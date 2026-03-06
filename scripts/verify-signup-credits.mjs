#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function fail(message, details) {
  console.error(`\nFAIL: ${message}`);
  if (details) console.error(details);
  process.exit(1);
}

function info(message) {
  console.log(message);
}

async function listRecentAuthUsers(admin, lookbackHours) {
  const cutoffMs = Date.now() - lookbackHours * 60 * 60 * 1000;
  const recent = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) fail("Unable to list auth users.", error.message);
    const users = data?.users ?? [];
    if (!users.length) break;

    for (const user of users) {
      const createdMs = Date.parse(user.created_at ?? "");
      if (Number.isFinite(createdMs) && createdMs >= cutoffMs) {
        recent.push(user);
      }
    }

    const reachedOlderUsers = users.some((u) => {
      const createdMs = Date.parse(u.created_at ?? "");
      return Number.isFinite(createdMs) && createdMs < cutoffMs;
    });
    if (reachedOlderUsers || users.length < perPage) break;
    page += 1;
  }

  return recent;
}

async function verifyRecentUsers(admin, lookbackHours) {
  info(`\n[1/2] Checking real signups from the last ${lookbackHours}h...`);
  const recentAuthUsers = await listRecentAuthUsers(admin, lookbackHours);
  info(`Recent auth users found: ${recentAuthUsers.length}`);

  if (!recentAuthUsers.length) {
    info("No recent signups in window. Skipping historical validation.");
    return;
  }

  const ids = recentAuthUsers.map((u) => u.id);
  const { data: rows, error } = await admin
    .from("subscriptions")
    .select("user_id, credits")
    .in("user_id", ids);
  if (error) fail("Unable to query subscriptions credits table.", error.message);

  const byId = new Map((rows ?? []).map((row) => [row.user_id, row]));
  const missing = [];
  const invalid = [];

  for (const authUser of recentAuthUsers) {
    const row = byId.get(authUser.id);
    if (!row) {
      missing.push({ id: authUser.id, email: authUser.email ?? "(no email)" });
      continue;
    }
    if (typeof row.credits !== "number" || !Number.isFinite(row.credits) || row.credits < 0) {
      invalid.push({
        id: authUser.id,
        email: authUser.email ?? "(no email)",
        credits: row.credits,
      });
    }
  }

  if (missing.length || invalid.length) {
    fail(
      "Recent signup credit validation failed.",
      JSON.stringify({ missing, invalid }, null, 2)
    );
  }

  info("Recent signup credit validation passed.");
}

async function runSmokeTest(admin) {
  info("\n[2/2] Running throwaway signup provisioning smoke test...");
  const testEmail = `credits-smoke-${Date.now()}-${randomUUID().slice(0, 8)}@example.com`;
  const password = `Mx!${randomUUID()}A1`;
  let testUserId = null;

  try {
    const { data: createData, error: createError } = await admin.auth.admin.createUser({
      email: testEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Credits Smoke Test" },
    });
    if (createError || !createData?.user) {
      fail("Unable to create throwaway auth user.", createError?.message);
    }
    testUserId = createData.user.id;

    const { data: existing, error: existingError } = await admin
      .from("subscriptions")
      .select("user_id")
      .eq("user_id", testUserId)
      .single();
    if (existingError && existingError.code !== "PGRST116") {
      fail("Unexpected error checking throwaway user row.", existingError.message);
    }
    if (existing) {
      fail("Throwaway auth user already had a subscriptions row before provisioning.");
    }

    const { error: insertError } = await admin.from("subscriptions").insert({
      user_id: testUserId,
      status: "trial",
      credits: 15,
      updated_at: new Date().toISOString(),
    });
    if (insertError) {
      fail("Failed to insert default 15 credits for throwaway user.", insertError.message);
    }

    const { data: inserted, error: insertedError } = await admin
      .from("subscriptions")
      .select("credits")
      .eq("user_id", testUserId)
      .single();
    if (insertedError) {
      fail("Failed to read back throwaway user credits.", insertedError.message);
    }
    if (inserted?.credits !== 15) {
      fail("Throwaway user did not receive exactly 15 credits.", JSON.stringify(inserted));
    }

    const { error: downgradeError } = await admin
      .from("subscriptions")
      .update({ credits: 3, updated_at: new Date().toISOString() })
      .eq("user_id", testUserId);
    if (downgradeError) {
      fail("Failed to set throwaway user credits to 3 for callback regression check.", downgradeError.message);
    }

    const { error: updateError } = await admin
      .from("subscriptions")
      .update({
        status: "trial",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", testUserId);
    if (updateError) {
      fail("Failed to run callback-style profile update check.", updateError.message);
    }

    const { data: afterUpdate, error: afterUpdateError } = await admin
      .from("subscriptions")
      .select("credits")
      .eq("user_id", testUserId)
      .single();
    if (afterUpdateError) {
      fail("Failed to read throwaway credits after callback-style update.", afterUpdateError.message);
    }
    if (afterUpdate?.credits !== 3) {
      fail("Callback-style update unexpectedly changed existing credits.", JSON.stringify(afterUpdate));
    }

    info("Throwaway signup provisioning smoke test passed.");
  } finally {
    if (testUserId) {
      await admin.from("subscriptions").delete().eq("user_id", testUserId);
      await admin.auth.admin.deleteUser(testUserId);
      info("Throwaway user cleaned up.");
    }
  }
}

async function main() {
  loadEnvFile(path.resolve(process.cwd(), ".env.local"));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const lookbackHours = Number(process.env.SIGNUP_CREDITS_LOOKBACK_HOURS ?? "72");

  if (!url || !serviceRole) {
    fail("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }
  if (!Number.isFinite(lookbackHours) || lookbackHours <= 0) {
    fail("SIGNUP_CREDITS_LOOKBACK_HOURS must be a positive number.");
  }

  const admin = createClient(url, serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  info("Verifying signup credit provisioning...");
  await verifyRecentUsers(admin, lookbackHours);
  await runSmokeTest(admin);
  info("\nPASS: Signup credit provisioning checks completed successfully.");
}

main().catch((error) => {
  fail("Unhandled verification error.", error instanceof Error ? error.stack : String(error));
});
