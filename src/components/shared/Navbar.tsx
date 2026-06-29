"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, BarChart3, Users, Home, Menu, X, Shield, LogOut, User
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { PlayerAvatar } from "./PlayerAvatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { CountdownTimer } from "./CountdownTimer";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/bracket", label: "Bracket", icon: Trophy },
  { href: "/leaderboard", label: "Leaderboard", icon: BarChart3 },
  { href: "/league", label: "League", icon: Users },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { currentPlayer, league, logout, isLocked } = useAppStore();
  const locked = league ? isLocked() : false;

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border glass">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg group-hover:shadow-yellow-500/30 transition-all">
                <Trophy className="h-4 w-4 text-black" />
              </div>
              <span className="font-bold text-base tracking-tight hidden sm:block">
                <span className="gold-text">FIFA</span>
                <span className="text-foreground"> Predict</span>
                <span className="text-muted-foreground text-xs ml-1">2026</span>
              </span>
            </Link>

            {/* Center Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== "/" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Lock status */}
              {league && (
                <div className="hidden lg:block">
                  {locked ? (
                    <Badge variant="locked">🔒 Locked</Badge>
                  ) : (
                    <CountdownTimer lockTime={league.lockTime} />
                  )}
                </div>
              )}

              {/* Player */}
              {currentPlayer ? (
                <div className="flex items-center gap-2 group relative">
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-secondary transition-colors"
                    title="Logout"
                  >
                    <PlayerAvatar name={currentPlayer.name} size="sm" />
                    <span className="text-sm font-medium hidden sm:block max-w-[120px] truncate">
                      {currentPlayer.name}
                    </span>
                    <LogOut className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all"
                >
                  <User className="h-4 w-4" />
                  Join
                </Link>
              )}

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
                onClick={() => setMobileOpen((o) => !o)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed top-16 inset-x-0 z-30 md:hidden bg-card border-b border-border shadow-xl"
          >
            <nav className="flex flex-col p-4 gap-1">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== "/" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
              {league && (
                <div className="px-4 py-3 border-t border-border mt-1">
                  {locked ? (
                    <Badge variant="locked">🔒 Predictions Locked</Badge>
                  ) : (
                    <CountdownTimer lockTime={league.lockTime} />
                  )}
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
