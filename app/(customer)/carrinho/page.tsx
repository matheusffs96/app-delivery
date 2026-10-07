"use client";

import Link from "next/link";
import { useCartStore } from "@/stores/cart-store";
import type { ComboCartItem, ProductCartItem } from "@/types/cart";

function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

function ProductConfigurationDetails({ item }: { item: ProductCartItem }) {
    const choices = [...item.configuration.options, ...item.configuration.components];

    const groups = choices.reduce<Record<string, typeof choices>>((result, choice) => {
        const groupName = choice.groupName ?? "Opções";

        result[groupName] ??= [];
        result[groupName].push(choice);

        return result;
    }, {});

    return (
        <div className="mt-3 space-y-1 text-sm">
            {Object.entries(groups).map(([groupName, choices]) => (
                <div key={groupName}>
                    <span className="font-medium">{groupName}: </span>

                    <span className="text-muted-foreground">
                        {choices
                            .map((choice) =>
                                choice.quantity > 1
                                    ? `${choice.quantity}x ${choice.name}`
                                    : choice.name
                            )
                            .join(", ")}
                    </span>
                </div>
            ))}

            {item.configuration.addons.length > 0 && (
                <div>
                    <span className="font-medium">Adicionais: </span>

                    <span className="text-muted-foreground">
                        {item.configuration.addons
                            .map((addon) =>
                                addon.quantity > 1 ? `${addon.quantity}x ${addon.name}` : addon.name
                            )
                            .join(", ")}
                    </span>
                </div>
            )}

            {item.configuration.notes && (
                <div>
                    <span className="font-medium">Observação: </span>

                    <span className="text-muted-foreground">{item.configuration.notes}</span>
                </div>
            )}
        </div>
    );
}

function ComboConfigurationDetails({ item }: { item: ComboCartItem }) {
    return (
        <div className="mt-3 space-y-3">
            {item.comboSelections.map((comboItem) => {
                const repeatedCount = item.comboSelections.filter(
                    (other) => other.comboItemId === comboItem.comboItemId
                ).length;

                return (
                    <div
                        key={`${comboItem.comboItemId}-${comboItem.instance}`}
                        className="border-l pl-3"
                    >
                        <div className="text-sm font-medium">
                            {comboItem.productName}
                            {repeatedCount > 1 ? ` #${comboItem.instance}` : ""}
                        </div>

                        {comboItem.configuration ? (
                            <div className="text-muted-foreground mt-1 space-y-1 text-sm">
                                {comboItem.configuration.options.map((option) => (
                                    <div key={option.id}>
                                        {option.quantity > 1 && `${option.quantity}x `}
                                        {option.name}
                                    </div>
                                ))}

                                {comboItem.configuration.components.map((component) => (
                                    <div key={component.id}>
                                        {component.quantity > 1 && `${component.quantity}x `}
                                        {component.name}
                                    </div>
                                ))}

                                {comboItem.configuration.addons.map((addon) => (
                                    <div key={addon.id}>
                                        {addon.quantity > 1 && `${addon.quantity}x `}
                                        {addon.name}
                                    </div>
                                ))}

                                {comboItem.configuration.notes && (
                                    <div>Obs.: {comboItem.configuration.notes}</div>
                                )}
                            </div>
                        ) : (
                            <p className="text-muted-foreground mt-1 text-sm">
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

    if (items.length === 0) {
        return (
            <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-10">
                <h1 className="text-2xl font-bold">Seu carrinho está vazio</h1>

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
        <main className="mx-auto max-w-2xl px-4 py-6">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Seu carrinho</h1>

                <button
                    type="button"
                    onClick={clear}
                    className="text-muted-foreground hover:text-destructive text-sm"
                >
                    Limpar carrinho
                </button>
            </div>

            <div className="space-y-4">
                {items.map((item) => (
                    <article key={item.id} className="rounded-xl border p-4">
                        <div className="flex justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <h2 className="font-semibold">{item.productName}</h2>

                                <p className="text-muted-foreground mt-1 text-sm">
                                    {formatCurrency(item.unitPrice)} cada
                                </p>

                                {item.type === "PRODUCT" ? (
                                    <ProductConfigurationDetails item={item} />
                                ) : (
                                    <ComboConfigurationDetails item={item} />
                                )}
                            </div>

                            <strong>{formatCurrency(item.unitPrice * item.quantity)}</strong>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border"
                                    aria-label="Diminuir quantidade"
                                >
                                    −
                                </button>

                                <span className="min-w-6 text-center font-medium">
                                    {item.quantity}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border"
                                    aria-label="Aumentar quantidade"
                                >
                                    +
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="text-destructive text-sm"
                            >
                                Remover
                            </button>
                        </div>
                    </article>
                ))}
            </div>

            <section className="mt-8 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>

                    <strong className="text-lg">{formatCurrency(subtotal)}</strong>
                </div>

                <p className="text-muted-foreground mt-2 text-sm">
                    Taxa de entrega e descontos serão calculados no checkout.
                </p>
            </section>

            <div className="bg-background sticky bottom-0 mt-6 border-t py-4">
                <Link
                    href="/checkout"
                    className="bg-primary text-primary-foreground block w-full rounded-lg p-4 text-center font-semibold"
                >
                    Continuar — {formatCurrency(subtotal)}
                </Link>
            </div>
        </main>
    );
}
