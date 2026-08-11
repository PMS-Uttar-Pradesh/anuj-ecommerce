// apps/storefront/components/store/layout/MegaMenu.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface MegaMenuProps {
  category: string;
  categoryData?: any;
  onClose: () => void;
}

const megaMenuVariants = {
  hidden: { opacity: 0, y: -8, scaleY: 0.97, transformOrigin: "top" },
  visible: {
    opacity: 1,
    y: 0,
    scaleY: 1,
    transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
};

export default function MegaMenu({ category, categoryData, onClose }: MegaMenuProps) {
  if (!categoryData) return null;

  const activeProducts = categoryData.products || [];
  
  // Separate into featured and regular list
  const featuredProducts = activeProducts.filter((p: any) => p.isFeatured).slice(0, 2);
  // If no featured, fallback to first 2 products
  const featuredList = featuredProducts.length > 0 ? featuredProducts : activeProducts.slice(0, 2);

  const regularProducts = activeProducts.slice(0, 4);

  const subcategories = regularProducts.map((p: any) => {
    const primaryImg = p.images?.find((i: any) => i.isPrimary)?.url || p.images?.[0]?.url || "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=200&auto=format&fit=crop&q=80";
    return {
      title: p.name,
      image: primaryImg,
      href: `/products/${p.slug}`,
    };
  });

  const featured = featuredList.map((p: any) => {
    const primaryImg = p.images?.find((i: any) => i.isPrimary)?.url || p.images?.[0]?.url || "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=150&auto=format&fit=crop&q=80";
    return {
      title: p.name,
      price: `₹${p.price}`,
      image: primaryImg,
      href: `/products/${p.slug}`,
    };
  });

  const ctaText = `See All ${categoryData.name} →`;
  const ctaHref = `/collections/${categoryData.slug}`;

  return (
    <motion.div
      variants={megaMenuVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="absolute top-[calc(100%-1px)] left-0 w-full bg-white dark:bg-neutral-900 z-[100] border-b border-[var(--ag-gray-200)] dark:border-neutral-800 shadow-2xl flex flex-col"
      onMouseLeave={onClose}
    >
      <div className="max-w-7xl mx-auto w-full px-8 py-10 grid grid-cols-12 gap-8">
        {/* Left Side: Category Products */}
        <div className="col-span-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ag-gray-500)] mb-6">
            Shop Products
          </h3>
          {subcategories.length === 0 ? (
            <p className="text-sm font-semibold text-[var(--ag-gray-500)] py-8">
              No products found in this category.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-6">
              {subcategories.map((sub: any) => (
                <Link
                  key={sub.title}
                  href={sub.href}
                  className="group flex flex-col items-center text-center select-none"
                  onClick={onClose}
                >
                  <div className="w-full aspect-square rounded-[var(--radius-lg)] overflow-hidden border border-[var(--ag-gray-200)] dark:border-neutral-800 bg-[var(--ag-gray-100)] dark:bg-neutral-800 transition-transform duration-300 group-hover:scale-102 group-hover:shadow-md">
                    <Image
                      src={sub.image}
                      alt={sub.title}
                      width={180}
                      height={180}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <span className="mt-3 text-sm font-semibold text-[var(--ag-dark)] dark:text-[var(--foreground)] group-hover:text-[var(--ag-red)] transition-colors border-b-2 border-transparent group-hover:border-[var(--ag-red)] pb-0.5 line-clamp-1 w-full text-center">
                    {sub.title}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Featured Products */}
        <div className="col-span-4 border-l border-[var(--ag-gray-200)] dark:border-neutral-800 pl-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ag-gray-500)] mb-6">
            Featured Bestsellers
          </h3>
          {featured.length === 0 ? (
            <p className="text-sm font-semibold text-[var(--ag-gray-500)] py-8">
              No featured products yet.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {featured.map((prod: any) => (
                <Link
                  key={prod.title}
                  href={prod.href}
                  className="group flex items-center gap-4 bg-[var(--ag-gray-100)] dark:bg-neutral-800 p-3 rounded-[var(--radius-md)] border border-transparent hover:border-[var(--ag-red)] hover:bg-white dark:hover:bg-neutral-700 hover:shadow-sm transition-all"
                  onClick={onClose}
                >
                  <div className="w-14 h-14 rounded-[var(--radius-sm)] overflow-hidden bg-white dark:bg-neutral-700 shrink-0 border border-[var(--ag-gray-200)] dark:border-neutral-600">
                    <Image
                      src={prod.image}
                      alt={prod.title}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-[var(--ag-dark)] dark:text-[var(--foreground)] truncate group-hover:text-[var(--ag-red)] transition-colors">
                      {prod.title}
                    </h4>
                    <p className="text-sm font-extrabold text-[var(--ag-red)] mt-0.5">
                      {prod.price}
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-[var(--ag-gray-500)] group-hover:text-[var(--ag-red)] group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom CTA strip */}
      <div className="w-full bg-[var(--ag-gray-100)] dark:bg-neutral-800 border-t border-[var(--ag-gray-200)] dark:border-neutral-700 py-3 px-8 text-center">
        <Link
          href={ctaHref}
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--ag-red)] hover:text-[var(--ag-red-hover)] transition-colors hover:underline"
        >
          {ctaText}
        </Link>
      </div>
    </motion.div>
  );
}
