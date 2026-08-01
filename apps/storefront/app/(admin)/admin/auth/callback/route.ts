/**
 * Admin OAuth Callback — /admin/auth/callback
 *
 * Dedicated callback for admin Google OAuth logins only.
 * Exchanges the auth code for a Supabase session, then lands on
 * /admin/dashboard where requireAdmin() enforces role-based gating.
 *
 * Non-ADMIN users are bounced to / by the (protected) layout.
 * The shared /auth/callback route is NOT modified.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPrismaUser } from "@/lib/auth/get-user";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // After exchanging the code for a session, determine whether the
  // authenticated user is an ADMIN. Redirect accordingly to provide
  // a dedicated Access Denied page for unauthorized admin accounts.
  const prismaUser = await getPrismaUser();

  if (!prismaUser) {
    // Not authenticated — send back to admin login
    return NextResponse.redirect(`${origin}/admin/login`);
  }

  if (prismaUser.role === "ADMIN") {
    return NextResponse.redirect(`${origin}/admin/dashboard`);
  }

  return NextResponse.redirect(`${origin}/admin/access-denied`);
}
