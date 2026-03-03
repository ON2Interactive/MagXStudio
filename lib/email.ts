import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const FROM = process.env.SENDGRID_FROM_EMAIL ?? "hello@magxstudio.com";
const ADMIN = process.env.SENDGRID_FROM_EMAIL ?? "hello@magxstudio.com";

export async function sendEmail(to: string, subject: string, html: string) {
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
        "Welcome to MagXStudio 🎉",
        `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333;line-height:1.6;font-size:16px;">
            <p>Hey ${firstName},</p>
            <p>Welcome to MagXStudio. Your account is ready, and you're starting with <strong>10 free credits</strong> — enough to generate your first sites and visuals.</p>
            <p><a href="https://magxstudio.com/workspace" style="color:#000;font-weight:bold;text-decoration:underline;">Open your Workspace →</a></p>
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
