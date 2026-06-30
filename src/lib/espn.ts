import { INITIAL_MATCHES } from "./constants";
import type { Predictions } from "@/types";

const ESPN_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

interface ESPNTeam {
  abbreviation: string;
}
interface ESPNCompetitor {
  team: ESPNTeam;
  winner?: boolean;
  score?: string;
}
interface ESPNStatus {
  type: { name: string }; // STATUS_FINAL, STATUS_IN_PROGRESS, STATUS_SCHEDULED
}
interface ESPNCompetition {
  competitors: ESPNCompetitor[];
  status: ESPNStatus;
}
interface ESPNEvent {
  id: string;
  competitions: ESPNCompetition[];
}

export interface SyncResult {
  updated: number;
  skipped: number;
  matches: { matchId: string; winner: string }[];
}

export async function fetchESPNResults(): Promise<SyncResult> {
  const res = await fetch(ESPN_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`ESPN API error: ${res.status}`);
  const data = await res.json();
  const events: ESPNEvent[] = data.events ?? [];

  const result: SyncResult = { updated: 0, skipped: 0, matches: [] };

  for (const event of events) {
    const comp = event.competitions[0];
    if (!comp) continue;

    const status = comp.status.type.name;
    const isFinished = status === "STATUS_FINAL" || status === "STATUS_FULL_TIME"
      || status === "STATUS_FULL_TIME_AET" || status === "STATUS_FINAL_PEN"
      || status === "STATUS_FINAL_AET";
    if (!isFinished) {
      result.skipped++;
      continue;
    }

    const winner = comp.competitors.find((c) => c.winner);
    if (!winner) continue;

    const winnerAbbr = winner.team.abbreviation;
    const homeAbbr = comp.competitors[0].team.abbreviation;
    const awayAbbr = comp.competitors[1].team.abbreviation;

    // Find which match in our bracket has these two teams
    const match = INITIAL_MATCHES.find(
      (m) =>
        m.teamA &&
        m.teamB &&
        ((m.teamA.id === homeAbbr && m.teamB.id === awayAbbr) ||
          (m.teamA.id === awayAbbr && m.teamB.id === homeAbbr))
    );

    if (!match) continue;

    result.matches.push({ matchId: match.id, winner: winnerAbbr });
    result.updated++;
  }

  return result;
}

// Merge ESPN results into existing officialResults, return updated predictions
export function mergeESPNResults(
  existing: Predictions,
  syncResult: SyncResult
): Predictions {
  const updated = { ...existing };
  for (const { matchId, winner } of syncResult.matches) {
    updated[matchId] = winner;
  }
  return updated;
}
