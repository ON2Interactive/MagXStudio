import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full border-0 border-b border-[#5c626f] bg-transparent px-0 py-2 text-sm text-white/92 placeholder:text-[#8f96a3] focus-visible:outline-none focus-visible:border-[#8a92a0]",
        props.className
      )}
    />
  );
}
