"use server";

import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export interface ForgotPasswordState {
  success?: boolean;
  error?: string;
}

export async function forgotPassword(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();

  if (!email) {
    return { error: "Email address is required." };
  }

  const resetRl = checkRateLimit(`forgot-password:${email}`, 3, 60 * 60 * 1000);
  if (!resetRl.allowed) {
    return {
      error: "Too many password reset requests. Please wait 1 hour before trying again.",
    };
  }

  const supabase = await createClient();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
    "https://anuj-ecommerce-pi.vercel.app";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/account/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
