import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

function createServiceClient() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return null;
    }
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
}

async function ensureUserCredits(userId: string): Promise<number | null> {
    const serviceClient = createServiceClient();
    if (!serviceClient) {
        console.error("Missing SUPABASE credentials for ensuring user credits.");
        return null;
    }

    const { data, error } = await serviceClient
        .from("subscriptions")
        .select("credits")
        .eq("user_id", userId)
        .single();

    if (!error && data) {
        if (typeof data.credits === "number") return data.credits;

        const { error: repairError } = await serviceClient
            .from("subscriptions")
            .update({ credits: 15, updated_at: new Date().toISOString() })
            .eq("user_id", userId);
        if (repairError) {
            console.error("Failed to repair null credits for user:", repairError);
            return null;
        }
        return 15;
    }

    if (error?.code !== "PGRST116") {
        console.error("Failed to fetch user credits with service role:", error);
        return null;
    }

    const { error: insertError } = await serviceClient.from("subscriptions").insert({
        user_id: userId,
        status: "trial",
        credits: 15,
        updated_at: new Date().toISOString(),
    });

    if (insertError) {
        console.error("Failed to create missing user credits row:", insertError);
        return null;
    }

    return 15;
}

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

    const credits = await ensureUserCredits(user.id);

    if (typeof credits !== "number" || credits < minCredits) {
        return { allowed: false, error: "Insufficient credits", userId: user.id, isAdmin };
    }

    return { allowed: true, userId: user.id, isAdmin };
}

export async function deductCredit(userId: string, amount: number = 1) {
    const serviceClient = createServiceClient();
    if (!serviceClient) {
        console.error("Missing SUPABASE credentials for deducting credits.");
        return;
    }

    // Fetch current credits as service role
    const { data } = await serviceClient.from("subscriptions").select("credits").eq("user_id", userId).single();

    if (data && typeof data.credits === "number" && data.credits >= amount) {
        await serviceClient
            .from("subscriptions")
            .update({ credits: data.credits - amount })
            .eq("user_id", userId);
    }
}
