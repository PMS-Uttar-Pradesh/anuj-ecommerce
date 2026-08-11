"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/lib/store/cart-store";
import { PLACEHOLDER_IMAGE } from "@/lib/utils";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Shield,
  Truck,
} from "lucide-react";

interface CartClientProps {
  freeDeliveryThreshold: number;
}

export default function CartClient({ freeDeliveryThreshold }: CartClientProps) {
  const items = useCartStore((state) => state.items);
  const increaseQuantity = useCartStore((state) => state.increaseQuantity);
  const decreaseQuantity = useCartStore((state) => state.decreaseQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const originalTotal = items.reduce(
    (sum, item) => sum + Math.round(item.price * 2.2) * item.quantity,
    0
  );
  const savings = originalTotal - subtotal;
  const delivery = subtotal >= freeDeliveryThreshold ? 0 : 49;
  const total = subtotal + delivery;

  return (
    <main
      className="min-h-screen"
      style={{ background: "linear-gradient(180deg, white 0%, var(--brand-cream) 100%)" }}
    >
      {/* Page Header */}
      <div
        className="border-b"
        style={{
          background: "white",
          borderColor: "#EAE4DD",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/products"
              className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-[var(--brand-coral)]"
              style={{ color: "var(--muted-foreground)" }}
            >
              <ArrowLeft size={15} />
              Continue Shopping
            </Link>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-black tracking-tight"
            style={{ color: "var(--brand-navy)" }}
          >
            Your Shopping Cart
            {items.length > 0 && (
              <span
                className="ml-2 text-base font-semibold"
                style={{ color: "var(--muted-foreground)" }}
              >
                ({items.length} {items.length === 1 ? "item" : "items"})
              </span>
            )}
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {items.length === 0 ? (
          /* ── Empty State ── */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-lg"
              style={{
                background: "linear-gradient(135deg, #F5F0EB, #EAE4DD)",
              }}
            >
              <ShoppingBag
                size={40}
                style={{ color: "var(--muted-foreground)", opacity: 0.5 }}
              />
            </div>
            <h2
              className="text-2xl font-black mb-2"
              style={{ color: "var(--brand-navy)" }}
            >
              Your cart is empty
            </h2>
            <p
              className="text-base mb-8 max-w-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              Looks like you haven&apos;t added anything yet. Explore our premium
              stationery collection!
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:-translate-y-0.5 hover:shadow-xl"
              style={{
                background: "linear-gradient(135deg, #E8442A, #C7321A)",
                boxShadow: "0 4px 20px rgba(232,68,42,0.35)",
              }}
            >
              <ShoppingBag size={16} />
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* ── Cart Items ── */}
            <div className="lg:col-span-2 space-y-4">
              {/* Free shipping progress */}
              {subtotal < freeDeliveryThreshold && (
                <div
                  className="rounded-2xl p-4 border"
                  style={{
                    background: "linear-gradient(135deg, #FFF8F6, #FFF0E8)",
                    borderColor: "rgba(232,68,42,0.15)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Truck size={14} style={{ color: "var(--brand-coral)" }} />
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "var(--brand-navy)" }}
                    >
                      Add{" "}
                      <span style={{ color: "var(--brand-coral)" }}>
                        ₹{freeDeliveryThreshold - subtotal}
                      </span>{" "}
                      more for FREE delivery!
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: "#EAE4DD" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min((subtotal / freeDeliveryThreshold) * 100, 100)}%`,
                        background:
                          "linear-gradient(90deg, #E8442A, #F5A623)",
                      }}
                    />
                  </div>
                </div>
              )}

              {subtotal >= freeDeliveryThreshold && (
                <div
                  className="rounded-2xl p-4 border flex items-center gap-3"
                  style={{
                    background: "#F0FDF4",
                    borderColor: "rgba(22,163,74,0.2)",
                  }}
                >
                  <Truck size={16} style={{ color: "#16A34A" }} />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "#15803D" }}
                  >
                    🎉 Congrats! You&apos;ve unlocked FREE delivery!
                  </span>
                </div>
              )}

              {/* Items list */}
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border bg-white p-5 flex gap-4 transition-all hover:shadow-md"
                  style={{ borderColor: "#EAE4DD" }}
                >
                  {/* Image */}
                  <Link href={`/products/${item.id}`}>
                    <div
                      className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0"
                      style={{ background: "#F9F6F3" }}
                    >
                      <Image
                        src={item.image || PLACEHOLDER_IMAGE}
                        alt={item.name}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3
                          className="font-bold text-sm leading-snug mb-0.5 truncate"
                          style={{ color: "var(--brand-navy)" }}
                        >
                          {item.name}
                        </h3>
                        <p
                          className="text-xs"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          Unit Price: ₹{item.price}
                        </p>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 rounded-lg transition-colors hover:bg-red-50 flex-shrink-0"
                        aria-label="Remove item"
                      >
                        <Trash2
                          size={15}
                          style={{ color: "var(--muted-foreground)" }}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity Stepper */}
                      <div
                        className="flex items-center gap-0 rounded-xl overflow-hidden border"
                        style={{ borderColor: "#EAE4DD" }}
                      >
                        <button
                          onClick={() => decreaseQuantity(item.id)}
                          className="w-8 h-8 flex items-center justify-center transition-colors hover:bg-[#F5F0EB]"
                          style={{ color: "var(--brand-navy)" }}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span
                          className="w-9 h-8 flex items-center justify-center text-sm font-bold border-x"
                          style={{
                            color: "var(--brand-navy)",
                            borderColor: "#EAE4DD",
                          }}
                        >
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => increaseQuantity(item.id)}
                          disabled={item.quantity >= item.stock}
                          className="w-8 h-8 flex items-center justify-center transition-colors hover:bg-[#F5F0EB] disabled:opacity-30 disabled:hover:bg-transparent"
                          style={{ color: "var(--brand-navy)" }}
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      {/* Line total */}
                      <div className="text-right">
                        <div
                          className="text-base font-black"
                          style={{ color: "var(--brand-coral)" }}
                        >
                          ₹{item.price * item.quantity}
                        </div>
                        {item.quantity > 1 && (
                          <div
                            className="text-xs"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            ₹{item.price} × {item.quantity}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Order Summary ── */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">


                {/* Summary card */}
                <div
                  className="rounded-2xl border p-5 bg-white"
                  style={{ borderColor: "#EAE4DD" }}
                >
                  <h2
                    className="text-base font-black mb-5"
                    style={{ color: "var(--brand-navy)" }}
                  >
                    Order Summary
                  </h2>

                  <div className="space-y-3 pb-4 border-b" style={{ borderColor: "#EAE4DD" }}>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "var(--muted-foreground)" }}>
                        Subtotal ({items.length} items)
                      </span>
                      <span
                        className="font-semibold"
                        style={{ color: "var(--brand-navy)" }}
                      >
                        ₹{subtotal}
                      </span>
                    </div>

                    {savings > 0 && (
                      <div className="flex justify-between text-sm">
                        <span style={{ color: "var(--muted-foreground)" }}>
                          You Save
                        </span>
                        <span className="font-semibold" style={{ color: "#16A34A" }}>
                          − ₹{savings}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span style={{ color: "var(--muted-foreground)" }}>
                        Delivery
                      </span>
                      <span
                        className="font-semibold"
                        style={{ color: delivery === 0 ? "#16A34A" : "var(--brand-navy)" }}
                      >
                        {delivery === 0 ? "FREE" : `₹${delivery}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-4">
                    <span
                      className="font-bold"
                      style={{ color: "var(--brand-navy)" }}
                    >
                      Total
                    </span>
                    <div className="text-right">
                      <div
                        className="text-xl font-black"
                        style={{ color: "var(--brand-coral)" }}
                      >
                        ₹{total}
                      </div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        Incl. all taxes
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/checkout"
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
                    style={{
                      background: "linear-gradient(135deg, #E8442A, #C7321A)",
                      boxShadow: "0 4px 20px rgba(232,68,42,0.35)",
                    }}
                  >
                    Proceed to Checkout
                    <ArrowRight size={16} />
                  </Link>

                  {/* Trust signals */}
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <div
                      className="flex items-center gap-1.5 text-xs"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      <Shield size={12} style={{ color: "#16A34A" }} />
                      Secure Checkout
                    </div>
                    <div
                      className="flex items-center gap-1.5 text-xs"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      <Truck size={12} style={{ color: "#16A34A" }} />
                      Fast Delivery
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
