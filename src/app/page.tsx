"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy, Users, BarChart3, ArrowRight, Lock, Zap, Globe
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";
import { CountdownTimer } from "@/components/shared/CountdownTimer";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function HomePage() {
  const { currentPlayer } = useAppStore();
  if (!currentPlayer) return <WelcomeHero />;
  return <Dashboard />;
}

function WelcomeHero() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 text-center py-16">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-8 max-w-2xl"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="h-24 w-24 mx-auto rounded-3xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-2xl shadow-yellow-500/30"
        >
          <Trophy className="h-12 w-12 text-black" />
        </motion.div>

        <div>
          <div className="text-sm font-bold uppercase tracking-widest text-yellow-500 mb-3">
            FIFA World Cup 2026
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
            Predict the
            <br />
            <span className="gold-text">Champion</span>
          </h1>
          <p className="text-xl text-muted-foreground mt-4 max-w-lg mx-auto">
            Build your bracket, compete with friends, and prove you know football.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/login">
            <Button variant="gold" size="xl" className="gap-2 shadow-2xl shadow-yellow-500/20">
              Start Predicting
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/bracket">
            <Button variant="outline" size="xl" className="gap-2">
              <Trophy className="h-5 w-5" />
              View Bracket
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5"><Globe className="h-4 w-4" /> 32 Teams</div>
          <div className="flex items-center gap-1.5"><Zap className="h-4 w-4" /> 31 Matches</div>
          <div className="flex items-center gap-1.5"><Trophy className="h-4 w-4" /> 1 Champion</div>
        </div>
      </motion.div>
    </div>
  );
}

function Dashboard() {
  const { currentPlayer, league, leagueMembers, isLocked: checkLocked } = useAppStore();
  if (!currentPlayer) return null;

  const locked = league ? checkLocked() : false;
  const members = leagueMembers();
  const completionPct = currentPlayer.completionPct;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <PlayerAvatar name={currentPlayer.name} size="lg" />
          <div>
            <div className="text-2xl font-extrabold">
              Hey, {currentPlayer.name.split(" ")[0]} 👋
            </div>
            <div className="text-muted-foreground text-sm mt-0.5">
              {completionPct === 100
                ? "Your bracket is complete!"
                : `${completionPct}% of your bracket filled`}
            </div>
          </div>
        </div>
        {league && locked && <Badge variant="locked" className="text-sm">🔒 Locked</Badge>}
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Completion", value: `${completionPct}%`, icon: Zap, color: "text-yellow-400" },
          { label: "League", value: league?.name ?? "None", icon: Users, color: "text-blue-400", truncate: true },
          { label: "Members", value: String(league ? members.length : "—"), icon: Users, color: "text-emerald-400" },
          { label: "Status", value: !league ? "No league" : locked ? "Locked" : "Open", icon: Lock, color: locked ? "text-red-400" : "text-emerald-400" },
        ].map(({ label, value, icon: Icon, color, truncate }, idx) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07 }}
          >
            <Card className="glass hover:-translate-y-0.5 transition-transform">
              <CardContent className="p-4">
                <div className={`${color} mb-2`}><Icon className="h-5 w-5" /></div>
                <div className={`text-lg font-bold ${truncate ? "truncate" : ""}`}>{value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="glass">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Bracket Progress</div>
              <Link href="/bracket">
                <Button variant="gold" size="sm" className="gap-1.5">
                  {completionPct === 0 ? "Start Bracket" : "Edit Bracket"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            <Progress value={completionPct} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 picks</span>
              <span className="font-semibold text-foreground">{completionPct}%</span>
              <span>31 picks</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        {[
          {
            href: "/bracket",
            icon: Trophy,
            color: "text-yellow-500",
            bg: "bg-yellow-500/10",
            title: "My Bracket",
            sub: "Pick your winners",
          },
          {
            href: "/league",
            icon: Users,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            title: league ? league.name : "Join League",
            sub: league ? `${members.length} members` : "Create or join a league",
            truncate: true,
          },
          {
            href: "/leaderboard",
            icon: BarChart3,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            title: "Leaderboard",
            sub: `${members.length} player${members.length !== 1 ? "s" : ""} competing`,
          },
        ].map(({ href, icon: Icon, color, bg, title, sub, truncate }) => (
          <Link href={href} key={href} className="block">
            <Card className="glass hover:border-primary/40 hover:-translate-y-0.5 transition-all cursor-pointer h-full">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`font-semibold text-sm ${truncate ? "truncate" : ""}`}>{title}</div>
                  <div className="text-xs text-muted-foreground">{sub}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </motion.div>

      {league && !locked && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Card className="glass border-yellow-500/20">
            <CardContent className="p-5 flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-sm">Predictions lock in</div>
                <div className="text-xs text-muted-foreground mt-0.5">{league.name}</div>
              </div>
              <CountdownTimer lockTime={league.lockTime} />
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
