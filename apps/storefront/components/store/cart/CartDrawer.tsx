// apps/storefront/components/store/cart/CartDrawer.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, ShoppingBag, Truck, Plus, Sparkles } from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import { useUIStore } from "@/components/store/ui-store";
import CartItemComponent from "./CartItem";
import { useRouter } from "next/navigation";
import { getProducts } from "@/lib/actions/product-actions";
import { StorefrontProduct } from "../products/ProductCard";
import { PLACEHOLDER_IMAGE } from "@/lib/utils";

export default function CartDrawer({ freeDeliveryThreshold = 999 }: { freeDeliveryThreshold?: number }) {
  const router = useRouter();
  const { isCartOpen, setCartOpen } = useUIStore();
  const { items, addItem } = useCartStore();
  const drawerRef = useRef<HTMLDivElement>(null);

  const [recommended, setRecommended] = useState<StorefrontProduct[]>([]);

  const cartCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

  const threshold = freeDeliveryThreshold;
  const isFreeShipping = subtotal >= threshold;
  const remaining = threshold - subtotal;
  const progress = Math.min((subtotal / threshold) * 100, 100);

  // Load recommended products that are not currently in the cart
  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const products = (await getProducts()) as StorefrontProduct[];
        const cartItemNames = items.map((i) => i.name.toLowerCase());
        const filtered = (products || []).filter(
          (p) => !cartItemNames.some((name) => p.name.toLowerCase().includes(name) || name.includes(p.name.toLowerCase()))
        );
        setRecommended(filtered.slice(0, 3));
      } catch (err) {
        console.error(err);
      }
    };
    if (isCartOpen) {
      fetchRecs();
    }
  }, [isCartOpen, items]);

  // Close drawer on escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCartOpen) {
        setCartOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen, setCartOpen]);

  // Focus trap inside drawer
  useEffect(() => {
    if (isCartOpen && drawerRef.current) {
      const focusableElements = drawerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex="0"]'
      );
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [isCartOpen]);

  const handleCheckout = () => {
    setCartOpen(false);
    router.push("/checkout");
  };

  const handleAddRecommend = (prod: StorefrontProduct) => {
    addItem({
      id: prod.id,
      name: prod.name,
      price: prod.price,
      image: prod.images.find(i => i.isPrimary)?.url || prod.images[0]?.url || "",
      quantity: 1,
      stock: prod.variants[0]?.stock || 0,
    });
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-[200] overflow-hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            onClick={() => setCartOpen(false)}
          />

          {/* Drawer content */}
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <motion.div
              ref={drawerRef}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 260 }}
              className="w-screen max-w-[440px] bg-card text-card-foreground border-l border-border flex flex-col shadow-2xl relative"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-[var(--ag-gray-200)] dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={20} className="text-foreground stroke-[2.5]" />
                  <span className="font-display font-extrabold text-lg text-foreground">
                    Your Cart ({cartCount} {cartCount === 1 ? "item" : "items"})
                  </span>
                </div>
                <button
                  onClick={() => setCartOpen(false)}
                  className="p-2 -mr-2 rounded-lg hover:bg-[var(--ag-gray-100)] dark:hover:bg-neutral-800 text-[var(--ag-gray-800)] dark:text-neutral-300 transition-colors cursor-pointer"
                  aria-label="Close cart"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Free Shipping Progress */}
              {cartCount > 0 && (
                <div className="px-6 py-4.5 bg-[var(--ag-gray-100)] dark:bg-neutral-900 border-b border-[var(--ag-gray-200)] dark:border-neutral-800">
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    {isFreeShipping ? (
                      <motion.span
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-emerald-600 dark:text-emerald-500 flex items-center gap-1 font-black"
                      >
                        🎉 FREE SHIPPING UNLOCKED!
                      </motion.span>
                    ) : (
                      <span className="text-[var(--ag-gray-800)] dark:text-neutral-300">
                        Add <span className="font-black text-[var(--ag-red)]">₹{remaining}</span> more to unlock FREE shipping
                      </span>
                    )}
                    <span className="text-[var(--ag-gray-500)] font-semibold">Threshold: ₹{threshold}</span>
                  </div>
                  
                  {/* Slider Progress Bar */}
                  <div className="w-full h-2 bg-gray-200 dark:bg-neutral-800 rounded-full relative overflow-visible mt-3">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[var(--ag-red)] to-[var(--ag-red-hover)] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                    {/* Floating Sliding Truck */}
                    {progress > 0 && progress < 100 && (
                      <motion.div
                        className="absolute -top-1.5 -translate-x-1/2 p-0.5 rounded-full bg-white dark:bg-neutral-900 border border-[var(--ag-red)] shadow-md text-[var(--ag-red)]"
                        animate={{ left: `${progress}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      >
                        <Truck size={10} className="stroke-[2.5]" />
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-none">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-[var(--ag-gray-100)] dark:bg-neutral-800 flex items-center justify-center mb-4 text-[var(--ag-gray-500)]">
                      <ShoppingBag size={28} />
                    </div>
                    <h3 className="font-black text-base text-[var(--ag-dark)] dark:text-white mb-1">
                      Your cart is empty
                    </h3>
                    <p className="text-xs text-[var(--ag-gray-500)] dark:text-neutral-400 mb-6 max-w-[280px] font-semibold">
                      Add items to your cart to see them here. Free delivery above ₹{threshold}!
                    </p>
                    <button
                      onClick={() => setCartOpen(false)}
                      className="px-6 py-2.5 bg-[var(--ag-red)] text-white text-sm font-black rounded-[var(--radius-lg)] hover:bg-[var(--ag-red-hover)] transition-all cursor-pointer"
                    >
                      Continue Shopping
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {/* Item list container */}
                    <div className="divide-y divide-[var(--ag-gray-200)] dark:divide-neutral-800">
                      <AnimatePresence initial={false}>
                        {items.map((item) => (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <CartItemComponent item={item} />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    {/* Recommended products upsell */}
                    {recommended.length > 0 && (
                      <div className="mt-2 bg-[var(--ag-gray-100)] dark:bg-neutral-900 border border-[var(--ag-gray-200)] dark:border-neutral-800 rounded-[var(--radius-xl)] p-4">
                        <div className="flex items-center gap-1.5 text-xs font-black text-[var(--ag-dark)] dark:text-white mb-3 tracking-tight">
                          <Sparkles size={13} className="text-[var(--ag-yellow)] stroke-[2.5]" />
                          STATIONERY YOU MIGHT LOVE
                        </div>
                        <div className="flex flex-col gap-3">
                          {recommended.map((prod) => (
                            <div
                              key={prod.id}
                            className="flex items-center justify-between gap-3 bg-card text-card-foreground border border-border p-2.5 rounded-[var(--radius-lg)] shadow-xs hover:border-[var(--ag-red)]/30 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <Image
                                  src={prod.images.find(i => i.isPrimary)?.url || prod.images[0]?.url || PLACEHOLDER_IMAGE}
                                  alt=""
                                  width={40}
                                  height={40}
                                  className="w-10 h-10 object-cover rounded-[var(--radius-md)] border border-[var(--ag-gray-200)] dark:border-neutral-850 shrink-0 bg-[var(--ag-gray-100)] dark:bg-neutral-800"
                                />
                                <div className="min-w-0">
                                  <h5 className="text-xs font-bold text-foreground truncate">
                                    {prod.name}
                                  </h5>
                                  <p className="text-[10px] font-black text-[var(--ag-red)]">
                                    ₹{prod.price}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleAddRecommend(prod)}
                                className="p-1.5 rounded-full bg-[var(--ag-red)] hover:bg-[var(--ag-red-hover)] text-white shadow-xs transition-all cursor-pointer"
                                title="Add to Cart"
                              >
                                <Plus size={12} className="stroke-[3]" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer Checkout details */}
              {items.length > 0 && (
                <div className="border-t border-border p-6 bg-card text-card-foreground shrink-0 shadow-inner">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-[var(--ag-gray-500)] dark:text-neutral-400">
                      Subtotal
                    </span>
                    <span className="text-xl font-extrabold text-[var(--ag-dark)] dark:text-white">
                      ₹{subtotal}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-4 text-xs font-bold">
                    <span className="text-[var(--ag-gray-500)] dark:text-neutral-400">Shipping</span>
                    <span className={isFreeShipping ? "text-emerald-500" : "text-[var(--ag-dark)] dark:text-white"}>
                      {isFreeShipping ? "FREE" : "₹49"}
                    </span>
                  </div>

                  <p className="text-[11px] text-[var(--ag-gray-500)] dark:text-neutral-400 mb-4 leading-normal text-center font-medium">
                    Taxes and shipping charges calculated at checkout.
                  </p>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleCheckout}
                      className="w-full py-4 bg-[var(--ag-red)] hover:bg-[var(--ag-red-hover)] text-white font-black rounded-[var(--radius-lg)] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm select-none cursor-pointer"
                    >
                      PROCEED TO CHECKOUT
                    </button>
                    <button
                      onClick={() => setCartOpen(false)}
                      className="w-full py-3 bg-transparent border border-[var(--ag-gray-200)] dark:border-neutral-800 text-[var(--ag-dark)] dark:text-white font-black text-xs rounded-[var(--radius-lg)] hover:bg-[var(--ag-gray-100)] dark:hover:bg-neutral-800 transition-all select-none cursor-pointer"
                    >
                      CONTINUE SHOPPING
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
