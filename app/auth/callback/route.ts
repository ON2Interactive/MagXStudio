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

            // Ensure a subscriptions row exists for trial credits
            const service = createServiceClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            const { data: existing, error: existingError } = await service
                .from("subscriptions")
                .select("user_id")
                .eq("user_id", user.id)
                .single();

            const isNewUser = !existing && existingError?.code === "PGRST116";

            if (existingError && existingError.code !== "PGRST116") {
                console.error("Error fetching existing subscription in callback:", existingError);
            } else if (!existing) {
                const { error: insertError } = await service.from("subscriptions").insert({
                    user_id: user.id,
                    status: "trial",
                    credits: 15,
                    updated_at: new Date().toISOString(),
                });
                if (insertError) {
                    console.error("Error creating trial subscription in callback:", insertError);
                }
            }

            // Only send emails on first sign-up (user didn't exist before)
            if (isNewUser && email) {
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
