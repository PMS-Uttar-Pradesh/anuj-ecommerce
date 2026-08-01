import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--ag-gray-100)] flex items-center justify-center py-12 px-4 sm:px-6">
          <div className="w-full max-w-md mx-auto p-8 bg-white rounded-3xl border border-[var(--ag-gray-200)] shadow-xl text-center">
            Loading password recovery…
          </div>
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
