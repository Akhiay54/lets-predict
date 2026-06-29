import { SCORING, INITIAL_MATCHES, TIEBREAK_KEY } from "./constants";
import { computeBracket } from "./bracket";
import type { Player, ScoreBreakdown, LeaderboardEntry, Predictions, Round } from "@/types";

export function scorePlayer(
  player: Player,
  officialResults: Predictions
): ScoreBreakdown {
  const breakdown: ScoreBreakdown = {
    R32: 0, R16: 0, QF: 0, SF: 0, FINAL: 0, CHAMPION: 0,
    total: 0,
    correctByRound: {},
  };

  // Compare predictions against official results match by match
  for (const match of INITIAL_MATCHES.filter((m) => m.round !== "CHAMPION")) {
    const official = officialResults[match.id];
    const predicted = player.predictions[match.id];

    if (!official || !predicted) continue;
    if (official !== predicted) continue;

    const round = match.round as Exclude<Round, "CHAMPION">;
    const pts = SCORING[round];
    breakdown[round] += pts;
    breakdown.total += pts;
    breakdown.correctByRound[round] = (breakdown.correctByRound[round] ?? 0) + 1;
  }

  // Champion bonus — use explicit "CHAMPION" key if set, otherwise derive from FINAL_1 winner
  const officialChampion = officialResults["CHAMPION"] ?? officialResults["FINAL_1"];
  const predictedChampion = player.predictions["CHAMPION"] ?? player.predictions["FINAL_1"];
  if (officialChampion && predictedChampion && officialChampion === predictedChampion) {
    breakdown.CHAMPION = SCORING.CHAMPION;
    breakdown.total += SCORING.CHAMPION;
    breakdown.correctByRound["CHAMPION"] = 1;
  }

  return breakdown;
}

export function computeLeaderboard(
  players: Player[],
  officialResults: Predictions
): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = players.map((player) => ({
    rank: 0,
    player,
    score: scorePlayer(player, officialResults),
    tiebreak: player.tiebreakerGoals,
  }));

  // Sort: total desc, then by tiebreak proximity to official tiebreak
  const _tb = officialResults[TIEBREAK_KEY];
  const _tbParsed = typeof _tb === "string" ? parseInt(_tb, 10) : null;
  const officialTiebreak = _tbParsed !== null && !isNaN(_tbParsed) ? _tbParsed : null;

  entries.sort((a, b) => {
    if (b.score.total !== a.score.total) return b.score.total - a.score.total;
    // Tiebreak: closer to official total goals wins
    if (officialTiebreak !== null && a.tiebreak !== null && b.tiebreak !== null) {
      const aDiff = Math.abs(a.tiebreak - officialTiebreak);
      const bDiff = Math.abs(b.tiebreak - officialTiebreak);
      return aDiff - bDiff;
    }
    return 0;
  });

  // Assign ranks (shared rank for ties)
  let rank = 1;
  for (let i = 0; i < entries.length; i++) {
    if (i > 0 && entries[i].score.total < entries[i - 1].score.total) {
      rank = i + 1;
    }
    entries[i].rank = rank;
  }

  return entries;
}
