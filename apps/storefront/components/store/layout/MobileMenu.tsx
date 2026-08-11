// apps/storefront/components/store/layout/MobileMenu.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, ShoppingBag, User, Home, Package, MapPin, LogOut } from "lucide-react";
import { useUIStore } from "@/components/store/ui-store";
import { useCartStore } from "@/lib/store/cart-store";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/store/ui/ThemeToggle";
import { useAuthStore } from "@/lib/store/auth-store";
import { logout } from "@/lib/actions/auth/logout";
import { createClient } from "@/lib/supabase/client";

interface SubCategory {
  title: string;
  href: string;
}

interface NavItem {
  title: string;
  href: string;
  subcategories?: SubCategory[];
}

interface MobileMenuProps {
  categories: any[];
}

export default function MobileMenu({ categories = [] }: MobileMenuProps) {
  const navItems: NavItem[] = [
    { title: "Home", href: "/" },
    { title: "All Products", href: "/products" },
    ...(categories.length > 0
      ? [
          {
            title: "Categories",
            href: "#",
            subcategories: categories.map((cat: any) => ({
              title: cat.name,
              href: `/collections/${cat.slug}`,
            })),
          },
        ]
      : []),
    { title: "Best Sellers", href: "/collections/best-sellers" },
  ];

  const { isMobileMenuOpen, setMobileMenuOpen, setCartOpen } = useUIStore();
  const items = useCartStore((state) => state.items);
  const cartCount = items.reduce((total, item) => total + item.quantity, 0);
  const { user, isAuthenticated } = useAuthStore();

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Lock scroll when open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  const openCart = () => {
    setMobileMenuOpen(false);
    setCartOpen(true);
  };

  return (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[250] md:hidden flex" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "-100vw" }}
            animate={{ x: 0 }}
            exit={{ x: "-100vw" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="w-full max-w-[320px] bg-white dark:bg-neutral-900 h-full relative z-10 flex flex-col shadow-2xl border-r border-transparent dark:border-neutral-800"
          >
            {/* Header */}
            <div className="p-4 border-b border-[var(--ag-gray-200)] dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-neutral-900">
              <div className="flex items-center gap-2">
                <Image src="/logo.jpg" alt="Personal Marketing Store Logo" width={64} height={32} className="h-8 w-auto object-contain" />
                <span className="font-display font-black text-sm leading-tight tracking-tight text-[var(--ag-dark)] dark:text-[var(--foreground)]">
                  Personal Marketing<br/>Store
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <ThemeToggle />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-[var(--ag-gray-100)] dark:hover:bg-neutral-800 text-[var(--ag-gray-800)] dark:text-[var(--foreground)]"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>
            </div>


            {/* Navigation List */}
            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-white dark:bg-neutral-900">
              {navItems.map((item, index) => {
                const hasSubs = item.subcategories && item.subcategories.length > 0;
                const isExpanded = expandedIndex === index;

                return (
                  <div key={item.title} className="border-b border-[var(--ag-gray-100)] dark:border-neutral-800 pb-1 last:border-0">
                    <div className="flex items-center justify-between">
                      {hasSubs ? (
                        <button
                          onClick={() => toggleExpand(index)}
                          className="w-full flex items-center justify-between text-left py-3 px-2 rounded-lg hover:bg-[var(--ag-gray-100)] dark:hover:bg-neutral-800 font-semibold text-sm text-[var(--ag-dark)] dark:text-[var(--foreground)] transition-colors"
                        >
                          <span>{item.title}</span>
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown size={16} />
                          </motion.div>
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          onClick={handleLinkClick}
                          className="w-full block py-3 px-2 rounded-lg hover:bg-[var(--ag-gray-100)] dark:hover:bg-neutral-800 font-semibold text-sm text-[var(--ag-dark)] dark:text-[var(--foreground)] transition-colors"
                        >
                          {item.title}
                        </Link>
                      )}
                    </div>

                    {/* Subcategories Accordion */}
                    <AnimatePresence initial={false}>
                      {hasSubs && isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden bg-[var(--ag-gray-100)] dark:bg-neutral-800 rounded-lg mt-1 ml-2"
                        >
                          <div className="py-2 px-3 flex flex-col gap-2">
                            {item.subcategories!.map((sub) => (
                              <Link
                                key={sub.title}
                                href={sub.href}
                                onClick={handleLinkClick}
                                className="py-1.5 px-2 text-xs font-semibold text-[var(--ag-gray-800)] dark:text-[var(--ag-gray-300)] hover:text-[var(--ag-red)] transition-colors"
                              >
                                {sub.title}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {/* Dynamic Account Sections in Mobile Drawer */}
              {isAuthenticated && user ? (
                <div className="border-b border-[var(--ag-gray-100)] dark:border-neutral-800 pb-1">
                  <button
                    onClick={() => toggleExpand(999)}
                    className="w-full flex items-center justify-between text-left py-3 px-2 rounded-lg hover:bg-[var(--ag-gray-100)] dark:hover:bg-neutral-800 font-semibold text-sm text-[var(--ag-dark)] dark:text-[var(--foreground)] transition-colors"
                  >
                    <span>My Account</span>
                    <motion.div
                      animate={{ rotate: expandedIndex === 999 ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={16} />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {expandedIndex === 999 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden bg-[var(--ag-gray-100)] dark:bg-neutral-800 rounded-lg mt-1 ml-2"
                      >
                        <div className="py-2 px-3 flex flex-col gap-2">
                          <Link
                            href="/account/profile"
                            onClick={handleLinkClick}
                            className="py-1.5 px-2 text-xs font-semibold text-[var(--ag-gray-800)] dark:text-[var(--ag-gray-300)] hover:text-[var(--ag-red)] transition-colors flex items-center gap-2"
                          >
                            <User size={14} className="text-[var(--ag-gray-500)]" />
                            <span>My Profile</span>
                          </Link>
                          <Link
                            href="/account/orders"
                            onClick={handleLinkClick}
                            className="py-1.5 px-2 text-xs font-semibold text-[var(--ag-gray-800)] dark:text-[var(--ag-gray-300)] hover:text-[var(--ag-red)] transition-colors flex items-center gap-2"
                          >
                            <Package size={14} className="text-[var(--ag-gray-500)]" />
                            <span>My Orders</span>
                          </Link>
                          <Link
                            href="/account/addresses"
                            onClick={handleLinkClick}
                            className="py-1.5 px-2 text-xs font-semibold text-[var(--ag-gray-800)] dark:text-[var(--ag-gray-300)] hover:text-[var(--ag-red)] transition-colors flex items-center gap-2"
                          >
                            <MapPin size={14} className="text-[var(--ag-gray-500)]" />
                            <span>Addresses</span>
                          </Link>
                          <button
                            onClick={async () => {
                              handleLinkClick();
                              const supabase = createClient();
                              await supabase.auth.signOut();
                              await logout();
                            }}
                            className="py-1.5 px-2 text-xs font-semibold text-[var(--ag-red)] hover:bg-[var(--ag-red)]/5 rounded-lg transition-colors flex items-center gap-2 w-full text-left cursor-pointer"
                          >
                            <LogOut size={14} />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="pt-2 grid grid-cols-2 gap-2">
                  <Link
                    href="/account/login"
                    onClick={handleLinkClick}
                    className="w-full block text-center py-2.5 px-4 bg-[var(--ag-red)] hover:bg-[var(--ag-red-hover)] text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                  >
                    Login
                  </Link>
                  <Link
                    href="/account/register"
                    onClick={handleLinkClick}
                    className="w-full block text-center py-2.5 px-4 border border-[var(--ag-gray-200)] dark:border-neutral-700 text-[var(--ag-dark)] dark:text-[var(--foreground)] font-bold text-xs rounded-xl transition-all"
                  >
                    Register
                  </Link>
                </div>
              )}
            </nav>

            {/* Bottom Strip Action Bar */}
            <div className="border-t border-[var(--ag-gray-200)] dark:border-neutral-800 p-4 bg-[var(--ag-gray-100)] dark:bg-neutral-800 flex items-center justify-around">
              <Link
                href="/"
                onClick={handleLinkClick}
                className="flex flex-col items-center gap-1 text-[var(--ag-gray-800)] dark:text-[var(--foreground)] hover:text-[var(--ag-red)] transition-colors"
                aria-label="Home"
              >
                <Home size={20} />
                <span className="text-[10px] font-bold">Home</span>
              </Link>
              <button
                onClick={openCart}
                className="flex flex-col items-center gap-1 text-[var(--ag-gray-800)] dark:text-[var(--foreground)] hover:text-[var(--ag-red)] transition-colors relative"
                aria-label="Cart"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 right-2 bg-[var(--ag-red)] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
                <span className="text-[10px] font-bold">Cart</span>
              </button>
              {isAuthenticated && user ? (
                <Link
                  href="/account/profile"
                  onClick={handleLinkClick}
                  className="flex flex-col items-center gap-1 text-[var(--ag-gray-800)] dark:text-[var(--foreground)] hover:text-[var(--ag-red)] transition-colors"
                  aria-label="Account"
                >
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-extrabold shadow-xs" style={{ background: "linear-gradient(135deg, var(--ag-red), var(--ag-yellow))" }}>
                    {user.user_metadata?.first_name ? user.user_metadata.first_name[0].toUpperCase() : user.email?.[0].toUpperCase() || "U"}
                  </div>
                  <span className="text-[10px] font-bold">Account</span>
                </Link>
              ) : (
                <Link
                  href="/account/login"
                  onClick={handleLinkClick}
                  className="flex flex-col items-center gap-1 text-[var(--ag-gray-800)] dark:text-[var(--foreground)] hover:text-[var(--ag-red)] transition-colors"
                  aria-label="Account"
                >
                  <User size={20} />
                  <span className="text-[10px] font-bold">Account</span>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
