"use client";

import { useEffect, useState } from "react";
import { gsap } from "gsap";

const LABELS = ["Biological Data", "Precision Longevity", "Genome Sequence", "Neural Mapping"];

export function DiagnosticShuffler() {
    const [cards, setCards] = useState(LABELS.slice(0, 3));

    useEffect(() => {
        const interval = setInterval(() => {
            setCards((prev) => {
                const next = [...prev];
                const last = next.pop()!;
                next.unshift(last);
                return next;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
            <div className="relative h-40 w-full max-w-[200px]">
                {cards.map((label, i) => (
                    <div
                        key={label}
                        className="absolute left-0 top-0 flex h-24 w-full items-center justify-center rounded-2xl border border-white/10 bg-surface px-4 text-center text-sm font-bold shadow-2xl transition-all duration-700"
                        style={{
                            transform: `translateY(${i * 20}px) scale(${1 - i * 0.05})`,
                            zIndex: 3 - i,
                            opacity: 1 - i * 0.3,
                        }}
                    >
                        <span className="text-ivory">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
