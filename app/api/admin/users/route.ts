import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "kipme001@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "MagXStudio@$@$";
const SESSION_TOKEN = Buffer.from(`${ADMIN_EMAIL}:${ADMIN_PASSWORD}`).toString("base64");

async function checkAuth() {
    const cookieStore = await cookies();
    return cookieStore.get("magx_admin_session")?.value === SESSION_TOKEN;
}

function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// GET all users
export async function GET() {
    if (!await checkAuth()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getServiceClient();

    // List all auth users
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Get all subscriptions
    const { data: subs } = await supabase
        .from("subscriptions")
        .select("user_id, status, credits");

    const subMap = new Map(subs?.map((s) => [s.user_id, s]) ?? []);

    const rows = users.map((u) => {
        const sub = subMap.get(u.id);
        return {
            id: u.id,
            email: u.email ?? "",
            username: (u.user_metadata?.full_name as string | undefined) ?? "",
            credits: (sub?.credits as number | undefined) ?? 0,
            status: (sub?.status as string | undefined) ?? "inactive",
            created: u.created_at,
        };
    });

    return NextResponse.json({ users: rows });
}

// PUT update a user (username + credits)
export async function PUT(req: Request) {
    if (!await checkAuth()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, username, credits } = await req.json() as {
        id: string;
        username: string;
        credits: number;
    };

    const supabase = getServiceClient();

    // Update display name in auth metadata
    await supabase.auth.admin.updateUserById(id, {
        user_metadata: { full_name: username },
    });

    // Upsert credits in subscriptions
    await supabase.from("subscriptions").upsert(
        { user_id: id, credits, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
    );

    return NextResponse.json({ ok: true });
}

// DELETE a user
export async function DELETE(req: Request) {
    if (!await checkAuth()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json() as { id: string };
    const supabase = getServiceClient();
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
}
