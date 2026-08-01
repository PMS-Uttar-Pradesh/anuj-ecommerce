"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { adminLogout } from "@/lib/actions/auth/admin-logout";

export default function AccessDeniedPanel() {
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await adminLogout();
    });
  };

  return (
    <div className="max-w-2xl mx-auto w-full px-6 py-12">
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 shadow-lg p-10 text-center">
        <div className="text-6xl">🚫</div>
        <h1 className="mt-6 text-2xl font-bold text-white">Access Denied</h1>
        <p className="mt-3 text-sm text-zinc-300 max-w-prose mx-auto">
          Sorry, you don't have permission to access the Personal Marketing Store Admin Portal.
          Only approved administrator Google accounts are allowed to sign in.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">Return to Storefront</Button>
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            <Button className="w-full sm:w-auto">{isPending ? "Signing out…" : "Sign Out"}</Button>
          </button>
        </div>
      </div>
    </div>
  );
}
