// apps/storefront/components/store/home/TrustBar.tsx
import { ShieldCheck, Truck, CreditCard, RotateCcw } from "lucide-react";

import { getStoreSettings } from "@/lib/actions/settings";

interface TrustItem {
  icon: React.ComponentType<{ size?: string | number; className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
}

export default async function TrustBar() {
  const settings = await getStoreSettings();

  const trustItems: TrustItem[] = [
    {
      icon: ShieldCheck,
      title: "100% Genuine Products",
      description: "Sourced directly from global brands",
    },
    {
      icon: Truck,
      title: "Fast Delivery Across India",
      description: `Free shipping on orders above ₹${settings.freeDeliveryThreshold}`,
    },
    {
      icon: CreditCard,
      title: "Secure Payments",
      description: "UPI, Cards, and Net Banking protected",
    },
    {
      icon: RotateCcw,
      title: "Easy Returns",
      description: "7-day hassle free replacement policy",
    },
  ];

  return (
    <section
      className="w-full bg-white dark:bg-neutral-900 border-b border-[var(--ag-gray-200)] dark:border-neutral-800 select-none"
      aria-label="Trust signals"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x-0 lg:divide-x divide-[var(--ag-gray-200)] dark:divide-neutral-800">
          {trustItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-3.5 py-5 px-6 first:pl-0 last:pr-0"
              >
                <Icon
                  size={18}
                  strokeWidth={1.75}
                  className="text-[var(--ag-gray-500)] dark:text-neutral-500 shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[var(--ag-dark)] dark:text-[var(--foreground)] leading-tight mb-0.5">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-[var(--ag-gray-500)] dark:text-neutral-500 leading-snug">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
