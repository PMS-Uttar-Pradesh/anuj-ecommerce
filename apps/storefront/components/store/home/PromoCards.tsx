// apps/storefront/components/store/home/PromoCards.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

interface PromoCard {
  image: string;
  categoryName: string;
  tagline: string;
  ctaText: string;
  href: string;
}

const promoCards: PromoCard[] = [
  {
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&auto=format&fit=crop&q=80",
    categoryName: "Writing Instruments",
    tagline: "Fountain pens, gel pens & fine liners",
    ctaText: "Shop Pens",
    href: "/collections/pens",
  },
  {
    image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600&auto=format&fit=crop&q=80",
    categoryName: "Journals & Notebooks",
    tagline: "Dotted, lined & thread-bound formats",
    ctaText: "Shop Notebooks",
    href: "/collections/notebooks",
  },
  {
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop&q=80",
    categoryName: "Art & Illustration",
    tagline: "Brush pens, watercolours & sketch tools",
    ctaText: "Shop Art",
    href: "/collections/art-supplies",
  },
];

export default function PromoCards() {
  return (
    <section className="py-12 bg-white dark:bg-neutral-900 select-none">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8 text-center md:text-left">
          <h2 className="text-xl sm:text-2xl font-display font-black text-[var(--ag-dark)] dark:text-[var(--foreground)] section-title-underline pb-1">
            Offers & Deals
          </h2>
          <p className="text-sm text-[var(--ag-gray-500)] mt-2 font-medium">
            Discover limited-time discounts and curated collections.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {promoCards.map((card, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.15)" }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="relative w-full aspect-[4/3] md:aspect-[3/4] lg:aspect-[4/3] rounded-[var(--radius-lg)] overflow-hidden bg-[var(--ag-gray-800)] group shadow-md"
            >
              {/* Background Image */}
              <Image
                src={card.image}
                alt=""
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-1.04"
                loading="lazy"
              />
              {/* Dark Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

              {/* Card Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 text-white z-10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--ag-yellow)] mb-1">
                  {card.tagline}
                </span>
                <h3 className="text-xl font-display font-black mb-4">
                  {card.categoryName}
                </h3>
                <div>
                  <Link
                    href={card.href}
                    className="inline-flex items-center justify-center px-4 py-2 border-2 border-white hover:bg-white hover:text-[var(--ag-dark)] text-white text-xs font-bold rounded-[var(--radius-sm)] transition-colors"
                  >
                    {card.ctaText}
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
