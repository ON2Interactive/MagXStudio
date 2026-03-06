import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient, type User } from "@supabase/supabase-js";
import { sendWelcomeEmail, sendAdminNewUserEmail } from "@/lib/email";

const DEFAULT_TRIAL_CREDITS = 15;

function getServiceClient() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

async function ensureTrialMetadataAndWelcome(user: User) {
    const service = getServiceClient();
    const email = user.email ?? "";
    const name = user.user_metadata?.full_name ?? user.user_metadata?.name ?? "";
    const hasTrialCredits =
        typeof user.user_metadata?.trial_credits === "number" &&
        Number.isFinite(user.user_metadata?.trial_credits) &&
        user.user_metadata?.trial_credits >= 0;
    const welcomeSent = user.user_metadata?.welcome_email_sent === true;

    const nextMetadata = {
        ...(user.user_metadata ?? {}),
        trial_credits: hasTrialCredits ? user.user_metadata?.trial_credits : DEFAULT_TRIAL_CREDITS,
        welcome_email_sent: welcomeSent || !email,
    };

    const { error: updateError } = await service.auth.admin.updateUserById(user.id, {
        user_metadata: nextMetadata,
    });
    if (updateError) {
        console.error("Error updating trial metadata in callback:", updateError);
    }

    if (!welcomeSent && email) {
        await Promise.all([
            sendWelcomeEmail(email, name),
            sendAdminNewUserEmail(email, name),
        ]);
    }
}

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/workspace";
    const supabase = await createClient();

    if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && data.user) {
            await ensureTrialMetadataAndWelcome(data.user);
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // Fallback: if code exchange is skipped but session cookie already exists, still initialize trial metadata.
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (user) {
        await ensureTrialMetadataAndWelcome(user);
        return NextResponse.redirect(`${origin}${next}`);
    }

    return NextResponse.redirect(`${origin}/signup?error=auth`);
}
