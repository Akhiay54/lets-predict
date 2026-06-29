"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { Match, Team } from "@/types";
import { TeamFlag } from "@/components/shared/TeamFlag";
import { cn } from "@/lib/utils";

interface TeamRowProps {
  team: Team | null;
  isWinner: boolean;
  isLoser: boolean;
  isReadOnly: boolean;
  onClick: () => void;
}

function TeamRow({ team, isWinner, isLoser, isReadOnly, onClick }: TeamRowProps) {
  if (!team) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 opacity-30">
        <div className="h-5 w-5 rounded bg-border/50" />
        <div className="h-3 w-16 rounded bg-border/50" />
      </div>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      disabled={isReadOnly}
      whileHover={!isReadOnly && !isWinner ? { x: 2 } : {}}
      whileTap={!isReadOnly ? { scale: 0.98 } : {}}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all duration-200 group",
        !isReadOnly && "cursor-pointer hover:bg-white/5",
        isReadOnly && "cursor-default",
        isWinner && "bg-yellow-500/10",
        isLoser && "opacity-40"
      )}
    >
      <TeamFlag flagCode={team.flagCode} name={team.name} size="xs" />
      <div className="flex-1 min-w-0">
        <div className={cn(
          "text-xs font-bold leading-none",
          isWinner ? "text-yellow-400" : "text-muted-foreground"
        )}>
          {team.code}
        </div>
        <div className={cn(
          "text-[10px] leading-none mt-0.5 truncate",
          isWinner ? "text-yellow-300/70" : "text-muted-foreground/60"
        )}>
          {team.name}
        </div>
      </div>
      {isWinner && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <ChevronRight className="h-3 w-3 text-yellow-500 shrink-0" />
        </motion.div>
      )}
    </motion.button>
  );
}

interface MatchCardProps {
  match: Match;
  winnerId: string | null | undefined;
  isReadOnly?: boolean;
  onSelect: (matchId: string, winnerId: string | null) => void;
  size?: "sm" | "md";
}

export function MatchCard({
  match,
  winnerId,
  isReadOnly = false,
  onSelect,
  size = "md",
}: MatchCardProps) {
  const isWinnerA = winnerId === match.teamA?.id;
  const isWinnerB = winnerId === match.teamB?.id;
  const hasWinner = !!winnerId;

  const handleTeamClick = (team: Team | null) => {
    if (!team || isReadOnly) return;
    const newWinner = winnerId === team.id ? null : team.id;
    onSelect(match.id, newWinner);
  };

  return (
    <motion.div
      layout
      className={cn(
        "relative rounded-xl border overflow-hidden transition-all duration-300",
        "bg-card shadow-sm",
        hasWinner
          ? "border-yellow-500/40 shadow-yellow-500/10 shadow-lg"
          : "border-border hover:border-border/80",
        size === "sm" ? "min-w-[140px]" : "min-w-[170px]"
      )}
    >
      {/* Match number label */}
      <div className="absolute top-0 right-0 px-1.5 py-0.5 bg-border/50 rounded-bl-lg">
        <span className="text-[9px] text-muted-foreground font-mono">
          {match.round} · {match.matchNumber}
        </span>
      </div>

      <div className="flex flex-col divide-y divide-border/50 pt-1">
        <TeamRow
          team={match.teamA}
          isWinner={isWinnerA}
          isLoser={hasWinner && !isWinnerA}
          isReadOnly={isReadOnly}
          onClick={() => handleTeamClick(match.teamA)}
        />
        <div className="h-px bg-border/30 relative">
          <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] text-muted-foreground/50 bg-card px-1">
            vs
          </span>
        </div>
        <TeamRow
          team={match.teamB}
          isWinner={isWinnerB}
          isLoser={hasWinner && !isWinnerB}
          isReadOnly={isReadOnly}
          onClick={() => handleTeamClick(match.teamB)}
        />
      </div>
    </motion.div>
  );
}
