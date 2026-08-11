// apps/storefront/app/(store)/page.tsx
import HeroCarousel from "@/components/store/home/HeroCarousel";
import TrustBar from "@/components/store/home/TrustBar";
import CategoryGrid from "@/components/store/home/CategoryGrid";
import ProductCarousel from "@/components/store/home/ProductCarousel";
import PromoCards from "@/components/store/home/PromoCards";
import BudgetSection from "@/components/store/home/BudgetSection";
import dynamic from "next/dynamic";
import { getCategories, getFeaturedProducts, getNewArrivals, getTrendingProducts } from "@/lib/actions/product-actions";
import prisma from "@/lib/prisma";
import { getStoreSettings } from "@/lib/actions/settings";

const InfiniteShowcase = dynamic(() => import("@/components/store/home/InfiniteShowcase"), {
  loading: () => <section className="h-[640px] bg-[#0F0F10]" aria-label="Creator's workspace" />,
});

export default async function Home() {
  const currentDate = new Date();
  
  const [
    categories,
    activePromotions,
    settings,
    featuredProducts,
    trendingProducts,
    newArrivalProducts,
  ] = await Promise.all([
    getCategories(),
    prisma.promotion
      .findMany({
        where: {
          isActive: true,
          isDeleted: false,
          startDate: { lte: currentDate },
          endDate: { gte: currentDate },
        },
        orderBy: {
          displayOrder: "asc",
        },
      })
      .catch((error) => {
        console.error("Error fetching active promotions:", error);
        return [];
      }),
    getStoreSettings(),
    getFeaturedProducts(8),
    getTrendingProducts(6),
    getNewArrivals(6),
  ]);

  const mappedCategories = categories.map((cat) => ({
    id: cat.id,
    title: cat.name,
    image: cat.imageUrl || "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=200&auto=format&fit=crop&q=80",
    href: `/collections/${cat.slug}`,
  }));

  // Map promotions to fetch target slugs
  const productRedirectIds = activePromotions
    .filter((promo) => promo.redirectType === "PRODUCT")
    .map((promo) => promo.redirectId);
  const categoryRedirectIds = activePromotions
    .filter((promo) => promo.redirectType === "CATEGORY")
    .map((promo) => promo.redirectId);

  const [promotionProducts, promotionCategories] = await Promise.all([
    productRedirectIds.length
      ? prisma.product.findMany({
          where: { id: { in: productRedirectIds } },
          select: { id: true, slug: true },
        })
      : [],
    categoryRedirectIds.length
      ? prisma.category.findMany({
          where: { id: { in: categoryRedirectIds } },
          select: { id: true, slug: true },
        })
      : [],
  ]);

  const productSlugById = new Map(promotionProducts.map((product) => [product.id, product.slug]));
  const categorySlugById = new Map(promotionCategories.map((category) => [category.id, category.slug]));

  const promotionsWithSlugs = activePromotions.map((promo) => ({
    id: promo.id,
    title: promo.title,
    subtitle: promo.subtitle || "",
    imageUrl: promo.imageUrl,
    buttonText: promo.buttonText,
    redirectType: promo.redirectType,
    slug:
      promo.redirectType === "PRODUCT"
        ? productSlugById.get(promo.redirectId) || ""
        : categorySlugById.get(promo.redirectId) || "",
  }));

  // Render a responsive grid of 9 columns if few categories, otherwise a scrollable 18-column track
  const columns = mappedCategories.length > 9 ? 18 : 9;

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
        initialProducts={featuredProducts}
      />

      {/* 6. Trending This Week */}
      <ProductCarousel
        title="Trending This Week"
        subtitle="Popular stationery items flying off the shelves."
        collectionId="trending"
        limit={6}
        initialProducts={trendingProducts}
      />

      {/* 7. New Arrivals */}
      <ProductCarousel
        title="New Arrivals"
        subtitle="Fresh additions to our writing, office, and celebration catalogs."
        collectionId="new-arrivals"
        limit={6}
        initialProducts={newArrivalProducts}
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
