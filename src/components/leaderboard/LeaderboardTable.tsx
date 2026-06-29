"use client";

import { motion } from "framer-motion";
import { Crown, Medal, Trophy } from "lucide-react";
import type { LeaderboardEntry, Player } from "@/types";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentPlayer: Player | null;
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="h-4 w-4 text-yellow-400" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-slate-400" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-amber-700" />;
  return <span className="text-sm font-mono text-muted-foreground">{rank}</span>;
}

function RoundStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-sm font-bold text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
    </div>
  );
}

export function LeaderboardTable({ entries, currentPlayer }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Trophy className="h-10 w-10 mx-auto mb-3 opacity-20" />
        <p className="font-medium">No players yet</p>
        <p className="text-sm opacity-70">Join a league to see the leaderboard</p>
      </div>
    );
  }

  const maxScore = entries[0]?.score.total ?? 1;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="hidden md:grid grid-cols-[40px_1fr_80px_repeat(5,56px)_64px] gap-3 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        <div className="text-center">#</div>
        <div>Player</div>
        <div className="text-center">Points</div>
        <div className="text-center">R32</div>
        <div className="text-center">R16</div>
        <div className="text-center">QF</div>
        <div className="text-center">SF</div>
        <div className="text-center">Final</div>
        <div className="text-center">Tiebreak</div>
      </div>

      {entries.map((entry, idx) => {
        const isCurrentPlayer = currentPlayer?.id === entry.player.id;
        const pct = maxScore > 0 ? (entry.score.total / maxScore) * 100 : 0;

        return (
          <motion.div
            key={entry.player.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, duration: 0.25 }}
            className={cn(
              "relative rounded-xl border transition-all duration-200",
              isCurrentPlayer
                ? "bg-yellow-500/5 border-yellow-500/30 shadow-lg shadow-yellow-500/5"
                : "bg-card border-border hover:border-border/80",
              entry.rank === 1 && "bg-gradient-to-r from-yellow-500/5 to-transparent"
            )}
          >
            {/* Mobile layout */}
            <div className="md:hidden p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 flex justify-center">
                    <RankIcon rank={entry.rank} />
                  </div>
                  <PlayerAvatar name={entry.player.name} size="md" />
                  <div>
                    <div className={cn("font-semibold text-sm", isCurrentPlayer && "text-yellow-400")}>
                      {entry.player.name}
                      {isCurrentPlayer && <span className="text-[10px] ml-1 text-yellow-500/70">(You)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {entry.player.completionPct}% complete
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-extrabold gold-text">
                  {entry.score.total}
                  <span className="text-xs font-normal text-muted-foreground ml-0.5">pts</span>
                </div>
              </div>
              <Progress value={pct} className="h-1" />
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span>R32: {entry.score.correctByRound.R32 ?? 0}</span>
                <span>R16: {entry.score.correctByRound.R16 ?? 0}</span>
                <span>QF: {entry.score.correctByRound.QF ?? 0}</span>
                <span>SF: {entry.score.correctByRound.SF ?? 0}</span>
              </div>
            </div>

            {/* Desktop layout */}
            <div className="hidden md:grid grid-cols-[40px_1fr_80px_repeat(5,56px)_64px] gap-3 items-center px-4 py-3">
              <div className="flex justify-center">
                <RankIcon rank={entry.rank} />
              </div>

              <div className="flex items-center gap-3 min-w-0">
                <PlayerAvatar name={entry.player.name} size="sm" />
                <div className="min-w-0">
                  <div className={cn(
                    "font-semibold text-sm truncate",
                    isCurrentPlayer && "text-yellow-400"
                  )}>
                    {entry.player.name}
                    {isCurrentPlayer && (
                      <span className="text-[10px] ml-1 text-yellow-500/70">(You)</span>
                    )}
                  </div>
                  <Progress value={pct} className="h-0.5 mt-1 w-24" />
                </div>
              </div>

              <div className="text-center">
                <span className={cn(
                  "text-lg font-extrabold",
                  entry.rank === 1 ? "gold-text" : "text-foreground"
                )}>
                  {entry.score.total}
                </span>
              </div>

              <RoundStat value={entry.score.correctByRound.R32 ?? 0} label="correct" />
              <RoundStat value={entry.score.correctByRound.R16 ?? 0} label="correct" />
              <RoundStat value={entry.score.correctByRound.QF ?? 0} label="correct" />
              <RoundStat value={entry.score.correctByRound.SF ?? 0} label="correct" />
              <RoundStat value={entry.score.correctByRound.FINAL ?? 0} label="correct" />

              <div className="text-center text-sm text-muted-foreground font-mono">
                {entry.tiebreak ?? "—"}
              </div>
            </div>

            {/* Rank 1 crown decoration */}
            {entry.rank === 1 && (
              <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-yellow-500 to-transparent rounded-l-xl" />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
