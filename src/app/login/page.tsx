"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Zap, Users, BarChart3, Eye, EyeOff, Lock } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hashPin } from "@/lib/utils";
import type { Player } from "@/types";

const features = [
  { icon: Trophy, label: "Full 32-Team Bracket", desc: "Predict every match from R32 to Final" },
  { icon: Users, label: "League System", desc: "Compete with friends in private leagues" },
  { icon: BarChart3, label: "Live Leaderboard", desc: "Real-time scoring and rankings" },
  { icon: Zap, label: "Instant Updates", desc: "Winners propagate through the bracket" },
];

type Step = "name" | "pin-enter" | "pin-set";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingPlayer, setPendingPlayer] = useState<Player | null>(null);
  const [isNew, setIsNew] = useState(false);

  const router = useRouter();
  const { lookupPlayer, finaliseLogin, setPin: storeSavePin } = useAppStore();

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) { setError("Name must be at least 2 characters"); return; }
    setError("");
    setLoading(true);
    const { player, isNew: newPlayer } = await lookupPlayer(trimmed);
    setLoading(false);
    setPendingPlayer(player);
    setIsNew(newPlayer);

    if (newPlayer) {
      // Brand new player — ask them to set a PIN
      setStep("pin-set");
    } else if (!player.pinHash) {
      // Existing player, no PIN set yet — let them in but prompt to set one
      await finaliseLogin(player);
      router.push("/bracket");
    } else {
      // Existing player with PIN — ask for it
      setStep("pin-enter");
    }
  };

  const handlePinEnter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingPlayer) return;
    setError("");
    setLoading(true);
    const entered = await hashPin(pin);
    setLoading(false);
    if (entered !== pendingPlayer.pinHash) {
      setError("Wrong PIN. Try again.");
      setPin("");
      return;
    }
    await finaliseLogin(pendingPlayer);
    router.push("/bracket");
  };

  const handlePinSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingPlayer) return;
    if (pin.length < 4) { setError("PIN must be at least 4 digits"); return; }
    if (pin !== confirmPin) { setError("PINs don't match"); return; }
    setError("");
    setLoading(true);
    const pinHash = await hashPin(pin);
    const playerWithPin = { ...pendingPlayer, pinHash };
    await finaliseLogin(playerWithPin);
    // storeSavePin is redundant here since finaliseLogin writes the player, but keep in sync
    router.push("/bracket");
    setLoading(false);
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

          <div className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-4">
            <AnimatePresence mode="wait">

              {/* Step 1: Name */}
              {step === "name" && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  className="space-y-4"
                >
                  <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Enter your name to start
                  </div>
                  <form onSubmit={handleNameSubmit} className="space-y-3">
                    <div>
                      <Input
                        placeholder="Your name (e.g. Rahul)"
                        value={name}
                        onChange={(e) => { setName(e.target.value); setError(""); }}
                        className="h-12 text-base"
                        autoFocus
                        disabled={loading}
                      />
                      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
                    </div>
                    <Button type="submit" variant="gold" size="lg" className="w-full text-base" disabled={loading}>
                      {loading ? "Looking up…" : "Continue →"}
                    </Button>
                  </form>
                  <p className="text-xs text-muted-foreground/50 text-center">
                    New players will be asked to set a PIN
                  </p>
                </motion.div>
              )}

              {/* Step 2a: Enter existing PIN */}
              {step === "pin-enter" && (
                <motion.div
                  key="pin-enter"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-yellow-500" />
                    <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Enter PIN for <span className="text-foreground">{name.trim()}</span>
                    </div>
                  </div>
                  <form onSubmit={handlePinEnter} className="space-y-3">
                    <div className="relative">
                      <Input
                        type={showPin ? "text" : "password"}
                        placeholder="Your PIN"
                        value={pin}
                        onChange={(e) => { setPin(e.target.value); setError(""); }}
                        className="h-12 text-base pr-10"
                        autoFocus
                        disabled={loading}
                        inputMode="numeric"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPin((v) => !v)}
                        tabIndex={-1}
                      >
                        {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
                    </div>
                    <Button type="submit" variant="gold" size="lg" className="w-full text-base" disabled={loading}>
                      {loading ? "Checking…" : "Sign In →"}
                    </Button>
                  </form>
                  <button
                    className="text-xs text-muted-foreground/50 hover:text-muted-foreground w-full text-center"
                    onClick={() => { setStep("name"); setPin(""); setError(""); }}
                  >
                    ← Back
                  </button>
                </motion.div>
              )}

              {/* Step 2b: Set new PIN */}
              {step === "pin-set" && (
                <motion.div
                  key="pin-set"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-yellow-500" />
                    <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {isNew ? "Set a PIN for your account" : "Create a PIN to protect your account"}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You'll need this PIN every time you log in. Don't share it with others.
                  </p>
                  <form onSubmit={handlePinSet} className="space-y-3">
                    <div className="relative">
                      <Input
                        type={showPin ? "text" : "password"}
                        placeholder="Choose a PIN (min 4 digits)"
                        value={pin}
                        onChange={(e) => { setPin(e.target.value); setError(""); }}
                        className="h-12 text-base pr-10"
                        autoFocus
                        disabled={loading}
                        inputMode="numeric"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPin((v) => !v)}
                        tabIndex={-1}
                      >
                        {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Input
                      type={showPin ? "text" : "password"}
                      placeholder="Confirm PIN"
                      value={confirmPin}
                      onChange={(e) => { setConfirmPin(e.target.value); setError(""); }}
                      className="h-12 text-base"
                      disabled={loading}
                      inputMode="numeric"
                    />
                    {error && <p className="text-xs text-destructive">{error}</p>}
                    <Button type="submit" variant="gold" size="lg" className="w-full text-base" disabled={loading}>
                      {loading ? "Saving…" : "Set PIN & Start →"}
                    </Button>
                  </form>
                  <button
                    className="text-xs text-muted-foreground/50 hover:text-muted-foreground w-full text-center"
                    onClick={() => { setStep("name"); setPin(""); setConfirmPin(""); setError(""); }}
                  >
                    ← Back
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
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
