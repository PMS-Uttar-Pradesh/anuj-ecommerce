/**
 * google.ts — Server Action
 *
 * Initiates Google OAuth sign-in via Supabase.
 *
 * PREREQUISITES:
 * 1. Enable Google provider in Supabase Dashboard →
 *    Authentication → Providers → Google.
 * 2. Set `NEXT_PUBLIC_SITE_URL` in `.env` (e.g. http://localhost:3000).
 * 3. Add the Supabase callback URL to your Google Cloud Console
 *    OAuth consent screen's authorized redirect URIs.
 */
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Generates the Google OAuth URL and redirects the browser to it.
 *
 * @param redirectTo  Path to return to after authentication
 *                    (passed through the OAuth callback as `next`).
 */
export async function signInWithGoogle(redirectTo: string = "/"): Promise<void> {
  const supabase = await createClient();

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://anuj-ecommerce-pi.vercel.app";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    console.error("[google-auth] OAuth initiation failed:", error.message);
    redirect(`/account/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data.url) {
    redirect(data.url);
  }
}
