/**
 * admin-google.ts — Server Action
 *
 * Initiates Google OAuth sign-in specifically for the admin portal.
 * Uses a dedicated /admin/auth/callback URL so the shared storefront
 * /auth/callback route is never touched.
 *
 * On error, redirects to /admin/login (not the customer login page).
 */
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function adminSignInWithGoogle(): Promise<void> {
  const supabase = await createClient();

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://anuj-ecommerce-pi.vercel.app";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/admin/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    console.error("[admin-google] OAuth initiation failed:", error.message);
    redirect(`/admin/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data.url) {
    redirect(data.url);
  }
}
