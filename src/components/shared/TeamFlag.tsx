"use client";

import { getFlagEmoji } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TeamFlagProps {
  flagCode: string;
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  xs: "text-lg",
  sm: "text-2xl",
  md: "text-3xl",
  lg: "text-5xl",
};

export function TeamFlag({ flagCode, name, size = "md", className }: TeamFlagProps) {
  return (
    <span
      className={cn("inline-block leading-none select-none", sizeMap[size], className)}
      role="img"
      aria-label={name}
      title={name}
    >
      {getFlagEmoji(flagCode)}
    </span>
  );
}
