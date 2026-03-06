import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createServiceClient, type User } from "@supabase/supabase-js";

const DEFAULT_TRIAL_CREDITS = 15;

function getServiceClient() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

function readTrialCredits(user: User): number {
    const value = user.user_metadata?.trial_credits;
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
        return value;
    }
    return DEFAULT_TRIAL_CREDITS;
}

async function resolveUser(request: Request): Promise<User | null> {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return user;

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return null;

    const serviceForAuth = getServiceClient();
    const { data } = await serviceForAuth.auth.getUser(token);
    return data.user ?? null;
}

export async function POST(request: Request) {
    try {
        const user = await resolveUser(request);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const serviceClient = getServiceClient();

        const { data, error } = await serviceClient
            .from("subscriptions")
            .select("credits")
            .eq("user_id", user.id)
            .single();

        if (!error && data && typeof data.credits === "number" && Number.isFinite(data.credits) && data.credits >= 0) {
            return NextResponse.json({ credits: data.credits });
        }

        if (error && error.code !== "PGRST116") {
            console.error("User sync subscription fetch failed:", error);
            return NextResponse.json({ error: "Failed to fetch user credits" }, { status: 500 });
        }

        const trialCredits = readTrialCredits(user);
        if (user.user_metadata?.trial_credits !== trialCredits) {
            const { error: updateError } = await serviceClient.auth.admin.updateUserById(user.id, {
                user_metadata: {
                    ...(user.user_metadata ?? {}),
                    trial_credits: trialCredits,
                },
            });
            if (updateError) {
                console.error("User sync trial credits init failed:", updateError);
                return NextResponse.json({ error: "Failed to initialize trial credits" }, { status: 500 });
            }
        }

        return NextResponse.json({ credits: trialCredits });
    } catch (e) {
        console.error("User sync failed:", e);
        return NextResponse.json({ error: "Failed to sync user" }, { status: 500 });
    }
}
