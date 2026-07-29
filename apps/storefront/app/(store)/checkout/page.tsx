import { getStoreSettings } from "@/lib/actions/settings";
import CheckoutClient from "./CheckoutClient";

export default async function CheckoutPage() {
  const { freeDeliveryThreshold } = await getStoreSettings();
  return <CheckoutClient freeDeliveryThreshold={freeDeliveryThreshold} />;
}
