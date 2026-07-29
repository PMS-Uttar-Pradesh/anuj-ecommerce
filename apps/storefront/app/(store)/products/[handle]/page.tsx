import { getStoreSettings } from "@/lib/actions/settings";
import ProductDetailClient from "./ProductDetailClient";

interface PageProps {
  params: Promise<{ handle: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { freeDeliveryThreshold } = await getStoreSettings();
  return <ProductDetailClient params={params} freeDeliveryThreshold={freeDeliveryThreshold} />;
}
