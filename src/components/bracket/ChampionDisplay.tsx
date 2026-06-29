"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";
import type { Match, Predictions } from "@/types";
import { TeamFlag } from "@/components/shared/TeamFlag";
import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

interface ChampionDisplayProps {
  finalMatch: Match | undefined;
  predictions: Predictions;
  onChampionSelect?: (teamId: string | null) => void;
  isReadOnly?: boolean;
}

export function ChampionDisplay({
  finalMatch,
  predictions,
  onChampionSelect,
  isReadOnly = false,
}: ChampionDisplayProps) {
  const finalWinnerId = finalMatch ? predictions[finalMatch.id] : null;
  const champion = finalMatch
    ? (finalMatch.teamA?.id === finalWinnerId
        ? finalMatch.teamA
        : finalMatch.teamB?.id === finalWinnerId
        ? finalMatch.teamB
        : null)
    : null;

  const prevChampionId = useRef<string | null>(null);

  useEffect(() => {
    if (champion && champion.id !== prevChampionId.current) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { x: 0.5, y: 0.4 },
        colors: ["#f5c842", "#e8a800", "#fff", "#ef4444"],
      });
    }
    prevChampionId.current = champion?.id ?? null;
  }, [champion]);

  return (
    <div className="flex flex-col items-center gap-3 shrink-0">
      {/* Trophy */}
      <motion.div
        animate={champion ? { scale: [1, 1.1, 1], rotate: [-3, 3, 0] } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`relative h-20 w-20 rounded-full flex items-center justify-center ${
          champion
            ? "bg-gradient-to-br from-yellow-400 to-amber-600 shadow-2xl shadow-yellow-500/40 glow-gold"
            : "bg-secondary border-2 border-dashed border-border"
        }`}
      >
        <Trophy
          className={`h-9 w-9 ${champion ? "text-black" : "text-muted-foreground/30"}`}
        />
        {champion && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-card border-2 border-yellow-500 flex items-center justify-center"
          >
            <TeamFlag flagCode={champion.flagCode} name={champion.name} size="xs" />
          </motion.div>
        )}
      </motion.div>

      <div className="text-center">
        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
          Champion
        </div>
        <AnimatePresence mode="wait">
          {champion ? (
            <motion.div
              key={champion.id}
              initial={{ opacity: 0, scale: 0.8, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="text-center"
            >
              <div className="text-base font-extrabold gold-text">{champion.name}</div>
              <div className="text-xs text-muted-foreground">{champion.code}</div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-muted-foreground/50 italic"
            >
              Awaiting Final
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
