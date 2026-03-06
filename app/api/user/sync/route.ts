import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendWelcomeEmail, sendAdminNewUserEmail } from "@/lib/email";

export async function POST() {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const serviceClient = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await serviceClient
            .from("subscriptions")
            .select("credits")
            .eq("user_id", user.id)
            .single();

        if (error && error.code === "PGRST116") {
            // Missing user (OAuth redirect likely bypassed callback)
            // 1. Create with 15 credits
            const { error: insertError } = await serviceClient.from("subscriptions").insert({
                user_id: user.id,
                status: "trial",
                credits: 15,
                updated_at: new Date().toISOString(),
            });
            if (insertError) {
                console.error("User sync insert failed:", insertError);
                return NextResponse.json({ error: "Failed to create user credits" }, { status: 500 });
            }

            // 2. Send the missing welcome emails
            const email = user.email ?? "";
            const name = user.user_metadata?.full_name ?? user.user_metadata?.name ?? "";
            if (email) {
                await Promise.all([
                    sendWelcomeEmail(email, name),
                    sendAdminNewUserEmail(email, name),
                ]);
            }

            return NextResponse.json({ credits: 15 });
        }

        if (error) {
            console.error("User sync fetch failed:", error);
            return NextResponse.json({ error: "Failed to fetch user credits" }, { status: 500 });
        }

        return NextResponse.json({ credits: data?.credits ?? 0 });
    } catch (e) {
        console.error("User sync failed:", e);
        return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
    }
}
