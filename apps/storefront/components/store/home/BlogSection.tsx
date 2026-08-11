// apps/storefront/components/store/home/BlogSection.tsx
"use client";

import Link from "next/link";
import Image from "next/image";

interface BlogPost {
  id: string;
  category: string;
  title: string;
  date: string;
  image: string;
  href: string;
}

const blogPosts: BlogPost[] = [
  {
    id: "post-1",
    category: "Writing Tips",
    title: "How Hi-Tecpoint needle-point pens improve handwriting speeds",
    date: "June 12, 2026",
    image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80",
    href: "/",
  },
  {
    id: "post-2",
    category: "Paper Science",
    title: "Understanding GSM: What paper thickness is best for your fountain pen?",
    date: "May 28, 2026",
    image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600&auto=format&fit=crop&q=80",
    href: "/",
  },
  {
    id: "post-3",
    category: "Luxe Journaling",
    title: "A beginner's guide to bullet journaling: layout, logs, and materials",
    date: "May 15, 2026",
    image: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&auto=format&fit=crop&q=80",
    href: "/",
  },
  {
    id: "post-4",
    category: "Art Inspiration",
    title: "Tombow vs. Sakura: Which brush pens reign supreme for illustration?",
    date: "April 30, 2026",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&auto=format&fit=crop&q=80",
    href: "/",
  },
];

export default function BlogSection() {
  return (
    <section className="py-12 bg-[var(--ag-gray-100)] select-none">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mb-8 text-center md:text-left">
          <h2 className="text-xl sm:text-2xl font-display font-black text-[var(--ag-dark)] section-title-underline pb-1">
            Stationery Blog
          </h2>
          <p className="text-sm text-[var(--ag-gray-500)] mt-2 font-medium">
            Discover tips, paper comparisons, and inspiration from our writing experts.
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blogPosts.map((post) => (
            <Link
              key={post.id}
              href={post.href}
              className="group bg-white dark:bg-[#1E1E1E] border border-[var(--ag-gray-200)] rounded-[var(--radius-lg)] overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col sm:flex-row h-full"
            >
              {/* Image side */}
              <div className="w-full sm:w-2/5 aspect-[16/9] sm:aspect-auto sm:min-h-[160px] overflow-hidden bg-[var(--ag-gray-100)] relative shrink-0">
                <Image
                  src={post.image}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 40vw, 100vw"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-1.04"
                  loading="lazy"
                />
              </div>

              {/* Text side */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  {/* Category chip */}
                  <span className="inline-block bg-[var(--ag-red)]/10 text-[var(--ag-red)] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mb-2">
                    {post.category}
                  </span>
                  
                  {/* Title */}
                  <h3 className="text-sm font-bold text-[var(--ag-dark)] group-hover:text-[var(--ag-red)] transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </h3>
                </div>

                <div className="flex items-center justify-between border-t border-[var(--ag-gray-100)] pt-3 mt-4 shrink-0">
                  <span className="text-[10px] text-[var(--ag-gray-500)] font-semibold">
                    {post.date}
                  </span>
                  <span className="text-[11px] font-bold text-[var(--ag-red)] group-hover:underline flex items-center gap-1">
                    Read More →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
