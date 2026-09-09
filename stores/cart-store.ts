import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartState } from "@/types/cart";

export const useCartStore = create<CartState>()(
    persist(
        (set) => ({
            items: [],

            addItem: (item) =>
                set((state) => ({
                    items: [
                        ...state.items,
                        {
                            ...item,
                            id: crypto.randomUUID(),
                        },
                    ],
                })),

            updateQuantity: (id, quantity) =>
                set((state) => ({
                    items:
                        quantity <= 0
                            ? state.items.filter((item) => item.id !== id)
                            : state.items.map((item) =>
                                  item.id === id
                                      ? {
                                            ...item,
                                            quantity,
                                            totalPrice: item.unitPrice * quantity,
                                        }
                                      : item
                              ),
                })),

            removeItem: (id) =>
                set((state) => ({
                    items: state.items.filter((item) => item.id !== id),
                })),

            clear: () => set({ items: [] }),
        }),
        {
            name: "delivery-cart",
        }
    )
);
