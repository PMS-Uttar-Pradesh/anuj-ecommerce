/**
 * sync-user.ts
 *
 * Synchronizes a Supabase Auth user into the Prisma `User` table.
 * Uses `upsert` to prevent duplicates — safe to call on every login,
 * signup, or OAuth callback.
 *
 * The Supabase Auth UUID is used as the Prisma User `id` so both
 * systems share the same identifier.
 */

import type { User as SupabaseUser } from "@supabase/supabase-js";
import prisma from "@/lib/prisma";
import { isAdmin } from "@/lib/auth/permission";

/**
 * Extract the display name parts from Supabase user metadata.
 * Handles both email/password signups (where we explicitly set
 * `first_name` / `last_name`) and OAuth providers (which typically
 * set `full_name` or `name`).
 */
function extractName(user: SupabaseUser): {
  firstName: string | null;
  lastName: string | null;
} {
  const meta = user.user_metadata ?? {};

  // Explicit first/last from our signup form
  if (meta.first_name || meta.last_name) {
    return {
      firstName: (meta.first_name as string) || null,
      lastName: (meta.last_name as string) || null,
    };
  }

  // OAuth providers usually provide `full_name` or `name`
  const fullName = (meta.full_name ?? meta.name ?? "") as string;
  if (fullName) {
    const parts = fullName.trim().split(/\s+/);
    return {
      firstName: parts[0] || null,
      lastName: parts.slice(1).join(" ") || null,
    };
  }

  return { firstName: null, lastName: null };
}

/**
 * Upsert the Supabase Auth user into Prisma.
 *
 * - On **create**: inserts a new row with the Auth UUID as `id`.
 * - On **update**: refreshes `email` and name fields (in case the
 *   user changed their profile on the OAuth provider side).
 *
 * Wrapped in try/catch so a Prisma failure never breaks the auth flow.
 */
export async function syncUserToPrisma(user: SupabaseUser) {
  try {
    const { firstName, lastName } = extractName(user);

    // 1. Safe primary key ID reconciliation
    // Check if a User record with the same email already exists in Prisma under a different ID (e.g. a fake signup ID)
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: user.email! }
    });

    if (existingUserByEmail && existingUserByEmail.id !== user.id) {
      // Execute raw SQL update to re-key the primary key user ID.
      // Database foreign key constraints have ON UPDATE CASCADE, which propagates to all related tables automatically.
      await prisma.$executeRawUnsafe(
        `UPDATE "User" SET id = $1 WHERE id = $2`,
        user.id,
        existingUserByEmail.id
      );
    }

    // Fetch existing user to determine role
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    const isUserAdmin = isAdmin(user.email);
    let resolvedRole: "ADMIN" | "CUSTOMER" = "CUSTOMER";

    if (isUserAdmin) {
      resolvedRole = "ADMIN";
    } else if (existingUser) {
      resolvedRole = existingUser.role;
    } else if (existingUserByEmail) {
      resolvedRole = existingUserByEmail.role;
    }

    // 2. Perform standard upsert
    await prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email!,
        firstName,
        lastName,
        role: resolvedRole,
      },
      update: {
        email: user.email!,
        firstName,
        lastName,
        role: resolvedRole,
      },
    });
  } catch (error) {
    // Log but never throw — auth should succeed even if the DB sync
    // temporarily fails (e.g. during a migration or DB outage).
    console.error("[sync-user] Failed to sync user to Prisma:", error);
  }
}
