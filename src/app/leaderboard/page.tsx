"use client";

import { motion } from "framer-motion";
import { Trophy, RefreshCw, Info } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { computeLeaderboard } from "@/lib/scoring";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SCORING, TIEBREAK_KEY } from "@/lib/constants";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LeaderboardPage() {
  const { currentPlayer, allPlayers, officialResults, league, leagueMembers } = useAppStore();

  const members = leagueMembers();
  const displayPlayers = members.length > 0 ? members : allPlayers;
  const entries = computeLeaderboard(displayPlayers, officialResults);
  const hasResults = Object.keys(officialResults).length > 0;
  const officialTiebreak = officialResults[TIEBREAK_KEY];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="gold-text">Leaderboard</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {league
              ? `${league.name} · ${members.length} players`
              : "Add yourself to a league to see rankings"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {!hasResults && (
            <Badge variant="secondary" className="gap-1.5 text-xs">
              <Info className="h-3 w-3" />
              Awaiting official results
            </Badge>
          )}
          {officialTiebreak && (
            <Badge variant="secondary" className="gap-1.5 text-xs">
              🎯 Tiebreaker: {officialTiebreak} goals
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Scoring guide */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Scoring System
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { label: "R32", pts: SCORING.R32 },
                { label: "R16", pts: SCORING.R16 },
                { label: "QF", pts: SCORING.QF },
                { label: "SF", pts: SCORING.SF },
                { label: "Final", pts: SCORING.FINAL },
                { label: "Champion", pts: SCORING.CHAMPION },
              ].map(({ label, pts }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 bg-secondary/60 rounded-lg px-3 py-1.5"
                >
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-sm font-bold text-foreground">+{pts}pts</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <LeaderboardTable entries={entries} currentPlayer={currentPlayer} />
      </motion.div>

      {/* No league prompt */}
      {!league && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass border-dashed">
            <CardContent className="p-6 text-center space-y-3">
              <Trophy className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Create or join a league to compete against friends
              </p>
              <Link href="/league">
                <Button variant="outline" size="sm">Go to League →</Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
