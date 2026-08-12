/**
 * AuthProvider.tsx
 *
 * Top-level client component that initializes the Zustand auth store
 * on mount. Place this in the root layout (or store layout) to ensure
 * the auth state is hydrated as early as possible.
 *
 * Updates to automatically sync and merge guest carts to the DB.
 */
"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import { useCartStore } from "@/lib/store/cart-store";
import { mergeCartAction, fetchDbCart } from "@/lib/actions/cart";
import { createClient } from "@/lib/supabase/client";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialize = useAuthStore((s) => s.initialize);
  const { isAuthenticated, loading } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    initialize().then((unsubscribe) => {
      cleanup = unsubscribe;
    });

    return () => {
      cleanup?.();
    };
  }, [initialize]);

  // Synchronize auth state and refresh router cache on navigation changes (e.g., Server Action redirect)
  useEffect(() => {
    const syncSession = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const currentStoreUser = useAuthStore.getState().user;

      if (session?.user?.id !== currentStoreUser?.id) {
        useAuthStore.setState({
          user: session?.user ?? null,
          isAuthenticated: !!session?.user,
          loading: false,
        });
        router.refresh();
      }
    };

    syncSession();
  }, [pathname, router]);

  // Synchronize cart database state on auth changes
  useEffect(() => {
    if (loading) return;

    const syncUserData = async () => {
      const cartStore = useCartStore.getState();
      if (isAuthenticated) {
        try {
          const currentUserId = useAuthStore.getState().user?.id || null;

          // If the store thinks the cart belongs to a different user, reconcile
          if (cartStore.userId !== currentUserId) {
            // Capture a snapshot of local cart for merge and the current localVersion
            const guestCartItems = cartStore.items;
            const snapshotVersion = useCartStore.getState().localVersion || 0;

            if (cartStore.userId === null) {
              // Guest -> user: merge guest cart into DB
              try {
                const merged = await mergeCartAction(guestCartItems);
                const currentVersion = useCartStore.getState().localVersion || 0;
                // Only apply DB authoritative result if no newer local change happened during merge
                if (currentVersion === snapshotVersion) {
                  cartStore.setCartItems(merged);
                } else {
                  // Newer local changes exist; request a sync to persist latest to DB
                  await cartStore.requestSync();
                }
                cartStore.setUserId(currentUserId);
              } catch (err) {
                console.error("[AuthProvider] mergeCartAction failed:", err);
                // Do not overwrite local cart on merge failure; set userId so UX reflects authentication state
                cartStore.setUserId(currentUserId);
                // Optionally try to push local state
                await cartStore.requestSync().catch(() => {});
              }
            } else {
              // The cart in store belonged to another user (rare). Fetch server cart, but don't overwrite newer local changes.
              try {
                const snapshot = useCartStore.getState().localVersion || 0;
                const dbItems = await fetchDbCart();
                const currentVersion = useCartStore.getState().localVersion || 0;
                if (currentVersion === snapshot) {
                  cartStore.setCartItems(dbItems);
                } else {
                  // Local changes exist; ensure they are synced to DB
                  await cartStore.requestSync();
                }
                cartStore.setUserId(currentUserId);
              } catch (err) {
                console.error("[AuthProvider] fetchDbCart failed:", err);
                // don't clear or overwrite local cart on error
                cartStore.setUserId(currentUserId);
              }
            }
          } else {
            // Same user; optionally refresh DB state but avoid overwriting newer local changes
            try {
              const snapshot = useCartStore.getState().localVersion || 0;
              const dbItems = await fetchDbCart();
              const currentVersion = useCartStore.getState().localVersion || 0;
              if (currentVersion === snapshot) {
                cartStore.setCartItems(dbItems);
              } else {
                // don't overwrite; ensure current state persisted
                await cartStore.requestSync();
              }
            } catch (err) {
              console.error("[AuthProvider] refresh fetchDbCart failed:", err);
            }
          }
        } catch (err) {
          console.error("[AuthProvider] Data sync failed:", err);
        }
      } else {
        // Reset state on logout
        // Only clear if the cart currently belongs to a logged-in user
        if (cartStore.userId !== null) {
          cartStore.setCartItems([]);
          cartStore.setUserId(null);
        }
      }
    };

    syncUserData();
  }, [isAuthenticated, loading]);

  return <>{children}</>;
}
