"use client";

import Link from "next/link";
import { ShoppingBag, Trash2 } from "lucide-react";

import { CartItemCard } from "@/components/customer/cart-item-card";
import { useCartStore } from "@/stores/cart-store";

type Props = {
    variant?: "page" | "sidebar";
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

export function CartContent({ variant = "page" }: Props) {
    const items = useCartStore((state) => state.items);
    const updateQuantity = useCartStore((state) => state.updateQuantity);
    const removeItem = useCartStore((state) => state.removeItem);
    const clear = useCartStore((state) => state.clear);

    const compact = variant === "sidebar";

    const subtotal = items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);

    const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);

    if (items.length === 0) {
        return (
            <div className="flex min-h-60 flex-col items-center justify-center px-4 py-10 text-center">
                <div className="bg-muted mb-4 flex h-14 w-14 items-center justify-center rounded-full">
                    <ShoppingBag size={24} className="text-muted-foreground" />
                </div>

                <h2 className="font-semibold">Seu carrinho está vazio</h2>

                <p className="text-muted-foreground mt-2 text-sm">
                    Escolha um produto para começar seu pedido.
                </p>

                {!compact && (
                    <Link
                        href="/"
                        className="bg-primary text-primary-foreground mt-5 rounded-lg px-5 py-3 text-sm font-semibold"
                    >
                        Ver cardápio
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className={compact ? "flex min-h-0 flex-1 flex-col" : "space-y-5"}>
            <header className="flex items-center justify-between gap-3">
                <div>
                    <h2 className={compact ? "font-bold" : "text-2xl font-bold"}>Seu carrinho</h2>

                    <p className="text-muted-foreground mt-1 text-xs">
                        {totalQuantity} {totalQuantity === 1 ? "item" : "itens"} no pedido
                    </p>
                </div>

                <button
                    type="button"
                    onClick={clear}
                    className="text-muted-foreground hover:text-destructive flex items-center gap-1 rounded-lg px-2 py-2 text-xs"
                >
                    <Trash2 size={15} />
                    Limpar
                </button>
            </header>

            <div
                className={
                    compact
                        ? "mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain"
                        : "space-y-4"
                }
            >
                {items.map((item) => (
                    <CartItemCard
                        key={item.id}
                        item={item}
                        compact={compact}
                        onQuantityChange={updateQuantity}
                        onRemove={removeItem}
                    />
                ))}
            </div>

            <div
                className={
                    compact
                        ? "bg-background mt-4 shrink-0 space-y-3 border-t pt-4"
                        : "space-y-3 rounded-xl border p-4"
                }
            >
                <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground text-sm">Subtotal</span>

                    <strong>{formatCurrency(subtotal)}</strong>
                </div>

                <p className="text-muted-foreground text-xs">
                    Entrega e descontos calculados no checkout.
                </p>

                <div
                    className={
                        compact ? "" : "bg-background sticky bottom-16 z-10 pt-2 sm:bottom-0"
                    }
                >
                    <Link
                        href="/checkout"
                        className="bg-primary text-primary-foreground flex min-h-12 items-center justify-between gap-3 rounded-lg px-4 font-semibold hover:opacity-90"
                    >
                        <span>Continuar pedido</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
