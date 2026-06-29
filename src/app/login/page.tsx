"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, Zap, Users, BarChart3 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const features = [
  { icon: Trophy, label: "Full 32-Team Bracket", desc: "Predict every match from R32 to Final" },
  { icon: Users, label: "League System", desc: "Compete with friends in private leagues" },
  { icon: BarChart3, label: "Live Leaderboard", desc: "Real-time scoring and rankings" },
  { icon: Zap, label: "Instant Updates", desc: "Winners propagate through the bracket" },
];

export default function LoginPage() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { setPlayer } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }
    await setPlayer(trimmed);
    router.push("/bracket");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row">
      {/* Left panel */}
      <div className="flex-1 flex flex-col justify-center px-8 py-16 lg:px-16 max-w-2xl mx-auto lg:mx-0 w-full">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-2xl shadow-yellow-500/30">
              <Trophy className="h-6 w-6 text-black" />
            </div>
            <div>
              <div className="text-2xl font-extrabold tracking-tight">
                <span className="gold-text">FIFA</span>
                <span> Predict</span>
              </div>
              <div className="text-sm text-muted-foreground">World Cup 2026</div>
            </div>
          </div>

          <div>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Predict the{" "}
              <span className="gold-text">World Cup</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-3">
              Build your bracket, compete with friends, and see who predicts the champion.
            </p>
          </div>

          {/* Sign in form */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-4">
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Enter your name to start
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Input
                  placeholder="Your name (e.g. Rahul)"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError("");
                  }}
                  className="h-12 text-base"
                  autoFocus
                />
                {error && <p className="text-xs text-destructive mt-1">{error}</p>}
              </div>
              <Button type="submit" variant="gold" size="lg" className="w-full text-base">
                Start Predicting →
              </Button>
            </form>
            <p className="text-xs text-muted-foreground/50 text-center">
              No account needed · All data stored locally
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right panel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-secondary/30 to-background items-center justify-center px-16 border-l border-border">
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-2 gap-4 max-w-sm"
        >
          {features.map(({ icon: Icon, label, desc }, idx) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className="bg-card border border-border rounded-2xl p-5 space-y-2 hover:border-primary/30 transition-all hover:-translate-y-0.5"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="font-semibold text-sm">{label}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
