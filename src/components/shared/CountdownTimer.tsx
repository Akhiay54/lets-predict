"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  lockTime: string;
  className?: string;
}

function getTimeLeft(lockTime: string) {
  const diff = new Date(lockTime).getTime() - Date.now();
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

export function CountdownTimer({ lockTime, className }: CountdownTimerProps) {
  const [time, setTime] = useState(() => getTimeLeft(lockTime));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeLeft(lockTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockTime]);

  if (!time) {
    return (
      <div className={cn("flex items-center gap-1.5 text-red-400 font-semibold", className)}>
        <Clock className="h-4 w-4" />
        <span>Predictions Locked</span>
      </div>
    );
  }

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Clock className="h-4 w-4 text-yellow-500 shrink-0" />
      <div className="flex items-center gap-1 font-mono text-sm font-semibold">
        {time.days > 0 && (
          <>
            <span className="text-foreground">{time.days}d</span>
            <span className="text-muted-foreground">:</span>
          </>
        )}
        <span className="text-yellow-400">{pad(time.hours)}h</span>
        <span className="text-muted-foreground">:</span>
        <span className="text-yellow-400">{pad(time.minutes)}m</span>
        <span className="text-muted-foreground">:</span>
        <span className="text-yellow-400">{pad(time.seconds)}s</span>
      </div>
    </div>
  );
}
