"use server";

import prisma from "@/lib/prisma";
import { getUser } from "@/lib/auth/get-user";
import { revalidateTag } from "next/cache";
import { unstable_cache } from "next/cache";

export const getStoreSettings = unstable_cache(
  async () => {
    // Read-only: never writes. Returns the persisted row or an in-memory
    // default if the seed hasn't run yet. This is safe to call concurrently
    // during Vercel static generation without causing P2002 constraint errors.
    const settings = await prisma.storeSettings.findUnique({
      where: { id: "default" },
    });
    return settings ?? { id: "default", freeDeliveryThreshold: 999, updatedAt: new Date() };
  },
  ["store-settings"],
  { tags: ["store-settings"] }
);

export async function updateStoreSettings(data: { freeDeliveryThreshold: number }) {
  try {
    const user = await getUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized access." };
    }

    if (
      typeof data.freeDeliveryThreshold !== "number" ||
      data.freeDeliveryThreshold < 0
    ) {
      return { success: false, error: "Invalid free delivery threshold." };
    }

    await prisma.storeSettings.upsert({
      where: { id: "default" },
      update: {
        freeDeliveryThreshold: data.freeDeliveryThreshold,
      },
      create: {
        id: "default",
        freeDeliveryThreshold: data.freeDeliveryThreshold,
      },
    });

    revalidateTag("store-settings", "max");
    return { success: true };
  } catch (error: any) {
    console.error("[updateStoreSettings] Error updating settings:", error);
    return {
      success: false,
      error: error.message || "Failed to update settings.",
    };
  }
}
