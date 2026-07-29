// apps/storefront/app/(store)/products/[handle]/ProductDetailClient.tsx
"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { ChevronRight, Truck, RotateCcw, Shield, Check, ShoppingBag, CreditCard } from "lucide-react";
import { getProductBySlug, getProductsByCategory } from "@/lib/actions/product-actions";
import { StorefrontProduct } from "@/components/store/products/ProductCard";
import ImageGallery from "@/components/store/product/ImageGallery";
import QuantitySelector from "@/components/store/product/QuantitySelector";
import ProductTabs from "@/components/store/product/ProductTabs";
import ProductCard from "@/components/store/products/ProductCard";
import { useCartStore } from "@/lib/store/cart-store";
import { useUIStore } from "@/components/store/ui-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { PLACEHOLDER_IMAGE } from "@/lib/utils";
import { getPublicReviews, checkUserCanReview } from "@/lib/actions/reviews";

interface ProductDetailClientProps {
  params: Promise<{ handle: string }>;
  freeDeliveryThreshold: number;
}

export default function ProductDetailClient({ params, freeDeliveryThreshold }: ProductDetailClientProps) {
  const { handle } = use(params);
  const router = useRouter();
  const { addItem } = useCartStore();
  const { setCartOpen } = useUIStore();
  const [product, setProduct] = useState<StorefrontProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<StorefrontProduct[]>([]);
  const { isAuthenticated } = useAuthStore();
  const [reviews, setReviews] = useState<any[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [canReviewReason, setCanReviewReason] = useState<string | null>(null);

  const fetchReviewsAndAuth = async (productId: string) => {
    try {
      const publicReviews = await getPublicReviews(productId);
      setReviews(publicReviews);

      const canReviewStatus = await checkUserCanReview(productId);
      setCanReview(canReviewStatus.canReview);
      setCanReviewReason(canReviewStatus.reason ?? null);
    } catch (err) {
      console.error("Error loading reviews/auth:", err);
    }
  };

  // Fetch product & related items
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const fetchedProd = await getProductBySlug(handle) as StorefrontProduct;
        setProduct(fetchedProd);
        
        if (fetchedProd) {
          fetchReviewsAndAuth(fetchedProd.id);
        }

        // Fetch related products
        if (fetchedProd && fetchedProd.categoryId) {
          const fetchedRelated = await getProductsByCategory(fetchedProd.category?.slug || "");
          setRelatedProducts((fetchedRelated as StorefrontProduct[]).filter((p) => p.id !== fetchedProd.id).slice(0, 3));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [handle]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-[var(--ag-red)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  // Find price of active variant (or default first variant)
  const isPromoOffer = product.salePrice !== null && product.salePrice !== undefined;
  const activePrice = product.salePrice ?? product.price;
  const originalPrice = isPromoOffer ? product.price : product.mrp;
  const discount = originalPrice > activePrice ? Math.round(((originalPrice - activePrice) / originalPrice) * 100) : 0;

  const handleAddToCart = async () => {
    if (!product) return;
    const stock = product.variants[0]?.stock ?? 0;
    if (quantity > stock) {
      alert(`Only ${stock} units available.`);
      return;
    }

    setAddingToCart(true);
    
    addItem({
      id: product.id,
      name: product.name,
      price: activePrice,
      image: product.images.find(i => i.isPrimary)?.url || product.images[0]?.url || PLACEHOLDER_IMAGE,
      quantity: quantity,
      stock: stock,
    });

    setTimeout(() => {
      setAddingToCart(false);
      setCartSuccess(true);
      setCartOpen(true);
      setTimeout(() => setCartSuccess(false), 1500);
    }, 600);
  };



  const handleBuyNow = () => {
    if (!isAuthenticated) {
      router.push(`/account/login?redirect=${encodeURIComponent(`/products/${handle}`)}`);
    } else {
      // Proceed to checkout
      handleAddToCart();
      router.push("/cart");
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground select-none py-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-[var(--ag-gray-500)] mb-6 font-semibold">
          <Link href="/" className="hover:text-[var(--ag-dark)] transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link href="/products" className="hover:text-[var(--ag-dark)] transition-colors">Products</Link>
          <ChevronRight size={12} />
          <span className="text-[var(--ag-red)] font-bold">{product.name}</span>
        </nav>

        {/* Dynamic Detail grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Column: ImageGallery */}
          <div className="lg:col-span-7">
            <ImageGallery images={product.images.length > 0 ? product.images.map(img => img.url) : [PLACEHOLDER_IMAGE]} />
          </div>

          {/* Right Column: Info details */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div>
              {/* Brand Chip */}
              <span className="inline-block bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full mb-3">
                {product.category?.name || "Personal Marketing Store"}
              </span>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-display font-black leading-tight tracking-tight text-foreground">
                {product.name}
              </h1>
            </div>

            {/* Stars Review Row */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              {reviews.length > 0 ? (
                <>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => {
                      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
                      return (
                        <span key={s} className="text-sm">{s <= Math.round(avgRating) ? "★" : "☆"}</span>
                      );
                    })}
                  </div>
                  <span className="text-foreground">
                    {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                  </span>
                  <span className="text-[var(--ag-gray-500)]">|</span>
                  <span className="text-[var(--ag-gray-500)]">{reviews.length} rating{reviews.length > 1 ? "s" : ""}</span>
                </>
              ) : (
                <span className="text-zinc-400 dark:text-zinc-550 italic text-[11px] font-semibold">No reviews yet</span>
              )}
              <span className="text-[var(--ag-gray-500)]">|</span>
              {product.variants[0]?.stock > 0 ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-ping" />
                  In Stock
                </span>
              ) : (
                <span className="text-red-650 flex items-center gap-1 font-bold">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Price Tags */}
            <div className="flex flex-col gap-2">
              {isPromoOffer && (
                <div className="flex items-center gap-1.5 p-2 bg-red-50 border border-red-200 text-[var(--ag-red)] rounded-[var(--radius-lg)] text-[10px] font-black w-fit animate-pulse">
                  🔥 Limited Time Offer
                </div>
              )}
              <div className="flex items-baseline gap-3 p-4 bg-card text-card-foreground rounded-[var(--radius-lg)] border border-border w-fit">
                <span className="text-2xl font-extrabold text-[var(--ag-red)]">
                  ₹{activePrice}
                </span>
                {originalPrice > activePrice && (
                  <>
                    <span className="text-sm text-[var(--ag-gray-500)] line-through">
                      ₹{originalPrice}
                    </span>
                    <span className="bg-[var(--ag-red)] text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                      {isPromoOffer ? `${discount}% OFF` : `-${discount}% OFF`}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Description intro */}
            <p className="text-sm text-[var(--ag-gray-500)] leading-relaxed font-semibold">
              {(product.description || "").split(".")[0]}. Perfect for everyday task efficiency.
            </p>

            {/* Separator */}
            <hr className="border-[var(--ag-gray-200)]" />

            {/* Variant Selector (Removed until variants schema gets mapped to frontend options component) */}

            {/* Quantity Selector */}
            <QuantitySelector
              quantity={quantity}
              onChange={setQuantity}
              max={product.variants[0]?.stock || 10}
            />

            {/* Call to Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || (product.variants[0]?.stock ?? 0) <= 0}
                className="flex-1 h-13 bg-[var(--ag-red)] hover:bg-[var(--ag-red-hover)] disabled:bg-[var(--ag-gray-500)] text-white text-sm font-bold rounded-[var(--radius-md)] flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all select-none"
              >
                {(product.variants[0]?.stock ?? 0) <= 0 ? (
                  "OUT OF STOCK"
                ) : addingToCart ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : cartSuccess ? (
                  <>
                    <Check size={16} /> ADDED!
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} /> ADD TO CART
                  </>
                )}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={(product.variants[0]?.stock ?? 0) <= 0}
                className="flex-1 h-13 bg-background hover:bg-muted border-2 border-[var(--ag-red)] disabled:border-border disabled:text-muted-foreground disabled:hover:bg-transparent text-[var(--ag-red)] text-sm font-bold rounded-[var(--radius-md)] flex items-center justify-center gap-2 transition-colors select-none"
              >
                <CreditCard size={16} /> BUY NOW
              </button>
            </div>

            {/* Delivery Info */}
            <div className="flex flex-col gap-2 bg-card text-card-foreground border border-border p-4 rounded-[var(--radius-lg)] mt-2">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                <Truck size={15} className="text-emerald-600 shrink-0" />
                <span>Free delivery on orders above ₹{freeDeliveryThreshold}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                <RotateCcw size={15} className="text-emerald-600 shrink-0" />
                <span>Easy 7-day return policy</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
                <Shield size={15} className="text-emerald-600 shrink-0" />
                <span>100% genuine & authentic product</span>
              </div>
            </div>

          </div>
        </div>

        {/* Product Details Tabs */}
        <ProductTabs
          description={product.description || ""}
          brandName={product.brandName || product.category?.name || "Personal Marketing Store"}
          brandDescription={product.brandDescription || undefined}
          specifications={(product.specifications as Record<string, string>) || {}}
          productId={product.id}
          reviews={reviews}
          canReview={canReview}
          canReviewReason={canReviewReason}
          onReviewSubmitted={() => {
            fetchReviewsAndAuth(product.id);
          }}
        />

        {/* You Might Also Like */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 border-t border-[var(--ag-gray-200)] pt-12">
            <h2 className="text-lg sm:text-xl font-display font-black text-[var(--ag-dark)] section-title-underline pb-1 mb-8">
              You Might Also Like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
