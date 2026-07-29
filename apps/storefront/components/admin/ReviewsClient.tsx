"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, MessageSquare, Check, X, ShieldAlert, CornerDownRight, Loader2, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { updateReviewStatus, replyToReview } from "@/lib/actions/reviews";
import { ReviewStatus } from "@prisma/client";
import AdminRefreshButton from "@/components/admin/AdminRefreshButton";

interface ReviewItem {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string;
  comment: string;
  status: ReviewStatus;
  createdAt: Date | string;
  product: {
    name: string;
    slug: string;
  };
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  reply: {
    id: string;
    comment: string;
  } | null;
}

interface ReviewsClientProps {
  initialReviews: ReviewItem[];
  counts: {
    PENDING: number;
    APPROVED: number;
    REJECTED: number;
  };
}

export default function ReviewsClient({ initialReviews, counts }: ReviewsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<ReviewStatus>("PENDING");
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyComment, setReplyComment] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredReviews = initialReviews.filter((rev) => rev.status === activeTab);

  const handleStatusChange = async (reviewId: string, newStatus: ReviewStatus) => {
    setActionError(null);
    startTransition(async () => {
      const res = await updateReviewStatus(reviewId, newStatus);
      if (res.success) {
        router.refresh();
      } else {
        setActionError(res.error || "Failed to update review status");
      }
    });
  };

  const handleReplySubmit = async (e: React.FormEvent, reviewId: string) => {
    e.preventDefault();
    if (!replyComment.trim()) return;

    setActionError(null);
    startTransition(async () => {
      const res = await replyToReview(reviewId, replyComment);
      if (res.success) {
        setReplyingReviewId(null);
        setReplyComment("");
        router.refresh();
      } else {
        setActionError(res.error || "Failed to submit admin reply");
      }
    });
  };

  const startReplying = (review: ReviewItem) => {
    setReplyingReviewId(review.id);
    setReplyComment(review.reply?.comment || "");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-zinc-900 dark:text-zinc-50">
            Product Reviews Moderation
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Moderate customer reviews and submit official admin responses. Only approved reviews appear publicly.
          </p>
        </div>
        <AdminRefreshButton />
      </div>

      {actionError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg text-xs font-medium max-w-2xl flex items-center gap-2">
          <ShieldAlert className="size-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl p-1.5 shadow-sm border w-fit gap-1 select-none">
        {(["PENDING", "APPROVED", "REJECTED"] as ReviewStatus[]).map((tab) => {
          const isActive = activeTab === tab;
          const count = counts[tab];
          const label = tab === "PENDING" ? "Pending" : tab === "APPROVED" ? "Approved" : "Rejected";
          
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setActionError(null);
                setReplyingReviewId(null);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? "bg-red-600 text-white shadow-sm shadow-red-900/10"
                  : "text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              }`}
            >
              <span>{label}</span>
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Reviews list */}
      <div className="space-y-4 max-w-4xl">
        {filteredReviews.length === 0 ? (
          <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center shadow-sm">
            <MessageSquare className="size-8 text-zinc-400 dark:text-zinc-650 mx-auto mb-3 opacity-60" />
            <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">No reviews found</h3>
            <p className="text-xs text-zinc-500 mt-1">There are no reviews currently in this tab.</p>
          </div>
        ) : (
          filteredReviews.map((review) => {
            const customerName =
              review.user.firstName || review.user.lastName
                ? `${review.user.firstName ?? ""} ${review.user.lastName ?? ""}`.trim()
                : review.user.email;
            
            const isReplying = replyingReviewId === review.id;

            return (
              <div
                key={review.id}
                className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow"
              >
                {/* Upper line: Product, User & Date */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-850 pb-3">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Product Info</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Link
                        href={`/products/${review.product.slug}`}
                        target="_blank"
                        className="text-xs font-black text-red-600 dark:text-red-500 hover:underline flex items-center gap-1"
                      >
                        <span>{review.product.name}</span>
                        <LinkIcon className="size-3" />
                      </Link>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Reviewer / Date</span>
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                      {customerName} <span className="text-zinc-400 dark:text-zinc-600 font-normal">({review.user.email})</span>
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {new Date(review.createdAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>

                {/* Rating & Content */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`size-3.5 ${
                          s <= review.rating ? "text-amber-500 fill-amber-500" : "text-zinc-200 dark:text-zinc-800"
                        }`}
                      />
                    ))}
                  </div>

                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{review.title}</h3>
                  <p className="text-xs text-zinc-700 dark:text-zinc-350 leading-relaxed font-medium whitespace-pre-wrap">
                    {review.comment}
                  </p>
                </div>

                {/* Reply display if exists and not currently editing/replying */}
                {review.reply && !isReplying && (
                  <div className="pl-4 border-l-2 border-red-500/20 bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded-r-lg space-y-1">
                    <span className="text-[10px] text-red-650 dark:text-red-400 font-black uppercase tracking-wider flex items-center gap-1">
                      <CornerDownRight className="size-3" /> Admin Response
                    </span>
                    <p className="text-xs text-zinc-700 dark:text-zinc-350 font-medium leading-relaxed">
                      {review.reply.comment}
                    </p>
                  </div>
                )}

                {/* Reply Form */}
                {isReplying && (
                  <form onSubmit={(e) => handleReplySubmit(e, review.id)} className="space-y-3 bg-zinc-50 dark:bg-zinc-900/40 p-4 border border-zinc-200/50 dark:border-zinc-800/50 rounded-lg">
                    <label className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                      {review.reply ? "Edit Official Response" : "Write Official Response"}
                    </label>
                    <textarea
                      value={replyComment}
                      onChange={(e) => setReplyComment(e.target.value)}
                      placeholder="Thank you for your feedback! We will address this..."
                      rows={3}
                      required
                      className="w-full px-3 py-2 border border-zinc-250 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 text-zinc-900 dark:text-zinc-50 resize-y"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isPending || !replyComment.trim()}
                        className="flex items-center gap-1 text-xs py-1.5 px-3 bg-red-600 hover:bg-red-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 text-white rounded-lg transition-colors font-bold cursor-pointer shadow-sm"
                      >
                        {isPending ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Check className="size-3" />
                        )}
                        <span>Save Response</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingReviewId(null);
                          setReplyComment("");
                        }}
                        className="text-xs py-1.5 px-3 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-350 rounded-lg transition-colors font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Moderation Controls Footer */}
                {!isReplying && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-850 justify-between items-center">
                    <div className="flex gap-2">
                      {review.status !== "APPROVED" && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleStatusChange(review.id, "APPROVED")}
                          className="flex items-center gap-1 text-xs py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition-colors font-bold cursor-pointer shadow-sm"
                        >
                          <Check className="size-3.5" />
                          <span>Approve</span>
                        </button>
                      )}

                      {review.status !== "REJECTED" && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleStatusChange(review.id, "REJECTED")}
                          className="flex items-center gap-1 text-xs py-1.5 px-3 border border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg transition-colors font-bold cursor-pointer"
                        >
                          <X className="size-3.5" />
                          <span>Reject</span>
                        </button>
                      )}
                    </div>

                    <div>
                      {review.status === "APPROVED" && (
                        <button
                          type="button"
                          onClick={() => startReplying(review)}
                          className="flex items-center gap-1 text-xs py-1.5 px-3 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-650 dark:text-zinc-350 rounded-lg transition-colors font-bold cursor-pointer"
                        >
                          <MessageSquare className="size-3.5" />
                          <span>{review.reply ? "Edit Reply" : "Reply"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
