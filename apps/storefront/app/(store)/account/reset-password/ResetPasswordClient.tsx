"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const recoveryType = searchParams.get("type");
  const accessToken = searchParams.get("access_token");
  const refreshToken = searchParams.get("refresh_token");
  // `code` is handled by server-side /auth/callback. Do NOT exchange it here.

  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status !== "idle") return;

    // The auth callback (/auth/callback) is responsible for exchanging any `code`
    // and establishing a session server-side. This client should only verify that
    // a valid recovery session exists (or handle legacy access_token flows).
    const supabase = createClient();

    const verifySession = async () => {
      // If the URL contains a `code` param (v2 recovery), navigate to /auth/callback so
      // the server-side callback can exchange it (PKCE) and establish the session. The
      // callback will redirect back to /account/reset-password when done.
      const code = searchParams.get("code");
      if (code) {
        // Perform a full-location navigation to ensure the callback runs server-side.
        window.location.href = `/auth/callback?code=${encodeURIComponent(code)}&next=/account/reset-password`;
        return;
      }

      setStatus("loading");

      // First, check for an active session (exchange should have been done by /auth/callback)
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          setMessage(error.message ?? "Unable to verify recovery session.");
          setStatus("error");
          return;
        }

        if (data?.session) {
          setStatus("ready");
          return;
        }

        // Backwards-compatible: support legacy `type=recovery&access_token=...&refresh_token=...` links
        if (recoveryType === "recovery" && accessToken && refreshToken) {
          const { data: sData, error: sErr } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          if (sErr || !sData?.session) {
            setMessage(sErr?.message ?? "Unable to establish a recovery session. Please request a new reset link.");
            setStatus("error");
            return;
          }

          setStatus("ready");
          return;
        }

        setMessage("This password reset link is invalid or has expired.");
        setStatus("error");
      } catch (err: any) {
        setMessage(err?.message ?? "Unable to verify recovery session. Please request a new reset link.");
        setStatus("error");
      }
    };

    verifySession();
  }, [status, recoveryType, accessToken, refreshToken]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    await supabase.auth.signOut();
    router.push("/account/login?success=1");
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl border border-[var(--ag-gray-200)] shadow-xl overflow-hidden">
      <div className="p-8 space-y-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="size-14 rounded-3xl bg-[var(--ag-red)]/10 flex items-center justify-center text-[var(--ag-red)]">
            <Lock className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--ag-dark)]">Choose a new password</h1>
            <p className="text-sm text-[var(--ag-gray-500)] mt-2 leading-relaxed">
              Set a new password for your account and return to sign in.
            </p>
          </div>
        </div>

        {status === "loading" && (
          <div className="flex items-center justify-center gap-2 text-[var(--ag-gray-500)]">
            <Loader2 size={18} className="animate-spin" />
            <span>Preparing your recovery session…</span>
          </div>
        )}

        {(status === "error" || message) && (
          <div className="flex items-start gap-2.5 text-sm font-medium text-[var(--ag-red)] bg-[var(--ag-red)]/10 p-3.5 rounded-2xl border border-[var(--ag-red)]/20">
            <AlertCircle size={18} className="shrink-0" />
            <span>{message ?? "Unable to continue with password recovery."}</span>
          </div>
        )}

        {status === "ready" && (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--ag-gray-500)]">
                New password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a new password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full pr-10 py-3 rounded-2xl border border-[var(--ag-gray-200)] bg-white text-sm font-semibold text-[var(--ag-dark)] placeholder:text-[var(--ag-gray-400)] focus:border-[var(--ag-red)] focus:ring-4 focus:ring-[var(--ag-red)]/10 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ag-gray-500)] hover:text-[var(--ag-dark)]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--ag-gray-500)]">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat your new password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full pr-10 py-3 rounded-2xl border border-[var(--ag-gray-200)] bg-white text-sm font-semibold text-[var(--ag-dark)] placeholder:text-[var(--ag-gray-400)] focus:border-[var(--ag-red)] focus:ring-4 focus:ring-[var(--ag-red)]/10 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ag-gray-500)] hover:text-[var(--ag-dark)]"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[var(--ag-red)] hover:bg-[var(--ag-red-hover)] disabled:opacity-60 text-white font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving…
                </>
              ) : (
                "Save new password"
              )}
            </button>
          </form>
        )}

        <div className="text-center">
          <Link
            href="/account/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ag-gray-600)] hover:text-[var(--ag-dark)]"
          >
            <ArrowLeft size={16} />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
