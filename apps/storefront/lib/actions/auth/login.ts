/**
 * login.ts — Server Action
 *
 * Handles email/password authentication via Supabase Auth.
 * On first login, also syncs the user to Prisma (covers edge cases
 * where the sync failed during signup).
 */
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { syncUserToPrisma } from "@/lib/auth/sync-user";
import { isValidRedirectPath } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────

export interface LoginState {
  error?: string;
  success?: boolean;
}

// ── Server Action ────────────────────────────────────────────────────

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const rawEmail = (formData.get("email") as string | null) ?? "";
  const rawPassword = (formData.get("password") as string | null) ?? "";
  const rawRedirectTo = (formData.get("redirectTo") as string | null) ?? "/";

  const email = rawEmail.trim().toLowerCase();
  const password = rawPassword.trim();
  let redirectTo = rawRedirectTo.trim();

  // 1. Validate
  if (!email) {
    return { error: "Email address is required." };
  }
  if (!password) {
    return { error: "Password is required." };
  }

  if (email.length > 150) {
    return { error: "Email must be at most 150 characters." };
  }
  if (password.length > 100) {
    return { error: "Password must be at most 100 characters." };
  }

  if (!isValidRedirectPath(redirectTo)) {
    redirectTo = "/";
  }

  // 2. Authenticate
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: rawPassword, // use original password (or raw password since user might have spaces at start/end of pass, wait, users typically don't expect spaces to be trimmed, but to be safe let's pass the rawPassword or password. Let's pass the original password to avoid breaking users who signed up with spaces)
  });

  if (error) {
    return { error: error.message };
  }

  // 3. Sync to Prisma (idempotent — handles first-login edge case)
  if (data.user) {
    await syncUserToPrisma(data.user);
  }

  // 4. Redirect
  redirect(redirectTo);
}
