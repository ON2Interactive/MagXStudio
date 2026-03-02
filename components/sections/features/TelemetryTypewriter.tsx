"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
    "Initializing neural link...",
    "Loading localized datasets...",
    "Optimizing layout coordinates...",
    "Running diagnostic scan...",
    "System operational."
];

export function TelemetryTypewriter() {
    const [text, setText] = useState("");
    const [msgIdx, setMsgIdx] = useState(0);
    const [charIdx, setCharIdx] = useState(0);

    useEffect(() => {
        if (charIdx < MESSAGES[msgIdx].length) {
            const timeout = setTimeout(() => {
                setText((prev) => prev + MESSAGES[msgIdx][charIdx]);
                setCharIdx((prev) => prev + 1);
            }, 50);
            return () => clearTimeout(timeout);
        } else {
            const timeout = setTimeout(() => {
                setText("");
                setCharIdx(0);
                setMsgIdx((prev) => (prev + 1) % MESSAGES.length);
            }, 2000);
            return () => clearTimeout(timeout);
        }
    }, [charIdx, msgIdx]);

    return (
        <div className="flex h-full w-full flex-col gap-4 p-4 font-mono text-xs">
            <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                <span className="uppercase tracking-widest text-muted/60 text-[10px]">Live Feed</span>
            </div>
            <div className="flex-1 overflow-hidden text-accent/80 leading-relaxed">
                {text}
                <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-accent" />
            </div>
        </div>
    );
}
