"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

export function HydrationProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useAppStore((s) => s.hydrate);
  const hydrated = useAppStore((s) => s.hydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Avoid flash of unauthenticated state on SSR
  if (!hydrated) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-600 animate-pulse" />
          <div className="text-sm text-muted-foreground animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
