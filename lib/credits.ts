import { createClient as createSupabaseClient, type User } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const DEFAULT_TRIAL_CREDITS = 15;

function createServiceClient() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return null;
    }
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
}

function getTrialCreditsFromMetadata(user: User): number {
    const value = user.user_metadata?.trial_credits;
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
        return value;
    }
    return DEFAULT_TRIAL_CREDITS;
}

async function ensureTrialCreditsInMetadata(user: User): Promise<number | null> {
    const current = user.user_metadata?.trial_credits;
    if (typeof current === "number" && Number.isFinite(current) && current >= 0) {
        return current;
    }

    const serviceClient = createServiceClient();
    if (!serviceClient) {
        console.error("Missing SUPABASE credentials for initializing trial credits.");
        return null;
    }

    const { error } = await serviceClient.auth.admin.updateUserById(user.id, {
        user_metadata: {
            ...(user.user_metadata ?? {}),
            trial_credits: DEFAULT_TRIAL_CREDITS,
        },
    });
    if (error) {
        console.error("Failed to initialize trial credits in auth metadata:", error);
        return null;
    }
    return DEFAULT_TRIAL_CREDITS;
}

async function getCreditsForUser(user: User): Promise<number | null> {
    const serviceClient = createServiceClient();
    if (!serviceClient) {
        console.error("Missing SUPABASE credentials for checking credits.");
        return null;
    }

    const { data, error } = await serviceClient
        .from("subscriptions")
        .select("credits")
        .eq("user_id", user.id)
        .single();

    if (!error && data && typeof data.credits === "number" && Number.isFinite(data.credits) && data.credits >= 0) {
        return data.credits;
    }

    if (error && error.code !== "PGRST116") {
        console.error("Failed to fetch subscription credits:", error);
        return null;
    }

    if (!error && data && (typeof data.credits !== "number" || !Number.isFinite(data.credits) || data.credits < 0)) {
        return ensureTrialCreditsInMetadata(user);
    }

    return ensureTrialCreditsInMetadata(user);
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

    const credits = await getCreditsForUser(user);

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

    const { data, error } = await serviceClient
        .from("subscriptions")
        .select("credits")
        .eq("user_id", userId)
        .single();

    if (!error && data && typeof data.credits === "number" && data.credits >= amount) {
        await serviceClient
            .from("subscriptions")
            .update({ credits: data.credits - amount })
            .eq("user_id", userId);
        return;
    }

    if (error && error.code !== "PGRST116") {
        console.error("Failed to fetch subscription credits for deduction:", error);
        return;
    }

    const { data: authUserData, error: authUserError } = await serviceClient.auth.admin.getUserById(userId);
    if (authUserError || !authUserData?.user) {
        console.error("Failed to fetch auth user for trial credit deduction:", authUserError);
        return;
    }

    const user = authUserData.user;
    const currentTrialCredits = getTrialCreditsFromMetadata(user);
    if (currentTrialCredits < amount) return;

    const { error: updateError } = await serviceClient.auth.admin.updateUserById(userId, {
        user_metadata: {
            ...(user.user_metadata ?? {}),
            trial_credits: currentTrialCredits - amount,
        },
    });
    if (updateError) {
        console.error("Failed to deduct trial credits in auth metadata:", updateError);
    }
}
