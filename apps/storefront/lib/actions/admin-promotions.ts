"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { logActivity } from "@/lib/audit/log-activity";
import { revalidatePath } from "next/cache";
import { PromotionTargetType } from "@prisma/client";

interface PromotionPayload {
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl: string;
  buttonText: string;
  redirectType: PromotionTargetType;
  redirectId: string;
  isActive?: boolean;
  startDate: Date;
  endDate: Date;
  displayOrder?: number;
}

export async function createPromotion(data: PromotionPayload) {
  const admin = await requireAdmin();

  // Validation: startDate must be before endDate
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  if (start >= end) {
    return { success: false, error: "Start date must be before end date." };
  }

  if (!data.title.trim()) {
    return { success: false, error: "Title is required." };
  }
  if (data.title.trim().length > 150) {
    return { success: false, error: "Title must be 150 characters or fewer." };
  }
  if (!data.imageUrl.trim()) {
    return { success: false, error: "Banner image is required." };
  }
  if (data.imageUrl.trim().length > 500) {
    return { success: false, error: "Image URL must be 500 characters or fewer." };
  }
  if (!data.buttonText.trim()) {
    return { success: false, error: "Button text is required." };
  }
  if (data.buttonText.trim().length > 50) {
    return { success: false, error: "Button text must be 50 characters or fewer." };
  }
  if (!data.redirectId) {
    return { success: false, error: "Redirect target selection is required." };
  }

  try {
    const promotion = await prisma.promotion.create({
      data: {
        title: data.title,
        subtitle: data.subtitle ?? null,
        description: data.description ?? null,
        imageUrl: data.imageUrl,
        buttonText: data.buttonText,
        redirectType: data.redirectType,
        redirectId: data.redirectId,
        isActive: data.isActive ?? true,
        startDate: start,
        endDate: end,
        displayOrder: data.displayOrder ?? 0,
      },
    });

    await logActivity({
      adminId: admin.id,
      action: "PROMOTION_CREATED",
      entityType: "Promotion",
      entityId: promotion.id,
      metadata: { title: promotion.title },
    });

    revalidatePath("/admin/promotions");
    revalidatePath("/");
    return { success: true, promotionId: promotion.id };
  } catch (error: any) {
    console.error("[createPromotion] Error:", error);
    return { success: false, error: error.message || "Failed to create promotion." };
  }
}

export async function updatePromotion(id: string, data: PromotionPayload) {
  const admin = await requireAdmin();

  // Validation: startDate must be before endDate
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  if (start >= end) {
    return { success: false, error: "Start date must be before end date." };
  }

  if (!data.title.trim()) {
    return { success: false, error: "Title is required." };
  }
  if (data.title.trim().length > 150) {
    return { success: false, error: "Title must be 150 characters or fewer." };
  }
  if (!data.imageUrl.trim()) {
    return { success: false, error: "Banner image is required." };
  }
  if (data.imageUrl.trim().length > 500) {
    return { success: false, error: "Image URL must be 500 characters or fewer." };
  }
  if (!data.buttonText.trim()) {
    return { success: false, error: "Button text is required." };
  }
  if (data.buttonText.trim().length > 50) {
    return { success: false, error: "Button text must be 50 characters or fewer." };
  }
  if (!data.redirectId) {
    return { success: false, error: "Redirect target selection is required." };
  }

  try {
    const promotion = await prisma.promotion.update({
      where: { id },
      data: {
        title: data.title,
        subtitle: data.subtitle ?? null,
        description: data.description ?? null,
        imageUrl: data.imageUrl,
        buttonText: data.buttonText,
        redirectType: data.redirectType,
        redirectId: data.redirectId,
        isActive: data.isActive ?? true,
        startDate: start,
        endDate: end,
        displayOrder: data.displayOrder ?? 0,
      },
    });

    await logActivity({
      adminId: admin.id,
      action: "PROMOTION_UPDATED",
      entityType: "Promotion",
      entityId: promotion.id,
      metadata: { title: promotion.title },
    });

    revalidatePath("/admin/promotions");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("[updatePromotion] Error:", error);
    return { success: false, error: error.message || "Failed to update promotion." };
  }
}

export async function deletePromotion(id: string) {
  const admin = await requireAdmin();

  try {
    // Soft delete promotion by setting isDeleted = true
    const promotion = await prisma.promotion.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    });

    await logActivity({
      adminId: admin.id,
      action: "PROMOTION_DELETED",
      entityType: "Promotion",
      entityId: id,
      metadata: { title: promotion.title, note: "Soft deleted by setting isDeleted to true" },
    });

    revalidatePath("/admin/promotions");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("[deletePromotion] Error:", error);
    return { success: false, error: error.message || "Failed to delete promotion." };
  }
}

export async function togglePromotionActive(id: string, isActive: boolean) {
  const admin = await requireAdmin();

  try {
    const promotion = await prisma.promotion.update({
      where: { id },
      data: { isActive },
    });

    await logActivity({
      adminId: admin.id,
      action: isActive ? "PROMOTION_ACTIVATED" : "PROMOTION_DEACTIVATED",
      entityType: "Promotion",
      entityId: id,
      metadata: { title: promotion.title },
    });

    revalidatePath("/admin/promotions");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("[togglePromotionActive] Error:", error);
    return { success: false, error: error.message || "Failed to toggle promotion active state." };
  }
}
