import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const CART_STORE_VERSION = 2;
export const MAX_QUANTITY_PER_LINE = 10;
export const MAX_CART_LINES = 20;

export interface CartItemReference {
  variantId: string;
  quantity: number;
}

// Backward-compatible alias
export type CartItem = CartItemReference;

export type AddItemInput = string | { variantId: string; [key: string]: unknown };

export interface CartState {
  items: CartItemReference[];
  isOpen: boolean;
  appliedCoupon: string | null;
  validItemCount: number | null;
  isPricingLoading: boolean;
  pricingNotice: string | null;
  pricingError: string | null;

  // Actions
  addItem: (item: AddItemInput, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  removeItems: (variantIds: string[]) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  setCoupon: (code: string | null) => void;
  setAppliedCoupon: (code: string | null) => void;
  removeCoupon: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setValidItemCount: (count: number | null) => void;
  setIsPricingLoading: (loading: boolean) => void;
  setPricingNotice: (notice: string | null) => void;
  clearPricingNotice: () => void;
  setPricingError: (error: string | null) => void;

  // Computed helper
  getItemCount: () => number;
}

/**
 * Migration function for persisted cart store.
 * Drops legacy carts from version < 2 and filters out invalid or malformed entries.
 */
export function migrateCartState(
  persistedState: unknown,
  version: number
): { items: CartItemReference[]; appliedCoupon: string | null } {
  if (version < CART_STORE_VERSION) {
    // Old version carts (v0, v1, or unversioned) are dropped on load
    return {
      items: [],
      appliedCoupon: null,
    };
  }

  const state = persistedState as { items?: unknown[]; appliedCoupon?: unknown } | null;
  const rawItems = Array.isArray(state?.items) ? state.items : [];
  const validItems: CartItemReference[] = [];

  for (const item of rawItems) {
    if (
      item &&
      typeof item === "object" &&
      "variantId" in item &&
      typeof (item as { variantId: unknown }).variantId === "string" &&
      (item as { variantId: string }).variantId.trim().length > 0 &&
      "quantity" in item &&
      typeof (item as { quantity: unknown }).quantity === "number" &&
      Number.isInteger((item as { quantity: number }).quantity) &&
      (item as { quantity: number }).quantity > 0
    ) {
      const qty = Math.min(MAX_QUANTITY_PER_LINE, (item as { quantity: number }).quantity);
      validItems.push({
        variantId: (item as { variantId: string }).variantId.trim(),
        quantity: qty,
      });
    }

    if (validItems.length >= MAX_CART_LINES) {
      break;
    }
  }

  return {
    items: validItems,
    appliedCoupon: typeof state?.appliedCoupon === "string" ? state.appliedCoupon : null,
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      appliedCoupon: null,
      validItemCount: null,
      isPricingLoading: false,
      pricingNotice: null,
      pricingError: null,

      addItem: (input, quantity = 1) => {
        const variantId = typeof input === "string" ? input : input?.variantId;
        if (!variantId || typeof variantId !== "string" || !variantId.trim()) return;

        const qtyToAdd = Math.max(1, Math.min(MAX_QUANTITY_PER_LINE, Math.floor(Number(quantity) || 1)));

        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.variantId === variantId
          );

          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            const newQty = Math.min(
              MAX_QUANTITY_PER_LINE,
              updatedItems[existingIndex].quantity + qtyToAdd
            );
            updatedItems[existingIndex] = {
              variantId,
              quantity: newQty,
            };
            return { items: updatedItems, isOpen: true, isPricingLoading: true };
          }

          if (state.items.length >= MAX_CART_LINES) {
            return { isOpen: true };
          }

          return {
            items: [...state.items, { variantId, quantity: qtyToAdd }],
            isOpen: true,
            isPricingLoading: true,
          };
        });
      },

      removeItem: (variantId) => {
        set((state) => {
          const remaining = state.items.filter((item) => item.variantId !== variantId);
          return {
            items: remaining,
            validItemCount: remaining.length === 0 ? 0 : state.validItemCount,
          };
        });
      },

      removeItems: (variantIds: string[]) => {
        const toRemove = new Set(variantIds);
        set((state) => {
          const remaining = state.items.filter((item) => !toRemove.has(item.variantId));
          return {
            items: remaining,
            validItemCount: remaining.length === 0 ? 0 : state.validItemCount,
          };
        });
      },

      updateQuantity: (variantId, quantity) => {
        const numQty = Math.floor(Number(quantity));
        if (numQty <= 0) {
          get().removeItem(variantId);
          return;
        }

        const cappedQty = Math.min(MAX_QUANTITY_PER_LINE, numQty);

        set((state) => ({
          items: state.items.map((item) => {
            if (item.variantId === variantId) {
              return {
                variantId,
                quantity: cappedQty,
              };
            }
            return item;
          }),
        }));
      },

      clearCart: () =>
        set({
          items: [],
          appliedCoupon: null,
          validItemCount: 0,
          pricingNotice: null,
          pricingError: null,
          isPricingLoading: false,
        }),

      setCoupon: (code) =>
        set({ appliedCoupon: code ? code.trim().toUpperCase() : null }),

      setAppliedCoupon: (code) =>
        set({ appliedCoupon: code ? code.trim().toUpperCase() : null }),

      removeCoupon: () => set({ appliedCoupon: null }),

      openCart: () => set({ isOpen: true }),

      closeCart: () => set({ isOpen: false }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      setValidItemCount: (count) => set({ validItemCount: count }),

      setIsPricingLoading: (loading) => set({ isPricingLoading: loading }),

      setPricingNotice: (notice) => set({ pricingNotice: notice }),

      clearPricingNotice: () => set({ pricingNotice: null }),

      setPricingError: (error) => set({ pricingError: error }),

      getItemCount: () => {
        const state = get();
        if (state.items.length === 0) return 0;
        if (state.validItemCount !== null) return state.validItemCount;
        return state.items.reduce((total, item) => total + (item.quantity || 0), 0);
      },
    }),
    {
      name: "samaura_cart",
      version: CART_STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      migrate: migrateCartState,
      partialize: (state) => ({
        items: state.items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        appliedCoupon: state.appliedCoupon,
      }),
    }
  )
);
