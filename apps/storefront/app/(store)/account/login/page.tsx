/**
 * Login Page — `/account/login`
 *
 * Production login form with:
 * - Email, Password fields
 * - Remember Me checkbox (visual — Supabase handles persistence)
 * - Forgot Password link placeholder
 * - Server Action via `useActionState`
 * - Google OAuth button
 * - Error display (from both form validation and URL params)
 * - Personal Marketing Store brand design
 */
"use client";

import { useActionState, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { login, type LoginState } from "@/lib/actions/auth/login";
import { signInWithGoogle } from "@/lib/actions/auth/google";

const initialState: LoginState = {};

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const urlError = searchParams.get("error");

  const [state, formAction, isPending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);

  const displayError = state.error || urlError;

  return (
    <div className="w-full max-w-[440px] mx-auto">
      {/* ── Card ── */}
      <div className="bg-white dark:bg-[var(--card)] border border-[var(--ag-gray-200)] dark:border-[var(--border)] rounded-2xl p-8 shadow-xl">
        {/* Logo & heading */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center font-display text-white font-extrabold text-lg shadow-md"
            style={{
              background:
                "linear-gradient(135deg, var(--ag-red), var(--ag-yellow))",
            }}
          >
            K
          </div>
          <h1 className="font-display font-black text-xl text-[var(--ag-dark)] tracking-tight">
            Welcome back
          </h1>
          <p className="text-xs text-[var(--ag-gray-500)] font-medium text-center">
            Enter your credentials to access your account
          </p>
        </div>

        {/* Error banner */}
        {displayError && (
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--ag-red)] bg-[var(--ag-red)]/8 p-3 rounded-lg mb-5 border border-[var(--ag-red)]/15 animate-fadeInUp">
            <AlertCircle size={14} className="shrink-0" />
            <span>{displayError}</span>
          </div>
        )}

        {/* Form */}
        <form action={formAction} className="space-y-4">
          {/* Hidden redirect field */}
          <input type="hidden" name="redirectTo" value={redirectTo} />

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="login-email"
              className="text-[11px] font-bold uppercase tracking-wider text-[var(--ag-gray-500)]"
            >
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail
                size={15}
                className="absolute left-3 text-[var(--ag-gray-500)] pointer-events-none"
              />
              <input
                id="login-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                disabled={isPending}
                autoComplete="email"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--ag-gray-200)] dark:border-[var(--border)] bg-white dark:bg-transparent text-sm font-semibold text-[var(--ag-dark)] placeholder:text-[var(--ag-gray-500)] focus:border-[var(--ag-red)] focus:ring-4 focus:ring-[var(--ag-red)]/10 outline-none transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="text-[11px] font-bold uppercase tracking-wider text-[var(--ag-gray-500)]"
              >
                Password
              </label>
              <Link
                href="/account/forgot-password"
                className="text-[11px] font-bold text-[var(--ag-red)] hover:underline"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative flex items-center">
              <Lock
                size={15}
                className="absolute left-3 text-[var(--ag-gray-500)] pointer-events-none"
              />
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                disabled={isPending}
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-[var(--ag-gray-200)] dark:border-[var(--border)] bg-white dark:bg-transparent text-sm font-semibold text-[var(--ag-dark)] placeholder:text-[var(--ag-gray-500)] focus:border-[var(--ag-red)] focus:ring-4 focus:ring-[var(--ag-red)]/10 outline-none transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-1 rounded-md text-[var(--ag-gray-500)] hover:bg-[var(--ag-gray-100)] transition-colors"
                aria-label="Toggle password visibility"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center gap-2">
            <input
              id="remember-me"
              type="checkbox"
              defaultChecked
              className="h-3.5 w-3.5 rounded border-[var(--ag-gray-200)] text-[var(--ag-red)] accent-[var(--ag-red)] cursor-pointer"
            />
            <label
              htmlFor="remember-me"
              className="text-xs text-[var(--ag-gray-500)] font-medium cursor-pointer select-none"
            >
              Remember me
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 mt-1 bg-[var(--ag-red)] hover:bg-[var(--ag-red-hover)] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-px active:translate-y-0 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 pt-1">
            <hr className="flex-1 border-[var(--ag-gray-200)] dark:border-[var(--border)]" />
            <span className="text-[10px] font-bold text-[var(--ag-gray-500)] uppercase tracking-wider">
              Or continue with
            </span>
            <hr className="flex-1 border-[var(--ag-gray-200)] dark:border-[var(--border)]" />
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => signInWithGoogle(redirectTo)}
            className="w-full py-2.5 rounded-xl border border-[var(--ag-gray-200)] dark:border-[var(--border)] hover:bg-[var(--ag-gray-100)] dark:hover:bg-[var(--muted)] font-semibold text-xs text-[var(--ag-dark)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs font-medium text-[var(--ag-gray-500)] mt-6">
          New customer?{" "}
          <Link
            href="/account/register"
            className="text-[var(--ag-red)] font-semibold hover:underline"
          >
            Create account →
          </Link>
        </p>
      </div>

      {/* Trust badge */}
      <p className="text-center text-[10px] text-[var(--ag-gray-500)] mt-4">
        🔒 Your data is encrypted and secure
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[var(--ag-gray-100)] flex items-center justify-center py-12 px-4 sm:px-6">
      <Suspense
        fallback={
          <div className="w-10 h-10 border-4 border-[var(--ag-red)] border-t-transparent rounded-full animate-spin" />
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
