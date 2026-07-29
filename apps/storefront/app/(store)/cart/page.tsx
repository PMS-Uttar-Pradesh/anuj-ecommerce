import { getStoreSettings } from "@/lib/actions/settings";
import CartClient from "./CartClient";

export default async function CartPage() {
  const { freeDeliveryThreshold } = await getStoreSettings();
  return <CartClient freeDeliveryThreshold={freeDeliveryThreshold} />;
}