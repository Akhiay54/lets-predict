"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

type Status = "idle" | "loading" | "success" | "error" | "need-name";

export default function JoinPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentPlayer, importLeague, setPlayer, hydrated } = useAppStore();
  const [status, setStatus] = useState<Status>("loading");
  const [leagueName, setLeagueName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [name, setName] = useState("");

  const encoded = searchParams.get("d");

  useEffect(() => {
    if (!hydrated) return;
    if (!encoded) {
      setStatus("error");
      setErrorMsg("Missing invite data in link. Ask the league owner to reshare.");
      return;
    }

    // Peek at league name before importing
    try {
      const json = atob(encoded);
      const data = JSON.parse(json);
      setLeagueName(data.name ?? "Unknown League");
    } catch {
      setStatus("error");
      setErrorMsg("Invalid invite link. Ask the league owner to reshare.");
      return;
    }

    if (!currentPlayer) {
      setStatus("need-name");
    } else {
      doImport(encoded);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, encoded]);

  async function doImport(enc: string) {
    setStatus("loading");
    const league = await importLeague(enc);
    if (!league) {
      setStatus("error");
      setErrorMsg("Could not import the league. The link may be expired or corrupted.");
    } else {
      setLeagueName(league.name);
      setStatus("success");
      setTimeout(() => router.push("/bracket"), 1800);
    }
  }

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) return;
    await setPlayer(trimmed);
    doImport(encoded!);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-2xl space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            {status === "success" ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center"
              >
                <CheckCircle className="h-8 w-8 text-emerald-400" />
              </motion.div>
            ) : status === "error" ? (
              <div className="h-16 w-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
            ) : status === "loading" ? (
              <div className="h-16 w-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-yellow-400 animate-spin" />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-xl">
                <Trophy className="h-8 w-8 text-black" />
              </div>
            )}
          </div>

          {/* Content by status */}
          {status === "loading" && (
            <>
              <div className="text-lg font-bold">Joining league…</div>
              <div className="text-sm text-muted-foreground">Setting up your predictions</div>
            </>
          )}

          {status === "success" && (
            <>
              <div>
                <div className="text-lg font-bold text-emerald-400">Joined!</div>
                <div className="text-base font-semibold mt-1">{leagueName}</div>
              </div>
              <div className="text-sm text-muted-foreground">
                Redirecting to your bracket…
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div>
                <div className="text-lg font-bold text-red-400">Link error</div>
                <div className="text-sm text-muted-foreground mt-2">{errorMsg}</div>
              </div>
              <Link href="/league">
                <Button variant="outline" className="w-full">Go to League →</Button>
              </Link>
            </>
          )}

          {status === "need-name" && (
            <>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-yellow-500 mb-1">
                  You're invited to
                </div>
                <div className="text-xl font-extrabold">{leagueName}</div>
              </div>
              <form onSubmit={handleNameSubmit} className="space-y-3 text-left">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                    Your name
                  </label>
                  <Input
                    placeholder="e.g. Rahul"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11"
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  variant="gold"
                  className="w-full"
                  disabled={name.trim().length < 2}
                >
                  Join League →
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
