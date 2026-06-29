"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogIn } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

const schema = z.object({
  inviteCode: z.string().min(4, "Invalid invite code").max(20),
});

type FormData = z.infer<typeof schema>;

export function JoinLeagueModal() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { joinLeague, currentPlayer } = useAppStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError(null);
    const league = await joinLeague(data.inviteCode.trim().toUpperCase());
    if (!league) {
      setError("League not found. Make sure the invite code is correct.");
      return;
    }
    reset();
    setOpen(false);
  };

  if (!currentPlayer) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="gap-2">
          <LogIn className="h-4 w-4" />
          Join League
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl">Join a League</DialogTitle>
          <DialogDescription>
            Use an invite code only if you are on the same browser as the league creator. For a different browser or device, use the invite link instead.
          </DialogDescription>
        </DialogHeader>

        {/* Cross-device callout */}
        <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-3 text-sm space-y-1">
          <p className="font-semibold text-yellow-400">On a different browser or device?</p>
          <p className="text-xs text-muted-foreground">
            Ask the league owner to click <strong className="text-foreground">"Copy Invite Link"</strong> on their League page and send you that link. Opening it will add you automatically — no code needed.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Invite Code <span className="text-xs">(same browser only)</span>
            </label>
            <Input
              placeholder="e.g. ABC12345"
              className="h-11 uppercase font-mono tracking-widest text-center text-lg"
              {...register("inviteCode")}
            />
            {errors.inviteCode && (
              <p className="text-xs text-destructive mt-1">{errors.inviteCode.message}</p>
            )}
          </div>

          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
              {error}
              <p className="mt-1 text-xs text-muted-foreground">
                If you are on a different browser, ask the owner for the <strong>invite link</strong> instead.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              Join
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
