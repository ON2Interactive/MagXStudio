"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";

export default function HelpPage() {
    const helpSections = [
        {
            title: "Getting Started",
            description: (
                <>
                    New to MagXStudio? <Link href="/signup" className="underline hover:text-white transition-colors">Create your account</Link>, then open the workspace and choose where to begin — Site Design, Slides, Pages, or Visuals. Everything runs in your browser. Nothing to install.
                </>
            ),
            items: [
                "Sign up and sign in with Google",
                "Choose a workspace from the main navigation",
                "Start a new project or pick up where you left off",
                "Export your work any time from the workspace toolbar"
            ]
        },
        {
            title: "Site Design",
            description: "Generate fully structured, multi-section websites from a single prompt. Choose a design category, describe your site, and MagXStudio produces a production-ready layout with real content, responsive structure, and high-fidelity aesthetics.",
            items: [
                "Select from 20+ design categories — SaaS, editorial, portfolio, e-commerce, and more",
                "Enter a prompt describing your site's purpose and tone",
                "Review the generated layout and refine sections as needed",
                "Export as HTML when ready"
            ]
        },
        {
            title: "Slides",
            description: "Build polished presentation decks for pitches, sales, executive updates, workshops, and more. Each deck is generated with intentional layout hierarchy, consistent branding, and professional typography across multiple aspect ratios.",
            items: [
                "Choose a deck type and describe your content",
                "MagXStudio generates slides with layout, headings, and body copy",
                "Edit individual slides directly in the canvas",
                "Export as PDF for sharing or presenting"
            ]
        },
        {
            title: "Pages",
            description: "Design multi-page editorial layouts on an infinite canvas. Pages is built for magazines, posters, publications, and print-ready documents — with precise grid systems, alignment guides, and full multi-page management.",
            items: [
                "Choose from portrait, landscape, or custom canvas dimensions",
                "Enable column grids and set gutters for editorial structure",
                "Place text, images, and AI-generated assets on the canvas",
                "Manage multiple pages from the page panel",
                "Export as PDF or image"
            ]
        },
        {
            title: "Visuals — AI Image Generation",
            description: "The Visuals workspace is powered by Nano Banana 2. Generate high-fidelity images from text prompts, explore variations, remix outputs, and place assets directly onto any canvas — all without leaving MagXStudio.",
            items: [
                "Enter a prompt and generate multiple variations simultaneously",
                "Select a variation and remix it to refine composition, style, or tone",
                "Download high-resolution images for print or digital use",
                "Send any visual directly to the Pages canvas with automatic placement",
                "Image generation, editing, and vector art each use 10 credits per action"
            ]
        },
        {
            title: "Exporting Your Work",
            description: "Export is included with your MagXStudio Pro subscription. All export formats are available directly from the workspace toolbar.",
            items: [
                "Sites export as HTML",
                "Pages and Slides export as PDF",
                "Generated images download as high-resolution files",
                "No per-export fees — export as often as you need"
            ]
        },
        {
            title: "Auto-Save & Sessions",
            description: "MagXStudio automatically saves your work as you go — no manual save button required. Every workspace captures your canvas state in the background, so closing a tab, refreshing the browser, or stepping away for a few days never means losing your work.",
            items: [
                "All four workspaces — Site Design, Slides, Pages, and Visuals — auto-save every 1.5 seconds",
                "Drafts persist for 7 days, surviving browser closes, refreshes, and system restarts",
                "When you return, your canvas, layouts, visuals, and generated content restore automatically",
                "A brief 'Draft restored' banner confirms your session has been picked up",
                "Click Discard on the banner to clear a session and start with a clean workspace",
                "Cloud saves for permanent, account-linked project storage are coming with the full account system"
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20">
            <Navbar />

            <main className="flex-1 mx-auto w-full max-w-4xl px-5 py-24 pt-[200px]">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 text-white">Help Center</h1>

                <div className="space-y-16">
                    {helpSections.map((section, index) => (
                        <div key={index} className="max-w-2xl">
                            <h2 className="text-lg md:text-xl font-bold text-white mb-4 tracking-tight">
                                {section.title}
                            </h2>
                            <p className="text-sm md:text-base text-white/50 leading-relaxed font-regular mb-6">
                                {section.description}
                            </p>
                            {section.items && (
                                <ul className="space-y-3">
                                    {section.items.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm md:text-base text-white/50 font-regular">
                                            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/40" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            </main>

            <Footer />
        </div>
    );
}
