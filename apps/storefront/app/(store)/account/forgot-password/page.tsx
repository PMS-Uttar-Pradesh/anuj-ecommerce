"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  Mail,
  AlertCircle,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { forgotPassword, type ForgotPasswordState } from "@/lib/actions/auth/forgot-password";

const initialState: ForgotPasswordState = {};

function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(forgotPassword, initialState);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-3xl border border-[var(--ag-gray-200)] shadow-xl overflow-hidden">
        <div className="p-8 space-y-6">
          {state.success ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="size-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <CheckCircle2 className="size-7 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--ag-dark)]">Check your email</h1>
                <p className="text-sm text-[var(--ag-gray-500)] mt-2 leading-relaxed">
                  If an account exists for that email, a password reset link has been sent.
                </p>
              </div>
              <Link
                href="/account/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ag-red)] hover:text-[var(--ag-red-hover)]"
              >
                <ArrowLeft size={16} />
                Return to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="size-14 rounded-3xl bg-[var(--ag-red)]/10 flex items-center justify-center text-[var(--ag-red)]">
                  <KeyRound className="size-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[var(--ag-dark)]">Reset your password</h1>
                  <p className="text-sm text-[var(--ag-gray-500)] mt-2 leading-relaxed">
                    Enter your email and we will send a recovery link to reset your password.
                  </p>
                </div>
              </div>

              {state.error && (
                <div className="flex items-start gap-2.5 text-sm font-medium text-[var(--ag-red)] bg-[var(--ag-red)]/10 p-3.5 rounded-2xl border border-[var(--ag-red)]/20">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{state.error}</span>
                </div>
              )}

              <form action={formAction} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--ag-gray-500)]">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ag-gray-400)]" />
                    <input
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      disabled={isPending}
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[var(--ag-gray-200)] bg-white text-sm font-semibold text-[var(--ag-dark)] placeholder:text-[var(--ag-gray-400)] focus:border-[var(--ag-red)] focus:ring-4 focus:ring-[var(--ag-red)]/10 outline-none transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3.5 bg-[var(--ag-red)] hover:bg-[var(--ag-red-hover)] disabled:opacity-60 text-white font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </button>
              </form>

              <div className="text-center">
                <Link
                  href="/account/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ag-gray-600)] hover:text-[var(--ag-dark)]"
                >
                  <ArrowLeft size={16} />
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
      <p className="text-center text-[10px] text-[var(--ag-gray-500)] mt-4 font-mono">
        Personal Marketing Store
      </p>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-[var(--ag-gray-100)] flex items-center justify-center py-12 px-4 sm:px-6">
      <ForgotPasswordForm />
    </main>
  );
}
