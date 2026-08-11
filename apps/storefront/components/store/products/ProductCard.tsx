// apps/storefront/components/store/products/ProductCard.tsx
"use client";

import { motion } from "framer-motion";
import { Star, ShoppingCart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useUIStore } from "@/components/store/ui-store";
import { useCartStore } from "@/lib/store/cart-store";
import { Prisma } from "@prisma/client";
import { useState } from "react";
import { PLACEHOLDER_IMAGE } from "@/lib/utils";

export type StorefrontProduct = Prisma.ProductGetPayload<{
  include: { images: true; variants: true; category: true };
}>;

interface ProductCardProps {
  product: StorefrontProduct;
  showVendor?: boolean;
  showBadge?: boolean;
}

export default function ProductCard({ product, showVendor = true, showBadge = true }: ProductCardProps) {
  const { setCartOpen } = useUIStore();
  const { addItem } = useCartStore();
  const [isHovered, setIsHovered] = useState(false);

  // Images
  const primaryImage = product.images.find(img => img.isPrimary)?.url || product.images[0]?.url || PLACEHOLDER_IMAGE;
  const secondaryImage = product.images.filter(img => !img.isPrimary)[0]?.url || primaryImage;
  const hasSecondaryImage = product.images.length > 1;

  // Price variables
  const price = product.salePrice !== null && product.salePrice !== undefined ? product.salePrice : product.price;
  const originalPrice = product.salePrice !== null && product.salePrice !== undefined ? product.price : product.mrp;
  const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const isPromoOffer = product.salePrice !== null && product.salePrice !== undefined;

  // Inventory logic
  const inventory = product.variants[0]?.stock || 0;
  const isOutOfStock = inventory <= 0;
  const isLowStock = inventory > 0 && inventory < 10;

  // Mock rating
  const rating = 4.5;
  const reviewCount = 12;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    
    addItem({
      id: product.id,
      name: product.name,
      price: price,
      image: primaryImage,
      quantity: 1,
      stock: inventory,
    });
    setCartOpen(true);
  };

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-card text-card-foreground border border-border rounded-[var(--radius-xl)] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col h-full select-none"
    >
      <Link href={`/products/${product.slug}`} className="flex flex-col h-full flex-1">
        {/* Image wrapper */}
        <div className="relative aspect-square w-full bg-muted overflow-hidden border-b border-border shrink-0">
          
          {/* Primary image */}
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out-expo ${
              hasSecondaryImage && isHovered ? "opacity-0 scale-95" : "opacity-100 scale-100 group-hover:scale-105"
            }`}
            loading="lazy"
          />

          {/* Secondary image on hover */}
          {hasSecondaryImage && (
            <Image
              src={secondaryImage}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out-expo ${
                isHovered ? "opacity-100 scale-105" : "opacity-0 scale-100"
              }`}
              loading="lazy"
            />
          )}

          {/* Discount badge */}
          {showBadge && discount > 0 && (
            <div className="absolute top-3 left-3 bg-[var(--ag-red)] text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm">
              {isPromoOffer ? `${discount}% OFF` : `SAVE ${discount}%`}
            </div>
          )}

          {/* Slide-up Add to Cart button (hover state for desktop) */}
          <div className="absolute inset-x-0 bottom-0 p-3 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out-expo hidden sm:block z-10">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`w-full py-2.5 text-white font-black text-xs rounded-[var(--radius-lg)] flex items-center justify-center gap-1.5 shadow-md transition-all duration-200 cursor-pointer ${
                isOutOfStock 
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-[var(--ag-red)] hover:bg-[var(--ag-red-hover)] hover:shadow-lg active:scale-98"
              }`}
            >
              <ShoppingCart size={12} className="stroke-[2.5]" />
              {isOutOfStock ? "SOLD OUT" : "QUICK ADD"}
            </button>
          </div>
        </div>

        {/* Content details */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div className="flex flex-col gap-1">
            {/* Vendor/Brand & Stock Status */}
            <div className="flex items-center justify-between gap-2">
              {showVendor && (
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--ag-gray-500)]">
                  {product.category?.name || "Personal Marketing Store"}
                </span>
              )}
              
              {/* Stock Badge */}
              {isOutOfStock ? (
                <span className="text-[8px] font-black uppercase tracking-wider text-red-500">Out of Stock</span>
              ) : isLowStock ? (
                <span className="text-[8px] font-black uppercase tracking-wider text-amber-500">Only {inventory} Left!</span>
              ) : (
                <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-emerald-500">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block" />
                  In Stock
                </span>
              )}
            </div>

            {/* Product Title */}
            <h3 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-[var(--ag-red)] transition-colors line-clamp-2 leading-tight min-h-[36px]">
              {product.name}
            </h3>

            {/* Stars Rating */}
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex items-center gap-0.5 text-amber-500 dark:text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={11}
                    className={s <= Math.floor(rating) ? "fill-current" : "text-gray-200 dark:text-neutral-700"}
                  />
                ))}
              </div>
              <span className="text-[9px] font-black text-[var(--ag-gray-500)] dark:text-neutral-400">
                ({reviewCount})
              </span>
            </div>
          </div>

          {/* Price Tag Row */}
          <div className="flex items-baseline gap-2 mt-3 pt-3 border-t border-border shrink-0">
            <span className="text-sm sm:text-base font-black text-[var(--ag-red)]">
              ₹{price}
            </span>
            {originalPrice > price && (
              <span className="text-xs text-[var(--ag-gray-500)] dark:text-neutral-500 line-through">
                ₹{originalPrice}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Mobile Add to Cart button (always visible below card on mobile) */}
      <div className="p-3 pt-0 sm:hidden shrink-0">
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`w-full py-2.5 text-white font-black text-xs rounded-[var(--radius-lg)] flex items-center justify-center gap-1.5 shadow-sm transition-all duration-200 ${
            isOutOfStock 
              ? "bg-neutral-300 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-600 cursor-not-allowed"
              : "bg-[var(--ag-red)] hover:bg-[var(--ag-red-hover)] active:scale-98"
          }`}
        >
          <ShoppingCart size={11} className="stroke-[2.5]" />
          {isOutOfStock ? "OUT OF STOCK" : "ADD TO CART"}
        </button>
      </div>
    </motion.div>
  );
}
