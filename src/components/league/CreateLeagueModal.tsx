"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
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
  name: z.string().min(2, "Name must be at least 2 characters").max(40),
  lockTime: z.string().min(1, "Please select a lock time").refine(
    (val) => new Date(val) > new Date(),
    "Lock time must be in the future"
  ),
});

type FormData = z.infer<typeof schema>;

interface CreateLeagueModalProps {
  onCreated?: () => void;
}

function getDefaultLockTime() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(14, 30, 0, 0);
  return d.toISOString().slice(0, 16);
}

export function CreateLeagueModal({ onCreated }: CreateLeagueModalProps) {
  const [open, setOpen] = useState(false);
  const { createLeague, currentPlayer } = useAppStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      lockTime: getDefaultLockTime(),
    },
  });

  const onSubmit = async (data: FormData) => {
    await createLeague(data.name, new Date(data.lockTime).toISOString());
    reset();
    setOpen(false);
    onCreated?.();
  };

  if (!currentPlayer) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gold" size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          Create League
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl">Create a League</DialogTitle>
          <DialogDescription>
            Set up your prediction league and invite friends.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              League Name
            </label>
            <Input
              placeholder="e.g. Office Predictions 2026"
              {...register("name")}
              className="h-11"
            />
            {errors.name && (
              <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Prediction Lock Time
            </label>
            <Input
              type="datetime-local"
              {...register("lockTime")}
              className="h-11"
            />
            {errors.lockTime && (
              <p className="text-xs text-destructive mt-1">{errors.lockTime.message}</p>
            )}
            <p className="text-xs text-muted-foreground/60 mt-1">
              Predictions lock at this time — no edits allowed after.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="gold" className="flex-1" disabled={isSubmitting}>
              Create League
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
