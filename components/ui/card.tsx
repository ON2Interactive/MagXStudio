import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-none border-0 bg-transparent shadow-none backdrop-blur-0",
        className
      )}
      {...props}
    />
  );
}
