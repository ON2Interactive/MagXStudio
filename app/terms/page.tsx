"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";

function BulletList({ items }: { items: string[] }) {
    return (
        <ul className="space-y-3">
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm md:text-base text-white/50 font-regular">
                    <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-white/40" />
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20 flex flex-col">
            <Navbar />

            <main className="flex-1 mx-auto w-full max-w-4xl px-5 py-24 pt-[200px]">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 text-white">Terms of Use</h1>

                <div className="space-y-12 max-w-2xl">

                    <section>
                        <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-6">Last Updated: February 21, 2026</p>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">
                            Welcome to MagXStudio! By accessing or using our website and services, you agree to be bound by these Terms of Use. If you do not agree with any part of these terms, please do not use the service.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">1. Overview</h2>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">
                            MagXStudio is a browser-based creative studio for generating websites, presentation decks, multi-page editorial layouts, and AI-powered visuals. By using the platform, you agree to use it responsibly and in accordance with applicable laws.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">2. User Conduct</h2>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">You agree not to:</p>
                        <BulletList items={[
                            "Upload or generate content that is unlawful, harmful, offensive, or infringes on any third-party rights.",
                            "Use the platform to create misleading, deceptive, or manipulated content that could cause harm or misrepresentation.",
                            "Attempt to reverse-engineer or interfere with the service or its functionality."
                        ]} />
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">3. Account Responsibility</h2>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">
                            If you create an account, you are responsible for maintaining its security and for all activity that occurs under your login.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">4. Intellectual Property</h2>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">
                            Content you create in MagXStudio remains yours, unless otherwise stated. The MagXStudio platform, brand, software, and underlying technologies are owned by the company and may not be copied, resold, or used without permission.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">5. Disclaimer on AI Output and Export Accuracy</h2>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">
                            MagXStudio includes AI-assisted tools for image generation, image editing, vector generation, site generation, and presentation building. Results can vary and may not exactly match prompts, source content, or intended outcomes.
                        </p>
                        <p className="text-sm md:text-base text-white/70 font-bold leading-relaxed">
                            You are responsible for reviewing all generated content and final exports before publication, production, or client delivery.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">6. Limitation of Liability</h2>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">
                            MagXStudio is provided "as is" without warranties of any kind. We are not liable for any direct, indirect, incidental, or consequential damages arising from your use of the service, including loss of data, project files, or design outputs.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">7. Service Availability</h2>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">
                            We may update, modify, or suspend features of the platform at any time without notice. We are not responsible for outages, delays, or service interruptions.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">8. Termination</h2>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">
                            We reserve the right to suspend or terminate access to MagXStudio for any reason, including violation of these terms.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">9. Privacy</h2>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">
                            Your use of MagXStudio is also governed by our <Link href="/privacy" className="underline hover:text-white transition-colors">Privacy Policy</Link>, which explains how we handle your data and project content.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">10. Changes to Terms</h2>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">
                            We may revise these terms at any time. Continued use of the platform after changes are posted means you accept the revised terms.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">11. Contact</h2>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">
                            If you have any questions about these Terms of Use, please <Link href="/contact" className="underline hover:text-white transition-colors">contact us</Link>.
                        </p>
                    </section>

                </div>
            </main>

            <Footer />
        </div>
    );
}
