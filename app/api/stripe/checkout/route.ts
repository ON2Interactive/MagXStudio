import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { priceId } = await req.json() as { priceId: string };
    const TOP_UP_PRICE_ID = "price_1T6wtsPKoJ7Z0f639J0RogcH";

    if (!priceId) {
        return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
    }

    const mode = priceId === TOP_UP_PRICE_ID ? "payment" : "subscription";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://magxstudio.com";

    const session = await stripe.checkout.sessions.create({
        mode,
        payment_method_types: ["card"],
        customer_email: user.email,
        client_reference_id: user.id, // links Stripe customer → Supabase user in webhook
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${appUrl}/workspace?subscribed=true`,
        cancel_url: `${appUrl}/workspace`,
        metadata: { user_id: user.id },
    });

    return NextResponse.json({ url: session.url });
}
