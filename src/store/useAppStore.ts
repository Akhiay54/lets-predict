"use client";

import { create } from "zustand";
import {
  doc, getDoc, setDoc, updateDoc, onSnapshot,
  collection, getDocs, deleteDoc, Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { computeBracket, computeCompletionPct, getDescendantMatchIds } from "@/lib/bracket";
import {
  getStoredPlayerId, saveStoredPlayerId, clearStoredPlayerId,
  getStoredLeagueId, saveStoredLeagueId, clearStoredLeagueId,
} from "@/lib/storage";
import { generateId, generateInviteCode, isLocked } from "@/lib/utils";
import type { Player, League, Match, Predictions } from "@/types";
import { INITIAL_MATCHES, TIEBREAK_KEY } from "@/lib/constants";

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

export const useAppStore = create<AppStore>((set, get) => ({
  currentPlayer: null,
  league: null,
  allPlayers: [],
  officialResults: {},
  computedMatches: INITIAL_MATCHES,
  hydrated: false,
  _unsubs: [],

  async hydrate() {
    // Tear down any prior listeners
    get()._unsubs.forEach((u) => u());
    set({ _unsubs: [] });

    const playerId = getStoredPlayerId();
    const leagueId = getStoredLeagueId();

    const [player, league] = await Promise.all([
      playerId ? fetchPlayer(playerId) : Promise.resolve(null),
      leagueId ? fetchLeague(leagueId) : Promise.resolve(null),
    ]);

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

  async setPlayer(name: string) {
    const existing = get().currentPlayer;
    if (existing && existing.name === name) return existing;

    // Restore existing account by name, or create new
    const returning = await findPlayerByName(name);
    const player: Player = returning ?? {
      id: generateId(),
      name,
      predictions: {},
      tiebreakerGoals: null,
      completionPct: 0,
      createdAt: new Date().toISOString(),
    };

    await savePlayer(player);
    saveStoredPlayerId(player.id);

    // Prefer leagueId from Firestore player doc (works across browsers),
    // fall back to localStorage (works for new players not yet in Firestore)
    const leagueId = player.leagueId ?? getStoredLeagueId();
    const league = leagueId ? await fetchLeague(leagueId) : null;
    if (league) saveStoredLeagueId(league.id);
    const computedMatches = computeBracket(player.predictions);
    set({ currentPlayer: player, league, computedMatches });
    if (league) get()._subscribeLeague(league.id);
    return player;
  },

  logout() {
    get()._unsubs.forEach((u) => u());
    clearStoredPlayerId();
    set({ currentPlayer: null, _unsubs: [] });
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
    const updatedPlayer = { ...currentPlayer, leagueId: undefined };
    await savePlayer(updatedPlayer);
    clearStoredLeagueId();
    get()._unsubs.forEach((u) => u());
    set({ league: null, allPlayers: [], currentPlayer: updatedPlayer, _unsubs: [] });
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
    await deleteDoc(playerRef(playerId));
    const allPlayers = get().allPlayers.filter((p) => p.id !== playerId);
    set({ league: updated, allPlayers });
  },

  async setPrediction(matchId, winnerId) {
    const { currentPlayer, league } = get();
    if (!currentPlayer) return;
    if (league && isLocked(league.lockTime)) return;

    const predictions: Predictions = { ...currentPlayer.predictions };
    getDescendantMatchIds(matchId).forEach((id) => { delete predictions[id]; });
    predictions[matchId] = winnerId;
    const completionPct = computeCompletionPct(predictions);
    const updated: Player = { ...currentPlayer, predictions, completionPct };
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
        // onSnapshot will update allPlayers automatically
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
    };
    await savePlayer(player);

    const updated = {
      ...league,
      members: [...league.members, { playerId: player.id, joinedAt: new Date().toISOString(), isOwner: false }],
    };
    await saveLeague(updated);
    // onSnapshot will fire and refresh allPlayers
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
