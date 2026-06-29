import { BRACKET_PROGRESSION, INITIAL_MATCHES } from "./constants";
import type { Match, Predictions, Team } from "@/types";

/**
 * Given a set of predictions (matchId -> winnerId),
 * compute the full bracket state with winners propagated forward.
 */
export function computeBracket(predictions: Predictions): Match[] {
  // Deep clone initial matches
  const matches: Match[] = INITIAL_MATCHES.map((m) => ({
    ...m,
    teamA: m.teamA ? { ...m.teamA } : null,
    teamB: m.teamB ? { ...m.teamB } : null,
  }));

  const matchMap: Record<string, Match> = {};
  for (const m of matches) matchMap[m.id] = m;

  // Process in bracket order
  const orderedIds = [
    ...Array.from({ length: 16 }, (_, i) => `R32_${i + 1}`),
    ...Array.from({ length: 8 }, (_, i) => `R16_${i + 1}`),
    ...Array.from({ length: 4 }, (_, i) => `QF_${i + 1}`),
    "SF_1", "SF_2",
    "FINAL_1",
  ];

  for (const matchId of orderedIds) {
    const match = matchMap[matchId];
    const winnerId = predictions[matchId];
    if (!winnerId) continue;

    const winner = match.teamA?.id === winnerId
      ? match.teamA
      : match.teamB?.id === winnerId
      ? match.teamB
      : null;

    if (!winner) continue;

    const progression = BRACKET_PROGRESSION[matchId];
    if (!progression) continue;

    const [nextMatchId, slot] = progression;
    const nextMatch = matchMap[nextMatchId];
    if (!nextMatch) continue;

    if (slot === "A") {
      nextMatch.teamA = { ...winner };
    } else {
      nextMatch.teamB = { ...winner };
    }
  }

  return matches;
}

export function getWinnerTeam(match: Match, predictions: Predictions): Team | null {
  const winnerId = predictions[match.id];
  if (!winnerId) return null;
  if (match.teamA?.id === winnerId) return match.teamA;
  if (match.teamB?.id === winnerId) return match.teamB;
  return null;
}

export function getMatchById(matches: Match[], id: string): Match | undefined {
  return matches.find((m) => m.id === id);
}

/**
 * Return all descendant matchIds of a given matchId via BRACKET_PROGRESSION.
 * Used to clear stale downstream picks when an earlier round pick changes.
 */
export function getDescendantMatchIds(matchId: string): string[] {
  const result: string[] = [];
  const queue = [matchId];
  while (queue.length) {
    const id = queue.shift()!;
    const next = BRACKET_PROGRESSION[id];
    if (!next) continue;
    result.push(next[0]);
    queue.push(next[0]);
  }
  return result;
}

export function computeCompletionPct(predictions: Predictions): number {
  // 31 total matches to predict (16+8+4+2+1)
  const total = 31;
  const filled = Object.values(predictions).filter(Boolean).length;
  return Math.round((filled / total) * 100);
}
