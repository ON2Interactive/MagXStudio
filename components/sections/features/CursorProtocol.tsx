"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { MousePointer2 } from "lucide-react";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function CursorProtocol() {
    const [activeIndex, setActiveIndex] = useState(2);
    const cursorRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });

            DAYS.forEach((_, i) => {
                tl.to(cursorRef.current, {
                    x: i * 36 + 18,
                    y: 20,
                    duration: 0.6,
                    ease: "power2.inOut",
                    onStart: () => setActiveIndex(i),
                })
                    .to(cursorRef.current, {
                        scale: 0.8,
                        duration: 0.1,
                        yoyo: true,
                        repeat: 1,
                    });
            });

            tl.to(cursorRef.current, {
                x: 100,
                y: 80,
                duration: 0.8,
                ease: "power3.inOut"
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-6 p-4" ref={containerRef}>
            <div className="relative flex gap-2">
                {DAYS.map((day, i) => (
                    <div
                        key={`${day}-${i}`}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 text-[10px] font-bold transition-colors ${activeIndex === i ? "bg-accent text-obsidian" : "bg-white/5 text-muted/40"
                            }`}
                    >
                        {day}
                    </div>
                ))}

                <div ref={cursorRef} className="absolute left-0 top-0 z-10 pointer-events-none">
                    <MousePointer2 className="h-4 w-4 fill-accent text-accent" />
                </div>
            </div>

            <button className="rounded-full border border-white/10 bg-white/5 px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-ivory">
                Save Protocol
            </button>
        </div>
    );
}
