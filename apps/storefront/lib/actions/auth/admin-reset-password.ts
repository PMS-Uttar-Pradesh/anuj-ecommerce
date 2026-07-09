/**
 * admin-reset-password.ts — Server Action
 *
 * Sends a Supabase password reset email for admin accounts.
 * Uses Supabase's built-in reset flow — no custom token system.
 *
 * The reset link in the email points back to /admin/login so the
 * admin can complete the password update via Supabase's hosted UI.
 */
"use server";

import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export interface AdminResetPasswordState {
  success?: boolean;
  error?: string;
}

export async function adminResetPassword(
  _prevState: AdminResetPasswordState,
  formData: FormData
): Promise<AdminResetPasswordState> {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();

  if (!email) {
    return { error: "Email address is required." };
  }

  // Rate limit — 3 reset requests per email per hour
  const resetRl = checkRateLimit(`admin-reset-password:${email}`, 3, 60 * 60 * 1000);
  if (!resetRl.allowed) {
    return { error: "Too many password reset requests. Please wait 1 hour before trying again." };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/admin/login`,
  });

  if (error) {
    return { error: error.message };
  }

  // Always return success — avoids email enumeration
  return { success: true };
}
