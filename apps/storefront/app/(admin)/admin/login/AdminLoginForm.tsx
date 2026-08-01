"use client";

/**
 * AdminLoginForm — Client Component
 *
 * Redesigned with a split-panel layout:
 * - Left:  Personal Marketing Store Admin branding panel (dark, decorative)
 * - Right: Login form (higher contrast, clear inputs, Google OAuth)
 */

import { useTransition } from "react";
import { adminSignInWithGoogle } from "@/lib/actions/auth/admin-google";
import { AlertCircle, Loader2, ShieldCheck, BarChart3, Package, Users } from "lucide-react";

export default function AdminLoginForm({
  urlError,
  urlReset,
}: {
  urlError?: string;
  urlReset?: string;
}) {
  const [isGooglePending, startGoogleTransition] = useTransition();

  const displayError = urlError;
  const displaySuccess = urlReset === "success";
  const anyPending = isGooglePending;

  const handleGoogle = () => {
    startGoogleTransition(async () => {
      await adminSignInWithGoogle();
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex bg-white rounded-2xl overflow-hidden shadow-xl shadow-zinc-200/50 border border-zinc-200">

        {/* ── Left branding panel ───────────────────────────────── */}
        <div className="hidden md:flex w-[42%] flex-col justify-between bg-zinc-50 border-r border-zinc-200 p-10">
          {/* Logo */}
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="size-9 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-md shadow-red-900/10 shrink-0">
                <span className="text-sm font-black text-white">K</span>
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 leading-none">Personal Marketing Store</p>
                <p className="text-[10px] font-semibold text-red-500 uppercase tracking-[0.15em] mt-0.5">
                  Admin Portal
                </p>
              </div>
            </div>

            {/* Headline */}
            <h2 className="text-2xl font-bold text-zinc-900 leading-snug mb-3">
              Manage your store from one place
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Full control over orders, products, customers, and analytics — purpose-built for Personal Marketing Store.
            </p>
          </div>

          {/* Feature pills */}
          <div className="space-y-3">
            {[
              { icon: BarChart3, label: "Real-time revenue & analytics" },
              { icon: Package, label: "Product & inventory management" },
              { icon: Users, label: "Customer & order tracking" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="size-7 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0">
                  <Icon className="size-3.5 text-zinc-500" />
                </div>
                <span className="text-xs text-zinc-600 font-medium">{label}</span>
              </div>
            ))}
          </div>

          {/* Bottom note */}
          <div className="flex items-center gap-2 mt-8">
            <ShieldCheck className="size-3.5 text-zinc-400 shrink-0" />
            <p className="text-[10px] text-zinc-500 leading-tight">
              Only authorized administrators can access this portal.
            </p>
          </div>
        </div>

        {/* ── Right form panel ──────────────────────────────────── */}
        <div className="flex-1 bg-zinc-900 p-10 flex flex-col justify-center text-white">

          {/* Mobile-only logo */}
          <div className="flex md:hidden items-center gap-2 mb-8">
            <div className="size-8 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
              <span className="text-xs font-black text-white">K</span>
            </div>
            <p className="text-sm font-bold text-zinc-900">Personal Marketing Store Admin</p>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Welcome Back
            </h1>
            <p className="text-sm text-zinc-300 mt-1 max-w-prose">
              Access the Personal Marketing Store Admin Portal using your authorized Google account.
            </p>
          </div>

          {/* Success banner */}
          {displaySuccess && (
            <div className="flex items-start gap-2.5 text-sm font-medium text-emerald-700 bg-emerald-50 p-3.5 rounded-xl mb-5 border border-emerald-200">
              <span className="text-lg">✓</span>
              <span>
                Your password has been reset. Please sign in with your new password.
              </span>
            </div>
          )}

          {/* Error banner */}
          {displayError && (
            <div className="flex items-start gap-2.5 text-sm font-medium text-red-600 bg-red-50 p-3.5 rounded-xl mb-5 border border-red-200">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{displayError}</span>
            </div>
          )}

          <div className="space-y-5">            {/* Premium security card */}
            <div className="rounded-xl p-4 bg-zinc-800 border border-zinc-700 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🛡</div>
                <div>
                  <h3 className="text-sm font-bold text-white">Secure Google Authentication</h3>
                  <p className="text-xs text-zinc-300 mt-1 max-w-prose">
                    Sign in with your approved administrator Google account.
                    Only authorized administrators can access this dashboard.
                  </p>
                </div>
              </div>
            </div>

            {/* Google primary button */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={anyPending}
              className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-bold transition-all shadow-lg flex items-center justify-center gap-3"
            >
              {isGooglePending ? (
                <>
                  <Loader2 className="size-5 animate-spin text-white" />
                  <span>Redirecting to Google…</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Access note */}
            <p className="text-xs text-zinc-400 mt-2">
              Need access? <span className="font-semibold text-zinc-200">Contact the store owner</span> to have your Google account authorized.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
