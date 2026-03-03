import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "kipme001@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "MagXStudio@$@$";
// Simple session token derived from credentials — no extra env var needed
const SESSION_TOKEN = Buffer.from(`${ADMIN_EMAIL}:${ADMIN_PASSWORD}`).toString("base64");

export async function POST(req: Request) {
    const { email, password } = await req.json() as { email: string; password: string };

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set("magx_admin_session", SESSION_TOKEN, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 8, // 8 hours
    });

    return NextResponse.json({ ok: true });
}
