export type Round =
  | "R32"
  | "R16"
  | "QF"
  | "SF"
  | "FINAL"
  | "CHAMPION";

export interface Team {
  id: string;
  name: string;
  code: string; // 3-letter abbrev
  flagCode: string; // ISO 3166-1 alpha-2 for flag emoji
}

export interface Match {
  id: string;
  round: Round;
  matchNumber: number;
  teamA: Team | null;
  teamB: Team | null;
  // null = not yet decided
}

export interface Prediction {
  matchId: string;
  winnerId: string | null;
}

export type Predictions = Record<string, string | null>; // matchId -> winnerId

export interface Player {
  id: string;
  name: string;
  avatar?: string; // initials-based fallback
  createdAt: string;
  predictions: Predictions;
  tiebreakerGoals: number | null;
  completionPct: number;
  leagueId?: string; // persisted so the player can rejoin from any browser
  pinHash?: string;  // SHA-256 of their PIN; absent means no PIN set yet
}

export interface LeagueMember {
  playerId: string;
  joinedAt: string;
  isOwner: boolean;
}

export interface League {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  createdAt: string;
  lockTime: string; // ISO date string
  members: LeagueMember[];
}

export interface ScoreBreakdown {
  R32: number;
  R16: number;
  QF: number;
  SF: number;
  FINAL: number;
  CHAMPION: number;
  total: number;
  correctByRound: Partial<Record<Round, number>>;
}

export interface LeaderboardEntry {
  rank: number;
  player: Player;
  score: ScoreBreakdown;
  tiebreak: number | null;
}

export interface AppState {
  currentPlayer: Player | null;
  league: League | null;
  allPlayers: Player[];
  officialResults: Predictions; // set by admin/owner
  matches: Match[]; // base R32 matches, winners auto-advance
}
