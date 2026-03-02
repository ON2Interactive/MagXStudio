import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full resize-y border-0 border-b border-[#5c626f] bg-transparent px-0 py-2 text-sm text-white/92 placeholder:text-[#8f96a3] focus-visible:outline-none focus-visible:border-[#8a92a0]",
        props.className
      )}
    />
  );
}
