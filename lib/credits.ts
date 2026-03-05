import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function checkCredits(minCredits: number = 1): Promise<{ allowed: boolean; userId?: string; error?: string; isAdmin?: boolean }> {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { allowed: false, error: "Unauthorized" };
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "kipme001@gmail.com";
    const isAdmin = user.email === adminEmail;

    if (isAdmin) {
        return { allowed: true, userId: user.id, isAdmin };
    }

    const { data, error } = await supabase.from("users").select("credits").eq("id", user.id).single();

    if (error && error.code === "PGRST116") {
        // User profile doesn't exist yet (signup callback may have failed or been bypassed)
        // Lazy-create the user with 15 credits using the service role to bypass RLS
        const serviceClient = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error: insertError } = await serviceClient.from("users").insert({
            id: user.id,
            email: user.email,
            credits: 15,
            updated_at: new Date().toISOString(),
        });

        if (!insertError) {
            // Successfully created, check if 15 credits is enough
            if (15 < minCredits) {
                return { allowed: false, error: "Insufficient credits", userId: user.id, isAdmin };
            }
            return { allowed: true, userId: user.id, isAdmin };
        }

        console.error("Failed to lazy-create user profile:", insertError);
    }

    if (!data || typeof data.credits !== "number" || data.credits < minCredits) {
        return { allowed: false, error: "Insufficient credits", userId: user.id, isAdmin };
    }

    return { allowed: true, userId: user.id, isAdmin };
}

export async function deductCredit(userId: string, amount: number = 1) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("Missing SUPABASE credentials for deducting credits.");
        return;
    }

    const serviceClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch current credits as service role
    const { data } = await serviceClient.from("users").select("credits").eq("id", userId).single();

    if (data && typeof data.credits === "number" && data.credits >= amount) {
        await serviceClient
            .from("users")
            .update({ credits: data.credits - amount })
            .eq("id", userId);
    }
}
