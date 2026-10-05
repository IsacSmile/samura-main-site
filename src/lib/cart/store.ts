import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItemReference {
  variantId: string;
  quantity: number;
}

// Backward-compatible alias
export type CartItem = CartItemReference;

export type AddItemInput = string | { variantId: string; [key: string]: unknown };

interface CartState {
  items: CartItemReference[];
  isOpen: boolean;
  appliedCoupon: string | null;

  // Actions
  addItem: (item: AddItemInput, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  setCoupon: (code: string | null) => void;
  setAppliedCoupon: (code: string | null) => void;
  removeCoupon: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Computed helper
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      appliedCoupon: null,

      addItem: (input, quantity = 1) => {
        const variantId = typeof input === "string" ? input : input?.variantId;
        if (!variantId) return;

        const qtyToAdd = Math.max(1, Math.floor(quantity));

        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.variantId === variantId
          );

          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            updatedItems[existingIndex] = {
              variantId,
              quantity: updatedItems[existingIndex].quantity + qtyToAdd,
            };
            return { items: updatedItems, isOpen: true };
          }

          return {
            items: [...state.items, { variantId, quantity: qtyToAdd }],
            isOpen: true,
          };
        });
      },

      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        }));
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) => {
            if (item.variantId === variantId) {
              return {
                variantId,
                quantity: Math.floor(quantity),
              };
            }
            return item;
          }),
        }));
      },

      clearCart: () => set({ items: [], appliedCoupon: null }),

      setCoupon: (code) =>
        set({ appliedCoupon: code ? code.trim().toUpperCase() : null }),

      setAppliedCoupon: (code) =>
        set({ appliedCoupon: code ? code.trim().toUpperCase() : null }),

      removeCoupon: () => set({ appliedCoupon: null }),

      openCart: () => set({ isOpen: true }),

      closeCart: () => set({ isOpen: false }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getItemCount: () => {
        return get().items.reduce((total, item) => total + (item.quantity || 0), 0);
      },
    }),
    {
      name: "samaura_cart",
      storage: createJSONStorage(() => localStorage),
      // Only variantId, quantity and appliedCoupon are stored in client localStorage
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
