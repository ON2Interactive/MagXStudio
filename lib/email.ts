import sgMail from "@sendgrid/mail";

const FROM = process.env.SENDGRID_FROM_EMAIL ?? "hello@magxstudio.com";
const ADMIN = process.env.SENDGRID_FROM_EMAIL ?? "hello@magxstudio.com";

export async function sendEmail(to: string, subject: string, html: string) {
    if (!process.env.SENDGRID_API_KEY) {
        console.error("[SendGrid] API Key missing");
        return;
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    try {
        await sgMail.send({ to, from: FROM, subject, html });
    } catch (err) {
        console.error("[SendGrid] Failed to send email:", err);
    }
}

// ─── Welcome email to new user ─────────────────────────────────────────────
export function sendWelcomeEmail(to: string, name: string) {
    const firstName = name?.split(" ")[0] ?? "there";
    return sendEmail(
        to,
        "Welcome to MagXStudio",
        `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333;line-height:1.6;font-size:16px;">
            <p>Hi ${firstName},</p>
            <p>Welcome to MagXStudio.</p>
            <p>Your creative workspace is now ready.</p>
            <p>MagXStudio is designed to give you a streamlined, powerful environment to create:</p>
            <ul style="padding-left: 20px;">
                <li>Responsive websites</li>
                <li>Presentation decks</li>
                <li>Multi-page layouts and publications</li>
                <li>AI-generated visuals</li>
            </ul>
            <p>All in one browser-based studio. No installs. No complexity. Just a focused space to design and build.</p>
            
            <div style="margin: 30px 0;">
                <a href="https://magxstudio.com/workspace" style="background-color:#000;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Open your Workspace →</a>
            </div>

            <p>To get started:</p>
            <ol style="padding-left: 20px;">
                <li>Create your first project</li>
                <li>Choose your format — Website, Slides, or Layout</li>
                <li>Use a prompt or start designing directly on the canvas</li>
            </ol>
            <p>MagXStudio is built to feel fast, precise, and intuitive — whether you’re creating a landing page, a pitch deck, or a visual concept.</p>
            <p>We look forward to seeing what you create.</p>
            <p>The MagXStudio Team</p>
            <p style="margin-top:40px;color:#888;font-size:12px;">MagXStudio · <a href="https://magxstudio.com/unsubscribe" style="color:#888;">Unsubscribe</a></p>
        </div>
        `
    );
}

// ─── Admin notification: new user ──────────────────────────────────────────
export function sendAdminNewUserEmail(email: string, name: string) {
    return sendEmail(
        ADMIN,
        `🆕 New user signed up: ${email}`,
        `<p><strong>Name:</strong> ${name || "—"}<br/><strong>Email:</strong> ${email}<br/><strong>Time:</strong> ${new Date().toUTCString()}</p>`
    );
}

// ─── Admin notification: subscription event ────────────────────────────────
export function sendAdminSubscriptionEmail(event: string, detail: string) {
    return sendEmail(
        ADMIN,
        `📦 Subscription event: ${event}`,
        `<p>${detail}</p><p style="color:#888;font-size:12px;">${new Date().toUTCString()}</p>`
    );
}

// ─── Admin notification: payment ───────────────────────────────────────────
export function sendAdminPaymentEmail(event: string, detail: string) {
    return sendEmail(
        ADMIN,
        `💳 Payment event: ${event}`,
        `<p>${detail}</p><p style="color:#888;font-size:12px;">${new Date().toUTCString()}</p>`
    );
}
