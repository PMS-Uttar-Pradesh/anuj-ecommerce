import { Settings } from "lucide-react";
import SettingsForm from "@/components/admin/SettingsForm";
import { getStoreSettings } from "@/lib/actions/settings";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";

export const metadata = {
  title: "Settings — Personal Marketing Store Admin",
};

export default async function AdminSettingsPage() {
  const storeSettings = await getStoreSettings();

  return (
    <div className="max-w-3xl">
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="size-4 text-zinc-500" />
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
              System
            </p>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight font-display">
            Settings
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage admin portal and system configuration.
          </p>
        </div>
        <AdminRefreshButton />
      </div>

      <div className="grid gap-6">
        <SettingsForm initialThreshold={storeSettings.freeDeliveryThreshold} />
      </div>
    </div>
  );
}
