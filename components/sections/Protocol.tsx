"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
    {
        number: "01",
        title: "Inspiration Harvesting",
        description: "Our autonomous agents crawl the web to find high-fidelity design inspirations tailored to your unique aesthetic markers.",
        animation: <RotatingMotif />
    },
    {
        number: "02",
        title: "Structural Synthesis",
        description: "The core layout engine maps visual hierarchy to functional components, ensuring pixel-perfect 1:1 precision.",
        animation: <ScanningLaser />
    },
    {
        number: "03",
        title: "Cohesive Deployment",
        description: "Every page is generated with system-wide consistency, using a synchronized design language and asset library.",
        animation: <PulsingWaveform />
    }
];

export function Protocol() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const cards = gsap.utils.toArray<HTMLElement>(".protocol-card");

            cards.forEach((card, i) => {
                if (i === cards.length - 1) return;

                ScrollTrigger.create({
                    trigger: card,
                    start: "top top",
                    pin: true,
                    pinSpacing: false,
                    scrub: true,
                    onUpdate: (self) => {
                        const scale = 1 - self.progress * 0.1;
                        const blur = self.progress * 20;
                        const opacity = 1 - self.progress * 0.5;
                        gsap.set(card, { scale, opacity, filter: `blur(${blur}px)` });
                    }
                });
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section className="relative z-10" ref={containerRef}>
            {STEPS.map((step, i) => (
                <div
                    key={step.number}
                    className="protocol-card flex h-screen w-full items-center justify-center bg-obsidian px-8 md:px-20"
                >
                    <div className="grid w-full max-w-7xl grid-cols-1 md:grid-cols-2 gap-20">
                        <div className="flex flex-col justify-center">
                            <span className="mono-data mb-6 text-sm tracking-[0.3em] text-accent/60">STEP / {step.number}</span>
                            <h2 className="tight-tracking mb-8 text-5xl font-bold text-ivory md:text-7xl">{step.title}</h2>
                            <p className="max-w-md text-xl leading-relaxed text-muted/80">{step.description}</p>
                        </div>

                        <div className="flex h-[400px] w-full items-center justify-center rounded-[3rem] bg-surface/50 border border-white/5 shadow-inner-white">
                            {step.animation}
                        </div>
                    </div>
                </div>
            ))}
        </section>
    );
}

function RotatingMotif() {
    return (
        <svg className="h-64 w-64 text-accent/20" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" stroke="currentColor" fill="none" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="30" stroke="currentColor" fill="none" strokeWidth="0.5" />
            <g className="animate-spin-slow origin-center">
                {[...Array(12)].map((_, i) => (
                    <line
                        key={i}
                        x1="50" y1="10" x2="50" y2="20"
                        transform={`rotate(${i * 30} 50 50)`}
                        stroke="currentColor"
                        strokeWidth="1"
                    />
                ))}
            </g>
            <style jsx>{`
        .animate-spin-slow {
          animation: spin 10s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </svg>
    );
}

function ScanningLaser() {
    return (
        <div className="relative h-64 w-64 overflow-hidden rounded-xl border border-white/5 bg-black/40">
            <div className="absolute inset-x-0 h-[100%] w-full opacity-20"
                style={{
                    backgroundImage: "linear-gradient(#c9a84c 1px, transparent 1px), linear-gradient(90deg, #c9a84c 1px, transparent 1px)",
                    backgroundSize: "20px 20px"
                }}
            />
            <div className="absolute top-0 h-1 w-full bg-accent shadow-[0_0_20px_#c9a84c] animate-scan" />
            <style jsx>{`
        .animate-scan {
          animation: scan 4s ease-in-out infinite;
        }
        @keyframes scan {
          0%, 100% { top: 0; opacity: 0; }
          40%, 60% { opacity: 1; }
          50% { top: 100%; }
        }
      `}</style>
        </div>
    );
}

function PulsingWaveform() {
    return (
        <svg className="h-48 w-full px-12 text-accent" viewBox="0 0 400 100">
            <path
                className="animate-pulse-path"
                d="M 0 50 Q 50 50 100 20 Q 150 80 200 50 Q 250 50 300 20 Q 350 80 400 50"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="1000"
                strokeDashoffset="1000"
            />
            <style jsx>{`
        .animate-pulse-path {
          animation: draw 3s ease-in-out infinite;
        }
        @keyframes draw {
          0% { stroke-dashoffset: 1000; opacity: 0; }
          50% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: -1000; opacity: 0; }
        }
      `}</style>
        </svg>
    );
}
