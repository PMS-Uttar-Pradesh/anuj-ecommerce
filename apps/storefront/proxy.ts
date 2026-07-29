/**
 * middleware.ts — Root middleware
 *
 * Responsibilities:
 * 1. Refresh Supabase auth session on every request (via `updateSession`)
 * 2. Protect routes that require authentication
 *
 * Protected routes redirect unauthenticated users to `/account/login`
 * with a `redirect` query param to return after signing in.
 */

import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

// ── Protected route prefixes ────────────────────────────────────────

const PROTECTED_ROUTES = [
  "/checkout",
  "/account/profile",
  "/account/orders",
  "/account/addresses",
];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

// ── Middleware ────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  // 1. Always refresh the session first
  const response = await updateSession(request);

  const pathname = request.nextUrl.pathname;

  // 2. Protect admin routes (redirect unauthenticated to /admin/login)
  if (
    pathname.startsWith("/admin") &&
    pathname !== "/admin/login" &&
    !pathname.startsWith("/admin/auth/callback") &&
    !pathname.startsWith("/admin/forgot-password")
  ) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Check protected customer routes
  if (isProtectedRoute(pathname)) {
    // Create a lightweight Supabase client to check auth
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // We don't need to set cookies here — `updateSession`
            // already handled that above.
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL("/account/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};