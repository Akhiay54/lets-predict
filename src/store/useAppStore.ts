"use client";

import { create } from "zustand";
import {
  doc, getDoc, setDoc, updateDoc, onSnapshot,
  collection, getDocs, deleteField, Unsubscribe,
} from "firebase/firestore";
import { db, ensureAuth } from "@/lib/firebase";
import { computeBracket, computeCompletionPct, getDescendantMatchIds } from "@/lib/bracket";
import {
  getStoredPlayerId, saveStoredPlayerId, clearStoredPlayerId,
  getStoredLeagueId, saveStoredLeagueId, clearStoredLeagueId,
} from "@/lib/storage";
import { generateId, generateInviteCode, isLocked } from "@/lib/utils";
import type { Player, League, Match, Predictions } from "@/types";
import { INITIAL_MATCHES, TIEBREAK_KEY } from "@/lib/constants";
import { fetchESPNResults, mergeESPNResults } from "@/lib/espn";

// Firestore collection/doc helpers
const playerRef = (id: string) => doc(db, "players", id);
const leagueRef = (id: string) => doc(db, "leagues", id);
const resultsRef = (leagueId: string) => doc(db, "results", leagueId);

interface AppStore {
  currentPlayer: Player | null;
  league: League | null;
  allPlayers: Player[];
  officialResults: Predictions;
  computedMatches: Match[];
  hydrated: boolean;

  hydrate: () => Promise<void>;
  logout: () => void;

  // Returns the player WITHOUT committing state — login page handles PIN then calls finaliseLogin
  lookupPlayer: (name: string) => Promise<{ player: Player; isNew: boolean }>;
  finaliseLogin: (player: Player) => Promise<Player>;
  setPin: (pin: string) => Promise<void>;
  setPlayer: (name: string) => Promise<Player>;
  createLeague: (name: string, lockTime: string) => Promise<League>;
  joinLeague: (inviteCode: string) => Promise<League | null>;
  importLeague: (encoded: string) => Promise<League | null>;
  leaveLeague: () => Promise<void>;
  updateLeague: (updates: Partial<Pick<League, "name" | "lockTime">>) => Promise<void>;
  removeMember: (playerId: string) => Promise<void>;

  setPrediction: (matchId: string, winnerId: string | null) => Promise<void>;
  setTiebreaker: (goals: number) => Promise<void>;
  resetPredictions: () => Promise<void>;

  setOfficialResult: (matchId: string, winnerId: string | null) => Promise<void>;
  syncFromESPN: () => Promise<{ updated: number }>;


  addProxyPlayer: (name: string) => Promise<Player | null>;
  setProxyPrediction: (playerId: string, matchId: string, winnerId: string | null) => Promise<void>;
  setProxyTiebreaker: (playerId: string, goals: number) => Promise<void>;
  importPlayerData: (encoded: string) => Promise<Player | null>;

  isLocked: () => boolean;
  leagueMembers: () => Player[];

  _unsubs: Unsubscribe[];
  _subscribeLeague: (leagueId: string) => void;
}

// --- Firestore helpers ---

async function fetchPlayer(id: string): Promise<Player | null> {
  const snap = await getDoc(playerRef(id));
  return snap.exists() ? (snap.data() as Player) : null;
}

async function savePlayer(player: Player): Promise<void> {
  await setDoc(playerRef(player.id), player);
}

async function fetchLeague(id: string): Promise<League | null> {
  const snap = await getDoc(leagueRef(id));
  return snap.exists() ? (snap.data() as League) : null;
}

async function saveLeague(league: League): Promise<void> {
  await setDoc(leagueRef(league.id), league);
}

async function fetchResults(leagueId: string): Promise<Predictions> {
  const snap = await getDoc(resultsRef(leagueId));
  return snap.exists() ? (snap.data() as Predictions) : {};
}

async function saveResults(leagueId: string, results: Predictions): Promise<void> {
  await setDoc(resultsRef(leagueId), results);
}

async function fetchLeagueMembers(league: League): Promise<Player[]> {
  const players = await Promise.all(
    league.members.map((m) => fetchPlayer(m.playerId))
  );
  return players.filter((p): p is Player => !!p);
}

// Find a player by name across the entire players collection
async function findPlayerByName(name: string): Promise<Player | null> {
  const snap = await getDocs(collection(db, "players"));
  const lower = name.toLowerCase();
  for (const d of snap.docs) {
    const p = d.data() as Player;
    if (p.name.toLowerCase() === lower) return p;
  }
  return null;
}

// Find a league by invite code
async function findLeagueByCode(inviteCode: string): Promise<League | null> {
  const snap = await getDocs(collection(db, "leagues"));
  for (const d of snap.docs) {
    const l = d.data() as League;
    if (l.inviteCode === inviteCode.toUpperCase()) return l;
  }
  return null;
}

// Find a league that contains the given playerId as a member
async function findLeagueByMemberId(playerId: string): Promise<League | null> {
  const snap = await getDocs(collection(db, "leagues"));
  for (const d of snap.docs) {
    const l = d.data() as League;
    if (l.members.some((m) => m.playerId === playerId)) return l;
  }
  return null;
}

export const useAppStore = create<AppStore>((set, get) => ({
  currentPlayer: null,
  league: null,
  allPlayers: [],
  officialResults: {},
  computedMatches: INITIAL_MATCHES,
  hydrated: false,
  _unsubs: [],

  async hydrate() {
    await ensureAuth();
    // Tear down any prior listeners
    get()._unsubs.forEach((u) => u());
    set({ _unsubs: [] });

    const playerId = getStoredPlayerId();
    const storedLeagueId = getStoredLeagueId();

    // Fetch player first so we can fall back to player.leagueId if localStorage is missing it
    const player = playerId ? await fetchPlayer(playerId) : null;

    // localStorage is the fast path; Firestore player doc is the fallback (cross-browser restore)
    const leagueId = storedLeagueId ?? player?.leagueId ?? null;
    const league = leagueId ? await fetchLeague(leagueId) : null;
    // Sync localStorage so subsequent hydrations are fast
    if (league && !storedLeagueId) saveStoredLeagueId(league.id);

    const computedMatches = player
      ? computeBracket(player.predictions)
      : INITIAL_MATCHES;

    let allPlayers: Player[] = [];
    let officialResults: Predictions = {};

    if (league) {
      [allPlayers, officialResults] = await Promise.all([
        fetchLeagueMembers(league),
        fetchResults(league.id),
      ]);
    }

    set({ currentPlayer: player, league, allPlayers, officialResults, computedMatches, hydrated: true });

    // Set up real-time listeners if we have a league
    if (league) {
      get()._subscribeLeague(league.id);
    }
  },

  // Internal: subscribe to league + results + member player docs
  _subscribeLeague(leagueId: string) {
    // Tear down any prior listeners before registering new ones
    get()._unsubs.forEach((u) => u());
    const unsubs: Unsubscribe[] = [];

    // League doc changes (membership, lock time, etc.)
    unsubs.push(
      onSnapshot(leagueRef(leagueId), async (snap) => {
        if (!snap.exists()) return;
        const league = snap.data() as League;
        const allPlayers = await fetchLeagueMembers(league);
        set({ league, allPlayers });
      })
    );

    // Official results changes
    unsubs.push(
      onSnapshot(resultsRef(leagueId), (snap) => {
        const officialResults = snap.exists() ? (snap.data() as Predictions) : {};
        set({ officialResults });
      })
    );

    // Current player doc changes (another tab updated predictions)
    const playerId = getStoredPlayerId();
    if (playerId) {
      unsubs.push(
        onSnapshot(playerRef(playerId), (snap) => {
          if (!snap.exists()) return;
          const player = snap.data() as Player;
          const computedMatches = computeBracket(player.predictions);
          set({ currentPlayer: player, computedMatches });
        })
      );
    }

    set({ _unsubs: unsubs });
  },

  // Step 1: look up player by name without committing state (PIN check happens in UI)
  async lookupPlayer(name: string) {
    await ensureAuth();
    const returning = await findPlayerByName(name);
    if (returning) return { player: returning, isNew: false };
    const player: Player = {
      id: generateId(),
      name,
      predictions: {},
      tiebreakerGoals: null,
      completionPct: 0,
      createdAt: new Date().toISOString(),
    };
    return { player, isNew: true };
  },

  // Step 2: called after PIN verified — resolves league, commits state, sets up listeners
  async finaliseLogin(player: Player) {
    await ensureAuth();
    await savePlayer(player);
    saveStoredPlayerId(player.id);

    let leagueId = player.leagueId ?? null;
    let league = leagueId ? await fetchLeague(leagueId) : null;

    // Fallback for proxy players who were added before leagueId stamping
    if (!league) {
      const found = await findLeagueByMemberId(player.id);
      if (found) {
        league = found;
        leagueId = found.id;
        await savePlayer({ ...player, leagueId: found.id });
        player = { ...player, leagueId: found.id };
      }
    }

    if (league) {
      saveStoredLeagueId(league.id);
    } else {
      clearStoredLeagueId();
    }

    const computedMatches = computeBracket(player.predictions);
    let allPlayers: Player[] = [];
    let officialResults: Predictions = {};
    if (league) {
      [allPlayers, officialResults] = await Promise.all([
        fetchLeagueMembers(league),
        fetchResults(league.id),
      ]);
    }

    set({ currentPlayer: player, league, allPlayers, officialResults, computedMatches });
    if (league) get()._subscribeLeague(league.id);
    return player;
  },

  // Set or update PIN for the current player
  async setPin(pin: string) {
    const { hashPin } = await import("@/lib/utils");
    const player = get().currentPlayer;
    if (!player) return;
    const pinHash = await hashPin(pin);
    const updated = { ...player, pinHash };
    await savePlayer(updated);
    set({ currentPlayer: updated });
  },

  // Legacy wrapper — used by join/page and sync/page where PIN flow isn't needed
  async setPlayer(name: string) {
    const existing = get().currentPlayer;
    if (existing && existing.name === name) {
      if (!get().league && existing.leagueId) {
        const league = await fetchLeague(existing.leagueId);
        if (league) {
          saveStoredLeagueId(league.id);
          const [allPlayers, officialResults] = await Promise.all([
            fetchLeagueMembers(league),
            fetchResults(league.id),
          ]);
          set({ league, allPlayers, officialResults });
          get()._subscribeLeague(league.id);
        }
      }
      return existing;
    }
    const { player } = await get().lookupPlayer(name);
    return get().finaliseLogin(player);
  },

  logout() {
    get()._unsubs.forEach((u) => u());
    clearStoredPlayerId();
    clearStoredLeagueId();
    set({
      currentPlayer: null,
      league: null,
      allPlayers: [],
      officialResults: {},
      computedMatches: INITIAL_MATCHES,
      _unsubs: [],
    });
  },

  async createLeague(name, lockTime) {
    const player = get().currentPlayer!;
    const league: League = {
      id: generateId(),
      name,
      inviteCode: generateInviteCode(),
      ownerId: player.id,
      createdAt: new Date().toISOString(),
      lockTime,
      members: [{ playerId: player.id, joinedAt: new Date().toISOString(), isOwner: true }],
    };
    await saveLeague(league);
    saveStoredLeagueId(league.id);
    // Stamp leagueId on player so they can rejoin from any browser
    const updatedPlayer = { ...player, leagueId: league.id };
    await savePlayer(updatedPlayer);
    const allPlayers = await fetchLeagueMembers(league);
    set({ league, allPlayers, currentPlayer: updatedPlayer });
    get()._subscribeLeague(league.id);
    return league;
  },

  async joinLeague(inviteCode) {
    const league = await findLeagueByCode(inviteCode);
    if (!league) return null;

    const player = get().currentPlayer!;
    const alreadyMember = league.members.some((m) => m.playerId === player.id);
    const updated: League = alreadyMember
      ? league
      : {
          ...league,
          members: [
            ...league.members,
            { playerId: player.id, joinedAt: new Date().toISOString(), isOwner: false },
          ],
        };

    if (!alreadyMember) await saveLeague(updated);
    saveStoredLeagueId(updated.id);
    // Stamp leagueId on player so they can rejoin from any browser
    const updatedPlayer = { ...player, leagueId: updated.id };
    await savePlayer(updatedPlayer);
    const [allPlayers, officialResults] = await Promise.all([
      fetchLeagueMembers(updated),
      fetchResults(updated.id),
    ]);
    set({ league: updated, allPlayers, officialResults, currentPlayer: updatedPlayer });
    get()._subscribeLeague(updated.id);
    return updated;
  },

  async importLeague(encoded) {
    try {
      const json = atob(encoded);
      const leagueData = JSON.parse(json) as League;
      if (!leagueData.id || !leagueData.inviteCode) return null;

      // Check if league exists in Firestore; if not, save it (owner shared the full object)
      const existing = await fetchLeague(leagueData.id);
      const league = existing ?? leagueData;

      const player = get().currentPlayer!;
      const alreadyMember = league.members.some((m) => m.playerId === player.id);
      const updated: League = alreadyMember
        ? league
        : {
            ...league,
            members: [
              ...league.members,
              { playerId: player.id, joinedAt: new Date().toISOString(), isOwner: false },
            ],
          };

      await saveLeague(updated);
      // Stamp leagueId on player so they can rejoin from any browser
      const updatedPlayer = { ...player, leagueId: updated.id };
      await savePlayer(updatedPlayer);
      saveStoredLeagueId(updated.id);
      set({ currentPlayer: updatedPlayer });

      const [allPlayers, officialResults] = await Promise.all([
        fetchLeagueMembers(updated),
        fetchResults(updated.id),
      ]);
      set({ league: updated, allPlayers, officialResults });
      get()._subscribeLeague(updated.id);
      return updated;
    } catch {
      return null;
    }
  },

  async leaveLeague() {
    const { league, currentPlayer } = get();
    if (!league || !currentPlayer) return;
    const updated: League = {
      ...league,
      members: league.members.filter((m) => m.playerId !== currentPlayer.id),
    };
    await saveLeague(updated);
    // Remove leagueId from player doc so name-based restore doesn't rejoin them
    await updateDoc(playerRef(currentPlayer.id), { leagueId: deleteField() });
    const updatedPlayer: Player = { ...currentPlayer };
    delete updatedPlayer.leagueId;
    clearStoredLeagueId();
    get()._unsubs.forEach((u) => u());
    set({
      league: null,
      allPlayers: [],
      officialResults: {},
      computedMatches: INITIAL_MATCHES,
      currentPlayer: updatedPlayer,
      _unsubs: [],
    });
  },

  async updateLeague(updates) {
    const league = get().league;
    if (!league) return;
    const updated = { ...league, ...updates };
    await saveLeague(updated);
    set({ league: updated });
  },

  async removeMember(playerId) {
    const league = get().league;
    if (!league) return;
    const updated: League = {
      ...league,
      members: league.members.filter((m) => m.playerId !== playerId),
    };
    await saveLeague(updated);
    // Clear the leagueId stamp from the removed player's doc so they don't auto-rejoin
    await updateDoc(playerRef(playerId), { leagueId: deleteField() }).catch(() => {});
    const allPlayers = get().allPlayers.filter((p) => p.id !== playerId);
    set({ league: updated, allPlayers });
  },

  async setPrediction(matchId, winnerId) {
    const { currentPlayer, league } = get();
    if (!currentPlayer) return;
    if (league && isLocked(league.lockTime)) return;

    // Read fresh from Firestore to avoid read-modify-write race on rapid clicks
    const fresh = await fetchPlayer(currentPlayer.id);
    const base = fresh ?? currentPlayer;

    const predictions: Predictions = { ...base.predictions };
    getDescendantMatchIds(matchId).forEach((id) => { delete predictions[id]; });
    predictions[matchId] = winnerId;
    const completionPct = computeCompletionPct(predictions);
    const updated: Player = { ...base, predictions, completionPct };
    const computedMatches = computeBracket(predictions);

    await savePlayer(updated);
    set({ currentPlayer: updated, computedMatches });
  },

  async setTiebreaker(goals) {
    const player = get().currentPlayer;
    if (!player) return;
    const updated = { ...player, tiebreakerGoals: goals };
    await savePlayer(updated);
    set({ currentPlayer: updated });
  },

  async resetPredictions() {
    const player = get().currentPlayer;
    if (!player) return;
    const updated = { ...player, predictions: {}, completionPct: 0 };
    await savePlayer(updated);
    set({ currentPlayer: updated, computedMatches: INITIAL_MATCHES });
  },

  async setOfficialResult(matchId, winnerId) {
    const { officialResults, league } = get();
    if (!league) return;
    const updated = { ...officialResults, [matchId]: winnerId };
    await saveResults(league.id, updated);
    set({ officialResults: updated });
  },

  async syncFromESPN() {
    const { officialResults, league } = get();
    if (!league) return { updated: 0 };
    const syncResult = await fetchESPNResults();
    if (syncResult.updated === 0) return { updated: 0 };
    const merged = mergeESPNResults(officialResults, syncResult);
    const changed = syncResult.matches.filter(
      ({ matchId, winner }) => officialResults[matchId] !== winner
    );
    if (changed.length === 0) return { updated: 0 };
    await saveResults(league.id, merged);
    set({ officialResults: merged });
    return { updated: changed.length };
  },

  async addProxyPlayer(name) {
    const { league } = get();
    if (!league) return null;
    const trimmed = name.trim();
    if (trimmed.length < 2) return null;

    const existing = await findPlayerByName(trimmed);
    if (existing) {
      const alreadyMember = league.members.some((m) => m.playerId === existing.id);
      if (!alreadyMember) {
        const updated = {
          ...league,
          members: [...league.members, { playerId: existing.id, joinedAt: new Date().toISOString(), isOwner: false }],
        };
        await saveLeague(updated);
      }
      // Stamp leagueId so the player can restore their league from any browser
      if (!existing.leagueId) {
        await savePlayer({ ...existing, leagueId: league.id });
      }
      return existing;
    }

    const player: Player = {
      id: generateId(),
      name: trimmed,
      predictions: {},
      tiebreakerGoals: null,
      completionPct: 0,
      createdAt: new Date().toISOString(),
      leagueId: league.id, // stamp so they can restore on any browser
    };
    await savePlayer(player);

    const updated = {
      ...league,
      members: [...league.members, { playerId: player.id, joinedAt: new Date().toISOString(), isOwner: false }],
    };
    await saveLeague(updated);
    return player;
  },

  async setProxyPrediction(playerId, matchId, winnerId) {
    const player = await fetchPlayer(playerId);
    if (!player) return;

    const predictions: Predictions = { ...player.predictions };
    getDescendantMatchIds(matchId).forEach((id) => { delete predictions[id]; });
    predictions[matchId] = winnerId;
    const completionPct = computeCompletionPct(predictions);
    await savePlayer({ ...player, predictions, completionPct });
    // allPlayers will update via onSnapshot
  },

  async setProxyTiebreaker(playerId, goals) {
    const player = await fetchPlayer(playerId);
    if (!player) return;
    await savePlayer({ ...player, tiebreakerGoals: goals });
  },

  async importPlayerData(encoded) {
    try {
      const json = atob(encoded);
      const player = JSON.parse(json) as Player;
      if (!player.id || !player.name) return null;

      await savePlayer(player);

      const { league } = get();
      if (league) {
        const alreadyMember = league.members.some((m) => m.playerId === player.id);
        if (!alreadyMember) {
          const updated = {
            ...league,
            members: [...league.members, { playerId: player.id, joinedAt: new Date().toISOString(), isOwner: false }],
          };
          await saveLeague(updated);
          // onSnapshot fires and refreshes allPlayers
        }
      }
      return player;
    } catch {
      return null;
    }
  },

  isLocked() {
    const league = get().league;
    if (!league) return false;
    return isLocked(league.lockTime);
  },

  leagueMembers() {
    const { league, allPlayers } = get();
    if (!league) return [];
    return league.members
      .map((m) => allPlayers.find((p) => p.id === m.playerId))
      .filter((p): p is Player => !!p);
  },
}));
