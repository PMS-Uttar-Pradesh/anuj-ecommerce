import AccessDeniedPanel from "@/components/admin/AccessDeniedPanel";

export const dynamic = "force-dynamic";

export default function AccessDeniedPage() {
  return (
    <main className="min-h-screen bg-zinc-900 flex items-center justify-center px-6 py-12">
      {/* Ambient glows */}
      <div className="absolute top-1/4 -left-48 size-[500px] rounded-full bg-red-200/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 size-[400px] rounded-full bg-red-100/10 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-4xl mx-auto">
        <AccessDeniedPanel />
      </div>
    </main>
  );
}
