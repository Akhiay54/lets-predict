import type { Round, Team, Match } from "@/types";

export const SCORING: Record<Round, number> = {
  R32: 3,
  R16: 5,
  QF: 8,
  SF: 12,
  FINAL: 20,
  CHAMPION: 30,
};

export const ROUND_LABELS: Record<Round, string> = {
  R32: "Round of 32",
  R16: "Round of 16",
  QF: "Quarter Finals",
  SF: "Semi Finals",
  FINAL: "Final",
  CHAMPION: "Champion",
};

export const ROUND_ORDER: Round[] = ["R32", "R16", "QF", "SF", "FINAL", "CHAMPION"];

export const TEAMS: Record<string, Team> = {
  GER: { id: "GER", name: "Germany", code: "GER", flagCode: "de" },
  PAR: { id: "PAR", name: "Paraguay", code: "PAR", flagCode: "py" },
  FRA: { id: "FRA", name: "France", code: "FRA", flagCode: "fr" },
  SWE: { id: "SWE", name: "Sweden", code: "SWE", flagCode: "se" },
  RSA: { id: "RSA", name: "South Africa", code: "RSA", flagCode: "za" },
  CAN: { id: "CAN", name: "Canada", code: "CAN", flagCode: "ca" },
  NED: { id: "NED", name: "Netherlands", code: "NED", flagCode: "nl" },
  MAR: { id: "MAR", name: "Morocco", code: "MAR", flagCode: "ma" },
  POR: { id: "POR", name: "Portugal", code: "POR", flagCode: "pt" },
  CRO: { id: "CRO", name: "Croatia", code: "CRO", flagCode: "hr" },
  ESP: { id: "ESP", name: "Spain", code: "ESP", flagCode: "es" },
  AUT: { id: "AUT", name: "Austria", code: "AUT", flagCode: "at" },
  USA: { id: "USA", name: "United States", code: "USA", flagCode: "us" },
  BIH: { id: "BIH", name: "Bosnia & Herz.", code: "BIH", flagCode: "ba" },
  BEL: { id: "BEL", name: "Belgium", code: "BEL", flagCode: "be" },
  SEN: { id: "SEN", name: "Senegal", code: "SEN", flagCode: "sn" },
  BRA: { id: "BRA", name: "Brazil", code: "BRA", flagCode: "br" },
  JPN: { id: "JPN", name: "Japan", code: "JPN", flagCode: "jp" },
  CIV: { id: "CIV", name: "Ivory Coast", code: "CIV", flagCode: "ci" },
  NOR: { id: "NOR", name: "Norway", code: "NOR", flagCode: "no" },
  MEX: { id: "MEX", name: "Mexico", code: "MEX", flagCode: "mx" },
  ECU: { id: "ECU", name: "Ecuador", code: "ECU", flagCode: "ec" },
  ENG: { id: "ENG", name: "England", code: "ENG", flagCode: "gb-eng" },
  COD: { id: "COD", name: "DR Congo", code: "COD", flagCode: "cd" },
  ARG: { id: "ARG", name: "Argentina", code: "ARG", flagCode: "ar" },
  CPV: { id: "CPV", name: "Cape Verde", code: "CPV", flagCode: "cv" },
  AUS: { id: "AUS", name: "Australia", code: "AUS", flagCode: "au" },
  EGY: { id: "EGY", name: "Egypt", code: "EGY", flagCode: "eg" },
  SUI: { id: "SUI", name: "Switzerland", code: "SUI", flagCode: "ch" },
  ALG: { id: "ALG", name: "Algeria", code: "ALG", flagCode: "dz" },
  COL: { id: "COL", name: "Colombia", code: "COL", flagCode: "co" },
  GHA: { id: "GHA", name: "Ghana", code: "GHA", flagCode: "gh" },
};

export const INITIAL_MATCHES: Match[] = [
  // Match IDs: R32_1 through R32_16
  { id: "R32_1", round: "R32", matchNumber: 1, teamA: TEAMS.GER, teamB: TEAMS.PAR },
  { id: "R32_2", round: "R32", matchNumber: 2, teamA: TEAMS.FRA, teamB: TEAMS.SWE },
  { id: "R32_3", round: "R32", matchNumber: 3, teamA: TEAMS.RSA, teamB: TEAMS.CAN },
  { id: "R32_4", round: "R32", matchNumber: 4, teamA: TEAMS.NED, teamB: TEAMS.MAR },
  { id: "R32_5", round: "R32", matchNumber: 5, teamA: TEAMS.POR, teamB: TEAMS.CRO },
  { id: "R32_6", round: "R32", matchNumber: 6, teamA: TEAMS.ESP, teamB: TEAMS.AUT },
  { id: "R32_7", round: "R32", matchNumber: 7, teamA: TEAMS.USA, teamB: TEAMS.BIH },
  { id: "R32_8", round: "R32", matchNumber: 8, teamA: TEAMS.BEL, teamB: TEAMS.SEN },
  { id: "R32_9", round: "R32", matchNumber: 9, teamA: TEAMS.BRA, teamB: TEAMS.JPN },
  { id: "R32_10", round: "R32", matchNumber: 10, teamA: TEAMS.CIV, teamB: TEAMS.NOR },
  { id: "R32_11", round: "R32", matchNumber: 11, teamA: TEAMS.MEX, teamB: TEAMS.ECU },
  { id: "R32_12", round: "R32", matchNumber: 12, teamA: TEAMS.ENG, teamB: TEAMS.COD },
  { id: "R32_13", round: "R32", matchNumber: 13, teamA: TEAMS.ARG, teamB: TEAMS.CPV },
  { id: "R32_14", round: "R32", matchNumber: 14, teamA: TEAMS.AUS, teamB: TEAMS.EGY },
  { id: "R32_15", round: "R32", matchNumber: 15, teamA: TEAMS.SUI, teamB: TEAMS.ALG },
  { id: "R32_16", round: "R32", matchNumber: 16, teamA: TEAMS.COL, teamB: TEAMS.GHA },

  // R16: winners of R32 pairs
  { id: "R16_1", round: "R16", matchNumber: 1, teamA: null, teamB: null },
  { id: "R16_2", round: "R16", matchNumber: 2, teamA: null, teamB: null },
  { id: "R16_3", round: "R16", matchNumber: 3, teamA: null, teamB: null },
  { id: "R16_4", round: "R16", matchNumber: 4, teamA: null, teamB: null },
  { id: "R16_5", round: "R16", matchNumber: 5, teamA: null, teamB: null },
  { id: "R16_6", round: "R16", matchNumber: 6, teamA: null, teamB: null },
  { id: "R16_7", round: "R16", matchNumber: 7, teamA: null, teamB: null },
  { id: "R16_8", round: "R16", matchNumber: 8, teamA: null, teamB: null },

  // QF
  { id: "QF_1", round: "QF", matchNumber: 1, teamA: null, teamB: null },
  { id: "QF_2", round: "QF", matchNumber: 2, teamA: null, teamB: null },
  { id: "QF_3", round: "QF", matchNumber: 3, teamA: null, teamB: null },
  { id: "QF_4", round: "QF", matchNumber: 4, teamA: null, teamB: null },

  // SF
  { id: "SF_1", round: "SF", matchNumber: 1, teamA: null, teamB: null },
  { id: "SF_2", round: "SF", matchNumber: 2, teamA: null, teamB: null },

  // Final
  { id: "FINAL_1", round: "FINAL", matchNumber: 1, teamA: null, teamB: null },
];

// Bracket progression map: which R32 winners go to which R16 slot / position
// [matchId, 'A'|'B'] means "winner goes to that match as team A or B"
export const BRACKET_PROGRESSION: Record<string, [string, "A" | "B"]> = {
  R32_1: ["R16_1", "A"],
  R32_2: ["R16_1", "B"],
  R32_3: ["R16_2", "A"],
  R32_4: ["R16_2", "B"],
  R32_5: ["R16_3", "A"],
  R32_6: ["R16_3", "B"],
  R32_7: ["R16_4", "A"],
  R32_8: ["R16_4", "B"],
  R32_9: ["R16_5", "A"],
  R32_10: ["R16_5", "B"],
  R32_11: ["R16_6", "A"],
  R32_12: ["R16_6", "B"],
  R32_13: ["R16_7", "A"],
  R32_14: ["R16_7", "B"],
  R32_15: ["R16_8", "A"],
  R32_16: ["R16_8", "B"],

  R16_1: ["QF_1", "A"],
  R16_2: ["QF_1", "B"],
  R16_3: ["QF_2", "A"],
  R16_4: ["QF_2", "B"],
  R16_5: ["QF_3", "A"],
  R16_6: ["QF_3", "B"],
  R16_7: ["QF_4", "A"],
  R16_8: ["QF_4", "B"],

  QF_1: ["SF_1", "A"],
  QF_2: ["SF_1", "B"],
  QF_3: ["SF_2", "A"],
  QF_4: ["SF_2", "B"],

  SF_1: ["FINAL_1", "A"],
  SF_2: ["FINAL_1", "B"],
};

export const APP_NAME = "FIFA Predict 2026";
export const STORAGE_KEY_LEAGUE = "fifa_league";
export const STORAGE_KEY_PLAYER = "fifa_player";
export const STORAGE_KEY_PLAYERS = "fifa_all_players";
export const STORAGE_KEY_OFFICIAL = "fifa_official_results";
export const TIEBREAK_KEY = "TIEBREAK";
