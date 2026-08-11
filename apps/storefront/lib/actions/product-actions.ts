"use server";

import prisma from "@/lib/prisma";

export async function getProducts() {
  try {
    return await prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        images: true,
        category: true,
        variants: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function getProductBySlug(slug: string) {
  try {
    return await prisma.product.findFirst({
      where: { 
        slug,
        isActive: true
      },
      include: {
        images: true,
        category: true,
        variants: true,
      },
    });
  } catch (error) {
    console.error("Error fetching product by slug:", error);
    return null;
  }
}

export async function getProductsByCategory(categorySlug: string) {
  try {
    if (categorySlug === "best-sellers" || categorySlug === "featured") {
      return await getFeaturedProducts();
    }
    return await prisma.product.findMany({
      where: {
        isActive: true,
        category: {
          slug: categorySlug,
        },
      },
      include: {
        images: true,
        category: true,
        variants: true,
      },
    });
  } catch (error) {
    console.error("Error fetching products by category:", error);
    return [];
  }
}

export async function getFeaturedProducts(limit?: number) {
  try {
    return await prisma.product.findMany({
      where: {
        isActive: true,
        isFeatured: true,
      },
      include: {
        images: true,
        category: true,
        variants: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      ...(limit ? { take: limit } : {}),
    });
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}

export async function searchProducts(query: string, limit: number = 5) {
  try {
    return await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        images: true,
        category: true,
        variants: true,
      },
      take: limit,
    });
  } catch (error) {
    console.error("Error searching products:", error);
    return [];
  }
}

export async function getCategories() {
  try {
    return await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    return await prisma.category.findUnique({
      where: { slug },
    });
  } catch (error) {
    console.error("Error fetching category by slug:", error);
    return null;
  }
}

export async function getNewArrivals(limit: number = 8) {
  try {
    return await prisma.product.findMany({
      where: { isActive: true },
      include: {
        images: true,
        category: true,
        variants: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });
  } catch (error) {
    console.error("Error fetching new arrivals:", error);
    return [];
  }
}

export async function getTrendingProducts(limit: number = 8) {
  try {
    return await prisma.product.findMany({
      where: { isActive: true },
      include: {
        images: true,
        category: true,
        variants: true,
      },
      orderBy: [
        {
          orderItems: {
            _count: "desc",
          },
        },
        {
          createdAt: "desc",
        },
      ],
      take: limit,
    });
  } catch (error) {
    console.error("Error fetching trending products:", error);
    return [];
  }
}

export async function getMegaMenuCategories() {
  try {
    return await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        products: {
          where: { isActive: true },
          include: {
            images: {
              select: {
                url: true,
                isPrimary: true,
              },
            },
          },
          take: 8,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching mega menu categories:", error);
    return [];
  }
}
