"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { logActivity } from "@/lib/audit/log-activity";
import { revalidatePath } from "next/cache";
import { deleteImage } from "@/lib/cloudinary/upload-image";

// Helper to generate a unique slug
async function getUniqueSlug(name: string, currentId?: string) {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  let slug = baseSlug || "product";
  let count = 1;
  while (true) {
    const existing = await prisma.product.findFirst({
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

export async function createProduct(formData: {
  name: string;
  description?: string;
  price: number;
  mrp: number;
  salePrice?: number | null;
  categoryId: string;
  lowStockThreshold?: number;
  images?: { url: string; publicId?: string; isPrimary: boolean; sortOrder: number }[];
  stock: number; // for default single variant
  isActive?: boolean;
  isFeatured?: boolean;
  brandName?: string;
  brandDescription?: string;
  specifications?: Record<string, string>;
}) {
  const admin = await requireAdmin();

  // --- Input validation ---
  const name = formData.name?.trim();
  if (!name) {
    return { success: false, error: "Product name is required." };
  }
  if (name.length > 150) {
    return { success: false, error: "Product name must be 150 characters or fewer." };
  }
  if (!formData.categoryId?.trim()) {
    return { success: false, error: "Category is required." };
  }
  if (!Number.isFinite(formData.price) || formData.price <= 0) {
    return { success: false, error: "Price must be a positive number." };
  }
  if (!Number.isFinite(formData.mrp) || formData.mrp <= 0) {
    return { success: false, error: "MRP must be a positive number." };
  }
  if (!Number.isFinite(formData.stock) || formData.stock < 0) {
    return { success: false, error: "Stock must be 0 or greater." };
  }
  // --- End validation ---

  // Validation checks for salePrice
  if (formData.salePrice !== undefined && formData.salePrice !== null) {
    if (formData.salePrice <= 0) {
      return { success: false, error: "Sale Price must be greater than 0." };
    }
    if (formData.salePrice >= formData.price) {
      return { success: false, error: "Sale Price must be less than Original Price." };
    }
  }

  try {
    const slug = await getUniqueSlug(formData.name);

    // Create product
    const product = await prisma.product.create({
      data: {
        name: formData.name,
        slug,
        description: formData.description ?? null,
        price: formData.price,
        mrp: formData.mrp,
        salePrice: formData.salePrice ?? null,
        categoryId: formData.categoryId,
        lowStockThreshold: formData.lowStockThreshold ?? 10,
        isActive: formData.isActive ?? true,
        isFeatured: formData.isFeatured ?? false,
        brandName: formData.brandName ?? null,
        brandDescription: formData.brandDescription ?? null,
        specifications: formData.specifications ? JSON.parse(JSON.stringify(formData.specifications)) : {},
      },
    });

    // Create multiple images
    if (formData.images && formData.images.length > 0) {
      await Promise.all(
        formData.images.map((img) =>
          prisma.productImage.create({
            data: {
              productId: product.id,
              url: img.url,
              publicId: img.publicId ?? null,
              sortOrder: img.sortOrder,
              alt: formData.name,
              isPrimary: img.isPrimary,
            },
          })
        )
      );
    }

    // Create default variant for inventory tracking
    await prisma.productVariant.create({
      data: {
        productId: product.id,
        optionName: "Default",
        optionValue: "Standard",
        stock: formData.stock,
        price: formData.price,
      },
    });

    // Audit log
    await logActivity({
      adminId: admin.id,
      action: "PRODUCT_CREATED",
      entityType: "Product",
      entityId: product.id,
      metadata: {
        name: product.name,
        price: product.price,
        stock: formData.stock,
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/products");
    return { success: true, productId: product.id };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[createProduct] Error:", err);
    return { success: false, error: err.message || "Failed to create product" };
  }
}

export async function updateProduct(
  id: string,
  formData: {
    name: string;
    description?: string;
    price: number;
    mrp: number;
    salePrice?: number | null;
    categoryId: string;
    lowStockThreshold?: number;
    images?: { url: string; publicId?: string; isPrimary: boolean; sortOrder: number }[];
    stock: number; // updates the default/first variant
    isActive?: boolean;
    isFeatured?: boolean;
    brandName?: string;
    brandDescription?: string;
    specifications?: Record<string, string>;
  }
) {
  const admin = await requireAdmin();

  // --- Input validation ---
  const name = formData.name?.trim();
  if (!name) {
    return { success: false, error: "Product name is required." };
  }
  if (name.length > 150) {
    return { success: false, error: "Product name must be 150 characters or fewer." };
  }
  if (!formData.categoryId?.trim()) {
    return { success: false, error: "Category is required." };
  }
  if (!Number.isFinite(formData.price) || formData.price <= 0) {
    return { success: false, error: "Price must be a positive number." };
  }
  if (!Number.isFinite(formData.mrp) || formData.mrp <= 0) {
    return { success: false, error: "MRP must be a positive number." };
  }
  if (!Number.isFinite(formData.stock) || formData.stock < 0) {
    return { success: false, error: "Stock must be 0 or greater." };
  }
  // --- End validation ---

  // Validation checks for salePrice
  if (formData.salePrice !== undefined && formData.salePrice !== null) {
    if (formData.salePrice <= 0) {
      return { success: false, error: "Sale Price must be greater than 0." };
    }
    if (formData.salePrice >= formData.price) {
      return { success: false, error: "Sale Price must be less than Original Price." };
    }
  }

  try {
    const slug = await getUniqueSlug(formData.name, id);

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: formData.name,
        slug,
        description: formData.description ?? null,
        price: formData.price,
        mrp: formData.mrp,
        salePrice: formData.salePrice ?? null,
        categoryId: formData.categoryId,
        lowStockThreshold: formData.lowStockThreshold ?? 10,
        isActive: formData.isActive ?? true,
        isFeatured: formData.isFeatured ?? false,
        brandName: formData.brandName ?? null,
        brandDescription: formData.brandDescription ?? null,
        specifications: formData.specifications ? JSON.parse(JSON.stringify(formData.specifications)) : {},
      },
      include: {
        images: true,
        variants: true,
      },
    });

    // Update product images
    if (formData.images) {
      const currentImages = product.images;
      const newUrls = formData.images.map((img) => img.url);

      // Find images to delete
      const imagesToDelete = currentImages.filter((img) => !newUrls.includes(img.url));

      // 1. Delete removed images from Cloudinary
      for (const img of imagesToDelete) {
        if (img.publicId) {
          try {
            await deleteImage(img.publicId);
          } catch (e) {
            console.error(`Failed to delete asset ${img.publicId} from Cloudinary:`, e);
          }
        }
      }

      // 2. Delete removed images from database
      if (imagesToDelete.length > 0) {
        await prisma.productImage.deleteMany({
          where: {
            id: { in: imagesToDelete.map((img) => img.id) },
          },
        });
      }

      // 3. Upsert remaining/new images
      for (const img of formData.images) {
        const existing = currentImages.find((cImg) => cImg.url === img.url);

        if (existing) {
          await prisma.productImage.update({
            where: { id: existing.id },
            data: {
              isPrimary: img.isPrimary,
              sortOrder: img.sortOrder,
              publicId: img.publicId ?? existing.publicId,
            },
          });
        } else {
          await prisma.productImage.create({
            data: {
              productId: id,
              url: img.url,
              publicId: img.publicId ?? null,
              sortOrder: img.sortOrder,
              alt: formData.name,
              isPrimary: img.isPrimary,
            },
          });
        }
      }
    }

    // Update default variant or first variant stock/price
    if (product.variants.length > 0) {
      await prisma.productVariant.update({
        where: { id: product.variants[0].id },
        data: {
          stock: formData.stock,
          price: formData.price,
        },
      });
    } else {
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          optionName: "Default",
          optionValue: "Standard",
          stock: formData.stock,
          price: formData.price,
        },
      });
    }

    // Audit log
    await logActivity({
      adminId: admin.id,
      action: "PRODUCT_UPDATED",
      entityType: "Product",
      entityId: product.id,
      metadata: {
        name: product.name,
        price: product.price,
        stock: formData.stock,
      },
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);
    revalidatePath("/products");
    revalidatePath(`/products/${product.slug}`);
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[updateProduct] Error:", err);
    return { success: false, error: err.message || "Failed to update product" };
  }
}

export async function toggleProductActive(id: string, isActive: boolean) {
  const admin = await requireAdmin();

  try {
    const product = await prisma.product.update({
      where: { id },
      data: { isActive },
    });

    await logActivity({
      adminId: admin.id,
      action: isActive ? "PRODUCT_ACTIVATED" : "PRODUCT_DEACTIVATED",
      entityType: "Product",
      entityId: id,
      metadata: { name: product.name },
    });

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[toggleProductActive] Error:", err);
    return { success: false, error: err.message || "Failed to toggle active status" };
  }
}

export async function toggleProductFeatured(id: string, isFeatured: boolean) {
  const admin = await requireAdmin();

  try {
    const product = await prisma.product.update({
      where: { id },
      data: { isFeatured },
    });

    await logActivity({
      adminId: admin.id,
      action: isFeatured ? "PRODUCT_FEATURED" : "PRODUCT_UNFEATURED",
      entityType: "Product",
      entityId: id,
      metadata: { name: product.name },
    });

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[toggleProductFeatured] Error:", err);
    return { success: false, error: err.message || "Failed to toggle featured status" };
  }
}

export async function deleteProduct(id: string) {
  const admin = await requireAdmin();

  try {
    // Soft delete product by setting active = false
    const product = await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    // Audit log
    await logActivity({
      adminId: admin.id,
      action: "PRODUCT_DELETED",
      entityType: "Product",
      entityId: id,
      metadata: { name: product.name, note: "Soft deleted by setting active to false" },
    });

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[deleteProduct] Error:", err);
    return { success: false, error: err.message || "Failed to delete product" };
  }
}

export async function updateProductStock(productId: string, newStock: number) {
  const admin = await requireAdmin();

  // --- Input validation ---
  if (!Number.isFinite(newStock) || newStock < 0) {
    return { success: false, error: "Stock must be 0 or greater." };
  }
  // --- End validation ---

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true }
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    if (product.variants.length > 0) {
      await prisma.productVariant.update({
        where: { id: product.variants[0].id },
        data: { stock: newStock },
      });
    } else {
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          optionName: "Default",
          optionValue: "Standard",
          stock: newStock,
          price: product.price,
        },
      });
    }

    // Audit log
    await logActivity({
      adminId: admin.id,
      action: "PRODUCT_STOCK_UPDATED",
      entityType: "Product",
      entityId: productId,
      metadata: {
        name: product.name,
        newStock,
      },
    });

    revalidatePath("/admin/inventory");
    revalidatePath("/admin/products");
    revalidatePath("/admin/dashboard");
    revalidatePath("/products");
    return { success: true };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[updateProductStock] Error:", err);
    return { success: false, error: err.message || "Failed to update stock" };
  }
}
