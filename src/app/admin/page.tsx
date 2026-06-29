"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Save, Trophy, AlertTriangle, Target, UserPlus, Users, ChevronDown, ChevronUp, Edit3 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { computeBracket } from "@/lib/bracket";
import { MatchCard } from "@/components/bracket/MatchCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerAvatar } from "@/components/shared/PlayerAvatar";
import type { Round, Player } from "@/types";
import { TIEBREAK_KEY } from "@/lib/constants";

const ROUNDS: Round[] = ["R32", "R16", "QF", "SF", "FINAL"];

export default function AdminPage() {
  const {
    currentPlayer, league, officialResults, allPlayers, leagueMembers,
    setOfficialResult, addProxyPlayer, setProxyPrediction, setProxyTiebreaker,
  } = useAppStore();
  const [saved, setSaved] = useState(false);
  const [tiebreakerInput, setTiebreakerInput] = useState(
    officialResults[TIEBREAK_KEY] ?? ""
  );
  const [newPlayerName, setNewPlayerName] = useState("");
  const [addPlayerError, setAddPlayerError] = useState("");
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [proxyTiebreaker, setProxyTiebreakerInput] = useState("");

  const isOwner = league?.ownerId === currentPlayer?.id;
  const computedMatches = computeBracket(officialResults);
  const members = leagueMembers();

  const handleAddPlayer = async () => {
    const trimmed = newPlayerName.trim();
    if (trimmed.length < 2) { setAddPlayerError("Name must be at least 2 characters"); return; }
    const result = await addProxyPlayer(trimmed);
    if (!result) { setAddPlayerError("Could not add player"); return; }
    setNewPlayerName("");
    setAddPlayerError("");
  };

  const handleProxySelect = async (matchId: string, winnerId: string | null) => {
    if (!editingPlayer) return;
    // Optimistically apply locally so the bracket re-renders immediately
    const predictions = { ...editingPlayer.predictions };
    predictions[matchId] = winnerId;
    setEditingPlayer({ ...editingPlayer, predictions });
    await setProxyPrediction(editingPlayer.id, matchId, winnerId);
  };

  const handleSaveProxyTiebreaker = async () => {
    if (!editingPlayer) return;
    const n = parseInt(proxyTiebreaker, 10);
    if (!isNaN(n)) await setProxyTiebreaker(editingPlayer.id, n);
  };

  if (!currentPlayer) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Please sign in first.</p>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500/60" />
        <h2 className="text-xl font-bold">Owner Access Only</h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          Only the league owner can set official results. Create a league first.
        </p>
      </div>
    );
  }

  const handleSave = async () => {
    const val = tiebreakerInput.toString().trim();
    if (val !== "" && !isNaN(parseInt(val, 10))) {
      await setOfficialResult(TIEBREAK_KEY, val);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSelect = async (matchId: string, winnerId: string | null) => {
    await setOfficialResult(matchId, winnerId);
  };

  return (
    <div className="max-w-full px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="gold" className="gap-1.5">
              <Shield className="h-3 w-3" /> Admin Panel
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Official Results
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Set the actual World Cup results to score all predictions
          </p>
        </div>
        <Button
          variant="gold"
          onClick={handleSave}
          className="gap-2 shrink-0"
        >
          <Save className="h-4 w-4" />
          {saved ? "Saved!" : "Save Results"}
        </Button>
      </motion.div>

      {/* Notice */}
      <Card className="glass border-yellow-500/20">
        <CardContent className="p-4 flex items-start gap-3">
          <Trophy className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong>How to use:</strong> Click the winner of each match in the official bracket.
            Winners automatically advance. The leaderboard updates instantly when you set results.
          </div>
        </CardContent>
      </Card>

      {/* Tiebreaker */}
      <Card className="glass border-blue-500/20">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-400" />
            <div className="font-semibold text-sm">Official Tiebreaker</div>
          </div>
          <p className="text-xs text-muted-foreground">
            How many total goals were scored in the Final? This resolves tied scores on the leaderboard.
          </p>
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              min="0"
              max="30"
              placeholder="e.g. 3"
              value={tiebreakerInput}
              onChange={(e) => setTiebreakerInput(e.target.value)}
              className="h-9 w-28"
            />
            {officialResults[TIEBREAK_KEY] && (
              <Badge variant="success">Saved: {officialResults[TIEBREAK_KEY]}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Manage Players */}
      <Card className="glass border-purple-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-400" />
            Manage Players
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add player */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Add a friend manually and fill in their bracket on their behalf.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Friend's name (e.g. Rahul)"
                value={newPlayerName}
                onChange={(e) => { setNewPlayerName(e.target.value); setAddPlayerError(""); }}
                className="h-9"
                onKeyDown={(e) => e.key === "Enter" && handleAddPlayer()}
              />
              <Button size="sm" variant="outline" className="shrink-0 gap-1.5 h-9" onClick={handleAddPlayer}>
                <UserPlus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
            {addPlayerError && <p className="text-xs text-destructive">{addPlayerError}</p>}
          </div>

          {/* Player list */}
          {members.length > 0 && (
            <div className="space-y-2">
              {members.map((member) => {
                const isEditing = editingPlayer?.id === member.id;
                const isCurrentUser = member.id === currentPlayer?.id;
                const proxyMatches = computeBracket(member.predictions);
                return (
                  <div key={member.id} className="border border-border rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-secondary/30">
                      <div className="flex items-center gap-2.5">
                        <PlayerAvatar name={member.name} size="sm" />
                        <div>
                          <div className="text-sm font-semibold flex items-center gap-1.5">
                            {member.name}
                            {isCurrentUser && <span className="text-[10px] text-yellow-500/70">(You)</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">{member.completionPct}% predictions filled</div>
                        </div>
                      </div>
                      {!isCurrentUser && (
                        <Button
                          size="sm"
                          variant={isEditing ? "gold" : "outline"}
                          className="gap-1.5 h-7 text-xs"
                          onClick={() => {
                            if (isEditing) {
                              setEditingPlayer(null);
                            } else {
                              setEditingPlayer(member);
                              setProxyTiebreakerInput(member.tiebreakerGoals?.toString() ?? "");
                            }
                          }}
                        >
                          <Edit3 className="h-3 w-3" />
                          {isEditing ? "Done" : "Edit Bracket"}
                          {isEditing ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                      )}
                    </div>

                    {isEditing && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-border"
                      >
                        <div className="p-4 space-y-4">
                          {/* Tiebreaker */}
                          <div className="flex items-center gap-3">
                            <Target className="h-4 w-4 text-blue-400 shrink-0" />
                            <span className="text-xs text-muted-foreground">Tiebreaker (total goals in Final):</span>
                            <Input
                              type="number"
                              min="0"
                              max="30"
                              placeholder="e.g. 3"
                              value={proxyTiebreaker}
                              onChange={(e) => setProxyTiebreakerInput(e.target.value)}
                              className="h-7 w-20 text-xs"
                            />
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleSaveProxyTiebreaker}>
                              Save
                            </Button>
                          </div>
                          {/* Bracket by round */}
                          {ROUNDS.map((round) => {
                            const roundMatches = proxyMatches.filter((m) => m.round === round);
                            return (
                              <div key={round}>
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{round}</div>
                                <div className="flex flex-wrap gap-2">
                                  {roundMatches.map((match) => (
                                    <MatchCard
                                      key={match.id}
                                      match={match}
                                      winnerId={editingPlayer.predictions[match.id]}
                                      isReadOnly={false}
                                      onSelect={handleProxySelect}
                                    />
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results bracket — split by round */}
      {ROUNDS.map((round) => {
        const roundMatches = computedMatches.filter((m) => m.round === round);
        return (
          <motion.div
            key={round}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ROUNDS.indexOf(round) * 0.06 }}
          >
            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{round}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {roundMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      winnerId={officialResults[match.id]}
                      isReadOnly={false}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
