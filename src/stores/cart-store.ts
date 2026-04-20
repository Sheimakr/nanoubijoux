import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product, ProductVariant } from '@/types';

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, variant?: ProductVariant | null, quantity?: number) => void;
  removeItem: (productId: string, variantId?: string | null) => void;
  updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  getDiscount: () => number;
  getTotal: (shippingFee?: number) => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, variant = null, quantity = 1) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) =>
              item.product.id === product.id &&
              (item.variant?.id || null) === (variant?.id || null)
          );

          if (existingIndex >= 0) {
            const newItems = [...state.items];
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              quantity: newItems[existingIndex].quantity + quantity,
            };
            return { items: newItems };
          }

          return { items: [...state.items, { product, variant, quantity }] };
        });
      },

      removeItem: (productId, variantId = null) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(item.product.id === productId &&
                (item.variant?.id || null) === variantId)
          ),
        }));
      },

      updateQuantity: (productId, variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId &&
            (item.variant?.id || null) === variantId
              ? { ...item, quantity }
              : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => {
          const price = item.variant?.price_override ?? item.product.price;
          return sum + price * item.quantity;
        }, 0);
      },

      getDiscount: () => {
        // Auto-discount: 10% off when the cart has 3 or more units
        // (any mix of products counts). Stacks with coupon discounts,
        // which are tracked separately in the checkout page state.
        const items = get().items;
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        if (totalItems >= 3) {
          return Math.round(get().getSubtotal() * 0.1);
        }
        return 0;
      },

      getTotal: (shippingFee = 0) => {
        return get().getSubtotal() - get().getDiscount() + shippingFee;
      },
    }),
    {
      name: 'nano-bijoux-cart',
    }
  )
);
