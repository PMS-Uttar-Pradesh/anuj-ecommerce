// apps/storefront/components/store/home/CategoryGrid.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export interface CategoryItem {
  id: string;
  title: string;
  image: string;
  href: string;
}

interface CategoryGridProps {
  title: string;
  subtitle?: string;
  categories: CategoryItem[];
  columns: 6 | 9 | 18;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

export default function CategoryGrid({ title, subtitle, categories, columns }: CategoryGridProps) {
  const isScrollable = columns === 18;

  // Determine Tailwind grid columns based on props
  let gridColsClass = "grid-cols-3 sm:grid-cols-4 md:grid-cols-6";
  if (columns === 9) {
    gridColsClass = "grid-cols-3 sm:grid-cols-6 md:grid-cols-9";
  } else if (columns === 6) {
    gridColsClass = "grid-cols-2 sm:grid-cols-3 md:grid-cols-6";
  }

  return (
    <section className="py-section bg-white dark:bg-neutral-900 select-none">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mb-8 text-center md:text-left">
          <h2 className="text-xl sm:text-2xl font-display font-black text-[var(--ag-dark)] dark:text-[var(--foreground)] section-title-underline pb-1">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-[var(--ag-gray-500)] mt-2 font-medium">
              {subtitle}
            </p>
          )}
        </div>

        {/* Categories Grid or Scroll Row */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className={
            isScrollable
              ? "flex overflow-x-auto whitespace-nowrap scrollbar-none snap-x gap-4 sm:gap-5 pb-5 pt-1 -mx-6 px-6 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]"
              : `grid ${gridColsClass} gap-4 sm:gap-5`
          }
        >
          {categories.map((cat) => (
            <motion.div
              key={cat.id}
              variants={itemVariants}
              className={isScrollable ? "flex-none w-[90px] sm:w-[105px] snap-start" : "w-full"}
            >
              <Link
                href={cat.href}
                className="group flex flex-col items-center text-center w-full"
              >
                {/* Image Wrapper */}
                <div
                  className={`w-full aspect-square overflow-hidden bg-[var(--ag-gray-100)] dark:bg-neutral-800 border border-[var(--ag-gray-200)] dark:border-neutral-700 relative transition-transform duration-300 group-hover:scale-[1.04] ${
                    isScrollable ? "rounded-full" : "rounded-[var(--radius-lg)]"
                  }`}
                >
                  <Image
                    src={cat.image}
                    alt={cat.title}
                    fill
                    sizes={isScrollable ? "105px" : "(min-width: 768px) 12vw, (min-width: 640px) 16vw, 33vw"}
                    className="w-full h-full object-cover transition-transform duration-300 ease-out-expo group-hover:scale-[1.06]"
                    loading="lazy"
                  />
                </div>
                {/* Title */}
                <span
                  className={`mt-2.5 text-xs sm:text-sm font-bold text-[var(--ag-dark)] dark:text-[var(--foreground)] group-hover:text-[var(--ag-red)] transition-colors text-center leading-tight block ${
                    isScrollable ? "line-clamp-2 h-9 whitespace-normal w-full" : "line-clamp-1"
                  }`}
                >
                  {cat.title}
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
