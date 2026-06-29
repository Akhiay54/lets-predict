"use client";

import { motion } from "framer-motion";
import { Users, User } from "lucide-react";
import Link from "next/link";
import { useAppStore } from "@/store/useAppStore";
import { CreateLeagueModal } from "@/components/league/CreateLeagueModal";
import { JoinLeagueModal } from "@/components/league/JoinLeagueModal";
import { LeagueCard } from "@/components/league/LeagueCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LeaguePage() {
  const { currentPlayer, league, leagueMembers } = useAppStore();
  const members = leagueMembers();

  if (!currentPlayer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <div className="text-center space-y-3">
          <User className="h-12 w-12 text-muted-foreground/40 mx-auto" />
          <h2 className="text-2xl font-bold">Sign in first</h2>
          <p className="text-muted-foreground">You need a name to create or join a league.</p>
        </div>
        <Link href="/login">
          <Button variant="gold" size="lg">Set Your Name →</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-extrabold tracking-tight">
          <span className="gold-text">League</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Compete against your friends
        </p>
      </motion.div>

      {league ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <LeagueCard
            league={league}
            currentPlayer={currentPlayer}
            members={members}
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <Card className="glass border-dashed">
            <CardContent className="p-8 text-center space-y-6">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-secondary/60 flex items-center justify-center">
                <Users className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <div>
                <h2 className="text-xl font-bold">No League Yet</h2>
                <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
                  Create a league and invite your friends, or join one with an invite code.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <CreateLeagueModal />
                <JoinLeagueModal />
              </div>
            </CardContent>
          </Card>

          {/* Localhost instructions */}
          <Card className="glass border-blue-500/20">
            <CardContent className="p-5 space-y-2">
              <div className="text-sm font-semibold flex items-center gap-2">
                💡 How multiplayer works (localhost)
              </div>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>One person creates a league — they become the owner</li>
                <li>Share the <strong className="text-foreground">invite code</strong> with friends</li>
                <li>Share the <strong className="text-foreground">invite link</strong> with friends on other devices — they open it and join instantly</li>
                <li>All predictions are saved in your browser and persist across sessions</li>
                <li>The leaderboard ranks everyone in the league</li>
              </ol>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
