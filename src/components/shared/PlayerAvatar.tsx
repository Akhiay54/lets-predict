"use client";

import { getInitials, avatarColor, cn } from "@/lib/utils";

interface PlayerAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
};

export function PlayerAvatar({ name, size = "md", className }: PlayerAvatarProps) {
  const initials = getInitials(name);
  const color = avatarColor(name);

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold text-white shrink-0",
        color,
        sizeMap[size],
        className
      )}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
