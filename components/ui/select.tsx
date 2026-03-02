import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full border-0 border-b border-[#5c626f] bg-transparent px-0 py-2 text-sm text-white/92 focus-visible:outline-none focus-visible:border-[#8a92a0]",
        props.className
      )}
    />
  );
}
