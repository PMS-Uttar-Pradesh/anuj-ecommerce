// apps/storefront/components/store/cart/CartItem.tsx
"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Trash2, Plus, Minus } from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import { PLACEHOLDER_IMAGE } from "@/lib/utils";

interface CartItemProps {
  item: {
    id: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
    variantName?: string;
    stock: number;
  };
}

export default function CartItemComponent({ item }: CartItemProps) {
  const { removeItem, increaseQuantity, decreaseQuantity } = useCartStore();

  return (
    <div className="flex gap-4 py-4 border-b border-[var(--ag-gray-200)] dark:border-neutral-800 last:border-b-0">
      {/* Product Image */}
      <div className="w-16 h-16 rounded-[var(--radius-md)] overflow-hidden border border-[var(--ag-gray-200)] dark:border-neutral-750 bg-[var(--ag-gray-100)] dark:bg-neutral-850 shrink-0">
        <Image
          src={item.image || PLACEHOLDER_IMAGE}
          alt={item.name}
          width={64}
          height={64}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Item info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-bold text-[var(--ag-dark)] dark:text-white truncate">
            {item.name}
          </h4>
          {item.variantName && (
            <p className="text-xs text-[var(--ag-gray-500)] dark:text-neutral-400 mt-0.5 font-semibold">
              Variant: {item.variantName}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          {/* Quantity stepper */}
          <div className="flex items-center border border-[var(--ag-gray-200)] dark:border-neutral-700 rounded-[var(--radius-lg)] overflow-hidden bg-[var(--ag-gray-100)] dark:bg-neutral-800 h-8">
            <button
              onClick={() => decreaseQuantity(item.id)}
              disabled={item.quantity <= 1}
              className="px-2.5 h-full flex items-center justify-center hover:bg-white dark:hover:bg-neutral-700 text-[var(--ag-gray-800)] dark:text-neutral-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              aria-label="Decrease quantity"
            >
              <Minus size={11} className="stroke-[2.5]" />
            </button>
            <motion.span
              key={item.quantity}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-2 text-xs font-black text-[var(--ag-dark)] dark:text-white min-w-[20px] text-center inline-block"
            >
              {item.quantity}
            </motion.span>
            <button
              onClick={() => increaseQuantity(item.id)}
              disabled={item.quantity >= item.stock}
              className="px-2.5 h-full flex items-center justify-center hover:bg-white dark:hover:bg-neutral-700 text-[var(--ag-gray-800)] dark:text-neutral-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              aria-label="Increase quantity"
            >
              <Plus size={11} className="stroke-[2.5]" />
            </button>
          </div>

          {/* Pricing & delete */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-black text-[var(--ag-dark)] dark:text-white">
              ₹{item.price * item.quantity}
            </span>
            <button
              onClick={() => removeItem(item.id)}
              className="text-[var(--ag-gray-500)] hover:text-[var(--ag-red)] dark:hover:text-[var(--ag-red)] p-1.5 rounded-lg hover:bg-[var(--ag-gray-100)] dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label="Remove item"
            >
              <Trash2 size={13} className="stroke-[2]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
