"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { RefreshCw, Save, User } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { BracketView } from "@/components/bracket/BracketView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CountdownTimer } from "@/components/shared/CountdownTimer";
import Link from "next/link";

export default function BracketPage() {
  const {
    currentPlayer,
    computedMatches,
    league,
    isLocked: checkLocked,
    setPrediction,
    setTiebreaker,
    resetPredictions,
  } = useAppStore();

  const router = useRouter();
  const locked = league ? checkLocked() : false;
  const [tiebreakerInput, setTiebreakerInput] = useState(
    currentPlayer?.tiebreakerGoals?.toString() ?? ""
  );

  if (!currentPlayer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <div className="text-center space-y-3">
          <User className="h-12 w-12 text-muted-foreground/40 mx-auto" />
          <h2 className="text-2xl font-bold">You need a name first</h2>
          <p className="text-muted-foreground">Enter your name to start filling out the bracket.</p>
        </div>
        <Link href="/login">
          <Button variant="gold" size="lg">Set Your Name →</Button>
        </Link>
      </div>
    );
  }

  const handleSelect = async (matchId: string, winnerId: string | null) => {
    if (locked) return;
    await setPrediction(matchId, winnerId);
  };

  const handleTiebreakerSave = async () => {
    const val = parseInt(tiebreakerInput, 10);
    if (!isNaN(val) && val >= 0) {
      await setTiebreaker(val);
    }
  };

  return (
    <div className="max-w-full px-4 sm:px-6 py-6 space-y-6">
      {/* Top controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          {league && (
            <>
              {locked ? (
                <Badge variant="locked" className="gap-1.5 text-sm px-3 py-1">🔒 Predictions Locked</Badge>
              ) : (
                <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-3 py-1.5">
                  <CountdownTimer lockTime={league.lockTime} />
                </div>
              )}
            </>
          )}
        </div>

        {!locked && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive gap-1.5"
            onClick={() => {
              if (confirm("Reset all predictions?")) void resetPredictions();
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset
          </Button>
        )}
      </div>

      {/* Bracket */}
      <BracketView
        matches={computedMatches}
        predictions={currentPlayer.predictions}
        isReadOnly={locked}
        completionPct={currentPlayer.completionPct}
        onSelect={handleSelect}
      />

      {/* Tiebreaker */}
      {!locked && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-sm"
        >
          <Card className="glass border-yellow-500/20">
            <CardContent className="p-5 space-y-3">
              <div>
                <div className="font-semibold text-sm">🎯 Tiebreaker</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  How many total goals will be scored in the Final?
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  max="30"
                  placeholder="e.g. 3"
                  value={tiebreakerInput}
                  onChange={(e) => setTiebreakerInput(e.target.value)}
                  className="h-9 w-24"
                />
                <Button size="sm" onClick={handleTiebreakerSave} className="gap-1.5">
                  <Save className="h-3.5 w-3.5" />
                  Save
                </Button>
                {currentPlayer.tiebreakerGoals !== null && (
                  <Badge variant="success" className="gap-1">
                    Saved: {currentPlayer.tiebreakerGoals}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
