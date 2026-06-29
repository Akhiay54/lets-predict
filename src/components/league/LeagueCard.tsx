"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Copy, Check, Users, Clock, Settings, LogOut, Shield, Trash2, CalendarClock, Link2, Share2
} from "lucide-react";
import type { League, Player } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";
import { CountdownTimer } from "@/components/shared/CountdownTimer";
import { formatLockTime, isLocked } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LeagueCardProps {
  league: League;
  currentPlayer: Player;
  members: Player[];
}

async function writeToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for http (non-localhost) — execCommand is deprecated but works
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

export function LeagueCard({ league, currentPlayer, members }: LeagueCardProps) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [showLinkFallback, setShowLinkFallback] = useState(false);
  const [showShareFallback, setShowShareFallback] = useState(false);
  const [editingLock, setEditingLock] = useState(false);
  const [newLockTime, setNewLockTime] = useState(
    new Date(league.lockTime).toISOString().slice(0, 16)
  );
  const { leaveLeague, removeMember, updateLeague } = useAppStore();

  const isOwner = league.ownerId === currentPlayer.id;
  const locked = isLocked(league.lockTime);

  const getInviteLink = () => {
    const encoded = btoa(JSON.stringify(league));
    return `${window.location.origin}/join?d=${encodeURIComponent(encoded)}`;
  };

  const getShareBracketLink = () => {
    const encoded = btoa(JSON.stringify(currentPlayer));
    return `${window.location.origin}/sync?p=${encodeURIComponent(encoded)}`;
  };

  const copyShareBracket = async () => {
    const ok = await writeToClipboard(getShareBracketLink());
    if (ok) {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } else {
      setShowShareFallback(true);
    }
  };

  const copyInviteCode = async () => {
    await writeToClipboard(league.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyInviteLink = async () => {
    const ok = await writeToClipboard(getInviteLink());
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      // Clipboard unavailable (http on LAN) — show the link so they can copy manually
      setShowLinkFallback(true);
    }
  };

  const handleUpdateLock = async () => {
    await updateLeague({ lockTime: new Date(newLockTime).toISOString() });
    setEditingLock(false);
  };

  return (
    <div className="space-y-4">
      {/* League header */}
      <Card className="glass">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-extrabold">{league.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {isOwner && (
                  <Badge variant="gold" className="gap-1">
                    <Shield className="h-3 w-3" /> Owner
                  </Badge>
                )}
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" /> {league.members.length} member{league.members.length !== 1 ? "s" : ""}
                </Badge>
                {locked ? (
                  <Badge variant="locked" className="gap-1">🔒 Locked</Badge>
                ) : (
                  <Badge variant="success" className="gap-1">✅ Open</Badge>
                )}
              </div>
            </div>

            {!isOwner && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => void leaveLeague()}
              >
                <LogOut className="h-4 w-4 mr-1.5" />
                Leave
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Invite code */}
          <div className="bg-secondary/60 rounded-xl p-4 space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Invite Code
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-card rounded-lg px-4 py-2.5 font-mono text-xl font-bold tracking-[0.3em] text-center text-foreground border border-border">
                {league.inviteCode}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={copyInviteCode}
              >
                {copied ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <Check className="h-4 w-4 text-emerald-400" />
                  </motion.div>
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground/60">
              Share this code with friends on the same device, or use the invite link below for remote friends.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 mt-1"
              onClick={copyInviteLink}
            >
              {copiedLink ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Invite link copied!</span>
                </motion.div>
              ) : (
                <>
                  <Link2 className="h-3.5 w-3.5" />
                  Copy Invite Link (for other devices)
                </>
              )}
            </Button>

            {/* Fallback: clipboard unavailable on http LAN — show link to copy manually */}
            {showLinkFallback && (
              <div className="space-y-1.5 mt-2">
                <p className="text-xs text-yellow-400 font-medium">
                  Clipboard unavailable on HTTP — copy the link below manually:
                </p>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={getInviteLink()}
                    className="h-8 text-xs font-mono"
                    onFocus={(e) => e.target.select()}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 h-8"
                    onClick={() => setShowLinkFallback(false)}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Lock time */}
          <div className="bg-secondary/60 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5" />
                Prediction Lock
              </div>
              {isOwner && !locked && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setEditingLock(!editingLock)}
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}
            </div>

            {editingLock ? (
              <div className="flex gap-2">
                <Input
                  type="datetime-local"
                  value={newLockTime}
                  onChange={(e) => setNewLockTime(e.target.value)}
                  className="h-9"
                />
                <Button size="sm" onClick={handleUpdateLock} className="shrink-0">Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingLock(false)}>Cancel</Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground/80">{formatLockTime(league.lockTime)}</span>
                {!locked && <CountdownTimer lockTime={league.lockTime} />}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Members list */}
      <Card className="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {members.map((member, idx) => {
              const isOwnerMember = league.ownerId === member.id;
              const isCurrentPlayerRow = currentPlayer.id === member.id;

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <PlayerAvatar name={member.name} size="sm" />
                    <div>
                      <div className="text-sm font-semibold flex items-center gap-1.5">
                        {member.name}
                        {isCurrentPlayerRow && (
                          <span className="text-[10px] text-yellow-500/70">(You)</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {member.completionPct}% predictions done
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOwnerMember && (
                      <Badge variant="gold" className="text-[10px]">Owner</Badge>
                    )}
                    {isOwner && !isOwnerMember && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          if (confirm(`Remove ${member.name} from the league?`)) {
                            void removeMember(member.id);
                          }
                        }}
                        title="Remove member"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Share my bracket — non-owners send this to the owner to sync leaderboard */}
      <Card className="glass border-purple-500/20">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-purple-400" />
            <div className="font-semibold text-sm">Share My Bracket</div>
          </div>
          <p className="text-xs text-muted-foreground">
            {isOwner
              ? "Share this link with each friend. When they open it on your browser, their predictions sync to your leaderboard."
              : "Send this link to the league owner. When they open it, your predictions appear on their leaderboard."}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={copyShareBracket}
          >
            {copiedShare ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Bracket link copied!</span>
              </motion.div>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                Copy My Bracket Link
              </>
            )}
          </Button>
          {showShareFallback && (
            <div className="space-y-1.5">
              <p className="text-xs text-yellow-400 font-medium">Copy the link below manually:</p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={getShareBracketLink()}
                  className="h-8 text-xs font-mono"
                  onFocus={(e) => e.target.select()}
                />
                <Button size="sm" variant="outline" className="shrink-0 h-8" onClick={() => setShowShareFallback(false)}>✕</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
