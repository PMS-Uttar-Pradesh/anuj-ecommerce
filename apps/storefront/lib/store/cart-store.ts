import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./auth-store";
import { syncCartAction } from "@/lib/actions/cart";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
}

interface CartStore {
  items: CartItem[];
  userId: string | null;
  // localVersion increments for each local user action (optimistic update)
  localVersion?: number;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  increaseQuantity: (id: string) => Promise<void>;
  decreaseQuantity: (id: string) => Promise<void>;
  setCartItems: (items: CartItem[]) => void;
  setUserId: (userId: string | null) => void;
  // requestSync enqueues a sync of the current client state to the DB without modifying localVersion
  requestSync: () => Promise<void>;
}

// Module-level serialized sync queue to avoid concurrent DB races
let _syncQueue: Promise<void> = Promise.resolve();

// Incrementing local version counter used to detect stale DB responses
let _globalRequestId = 0;

async function enqueueSync(itemsSnapshot: CartItem[], capturedLocalVersion: number) {
  const { isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated) return;

  // Chain syncs so DB operations run sequentially in the order they were requested
  _syncQueue = _syncQueue.then(async () => {
    try {
      // Call server action to sync
      const dbItems = await syncCartAction(itemsSnapshot);

      // Only apply DB authoritative response if no newer local change happened
      const currentLocalVersion = useCartStore.getState().localVersion || 0;
      if (currentLocalVersion === capturedLocalVersion) {
        // Safe to apply authoritative DB state
        useCartStore.setState({ items: dbItems });
      } else {
        // Newer local changes exist; do not overwrite. Those changes will enqueue their own syncs.
        console.debug("[cart-store] Ignoring stale DB response due to newer local changes.");
      }
    } catch (err) {
      // Don't clear or overwrite local cart on DB errors. Keep optimistic UI intact.
      console.error("[cart-store] Failed to sync cart with DB:", err);
    }
  });

  return _syncQueue;
}

async function syncDb(items: CartItem[], set: (state: Partial<CartStore>) => void) {
  // kept for compatibility; delegate to enqueueSync using current localVersion snapshot
  const localVersion = useCartStore.getState().localVersion || 0;
  return enqueueSync(items, localVersion);
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      userId: null,
      localVersion: 0,

      setCartItems: (items) => set({ items }),
      setUserId: (userId) => set({ userId }),

      requestSync: async () => {
        // enqueue a sync of the current items without changing localVersion
        const itemsSnapshot = get().items;
        const snapshotVersion = get().localVersion || 0;
        await enqueueSync(itemsSnapshot, snapshotVersion);
      },

      addItem: async (item) => {
        // optimistic update + bump localVersion
        const newState = get();
        const currentItems = newState.items;
        const existingItem = currentItems.find((i) => i.id === item.id);
        let newItems: CartItem[];

        if (existingItem) {
          const totalQty = existingItem.quantity + item.quantity;
          if (totalQty > item.stock) {
            alert(`Only ${item.stock} units available.`);
            return;
          }
          newItems = currentItems.map((i) =>
            i.id === item.id ? { ...i, quantity: totalQty } : i
          );
        } else {
          if (item.quantity > item.stock) {
            alert(`Only ${item.stock} units available.`);
            return;
          }
          newItems = [...currentItems, item];
        }

        // increment localVersion and set optimistic state
        set((s: any) => {
          const next = (s.localVersion || 0) + 1;
          return { items: newItems, localVersion: next };
        });

        const snapshotVersion = get().localVersion || 0;
        await enqueueSync(newItems, snapshotVersion);
      },

      removeItem: async (id) => {
        const currentItems = get().items;
        const newItems = currentItems.filter((item) => item.id !== id);

        set((s: any) => {
          const next = (s.localVersion || 0) + 1;
          return { items: newItems, localVersion: next };
        });

        const snapshotVersion = get().localVersion || 0;
        await enqueueSync(newItems, snapshotVersion);
      },

      increaseQuantity: async (id) => {
        const item = get().items.find((i) => i.id === id);
        if (!item) return;

        if (item.quantity >= item.stock) {
          alert(`Only ${item.stock} units available.`);
          return;
        }

        const newItems = get().items.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + 1 } : item
        );

        set((s: any) => {
          const next = (s.localVersion || 0) + 1;
          return { items: newItems, localVersion: next };
        });

        const snapshotVersion = get().localVersion || 0;
        await enqueueSync(newItems, snapshotVersion);
      },

      decreaseQuantity: async (id) => {
        const newItems = get().items.map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(1, item.quantity - 1) }
            : item
        );

        set((s: any) => {
          const next = (s.localVersion || 0) + 1;
          return { items: newItems, localVersion: next };
        });

        const snapshotVersion = get().localVersion || 0;
        await enqueueSync(newItems, snapshotVersion);
      },
    }),
    {
      name: "kapi-cart",
    }
  )
);