"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2, Users } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Status = "loading" | "success" | "error";

export default function SyncPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { importPlayerData, hydrated } = useAppStore();
  const [status, setStatus] = useState<Status>("loading");
  const [playerName, setPlayerName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const encoded = searchParams.get("p");

  useEffect(() => {
    if (!hydrated) return;
    if (!encoded) {
      setStatus("error");
      setErrorMsg("Missing data in link. Ask your friend to reshare their bracket.");
      return;
    }
    const run = async () => {
      const player = await importPlayerData(encoded);
      if (!player) {
        setStatus("error");
        setErrorMsg("Could not import bracket data. The link may be corrupted.");
      } else {
        setPlayerName(player.name);
        setStatus("success");
        setTimeout(() => router.push("/leaderboard"), 1800);
      }
    };
    void run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, encoded]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-2xl space-y-6">
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
            ) : (
              <div className="h-16 w-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
              </div>
            )}
          </div>

          {status === "loading" && (
            <>
              <div className="text-lg font-bold">Importing bracket…</div>
              <div className="text-sm text-muted-foreground">Syncing predictions to your leaderboard</div>
            </>
          )}

          {status === "success" && (
            <>
              <div>
                <div className="text-lg font-bold text-emerald-400">Synced!</div>
                <div className="text-base font-semibold mt-1">
                  <span className="text-yellow-400">{playerName}</span>'s bracket imported
                </div>
              </div>
              <div className="text-sm text-muted-foreground">Redirecting to leaderboard…</div>
            </>
          )}

          {status === "error" && (
            <>
              <div>
                <div className="text-lg font-bold text-red-400">Import failed</div>
                <div className="text-sm text-muted-foreground mt-2">{errorMsg}</div>
              </div>
              <Link href="/leaderboard">
                <Button variant="outline" className="w-full">Go to Leaderboard →</Button>
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
