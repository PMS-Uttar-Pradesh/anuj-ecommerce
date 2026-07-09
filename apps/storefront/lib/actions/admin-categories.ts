"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { logActivity } from "@/lib/audit/log-activity";
import { revalidatePath } from "next/cache";

// Helper to generate a unique slug for Category
async function getUniqueCategorySlug(name: string, currentId?: string) {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  let slug = baseSlug || "category";
  let count = 1;
  while (true) {
    const existing = await prisma.category.findFirst({
      where: {
        slug,
        id: currentId ? { not: currentId } : undefined,
      },
    });
    if (!existing) break;
    slug = `${baseSlug}-${count}`;
    count++;
  }
  return slug;
}

export async function createCategory(formData: {
  name: string;
  description?: string;
  imageUrl?: string;
}) {
  const admin = await requireAdmin();

  // --- Input validation ---
  const name = formData.name?.trim();
  if (!name) {
    return { success: false, error: "Category name is required." };
  }
  if (name.length > 100) {
    return { success: false, error: "Category name must be 100 characters or fewer." };
  }
  // --- End validation ---

  try {
    const slug = await getUniqueCategorySlug(name);

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: formData.description ?? null,
        imageUrl: formData.imageUrl ?? null,
      },
    });

    // Audit log
    await logActivity({
      adminId: admin.id,
      action: "CATEGORY_CREATED",
      entityType: "Category",
      entityId: category.id,
      metadata: { name: category.name },
    });

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/");
    revalidatePath("/products");
    return { success: true, categoryId: category.id };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[createCategory] Error:", err);
    return { success: false, error: err.message || "Failed to create category" };
  }
}

export async function updateCategory(
  id: string,
  formData: {
    name: string;
    description?: string;
    imageUrl?: string;
  }
) {
  const admin = await requireAdmin();

  // --- Input validation ---
  const name = formData.name?.trim();
  if (!name) {
    return { success: false, error: "Category name is required." };
  }
  if (name.length > 100) {
    return { success: false, error: "Category name must be 100 characters or fewer." };
  }
  // --- End validation ---

  try {
    const slug = await getUniqueCategorySlug(name, id);

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        description: formData.description ?? null,
        imageUrl: formData.imageUrl ?? null,
      },
    });

    // Audit log
    await logActivity({
      adminId: admin.id,
      action: "CATEGORY_UPDATED",
      entityType: "Category",
      entityId: category.id,
      metadata: { name: category.name },
    });

    revalidatePath("/admin/categories");
    revalidatePath(`/admin/categories/${id}`);
    revalidatePath("/admin/products");
    revalidatePath("/");
    revalidatePath("/products");
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[updateCategory] Error:", err);
    return { success: false, error: err.message || "Failed to update category" };
  }
}

export async function deleteCategory(id: string) {
  const admin = await requireAdmin();

  try {
    // Check if there are active products referencing this category
    const activeProduct = await prisma.product.findFirst({
      where: {
        categoryId: id,
        isActive: true,
      },
    });

    if (activeProduct) {
      return {
        success: false,
        error: `Cannot delete category: active product "${activeProduct.name}" depends on it.`,
      };
    }

    const category = await prisma.category.delete({
      where: { id },
    });

    // Audit log
    await logActivity({
      adminId: admin.id,
      action: "CATEGORY_DELETED",
      entityType: "Category",
      entityId: id,
      metadata: { name: category.name },
    });

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/");
    revalidatePath("/products");
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[deleteCategory] Error:", err);
    return { success: false, error: err.message || "Failed to delete category" };
  }
}
