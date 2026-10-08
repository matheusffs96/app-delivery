"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { useCartStore } from "@/stores/cart-store";
import type { ComboCartItem } from "@/types/cart";
import { ConfigurationDetails } from "@/components/customer/configuration-details";

function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

function ComboConfigurationDetails({ item }: { item: ComboCartItem }) {
    return (
        <div className="mt-4 space-y-3">
            {item.comboSelections.map((comboItem) => {
                const repeatedCount = item.comboSelections.filter(
                    (other) => other.comboItemId === comboItem.comboItemId
                ).length;

                return (
                    <div
                        key={`${comboItem.comboItemId}-${comboItem.instance}`}
                        className="bg-muted/40 rounded-lg border p-3"
                    >
                        <p className="text-sm font-semibold">
                            {comboItem.productName}
                            {repeatedCount > 1 ? ` #${comboItem.instance}` : ""}
                        </p>

                        {comboItem.configuration ? (
                            <ConfigurationDetails
                                configuration={comboItem.configuration}
                                variant="chips"
                                className="mt-3"
                            />
                        ) : (
                            <p className="text-muted-foreground mt-1 text-xs">
                                {comboItem.productDescription || "Incluído no combo"}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function CartPage() {
    const items = useCartStore((state) => state.items);
    const updateQuantity = useCartStore((state) => state.updateQuantity);
    const removeItem = useCartStore((state) => state.removeItem);
    const clear = useCartStore((state) => state.clear);

    const subtotal = items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);

    const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);

    if (items.length === 0) {
        return (
            <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-10">
                <div className="bg-muted mb-5 flex h-16 w-16 items-center justify-center rounded-full">
                    <ShoppingBag className="text-muted-foreground" size={28} />
                </div>

                <h1 className="text-center text-2xl font-bold">Seu carrinho está vazio</h1>

                <p className="text-muted-foreground mt-2 text-center">
                    Escolha algum item do cardápio para começar seu pedido.
                </p>

                <Link
                    href="/"
                    className="bg-primary text-primary-foreground mt-6 rounded-lg px-6 py-3 font-semibold"
                >
                    Ver cardápio
                </Link>
            </main>
        );
    }

    return (
        <main className="mx-auto w-full max-w-2xl px-4 py-6">
            <header className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Seu carrinho</h1>

                    <p className="text-muted-foreground mt-1 text-sm">
                        {totalQuantity} {totalQuantity === 1 ? "item no pedido" : "itens no pedido"}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={clear}
                    className="text-muted-foreground hover:text-destructive flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs transition-colors"
                >
                    <Trash2 size={15} />
                    Limpar
                </button>
            </header>

            <div className="space-y-4">
                {items.map((item) => (
                    <article key={item.id} className="bg-card overflow-hidden rounded-xl border">
                        <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <h2 className="font-semibold">{item.productName}</h2>

                                    <p className="text-muted-foreground mt-1 text-xs">
                                        {formatCurrency(item.unitPrice)} cada
                                    </p>
                                </div>

                                <strong className="shrink-0 text-base">
                                    {formatCurrency(item.unitPrice * item.quantity)}
                                </strong>
                            </div>

                            {item.type === "PRODUCT" ? (
                                <ConfigurationDetails
                                    configuration={item.configuration}
                                    variant="chips"
                                    className="mt-4"
                                />
                            ) : (
                                <ComboConfigurationDetails item={item} />
                            )}
                        </div>

                        <div className="bg-muted/20 flex items-center justify-between gap-3 border-t px-4 py-3">
                            <div className="bg-background flex items-center rounded-lg border">
                                <button
                                    type="button"
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                    className="hover:bg-muted flex h-10 w-10 items-center justify-center rounded-l-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                                    aria-label="Diminuir quantidade"
                                >
                                    <Minus size={16} />
                                </button>

                                <span className="min-w-8 text-center text-sm font-semibold">
                                    {item.quantity}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="hover:bg-muted flex h-10 w-10 items-center justify-center rounded-r-lg transition-colors"
                                    aria-label="Aumentar quantidade"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="text-destructive hover:bg-destructive/10 flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm transition-colors"
                                aria-label={`Remover ${item.productName}`}
                            >
                                <Trash2 size={16} />
                                Remover
                            </button>
                        </div>
                    </article>
                ))}
            </div>

            <section className="mt-6 space-y-3 rounded-xl border p-4">
                <h2 className="font-semibold">Resumo do pedido</h2>

                <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground text-sm">
                        Subtotal ({totalQuantity} {totalQuantity === 1 ? "item" : "itens"})
                    </span>

                    <strong>{formatCurrency(subtotal)}</strong>
                </div>

                <p className="text-muted-foreground border-t pt-3 text-xs">
                    Taxa de entrega e descontos serão calculados no checkout.
                </p>
            </section>

            <div className="bg-background sticky bottom-16 z-10 mt-6 border-t py-4 sm:bottom-0">
                <Link
                    href="/checkout"
                    className="bg-primary text-primary-foreground flex min-h-14 w-full items-center justify-between gap-3 rounded-lg px-5 font-semibold transition-opacity hover:opacity-90"
                >
                    <span>Continuar pedido</span>

                    <span>{formatCurrency(subtotal)}</span>
                </Link>
            </div>
        </main>
    );
}
