import prisma from "@/lib/prisma";
import PromotionListClient from "@/components/admin/PromotionListClient";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";

export const dynamic = "force-dynamic";

export default async function PromotionsPage() {
  const promotions = await prisma.promotion.findMany({
    where: {
      isDeleted: false,
    },
    orderBy: {
      displayOrder: "asc",
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-zinc-900 dark:text-zinc-50">
            Promotions Management
          </h1>
          <p className="text-sm text-zinc-500">
            Create, edit, toggle active status, and schedule sliding homepage banners
          </p>
        </div>
        <AdminRefreshButton />
      </div>

      <PromotionListClient initialPromotions={promotions} />
    </div>
  );
}
