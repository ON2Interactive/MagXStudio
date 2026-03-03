import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

// Use service role to bypass RLS when writing subscription data
function getServiceClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

type InvoiceWithSubscription = Stripe.Invoice & { subscription?: string | null };

async function upsertSubscription(
    supabase: ReturnType<typeof getServiceClient>,
    subscription: Stripe.Subscription
) {
    const customerId = subscription.customer as string;

    // Look up user by stripe_customer_id
    const { data: existing } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .single();

    if (!existing?.user_id) return;

    const item = subscription.items.data[0];
    const sub = subscription as unknown as {
        current_period_start: number;
        current_period_end: number;
    };

    await supabase.from("subscriptions").upsert(
        {
            user_id: existing.user_id,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            stripe_price_id: item?.price?.id ?? null,
            status: subscription.status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
        },
        { onConflict: "stripe_customer_id" }
    );
}

export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const sig = headersList.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
        return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
        console.error("Stripe webhook signature verification failed:", err);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const supabase = getServiceClient();

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                if (session.mode === "subscription" && session.customer && session.client_reference_id) {
                    // Link Stripe customer → Supabase user
                    await supabase.from("subscriptions").upsert(
                        {
                            user_id: session.client_reference_id,
                            stripe_customer_id: session.customer as string,
                            status: "active",
                            updated_at: new Date().toISOString(),
                        },
                        { onConflict: "user_id" }
                    );
                }
                break;
            }

            case "customer.subscription.created":
            case "customer.subscription.updated": {
                const subscription = event.data.object as Stripe.Subscription;
                await upsertSubscription(supabase, subscription);
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                await supabase
                    .from("subscriptions")
                    .update({ status: "canceled", updated_at: new Date().toISOString() })
                    .eq("stripe_subscription_id", subscription.id);
                break;
            }

            case "invoice.payment_succeeded": {
                const invoice = event.data.object as InvoiceWithSubscription;
                const subscriptionId = invoice.subscription;
                if (subscriptionId) {
                    await supabase
                        .from("subscriptions")
                        .update({ status: "active", updated_at: new Date().toISOString() })
                        .eq("stripe_subscription_id", subscriptionId);
                }
                break;
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object as InvoiceWithSubscription;
                const subscriptionId = invoice.subscription;
                if (subscriptionId) {
                    await supabase
                        .from("subscriptions")
                        .update({ status: "past_due", updated_at: new Date().toISOString() })
                        .eq("stripe_subscription_id", subscriptionId);
                }
                break;
            }
        }
    } catch (err) {
        console.error(`Error handling Stripe event ${event.type}:`, err);
        return NextResponse.json({ error: "Handler error" }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
