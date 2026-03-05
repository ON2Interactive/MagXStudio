import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendWelcomeEmail, sendAdminNewUserEmail } from "@/lib/email";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/workspace";

    if (code) {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && data.user) {
            const user = data.user;
            const email = user.email ?? "";
            const name = user.user_metadata?.full_name ?? user.user_metadata?.name ?? "";
            const avatarUrl = user.user_metadata?.avatar_url ?? "";

            // Upsert into users table (service role bypasses RLS)
            const service = createServiceClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            const { data: existing } = await service
                .from("users")
                .select("id")
                .eq("id", user.id)
                .single();

            const { error: upsertError } = await service.from("users").upsert(
                {
                    id: user.id,
                    email,
                    name,
                    avatar_url: avatarUrl,
                    credits: 15,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "id" }
            );

            if (upsertError) {
                console.error("Error upserting user in callback:", upsertError);
            }

            // Only send emails on first sign-up (user didn't exist before)
            if (!existing && email) {
                await Promise.all([
                    sendWelcomeEmail(email, name),
                    sendAdminNewUserEmail(email, name),
                ]);
            }

            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    return NextResponse.redirect(`${origin}/signup?error=auth`);
}
