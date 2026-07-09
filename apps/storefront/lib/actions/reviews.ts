"use server";

import prisma from "@/lib/prisma";
import { getUser } from "@/lib/auth/get-user";
import { requireAdmin } from "@/lib/auth/require-admin";
import { revalidatePath } from "next/cache";
import { ReviewStatus } from "@prisma/client";

export async function submitReview(formData: {
  productId: string;
  rating: number;
  title: string;
  comment: string;
}) {
  // --- Input validation ---
  const productId = formData.productId?.trim();
  if (!productId) {
    return { success: false, error: "Product ID is required." };
  }
  const title = formData.title?.trim();
  if (!title) {
    return { success: false, error: "Review title is required." };
  }
  if (title.length > 100) {
    return { success: false, error: "Review title must be 100 characters or fewer." };
  }
  const comment = formData.comment?.trim();
  if (!comment) {
    return { success: false, error: "Review comment is required." };
  }
  if (comment.length > 1000) {
    return { success: false, error: "Review comment must be 1000 characters or fewer." };
  }
  const rating = Number(formData.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { success: false, error: "Rating must be a whole number between 1 and 5." };
  }
  // --- End validation ---

  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Please log in to submit a review." };
    }

    // 1. Verify user has purchased this product
    const order = await prisma.order.findFirst({
      where: {
        userId: user.id,
        paymentStatus: "COMPLETED",
        items: {
          some: {
            productId,
          },
        },
      },
    });

    if (!order) {
      return {
        success: false,
        error: "Only verified purchasers of this product can submit a review.",
      };
    }

    // 2. Check for existing review
    const existing = await prisma.review.findUnique({
      where: {
        productId_userId: {
          productId,
          userId: user.id,
        },
      },
    });

    if (existing) {
      return {
        success: false,
        error: "You have already submitted a review for this product.",
      };
    }

    // 3. Create review
    const review = await prisma.review.create({
      data: {
        productId,
        userId: user.id,
        rating,
        title,
        comment,
        status: "PENDING",
      },
      include: {
        product: true,
      },
    });

    revalidatePath(`/products/${review.product.slug}`);
    revalidatePath("/products");
    
    return {
      success: true,
      message: "Your review has been submitted and is pending moderation.",
    };
  } catch (error: any) {
    console.error("[submitReview] Error:", error);
    return { success: false, error: error.message || "Failed to submit review." };
  }
}

export async function checkUserCanReview(productId: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { canReview: false, reason: "not_logged_in" };
    }

    // Check for existing review
    const existing = await prisma.review.findUnique({
      where: {
        productId_userId: {
          productId,
          userId: user.id,
        },
      },
    });

    if (existing) {
      return { canReview: false, reason: "already_reviewed" };
    }

    // Check if purchased
    const order = await prisma.order.findFirst({
      where: {
        userId: user.id,
        paymentStatus: "COMPLETED",
        items: {
          some: {
            productId,
          },
        },
      },
    });

    if (!order) {
      return { canReview: false, reason: "not_purchased" };
    }

    return { canReview: true };
  } catch (error) {
    console.error("[checkUserCanReview] Error:", error);
    return { canReview: false, reason: "error" };
  }
}

export async function getPublicReviews(productId: string) {
  try {
    return await prisma.review.findMany({
      where: {
        productId,
        status: "APPROVED",
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        reply: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    console.error("[getPublicReviews] Error:", error);
    return [];
  }
}

export async function getReviewsForAdmin(status: ReviewStatus) {
  try {
    await requireAdmin();

    return await prisma.review.findMany({
      where: {
        status,
      },
      include: {
        product: {
          select: {
            name: true,
            slug: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        reply: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    console.error("[getReviewsForAdmin] Error:", error);
    return [];
  }
}

export async function updateReviewStatus(reviewId: string, status: ReviewStatus) {
  try {
    await requireAdmin();

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { status },
      include: { product: true },
    });

    revalidatePath("/admin/reviews");
    revalidatePath(`/products/${review.product.slug}`);
    revalidatePath("/products");

    return { success: true };
  } catch (error: any) {
    console.error("[updateReviewStatus] Error:", error);
    return { success: false, error: error.message || "Failed to update review status." };
  }
}

export async function replyToReview(reviewId: string, comment: string) {
  // --- Input validation ---
  const reviewIdTrimmed = reviewId?.trim();
  if (!reviewIdTrimmed) {
    return { success: false, error: "Review ID is required." };
  }
  const replyComment = comment?.trim();
  if (!replyComment) {
    return { success: false, error: "Reply comment is required." };
  }
  if (replyComment.length > 1000) {
    return { success: false, error: "Reply must be 1000 characters or fewer." };
  }
  // --- End validation ---

  try {
    const admin = await requireAdmin();

    const review = await prisma.review.findUnique({
      where: { id: reviewIdTrimmed },
      include: { product: true },
    });

    if (!review) {
      return { success: false, error: "Review not found." };
    }

    await prisma.reviewReply.upsert({
      where: { reviewId: reviewIdTrimmed },
      create: {
        reviewId: reviewIdTrimmed,
        adminId: admin.id,
        comment: replyComment,
      },
      update: {
        comment: replyComment,
        adminId: admin.id,
      },
    });

    revalidatePath("/admin/reviews");
    revalidatePath(`/products/${review.product.slug}`);

    return { success: true };
  } catch (error: any) {
    console.error("[replyToReview] Error:", error);
    return { success: false, error: error.message || "Failed to reply to review." };
  }
}
