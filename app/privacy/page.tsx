"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

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

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20 flex flex-col">
            <Navbar />

            <main className="flex-1 mx-auto w-full max-w-4xl px-5 py-24 pt-[200px]">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 text-white">Privacy Policy</h1>

                <div className="space-y-12 max-w-2xl">

                    <section>
                        <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-6">Last updated: February 21, 2026</p>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed font-regular mb-4">
                            MagXStudio ("MagXStudio", "we", "our", or "us") respects your privacy and is committed to protecting it through this Privacy Policy. This policy explains how we collect, use, disclose, and safeguard your information when you use the MagXStudio website, application, and related services (collectively, the "Service").
                        </p>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed font-regular">
                            By accessing or using MagXStudio, you agree to the terms of this Privacy Policy.
                        </p>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">1. Information We Collect</h2>

                        <div className="space-y-4">
                            <h3 className="text-base font-bold text-white tracking-tight">1.1 Information You Provide</h3>
                            <p className="text-sm md:text-base text-white/50 leading-relaxed">When you use MagXStudio, we may collect:</p>
                            <BulletList items={[
                                "Account information such as name and email address when you sign up or authenticate",
                                "Information provided through third-party authentication services (e.g., Google OAuth)",
                                "Communications you send to us, such as support requests or feedback"
                            ]} />
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-base font-bold text-white tracking-tight">1.2 Automatically Collected Information</h3>
                            <p className="text-sm md:text-base text-white/50 leading-relaxed">We may automatically collect limited technical information, including:</p>
                            <BulletList items={[
                                "Browser type, device type, and operating system",
                                "IP address and general location (city/country level)",
                                "Usage data related to features accessed within the Service"
                            ]} />
                            <p className="text-xs text-white/30 italic">This information is used solely to operate, secure, and improve MagXStudio.</p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-base font-bold text-white tracking-tight">1.3 Design and Content Data</h3>
                            <p className="text-sm md:text-base text-white/50 leading-relaxed">
                                Content you create in MagXStudio (such as designs, layouts, or uploaded assets) is stored only to provide the Service to you.
                            </p>
                            <p className="text-sm md:text-base text-white/70 leading-relaxed font-bold">
                                Your content is private. We do not review, analyze, sell, or use user-generated content for advertising or training purposes.
                            </p>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">2. Use of Information</h2>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">We use collected information to:</p>
                        <BulletList items={[
                            "Provide, operate, and maintain MagXStudio",
                            "Authenticate users and manage accounts",
                            "Improve functionality, usability, and performance",
                            "Communicate with users regarding updates or support",
                            "Ensure security and prevent abuse or fraud",
                            "Comply with legal obligations"
                        ]} />
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">3. Google OAuth & Third-Party Authentication</h2>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">MagXStudio offers sign-in via Google OAuth.</p>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">When you sign in using Google:</p>
                        <BulletList items={[
                            "We receive basic profile information (such as your email address and name)",
                            "This information is used only for authentication and account creation",
                            "We do not access Google Drive, contacts, or other Google services unless explicitly stated"
                        ]} />
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">
                            MagXStudio's use of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.
                        </p>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">We do not:</p>
                        <BulletList items={[
                            "Sell Google user data",
                            "Use Google user data for advertising",
                            "Share Google user data with third parties beyond what is required to operate the Service"
                        ]} />
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">4. Payments and Billing</h2>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">
                            If you purchase subscriptions or credits, payments are processed securely by third-party payment processors (such as Stripe).
                        </p>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">
                            MagXStudio does not store or process full payment card details. Payment providers handle this information according to their own privacy and security policies.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">5. Cookies and Tracking</h2>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">MagXStudio may use essential cookies or similar technologies to:</p>
                        <BulletList items={[
                            "Maintain user sessions",
                            "Enable authentication",
                            "Ensure security and basic functionality"
                        ]} />
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">
                            We do not use cookies for third-party advertising or cross-site tracking.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">6. Data Sharing and Disclosure</h2>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">We do not sell or rent personal data.</p>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">We may share information only:</p>
                        <BulletList items={[
                            "With trusted service providers required to operate the Service (e.g., authentication, hosting, payments)",
                            "To comply with legal obligations or enforce our rights",
                            "To protect the safety and integrity of MagXStudio and its users"
                        ]} />
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">
                            All third-party providers are required to protect user data and use it only for authorized purposes.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">7. Data Retention</h2>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">
                            We retain personal information only as long as necessary to provide the Service or comply with legal obligations.
                        </p>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">
                            Users may request account deletion, after which personal data will be removed or anonymized unless retention is legally required.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">8. Data Security</h2>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">
                            We implement industry-standard security measures to protect user data, including encryption, access controls, and secure infrastructure.
                        </p>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">
                            While no system is 100% secure, we continuously work to safeguard your information.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">9. Your Rights</h2>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">Depending on your location, you may have rights to:</p>
                        <BulletList items={[
                            "Access your personal data",
                            "Request correction or deletion",
                            "Withdraw consent for data processing"
                        ]} />
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">
                            Requests can be made by contacting us using the details below.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">10. Children's Privacy</h2>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">
                            MagXStudio is not intended for children under the age of 13. We do not knowingly collect personal data from children.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">11. Changes to This Policy</h2>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">
                            We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date.
                        </p>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">
                            Continued use of the Service after changes constitutes acceptance of the revised policy.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">12. Contact Information</h2>
                        <p className="text-sm md:text-base text-white/50 leading-relaxed">
                            If you have questions about this Privacy Policy or data practices, contact us at:
                        </p>
                        <BulletList items={[
                            "Email: hello@magxstudio.com",
                            "Website: https://magxstudio.com"
                        ]} />
                        <p className="text-xs text-white/30 italic mt-4">
                            MagXStudio uses your Google account information solely for secure authentication. We do not sell, share, or use your data for advertising.
                        </p>
                    </section>

                </div>
            </main>

            <Footer />
        </div>
    );
}
