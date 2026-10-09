"use client";

import { Minus, Plus, Trash2 } from "lucide-react";

import { ConfigurationDetails } from "@/components/customer/configuration-details";
import type { CartItem } from "@/types/cart";

type Props = {
    item: CartItem;
    onQuantityChange: (id: string, quantity: number) => void;
    onRemove: (id: string) => void;
    compact?: boolean;
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

export function CartItemCard({ item, onQuantityChange, onRemove, compact = false }: Props) {
    return (
        <article className="bg-card overflow-hidden rounded-xl border">
            <div className={compact ? "p-3" : "p-4"}>
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold">{item.productName}</h3>

                        <p className="text-muted-foreground mt-1 text-xs">
                            {formatCurrency(item.unitPrice)} cada
                        </p>
                    </div>

                    <strong className="shrink-0 text-sm">
                        {formatCurrency(item.unitPrice * item.quantity)}
                    </strong>
                </div>

                {item.type === "PRODUCT" ? (
                    <ConfigurationDetails
                        configuration={item.configuration}
                        variant="chips"
                        className="mt-3"
                    />
                ) : (
                    <div className="mt-3 space-y-3">
                        {item.comboSelections.map((selection) => {
                            const repeatedCount = item.comboSelections.filter(
                                (other) => other.comboItemId === selection.comboItemId
                            ).length;

                            return (
                                <div
                                    key={`${selection.comboItemId}-${selection.instance}`}
                                    className="bg-muted/40 rounded-lg border p-3"
                                >
                                    <p className="text-xs font-semibold">
                                        {selection.productName}
                                        {repeatedCount > 1 ? ` #${selection.instance}` : ""}
                                    </p>

                                    {selection.configuration ? (
                                        <ConfigurationDetails
                                            configuration={selection.configuration}
                                            variant="chips"
                                            className="mt-2"
                                        />
                                    ) : (
                                        <p className="text-muted-foreground mt-1 text-xs">
                                            {selection.productDescription || "Incluído no combo"}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div
                className={`bg-muted/20 flex items-center justify-between gap-2 border-t ${
                    compact ? "px-3 py-2" : "px-4 py-3"
                }`}
            >
                <div className="bg-background flex items-center rounded-lg border">
                    <button
                        type="button"
                        onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label={`Diminuir quantidade de ${item.productName}`}
                        className="hover:bg-muted flex h-9 w-9 items-center justify-center disabled:opacity-40"
                    >
                        <Minus size={15} />
                    </button>

                    <span className="min-w-7 text-center text-sm font-semibold">
                        {item.quantity}
                    </span>

                    <button
                        type="button"
                        onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                        aria-label={`Aumentar quantidade de ${item.productName}`}
                        className="hover:bg-muted flex h-9 w-9 items-center justify-center"
                    >
                        <Plus size={15} />
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    aria-label={`Remover ${item.productName}`}
                    className="text-destructive hover:bg-destructive/10 flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs"
                >
                    <Trash2 size={15} />
                    Remover
                </button>
            </div>
        </article>
    );
}
