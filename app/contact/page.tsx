"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp } from "lucide-react";

export default function ContactPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
        const mailto = `mailto:hello@magxstudio.com?subject=${encodeURIComponent(subject || "Contact from MagXStudio")}&body=${encodeURIComponent(body)}`;
        window.open(mailto, "_blank");
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20 flex flex-col">
            <Navbar />

            <main className="flex-1 mx-auto w-full max-w-4xl px-5 py-24 pt-[200px] text-left">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 text-white">Contact</h1>
                <p className="text-sm md:text-base text-white/50 leading-relaxed font-medium mb-10">
                    Questions, feedback, or support requests. Send us a message.
                </p>

                <form className="space-y-8 max-w-2xl" onSubmit={handleSubmit}>
                    <div className="space-y-1">
                        <label htmlFor="name" className="text-sm font-medium text-white/60">Name</label>
                        <Input
                            id="name"
                            placeholder="Your name"
                            className="rounded-none h-12"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="email" className="text-sm font-medium text-white/60">Email</label>
                        <Input
                            type="email"
                            id="email"
                            placeholder="Your email address"
                            className="rounded-none h-12"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="subject" className="text-sm font-medium text-white/60">Subject</label>
                        <Input
                            id="subject"
                            placeholder="How can we help?"
                            className="rounded-none h-12"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="message" className="text-sm font-medium text-white/60">Message</label>
                        <Textarea
                            id="message"
                            rows={6}
                            placeholder="Your message details..."
                            className="rounded-none resize-none min-h-[120px]"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>

                    <div className="pt-8 flex justify-end">
                        <button
                            type="submit"
                            title="Send message"
                            aria-label="Send message"
                            className="inline-flex h-12 w-12 items-center justify-center bg-white text-black transition-all duration-300 hover:bg-white/90 active:scale-95 cursor-pointer rounded-full"
                        >
                            <ArrowUp className="h-6 w-6 stroke-[2.5]" />
                        </button>
                    </div>
                </form>
            </main>

            <Footer />
        </div>
    );
}
