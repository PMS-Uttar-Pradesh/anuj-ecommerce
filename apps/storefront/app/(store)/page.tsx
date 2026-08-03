// apps/storefront/app/(store)/page.tsx
import HeroCarousel from "@/components/store/home/HeroCarousel";
import TrustBar from "@/components/store/home/TrustBar";
import CategoryGrid from "@/components/store/home/CategoryGrid";
import ProductCarousel from "@/components/store/home/ProductCarousel";
import PromoCards from "@/components/store/home/PromoCards";
import BudgetSection from "@/components/store/home/BudgetSection";
import InfiniteShowcase from "@/components/store/home/InfiniteShowcase";
import { getCategories } from "@/lib/actions/product-actions";
import prisma from "@/lib/prisma";
import { getStoreSettings } from "@/lib/actions/settings";

export default async function Home() {
  const currentDate = new Date();
  
  const [categories, activePromotions] = await Promise.all([
    getCategories(),
    prisma.promotion.findMany({
      where: {
        isActive: true,
        isDeleted: false,
        startDate: { lte: currentDate },
        endDate: { gte: currentDate },
      },
      orderBy: {
        displayOrder: "asc",
      },
    }),
  ]);

  const mappedCategories = categories.map((cat) => ({
    id: cat.id,
    title: cat.name,
    image: cat.imageUrl || "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=200&auto=format&fit=crop&q=80",
    href: `/collections/${cat.slug}`,
  }));

  // Map promotions to fetch target slugs
  const promotionsWithSlugs = await Promise.all(
    activePromotions.map(async (promo) => {
      let slug = "";
      if (promo.redirectType === "PRODUCT") {
        const prod = await prisma.product.findUnique({
          where: { id: promo.redirectId },
          select: { slug: true },
        });
        slug = prod?.slug || "";
      } else if (promo.redirectType === "CATEGORY") {
        const cat = await prisma.category.findUnique({
          where: { id: promo.redirectId },
          select: { slug: true },
        });
        slug = cat?.slug || "";
      }
      return {
        id: promo.id,
        title: promo.title,
        subtitle: promo.subtitle || "",
        imageUrl: promo.imageUrl,
        buttonText: promo.buttonText,
        redirectType: promo.redirectType,
        slug,
      };
    })
  );

  // Render a responsive grid of 9 columns if few categories, otherwise a scrollable 18-column track
  const columns = mappedCategories.length > 9 ? 18 : 9;

  const settings = await getStoreSettings();

  return (
    <div className="flex flex-col">
      {/* Hero Carousel Area */}
      <HeroCarousel promotions={promotionsWithSlugs} freeDeliveryThreshold={settings.freeDeliveryThreshold} />

      {/* 2. Trust Bar */}
      <TrustBar />

      {/* 3. Shop By Category */}
      <CategoryGrid
        title="Shop By Category"
        subtitle="Browse our curated collections of premium writing instruments, notebooks, and art tools."
        categories={mappedCategories}
        columns={columns}
      />

      {/* 4. Best Sellers Carousel */}
      <ProductCarousel
        title="Best Sellers"
        subtitle="Most loved and highly rated tools from our premium collection."
        collectionId="featured"
        limit={8}
      />

      {/* 6. Trending This Week */}
      <ProductCarousel
        title="Trending This Week"
        subtitle="Popular stationery items flying off the shelves."
        collectionId="trending"
        limit={6}
      />

      {/* 7. New Arrivals */}
      <ProductCarousel
        title="New Arrivals"
        subtitle="Fresh additions to our writing, office, and celebration catalogs."
        collectionId="new-arrivals"
        limit={6}
      />

      {/* 8. Offers & Deals */}
      <PromoCards />
      <BudgetSection />

      {/* 9. Customer Reviews (temporarily removed for launch) */}
      <section className="py-section bg-[#F8F7F4] dark:bg-neutral-950" aria-hidden="true">
        <div className="max-w-7xl mx-auto px-6 lg:px-8" />
      </section>

      {/* 10. Infinite Showcase Experience */}
      <InfiniteShowcase />

    </div>
  );
}