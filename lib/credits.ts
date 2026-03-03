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

    const { data } = await supabase.from("users").select("credits").eq("id", user.id).single();
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
