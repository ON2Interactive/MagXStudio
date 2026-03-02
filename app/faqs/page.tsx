"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";

export default function FAQPage() {
    const faqs = [
        {
            question: "What is MagXStudio?",
            answer: "MagXStudio is an all-in-one creative studio that runs entirely in your browser. It brings four professional-grade workspaces under one tab — Site Design for generating websites, Slides for presentation decks, Pages for multi-page canvas layouts, and Visuals for AI-powered image generation. No installs. No switching tools. One subscription."
        },
        {
            question: "What are the four workspaces?",
            answer: "Site Design lets you generate fully structured, multi-section websites from a single prompt across 20+ design categories. Slides builds polished presentation decks — pitch decks, sales decks, executive updates — with consistent branding and layout hierarchy. Pages is a multi-page canvas for editorial layouts, magazines, posters, and publications. Visuals generates high-fidelity images using Nano Banana 2, with support for variations, remixes, and direct placement onto any canvas."
        },
        {
            question: "How is MagXStudio different from other design tools?",
            answer: "Most tools are built for one format — a slide deck tool, a website builder, a photo editor. MagXStudio combines all four into a single, unified workspace with shared context. You don't lose your project state switching between tasks. A marketer, designer, or content creator can move from generating visuals to building a layout to producing a presentation deck — all in one session, from one tab."
        },
        {
            question: "Do I need to install anything?",
            answer: "No. MagXStudio is entirely browser-based. Sign in, and your workspace is ready. Your projects and assets are stored in the cloud, so your work is accessible from any device without syncing, file transfers, or version conflicts."
        },
        {
            question: "Does MagXStudio save my work automatically?",
            answer: "Yes. Every workspace — Site Design, Slides, Pages, and Visuals — auto-saves your work as you go. There's no save button to remember. Drafts are preserved for 7 days, so closing a tab, refreshing the browser, or stepping away for a weekend won't result in lost work. When you return, your canvas is restored automatically. Account-linked cloud saves for permanent project storage are coming with the full account system."
        },
        {
            question: "How does pricing work?",
            answer: (
                <>
                    MagXStudio Pro is $24.99 per month. Your subscription includes 200 credits every month, plus full access to all four workspaces and export capabilities. You can top up credits at any time for $20 per 200 credits. Full details are on the <Link href="/pricing" className="underline hover:text-white transition-colors">Pricing</Link> page.
                </>
            )
        },
        {
            question: "What are credits used for?",
            answer: "Credits power AI actions inside MagXStudio. Image generation, image editing, and vector art generation each use 10 credits. Standard workspace features — canvas design, layout tools, text editing, and presentation building — do not use credits and are available with your subscription."
        },
        {
            question: "Do credits roll over or expire?",
            answer: "Monthly subscription credits reset at the start of each billing cycle. Top-up credits are permanent and do not expire — they remain in your account until you use them."
        },
        {
            question: "What is Nano Banana 2?",
            answer: "Nano Banana 2 is the AI image generation model powering the Visuals workspace. It produces high-fidelity raster outputs from text prompts, with support for multiple variations per prompt, remix refinements, and direct export or canvas placement. It is designed for professional creative workflows — fast, controlled, and integrated."
        },
        {
            question: "Can I design manually, or is everything AI?",
            answer: "Both. MagXStudio's canvas tools give you full manual control — drag, resize, rotate, layer, align, and apply grid systems and typography controls with precision. AI generation is available whenever you want it, but it never replaces the manual workflow. You decide when to use it."
        },
        {
            question: "What can I export?",
            answer: "Subscription includes full export access. You can export Sites as HTML, Pages and Slides as PDF, and generated images as high-resolution downloads. Exports are included with your subscription — no per-export fees."
        },
        {
            question: "What's included in the free trial?",
            answer: "The free trial gives you full access to the workspace environment — canvas tools, layout features, presentation building, and page design. AI generation, image editing, vector art, and export require an active subscription."
        },
        {
            question: "Can I use MagXStudio for commercial and client work?",
            answer: "Yes. MagXStudio is designed for professional and production workflows. Review all AI-generated outputs against your client's brand guidelines and applicable usage requirements before delivery."
        }
    ];

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20">
            <Navbar />

            <main className="flex-1 mx-auto w-full max-w-4xl px-5 py-24 pt-[200px]">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 text-white">FAQs</h1>

                <div className="space-y-12">
                    {faqs.map((faq, index) => (
                        <div key={index} className="max-w-2xl">
                            <h2 className="text-lg md:text-xl font-bold text-white mb-3 tracking-tight">
                                {faq.question}
                            </h2>
                            <div className="text-sm md:text-base text-white/50 leading-relaxed font-regular">
                                {faq.answer}
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <Footer />
        </div>
    );
}
