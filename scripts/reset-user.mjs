/**
 * reset-user.mjs
 * ───────────────────────────────────────────────────────────────────
 * One-shot utility to create OR update a Supabase Auth user with a
 * known email + password. Bypasses the "forgot password" email flow
 * (which requires outbound SMTP config that isn't set up here).
 *
 * Uses the SERVICE ROLE key — **server-side only**. Never commit the
 * key, never ship this script in client-side code.
 *
 * Usage:
 *   node scripts/reset-user.mjs
 *
 * The email + password + profile metadata are set in CONFIG below.
 * Change them, re-run, done.
 * ───────────────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ───────────────────────────────────────────────────────────────────
// CONFIG — edit these, save, rerun.
// ───────────────────────────────────────────────────────────────────
const CONFIG = {
  email:      'cheimakriba@gmail.com',
  password:   'Cheima2026!',   // pick anything — min 6 chars per Supabase default
  first_name: 'Cheima',
  last_name:  'Kriba',
  phone:      '0776908899',
};

// ───────────────────────────────────────────────────────────────────
// Robust .env.local loader:
//   - Strips UTF-8 BOM (Notepad adds it silently)
//   - Handles both LF and CRLF line endings
//   - Strips surrounding " or ' around values
//   - Allows any key casing (UPPER / lower / mixed)
//   - Prints which keys it picked up so env issues are visible
// ───────────────────────────────────────────────────────────────────
function loadEnv() {
  const path = resolve(process.cwd(), '.env.local');
  let raw;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    console.warn(`⚠ .env.local not found at ${path} — relying on shell env vars`);
    return [];
  }

  // Strip BOM if present (Windows editors love adding it)
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);

  const loaded = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();

    // Strip a single pair of matching outer quotes
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }

    // Don't overwrite values already in process.env (shell wins)
    if (!process.env[key]) process.env[key] = val;
    loaded.push(key);
  }

  console.log(`→ Loaded ${loaded.length} keys from .env.local:`);
  console.log(`  ${loaded.join(', ') || '(empty)'}`);
  return loaded;
}
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    '❌ Missing env vars. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`→ Looking up user by email: ${CONFIG.email}`);

  // Check if user exists. Admin API doesn't have a findByEmail, so
  // paginate through the user list. For small projects this is fine.
  const { data: listed, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listErr) {
    console.error('❌ Failed to list users:', listErr.message);
    process.exit(1);
  }

  const existing = listed.users.find((u) => u.email === CONFIG.email);

  let userId;
  if (existing) {
    console.log(`→ Found existing user ${existing.id}, updating password...`);
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password: CONFIG.password,
      email_confirm: true, // makes sure they can log in immediately
      user_metadata: {
        first_name: CONFIG.first_name,
        last_name:  CONFIG.last_name,
      },
    });
    if (error) {
      console.error('❌ Update failed:', error.message);
      process.exit(1);
    }
    userId = data.user.id;
    console.log(`✓ Password updated for ${CONFIG.email} (id: ${userId})`);
  } else {
    console.log('→ No existing user — creating fresh account...');
    const { data, error } = await admin.auth.admin.createUser({
      email: CONFIG.email,
      password: CONFIG.password,
      email_confirm: true,
      user_metadata: {
        first_name: CONFIG.first_name,
        last_name:  CONFIG.last_name,
      },
    });
    if (error) {
      console.error('❌ Create failed:', error.message);
      process.exit(1);
    }
    userId = data.user.id;
    console.log(`✓ Created new user ${CONFIG.email} (id: ${userId})`);
  }

  // Ensure the user_profiles row exists with phone + names. Upsert
  // so it works whether the row exists or not.
  console.log('→ Upserting user_profiles row...');
  const { error: profErr } = await admin.from('user_profiles').upsert(
    {
      id: userId,
      first_name: CONFIG.first_name,
      last_name:  CONFIG.last_name,
      phone:      CONFIG.phone,
    },
    { onConflict: 'id' },
  );
  if (profErr) {
    console.warn('⚠ user_profiles upsert failed:', profErr.message);
    console.warn('   (user can still log in, profile fields just aren\'t set)');
  } else {
    console.log('✓ user_profiles upserted');
  }

  console.log('');
  console.log('──────────────────────────────────────────────');
  console.log('✅ Done. Use these credentials to log in:');
  console.log(`   Email:    ${CONFIG.email}`);
  console.log(`   Password: ${CONFIG.password}`);
  console.log(`   user.id:  ${userId}`);
  console.log('──────────────────────────────────────────────');
}

main().catch((err) => {
  console.error('❌ Fatal:', err);
  process.exit(1);
});
