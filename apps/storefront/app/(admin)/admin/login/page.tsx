/**
 * Admin Login Page — `/admin/login`
 *
 * Server Component. Checks if the visitor is already an authenticated
 * admin and redirects them to /admin/dashboard before rendering the
 * login UI — no client-side flash or duplicate auth logic.
 *
 * Role check mirrors requireAdmin() but avoids importing it directly
 * (requireAdmin throws a hard redirect on failure; here we want a
 * soft check that falls through to the login form).
 */
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getUser } from "@/lib/auth/get-user";
import prisma from "@/lib/prisma";
import AdminLoginForm from "./AdminLoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // ── Server-side session check ──────────────────────────────────────
  // If the visitor is already signed in as ADMIN, skip the login page.
  const user = await getUser();
  if (user) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (dbUser?.role === "ADMIN") {
      redirect("/admin/dashboard");
    }
  }

  const { error: urlError } = await searchParams;

  // ── Render login UI ────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Dot-grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0, 0, 0, 0.15) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Ambient glows */}
      <div className="absolute top-1/4 -left-48 size-[500px] rounded-full bg-red-200/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 size-[400px] rounded-full bg-red-100/30 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-4xl mx-auto">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-64">
              <div className="size-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <AdminLoginForm urlError={urlError} />
        </Suspense>
      </div>
    </main>
  );

}
