"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowRight, Play, CheckCircle2 } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let mouseMoveHandler: (e: MouseEvent) => void;

        const ctx = gsap.context(() => {
            // Hero Entrance
            gsap.from(".hero-content > *", {
                y: 40,
                opacity: 0,
                duration: 1.2,
                stagger: 0.15,
                ease: "power3.out",
            });

            // Infinite marquee animation
            const marqueeContent = document.querySelector(".marquee-content");
            if (marqueeContent) {
                const contentWidth = marqueeContent.scrollWidth;
                gsap.to(".marquee-content", {
                    x: -contentWidth,
                    duration: 40,
                    ease: "none",
                    repeat: -1,
                });
            }
            // Parallax for Hero Image
            gsap.to(".hero-bg", {
                yPercent: 10,
                ease: "none",
                scrollTrigger: {
                    trigger: ".hero-section",
                    start: "top top",
                    end: "bottom top",
                    scrub: true,
                },
            });

            // Philosophy Reveal
            gsap.from(".philosophy-content > *", {
                y: 60,
                opacity: 0,
                duration: 1.5,
                stagger: 0.2,
                ease: "power4.out",
                scrollTrigger: {
                    trigger: ".philosophy-section",
                    start: "top 70%",
                }
            });

            // Editor Preview Fade In/Out on Scroll
            gsap.fromTo(".editor-preview-img",
                { opacity: 0, y: 60 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1.2,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: ".editor-preview-img",
                        start: "top 85%",
                        end: "bottom 15%",
                        toggleActions: "play reverse play reverse",
                    }
                }
            );

            // Mouse Follow for Hero Background
            const heroBg = document.querySelector('.hero-bg') as HTMLElement;
            if (heroBg) {
                // Ensure sufficient scale for motion to avoid edges
                gsap.set(heroBg, { scale: 1.2, force3D: true });

                const xTo = gsap.quickTo(heroBg, "x", { duration: 1, ease: "power3.out" });
                const yTo = gsap.quickTo(heroBg, "y", { duration: 1, ease: "power3.out" });

                mouseMoveHandler = (e: MouseEvent) => {
                    const { clientX, clientY } = e;
                    const { innerWidth, innerHeight } = window;

                    const xPos = (clientX / innerWidth - 0.5) * 60;
                    const yPos = (clientY / innerHeight - 0.5) * 60;

                    // Calculate distance from center (0 at center, 1 at edges)
                    const distX = Math.abs(clientX / innerWidth - 0.5) * 2;
                    const distY = Math.abs(clientY / innerHeight - 0.5) * 2;
                    const dist = Math.min(Math.sqrt(distX * distX + distY * distY), 1);

                    // Brighten from 0.5 → 0.8 based on mouse distance from center
                    const brightness = 0.5 + dist * 0.3;
                    heroBg.style.filter = `brightness(${brightness})`;

                    xTo(xPos);
                    yTo(yPos);
                };

                window.addEventListener('mousemove', mouseMoveHandler);
            }
        }, containerRef);

        return () => {
            ctx.revert();
            if (mouseMoveHandler) window.removeEventListener('mousemove', mouseMoveHandler);
        };
    }, []);

    return (
        <div className="relative min-h-screen bg-black selection:bg-accent selection:text-obsidian overflow-x-hidden" ref={containerRef}>
            <Navbar />

            {/* HERO SECTION */}
            <section className="hero-section relative h-[100dvh] w-full overflow-hidden flex items-center justify-center text-center">
                <div
                    className="hero-bg absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: "url('/Assets/Hero-Dark.png')",
                        filter: "brightness(0.5)"
                    }}
                />
                <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/40 via-transparent to-black" />

                <div className="hero-content relative z-20 px-6 max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-6 tracking-tight">
                        One Studio for Site Design,<br className="hidden md:block" />
                        Presentation Slides, Pages, and AI Visuals.
                    </h1>
                    <p className="text-lg md:text-xl text-white/70 mb-10 font-medium max-w-2xl mx-auto">
                        Professional-grade creative tools, in one place.
                    </p>
                    <div className="flex justify-center">
                        <a
                            href="/workspace"
                            className="px-10 py-3 rounded-xl border border-white/40 text-white font-semibold hover:bg-white hover:text-black transition-all duration-300 backdrop-blur-sm"
                        >
                            Try It Now
                        </a>
                    </div>
                </div>
            </section>

            {/* EDITOR PREVIEW SECTION */}
            <section className="editor-preview-section bg-black py-40 px-6 md:px-20 text-center border-t border-white/5">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-20 tracking-tight">
                        All-In-One Integrated Workspaces
                    </h2>

                    <div className="relative mb-20 group max-w-[1400px] mx-auto editor-preview-img">
                        <div className="absolute -inset-1 bg-gradient-to-r from-white/10 to-transparent blur opacity-20 transition duration-1000"></div>
                        <div className="relative overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-2xl">
                            <img
                                src="/images/screenshot-pages.png"
                                alt="MagXStudio Pages Editor"
                                className="w-full h-auto opacity-80"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* FOUR PILLARS SECTION */}
            <section className="pillars-section relative py-40 px-6 md:px-20 overflow-hidden border-t border-white/5"
                style={{ backgroundColor: '#0e0e0e' }}
            >
                <div className="relative z-10 max-w-[1400px] mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20">
                        <div>
                            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">Site Design</h3>
                            <p className="text-sm md:text-base text-white/50 leading-relaxed font-medium">
                                Generate fully structured, multi-section websites from a single prompt. Choose from over 20 design categories — SaaS, editorial, portfolio, e-commerce — and produce production-ready layouts with real content, responsive structure, and high-fidelity aesthetics.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">Slides</h3>
                            <p className="text-sm md:text-base text-white/50 leading-relaxed font-medium">
                                Build polished presentation decks — pitch decks, sales decks, executive updates, and workshop materials. Each slide is generated with intentional layout hierarchy, consistent branding, and professional typography across multiple aspect ratios.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">Pages</h3>
                            <p className="text-sm md:text-base text-white/50 leading-relaxed font-medium">
                                Design multi-page editorial layouts for magazines, posters, and publications on an infinite canvas. Precise grid systems, alignment guides, and multi-page management give you the architectural control of traditional desktop publishing in a modern browser environment.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">Visuals</h3>
                            <p className="text-sm md:text-base text-white/50 leading-relaxed font-medium">
                                Generate high-fidelity raster and vector assets directly inside the studio. From social media graphics and digital ads to concept art and product shots — create, edit, and place visual assets without leaving the canvas.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CANVAS PREVIEW GALLERY */}
            <section className="canvas-preview-section bg-[#f5f5f5] py-40 px-6 md:px-20 relative overflow-hidden">
                <div className="max-w-7xl mx-auto relative">
                    <div className="text-center mb-20 flex flex-col items-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-black tracking-tight mb-3">Super Fast Image Generation</h2>
                        <p className="text-sm md:text-base text-black/50 font-medium mb-16">Powered by Nano Banana 2</p>

                        {/* FEATURE DESCRIPTIONS */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 w-full max-w-6xl text-left">
                            <div>
                                <h4 className="text-base font-bold text-black tracking-wider mb-2">Variations</h4>
                                <p className="text-sm text-black/60 leading-relaxed font-medium">
                                    Generate multiple interpretations of a single prompt simultaneously. Explore diverse aesthetic directions in seconds.
                                </p>
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-black tracking-wider mb-2">Remix</h4>
                                <p className="text-sm text-black/60 leading-relaxed font-medium">
                                    Take any variation and refine it. Adjust context, style, or composition without losing the core essence of your initial creation.
                                </p>
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-black tracking-wider mb-2">Professional Control</h4>
                                <p className="text-sm text-black/60 leading-relaxed font-medium">
                                    Preview, delete, and manage each selection. Download high-resolution assets ready for professional print or digital use.
                                </p>
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-black tracking-wider mb-2">Send to Pages</h4>
                                <p className="text-sm text-black/60 leading-relaxed font-medium">
                                    Send any generated visuals directly to the Pages Canvas. Automatic placement and scaling for instant workflow integration.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center">
                        <Slideshow />
                    </div>
                </div>
            </section>

            {/* COMPREHENSIVE FEATURES GRID */}
            <section className="features-grid-section bg-black py-40 px-6 md:px-20 border-t border-white/5">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FeatureItem
                            title="AI Site Generation"
                            description="Generate fully structured, multi-section websites from a single prompt with over 20 design categories including SaaS, editorial, portfolio, and e-commerce."
                        />
                        <FeatureItem
                            title="Presentation Builder"
                            description="Build polished slide decks — pitch, sales, executive, and workshop formats — with consistent branding and professional typography across multiple aspect ratios."
                        />
                        <FeatureItem
                            title="Multi-Page Canvas"
                            description="Design complete multi-page publications on an infinite canvas with drag, resize, layer control, alignment guides, and snap-aware placement."
                        />
                        <FeatureItem
                            title="AI Image Generate + Edit"
                            description="Generate new visuals from prompts and run AI edits directly on selected canvas images, with version history controls built in."
                        />
                        <FeatureItem
                            title="Visual Asset Studio"
                            description="Create social media graphics, digital ads, concept art, and product shots in multiple aspect ratios — all generated and refined within the workspace."
                        />
                        <FeatureItem
                            title="Grid System"
                            description="Use preset layout grids and custom grids with adjustable columns, gutter, and margins for precise editorial structure across every page."
                        />
                        <FeatureItem
                            title="Typography Controls"
                            description="Style text with OpenType controls, alignment, tracking, spacing, gradients, and image fills for editorial-quality compositions."
                        />
                        <FeatureItem
                            title="Theme Categories"
                            description="Choose from over 20 curated design categories — brutalist, glassmorphism, bento, magazine, dashboard — to steer AI output toward specific aesthetics."
                        />
                        <FeatureItem
                            title="Export"
                            description="Export your work in multiple formats, including HTML, PDF, and image outputs for print, sharing, and digital publishing workflows."
                        />
                    </div>
                </div>
            </section>
            {/* TRUSTED BY SECTION */}
            <section className="trusted-by-section bg-black py-12 border-t border-white/5 overflow-hidden flex items-center min-h-[160px]">
                <div className="max-w-[1400px] mx-auto px-6 w-full">
                    <div className="marquee-container relative flex whitespace-nowrap overflow-hidden">
                        <div className="marquee-content flex gap-32 items-center pr-32">
                            <BrandLogo name="VERCEL" />
                            <BrandLogo name="STRIPE" />
                            <BrandLogo name="GHOST" />
                            <BrandLogo name="500PX" />
                            <BrandLogo name="SUPABASE" />
                            <BrandLogo name="FLICKR" />
                        </div>
                        {/* Duplicate for seamless loop */}
                        <div className="marquee-content flex gap-32 items-center pr-32" aria-hidden="true">
                            <BrandLogo name="VERCEL" />
                            <BrandLogo name="STRIPE" />
                            <BrandLogo name="GHOST" />
                            <BrandLogo name="500PX" />
                            <BrandLogo name="SUPABASE" />
                            <BrandLogo name="FLICKR" />
                        </div>
                    </div>
                </div>
            </section>

            {/* SESSION-BASED WORKFLOW SECTION */}
            <section className="session-section bg-black py-40 px-6 md:px-20 border-t border-white/5">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 tracking-tight">Session-Based Workflow</h2>

                    <div className="space-y-8 text-sm md:text-base text-white/50 leading-relaxed font-medium">
                        <p>
                            Every workspace in MagXStudio saves your work automatically. Close the tab, step away for a day, come back after a weekend — your canvas, your layouts, your generated visuals are exactly where you left them. No save button. No export required before you close.
                        </p>
                        <p>
                            The moment you make a change, it's captured. A 1.5-second auto-save runs silently in the background across all four workspaces — Site Design, Slides, Pages, and Visuals. Drafts are preserved for 7 days, surviving browser closes, refreshes, and system restarts without any action required on your part.
                        </p>
                        <p>
                            When you return, your work is restored instantly. A brief banner confirms the restore. From there, continue immediately, or discard and start clean. A designer can start a layout Tuesday morning, step into meetings, and return Thursday to exactly the same canvas. A creator can generate a set of visuals, close the tab, and re-open to the same session days later.
                        </p>
                        <p className="text-white font-bold">
                            Your session waits for you. Not the other way around.
                        </p>
                        <p>
                            No cloud account required for draft persistence. Your workspace state is held locally and privately — available for a full week before expiring. Account-linked cloud saves for permanent, device-synced project storage are coming with the full account system.
                        </p>
                    </div>
                </div>
            </section>

            {/* FREEHAND HISTORY SECTION */}

            <section className="history-section bg-black py-40 px-6 md:px-20 border-t border-white/5">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 tracking-tight">Work in Parallel</h2>

                    <div className="space-y-8 text-sm md:text-base text-white/50 leading-relaxed font-medium">
                        <p>
                            Most creative work doesn't fit into a single category. A marketer builds a campaign — and needs a landing page, a slide deck, images, and a visual layout, all for the same project. A designer pitches a client — and moves from a site mockup to a presentation to a printed one-pager without breaking stride. A creator publishes content — and goes from generating visuals to composing layouts to sharing a polished deck, all in one session.
                        </p>
                        <p>
                            MagXStudio is built for that reality. Every workspace — Site Design, Slides, Pages, and Visuals — is available from a single tab, without switching tools or losing context. You decide what you need and when you need it.
                        </p>
                        <p>
                            A marketer can design a landing page, generate on-brand imagery, build a campaign deck, and lay out a one-pager — without leaving. A designer can move between canvas layouts, presentation formats, and visual generation in the same session. A content creator can generate, arrange, and publish without the usual handoff friction.
                        </p>
                        <p className="text-white font-bold">
                            One tool. Every format. No switching tools.
                        </p>
                        <p>
                            Work in parallel doesn't mean working with others — it means being able to work across every dimension of a project, as one person, without walls between your tools.
                        </p>
                    </div>
                </div>
            </section>

            {/* CLOUD-BASED SECTION */}
            <section className="cloud-section bg-black py-40 px-6 md:px-20 border-t border-white/5">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 tracking-tight">Cloud-Based. No Software Downloads.</h2>

                    <div className="space-y-8 text-sm md:text-base text-white/50 leading-relaxed font-medium">
                        <p>
                            MagXStudio runs entirely in your browser. There's nothing to install, no license to activate, no update cycle to manage. Open a tab, sign in, and your full workspace is there — exactly where you left it.
                        </p>
                        <p>
                            Your projects, assets, and settings are stored securely in the cloud. Switch from a desktop to a laptop to an external monitor — your work follows you, not the other way around. No syncing, no file transfers, no version mismatches.
                        </p>
                        <p>
                            For marketers, designers, and creators who work across devices or move between environments, this matters. A campaign started at the office is ready to review on the road. A layout built in the morning is exactly the same when you return to it at night.
                        </p>
                        <p className="text-white font-bold">
                            Your browser is your studio.
                        </p>
                        <p>
                            No disk space consumed. No plugins to update. No compatibility issues between operating systems. Just a modern, capable creative environment available anywhere you have a connection.
                        </p>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
}

function FeatureItem({ title, description, badge }: { title: string; description: string; badge?: string }) {
    return (
        <div className="group relative overflow-hidden bg-[#0a0a0a] p-10 border border-white/5 hover:border-white/10 transition-all duration-300 shadow-2xl h-full flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
                {badge && (
                    <span className="px-2 py-0.5 bg-[#1a3a8a] text-[9px] font-bold text-[#60a5fa] uppercase tracking-wider">
                        {badge}
                    </span>
                )}
            </div>
            <p className="text-sm text-white/50 leading-relaxed font-medium">
                {description}
            </p>
        </div>
    );
}

function BrandLogo({ name }: { name: string }) {
    return (
        <div className="flex items-center grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-default group">
            <span className="text-2xl font-black text-white tracking-tighter group-hover:scale-105 transition-transform duration-500">
                {name}
            </span>
        </div>
    );
}

function Slideshow() {
    const slides = [
        { src: '/slideshow/02.jpeg', alt: 'MagXStudio Workspace' },
        { src: '/slideshow/07.jpeg', alt: 'MagXStudio Pages' },
        { src: '/slideshow/08.jpeg', alt: 'MagXStudio Slides' },
        { src: '/slideshow/09.jpeg', alt: 'MagXStudio Visuals' },
    ];

    const [current, setCurrent] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const imgRefs = useRef<(HTMLImageElement | null)[]>([]);

    const goTo = useCallback((index: number) => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        const prev = imgRefs.current[current];
        const next = imgRefs.current[index];
        if (prev && next) {
            gsap.to(prev, { opacity: 0, duration: 0.6, ease: 'power2.inOut' });
            gsap.fromTo(next,
                { opacity: 0 },
                { opacity: 1, duration: 0.6, ease: 'power2.inOut', onComplete: () => setIsTransitioning(false) }
            );
        } else {
            setIsTransitioning(false);
        }
        setCurrent(index);
    }, [current, isTransitioning]);

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setCurrent(prev => {
                const next = (prev + 1) % slides.length;
                const prevImg = imgRefs.current[prev];
                const nextImg = imgRefs.current[next];
                if (prevImg && nextImg) {
                    gsap.to(prevImg, { opacity: 0, duration: 0.6, ease: 'power2.inOut' });
                    gsap.fromTo(nextImg, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.inOut' });
                }
                return next;
            });
        }, 4000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [slides.length]);

    const resetInterval = (index: number) => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        goTo(index);
        intervalRef.current = setInterval(() => {
            setCurrent(prev => {
                const next = (prev + 1) % slides.length;
                const prevImg = imgRefs.current[prev];
                const nextImg = imgRefs.current[next];
                if (prevImg && nextImg) {
                    gsap.to(prevImg, { opacity: 0, duration: 0.6, ease: 'power2.inOut' });
                    gsap.fromTo(nextImg, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.inOut' });
                }
                return next;
            });
        }, 4000);
    };

    return (
        <div className="w-full max-w-[1200px] mx-auto">
            {/* Slide frame */}
            <div className="relative overflow-hidden bg-[#0a0a0a] aspect-video shadow-sm" style={{ border: '1px solid #e8e8e8', borderRadius: '10px' }}>
                {slides.map((slide, i) => (
                    <img
                        key={slide.src}
                        ref={el => { imgRefs.current[i] = el; }}
                        src={slide.src}
                        alt={slide.alt}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ opacity: i === 0 ? 1 : 0 }}
                    />
                ))}
            </div>

            {/* Dot navigation */}
            <div className="flex justify-center gap-2 mt-6">
                {slides.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => resetInterval(i)}
                        className={`transition-all duration-300 rounded-full ${i === current ? 'w-6 h-2 bg-black' : 'w-2 h-2 bg-black/30 hover:bg-black/60'}`}
                        aria-label={`Go to slide ${i + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
