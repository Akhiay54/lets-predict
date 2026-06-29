// localStorage is used only to remember which player/league this browser belongs to.
// All actual data (Player, League, official results) lives in Firestore.

const KEY_PLAYER_ID = "fifa_player_id";
const KEY_LEAGUE_ID = "fifa_league_id";

function ls(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}
function lsSet(key: string, val: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, val);
}
function lsRemove(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

export function getStoredPlayerId(): string | null {
  return ls(KEY_PLAYER_ID);
}
export function saveStoredPlayerId(id: string): void {
  lsSet(KEY_PLAYER_ID, id);
}
export function clearStoredPlayerId(): void {
  lsRemove(KEY_PLAYER_ID);
}

export function getStoredLeagueId(): string | null {
  return ls(KEY_LEAGUE_ID);
}
export function saveStoredLeagueId(id: string): void {
  lsSet(KEY_LEAGUE_ID, id);
}
export function clearStoredLeagueId(): void {
  lsRemove(KEY_LEAGUE_ID);
}
