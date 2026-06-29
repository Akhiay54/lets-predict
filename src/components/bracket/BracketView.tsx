"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import type { Match, Predictions, Round } from "@/types";
import { MatchCard } from "./MatchCard";
import { ChampionDisplay } from "./ChampionDisplay";
import { ROUND_LABELS, ROUND_ORDER, SCORING } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Lock, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface BracketViewProps {
  matches: Match[];
  predictions: Predictions;
  isReadOnly: boolean;
  completionPct?: number;
  onSelect: (matchId: string, winnerId: string | null) => void;
}

const ROUND_LEFT: Round[] = ["R32", "R16", "QF", "SF"];
const ROUND_RIGHT: Round[] = ["R32", "R16", "QF", "SF"];
const ALL_ROUNDS: Round[] = ["R32", "R16", "QF", "SF", "FINAL"];

function RoundHeader({ round, count }: { round: Round; count: number }) {
  const isR32 = round === "R32";
  const isFinal = round === "FINAL";
  return (
    <div className={cn("text-center mb-3 shrink-0", isFinal && "mb-1")}>
      <div className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
        isFinal
          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
          : isR32
          ? "bg-secondary text-muted-foreground/80"
          : "bg-secondary/60 text-muted-foreground/70"
      )}>
        {ROUND_LABELS[round]}
      </div>
      <div className="text-[9px] text-muted-foreground/40 mt-0.5 font-mono">
        {SCORING[round]}pts · {count} match{count !== 1 ? "es" : ""}
      </div>
    </div>
  );
}

export function BracketView({
  matches,
  predictions,
  isReadOnly,
  completionPct = 0,
  onSelect,
}: BracketViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Split R32 left/right
  const r32 = matches.filter((m) => m.round === "R32");
  const r32Left = r32.slice(0, 8);
  const r32Right = r32.slice(8, 16);

  const r16 = matches.filter((m) => m.round === "R16");
  const r16Left = r16.slice(0, 4);
  const r16Right = r16.slice(4, 8);

  const qf = matches.filter((m) => m.round === "QF");
  const qfLeft = qf.slice(0, 2);
  const qfRight = qf.slice(2, 4);

  const sf = matches.filter((m) => m.round === "SF");
  const sfLeft = [sf[0]];
  const sfRight = [sf[1]];

  const finalMatch = matches.find((m) => m.round === "FINAL");

  const renderColumn = (
    roundMatches: Match[],
    round: Round,
    side: "left" | "right"
  ) => {
    const verticalGaps: Record<Round, string> = {
      R32: "gap-2",
      R16: "gap-8",
      QF: "gap-[88px]",
      SF: "gap-[200px]",
      FINAL: "gap-0",
      CHAMPION: "gap-0",
    };

    return (
      <div className="flex flex-col items-center shrink-0">
        <RoundHeader round={round} count={roundMatches.length} />
        <div className={cn("flex flex-col", verticalGaps[round])}>
          {roundMatches.map((match, idx) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, x: side === "left" ? -12 : 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 + 0.1, duration: 0.3 }}
            >
              <MatchCard
                match={match}
                winnerId={predictions[match.id]}
                isReadOnly={isReadOnly}
                onSelect={onSelect}
              />
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            <span className="gold-text">2026</span> World Cup Bracket
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isReadOnly ? "Read-only — predictions are locked" : "Click a team to pick the winner"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isReadOnly && (
            <Badge variant="locked" className="gap-1.5">
              <Lock className="h-3 w-3" /> Locked
            </Badge>
          )}
          {!isReadOnly && (
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Zap className="h-3 w-3 text-yellow-500" />
                <span>{completionPct}% complete</span>
              </div>
              <Progress value={completionPct} className="w-28 h-1.5" />
            </div>
          )}
        </div>
      </div>

      {/* Scroll wrapper */}
      <div
        ref={scrollRef}
        className="overflow-x-auto pb-8 -mx-4 px-4"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="inline-flex items-start gap-3 min-w-max">

          {/* LEFT SIDE */}
          {renderColumn(r32Left, "R32", "left")}
          {renderColumn(r16Left, "R16", "left")}
          {renderColumn(qfLeft, "QF", "left")}
          {renderColumn(sfLeft, "SF", "left")}

          {/* CENTER: Final + Champion */}
          <div className="flex flex-col items-center gap-4 px-4 self-center shrink-0">
            <RoundHeader round="FINAL" count={1} />
            {finalMatch && (
              <MatchCard
                match={finalMatch}
                winnerId={predictions[finalMatch.id]}
                isReadOnly={isReadOnly}
                onSelect={onSelect}
              />
            )}
            <div className="mt-2">
              <ChampionDisplay
                finalMatch={finalMatch}
                predictions={predictions}
                isReadOnly={isReadOnly}
              />
            </div>
          </div>

          {/* RIGHT SIDE */}
          {renderColumn(sfRight, "SF", "right")}
          {renderColumn(qfRight, "QF", "right")}
          {renderColumn(r16Right, "R16", "right")}
          {renderColumn(r32Right, "R32", "right")}
        </div>
      </div>
    </div>
  );
}
