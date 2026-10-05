import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  image: string;
  pricePaise: number;
  salePricePaise?: number | null;
  quantity: number;
  stock: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  appliedCoupon: string | null;

  // Actions
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  setCoupon: (code: string | null) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Computed helpers
  getItemCount: () => number;
  getSubtotalPaise: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      appliedCoupon: null,

      addItem: (item, quantity = 1) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.variantId === item.variantId
          );

          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            const currentItem = updatedItems[existingIndex];
            const newQty = Math.min(
              currentItem.quantity + quantity,
              item.stock > 0 ? item.stock : 20
            );
            updatedItems[existingIndex] = {
              ...currentItem,
              quantity: newQty,
            };
            return { items: updatedItems, isOpen: true };
          }

          return {
            items: [
              ...state.items,
              {
                ...item,
                quantity: Math.min(quantity, item.stock > 0 ? item.stock : 20),
              },
            ],
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
              const maxAllowed = item.stock > 0 ? item.stock : 20;
              return {
                ...item,
                quantity: Math.min(quantity, maxAllowed),
              };
            }
            return item;
          }),
        }));
      },

      clearCart: () => set({ items: [], appliedCoupon: null }),

      setCoupon: (code) => set({ appliedCoupon: code }),

      openCart: () => set({ isOpen: true }),

      closeCart: () => set({ isOpen: false }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotalPaise: () => {
        return get().items.reduce((total, item) => {
          const effectivePrice = item.salePricePaise ?? item.pricePaise;
          return total + effectivePrice * item.quantity;
        }, 0);
      },
    }),
    {
      name: "samaura_cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        appliedCoupon: state.appliedCoupon,
      }),
    }
  )
);
