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
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0d0d0d;color:#f5f5f5;border-radius:16px;overflow:hidden;">
            <div style="padding:40px 40px 24px;">
                <img src="https://magxstudio.com/Assets/Logo-Light.png" alt="MagXStudio" style="height:32px;margin-bottom:32px;" />
                <h1 style="font-size:24px;font-weight:700;margin:0 0 12px;">Hey ${firstName}, welcome aboard!</h1>
                <p style="color:#999;font-size:15px;line-height:1.6;margin:0 0 24px;">
                    Your MagXStudio account is ready. You start with <strong style="color:#fff;">10 free credits</strong> — enough to generate your first sites and visuals.
                </p>
                <a href="https://magxstudio.com/workspace" style="display:inline-block;background:#fff;color:#000;font-weight:700;font-size:14px;padding:12px 28px;border-radius:100px;text-decoration:none;">
                    Open Workspace →
                </a>
            </div>
            <div style="padding:24px 40px;border-top:1px solid #222;color:#555;font-size:12px;">
                MagXStudio · <a href="https://magxstudio.com/unsubscribe" style="color:#555;">Unsubscribe</a>
            </div>
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
