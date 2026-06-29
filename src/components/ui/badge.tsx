import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/20 text-primary border border-primary/30",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive/20 text-destructive border border-destructive/30",
        outline: "border border-border text-foreground",
        gold: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
        success: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
        locked: "bg-red-500/20 text-red-400 border border-red-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
