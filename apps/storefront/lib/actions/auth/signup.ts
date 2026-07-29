/**
 * signup.ts — Server Action
 *
 * Handles email/password registration via Supabase Auth, then syncs
 * the new user into the Prisma `User` table.
 */
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { syncUserToPrisma } from "@/lib/auth/sync-user";
import { sendWelcomeEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// ── Types ────────────────────────────────────────────────────────────

export interface SignUpState {
  error?: string;
  success?: boolean;
}

// ── Validation ───────────────────────────────────────────────────────

function validateSignUpInput(formData: FormData): string | null {
  const firstName = (formData.get("firstName") as string | null)?.trim() ?? "";
  const lastName = (formData.get("lastName") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null)?.trim() ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string | null)?.trim() ?? "";

  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    return "All fields are required.";
  }

  if (firstName.length > 50) {
    return "First name must be at most 50 characters.";
  }
  if (lastName.length > 50) {
    return "Last name must be at most 50 characters.";
  }
  if (email.length > 150) {
    return "Email must be at most 150 characters.";
  }
  if (password.length > 100) {
    return "Password must be at most 100 characters.";
  }

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address.";
  }

  if (password.length < 6) {
    return "Password must be at least 6 characters.";
  }

  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }

  return null;
}

// ── Server Action ────────────────────────────────────────────────────

export async function signUp(
  _prevState: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  // 1. Validate
  const validationError = validateSignUpInput(formData);
  if (validationError) {
    return { error: validationError };
  }

  const firstName = (formData.get("firstName") as string).trim();
  const lastName = (formData.get("lastName") as string).trim();
  const email = (formData.get("email") as string).trim().toLowerCase();
  const password = (formData.get("password") as string).trim();

  // 1b. Rate limit — 5 attempts per email+IP per 1-hour window
  const ip = await getClientIp();
  const signupRl = checkRateLimit(`signup:${email}:${ip}`, 5, 60 * 60 * 1000);
  if (!signupRl.allowed) {
    return { error: "Too many signup attempts. Please wait 1 hour before trying again." };
  }

  // 2. Create Supabase Auth user
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // 3. Sync to Prisma
  if (data.user) {
    await syncUserToPrisma(data.user);
    await sendWelcomeEmail({
      email: data.user.email!,
      firstName: firstName,
    });
  }

  // 4. Redirect on success
  redirect("/");
}
