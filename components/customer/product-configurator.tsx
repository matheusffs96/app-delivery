"use client";

import { useMemo, useState } from "react";
import { useCartStore } from "@/stores/cart-store";
import type { ProductSelection } from "@/lib/validators/product";
import type { ProductConfigurationResult, ProductDetail } from "@/types/product";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Props = {
    product: ProductDetail;
    mode?: "cart" | "selection";
    initialSelection?: ProductSelection;
    selectionLabel?: string;
    onConfigured?: (result: ProductConfigurationResult) => void;
    onCancel?: () => void;
};

type ConfigureProductResponse = {
    productId: string;
    productName: string;
    basePrice: number;
    additionalPrice: number;
    totalPrice: number;
    options: {
        id: string;
        name: string;
        price: number;
        quantity: number;
    }[];
    components: {
        productId: string;
        productName: string;
        unitPrice: number;
        quantity: number;
    }[];
    componentOptions: {
        id: string;
        name: string;
        price: number;
        quantity: number;
    }[];
    addons: {
        id: string;
        name: string;
        price: number;
        quantity: number;
    }[];
    notes?: string;
};

function formatCurrency(value: number | string) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(value));
}

function buildInitialOptions(product: ProductDetail, selection?: ProductSelection) {
    const result: Record<string, string[]> = {};

    for (const selectedOption of selection?.options ?? []) {
        const group = product.optionGroups.find((item) =>
            item.options.some((option) => option.id === selectedOption.optionId)
        );

        if (!group) {
            continue;
        }

        result[group.id] = [...(result[group.id] ?? []), selectedOption.optionId];
    }

    return result;
}

function buildInitialComponentItems(product: ProductDetail, selection?: ProductSelection) {
    const result: Record<string, string[]> = {};

    for (const selectedItem of selection?.componentItems ?? []) {
        const group = product.componentGroups.find((item) =>
            item.items.some((component) => component.id === selectedItem.componentItemId)
        );

        if (!group) {
            continue;
        }

        result[group.id] = [...(result[group.id] ?? []), selectedItem.componentItemId];
    }

    return result;
}

function buildInitialComponentOptions(product: ProductDetail, selection?: ProductSelection) {
    const result: Record<string, string[]> = {};

    for (const selectedOption of selection?.componentOptions ?? []) {
        const group = product.componentGroups.find((item) =>
            item.options.some((option) => option.id === selectedOption.componentOptionId)
        );

        if (!group) {
            continue;
        }

        result[group.id] = [...(result[group.id] ?? []), selectedOption.componentOptionId];
    }

    return result;
}

function buildInitialAddons(selection?: ProductSelection) {
    return Object.fromEntries(
        (selection?.addons ?? []).map((addon) => [addon.addonId, addon.quantity])
    );
}

export function ProductConfigurator({
    product,
    mode = "cart",
    initialSelection,
    selectionLabel,
    onConfigured,
    onCancel,
}: Props) {
    const router = useRouter();

    const addItem = useCartStore((state) => state.addItem);
    const [options, setOptions] = useState<Record<string, string[]>>(() =>
        buildInitialOptions(product, initialSelection)
    );
    const [componentItems, setComponentItems] = useState<Record<string, string[]>>(() =>
        buildInitialComponentItems(product, initialSelection)
    );
    const [componentOptions, setComponentOptions] = useState<Record<string, string[]>>(() =>
        buildInitialComponentOptions(product, initialSelection)
    );
    const [addons, setAddons] = useState<Record<string, number>>(() =>
        buildInitialAddons(initialSelection)
    );
    const [notes, setNotes] = useState(initialSelection?.notes ?? "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const selectedAddonTotal = useMemo(() => {
        return Object.entries(addons).reduce((total, [addonId, quantity]) => {
            const addon = product.addons.find((item) => item.id === addonId);

            if (!addon) {
                return total;
            }

            return total + Number(addon.price) * quantity;
        }, 0);
    }, [addons, product.addons]);

    const selectedOptionTotal = useMemo(() => {
        return Object.entries(options).reduce((total, [, selected]) => {
            return (
                total +
                selected.reduce((groupTotal, optionId) => {
                    const option = product.optionGroups
                        .flatMap((group) => group.options)
                        .find((item) => item.id === optionId);

                    return groupTotal + Number(option?.price ?? 0);
                }, 0)
            );
        }, 0);
    }, [options, product.optionGroups]);

    const selectedComponentTotal = useMemo(() => {
        return Object.entries(componentItems).reduce((total, [groupId, selected]) => {
            const group = product.componentGroups.find((item) => item.id === groupId);

            if (!group) {
                return total;
            }

            return (
                total +
                selected.reduce((groupTotal, componentItemId) => {
                    const item = group.items.find((component) => component.id === componentItemId);

                    return groupTotal + Number(item?.additionalPrice ?? 0);
                }, 0)
            );
        }, 0);
    }, [componentItems, product.componentGroups]);

    const selectedComponentOptionTotal = useMemo(() => {
        return Object.entries(componentOptions).reduce((total, [groupId, selected]) => {
            const group = product.componentGroups.find((item) => item.id === groupId);

            if (!group) {
                return total;
            }

            return (
                total +
                selected.reduce((groupTotal, componentOptionId) => {
                    const option = group.options.find((item) => item.id === componentOptionId);

                    return groupTotal + Number(option?.additionalPrice ?? 0);
                }, 0)
            );
        }, 0);
    }, [componentOptions, product.componentGroups]);

    const totalPrice =
        Number(product.price) +
        selectedOptionTotal +
        selectedComponentTotal +
        selectedComponentOptionTotal +
        selectedAddonTotal;

    function toggleOption(groupId: string, optionId: string) {
        const group = product.optionGroups.find((item) => item.id === groupId);

        if (!group) {
            return;
        }

        setOptions((current) => {
            const selected = current[groupId] ?? [];

            if (selected.includes(optionId)) {
                return {
                    ...current,
                    [groupId]: selected.filter((id) => id !== optionId),
                };
            }

            if (group.maxSelect !== null && selected.length >= group.maxSelect) {
                if (group.maxSelect === 1) {
                    return {
                        ...current,
                        [groupId]: [optionId],
                    };
                }

                return current;
            }

            return {
                ...current,
                [groupId]: [...selected, optionId],
            };
        });
    }

    function toggleComponentItem(groupId: string, componentItemId: string) {
        const group = product.componentGroups.find((item) => item.id === groupId);

        if (!group) {
            return;
        }

        setComponentItems((current) => {
            const selectedItems = current[groupId] ?? [];
            const selectedOptions = componentOptions[groupId] ?? [];

            if (selectedItems.includes(componentItemId)) {
                return {
                    ...current,
                    [groupId]: selectedItems.filter((id) => id !== componentItemId),
                };
            }

            const currentCount = selectedItems.length + selectedOptions.length;

            if (group.maxSelect !== null && currentCount >= group.maxSelect) {
                return current;
            }

            return {
                ...current,
                [groupId]: [...selectedItems, componentItemId],
            };
        });
    }

    function toggleComponentOption(groupId: string, componentOptionId: string) {
        const group = product.componentGroups.find((item) => item.id === groupId);

        if (!group) {
            return;
        }

        setComponentOptions((current) => {
            const selectedOptions = current[groupId] ?? [];
            const selectedItems = componentItems[groupId] ?? [];

            if (selectedOptions.includes(componentOptionId)) {
                return {
                    ...current,
                    [groupId]: selectedOptions.filter((id) => id !== componentOptionId),
                };
            }

            const currentCount = selectedItems.length + selectedOptions.length;

            if (group.maxSelect !== null && currentCount >= group.maxSelect) {
                return current;
            }

            return {
                ...current,
                [groupId]: [...selectedOptions, componentOptionId],
            };
        });
    }

    function updateAddon(addonId: string, quantity: number) {
        setAddons((current) => {
            if (quantity <= 0) {
                const next = { ...current };
                delete next[addonId];
                return next;
            }

            return {
                ...current,
                [addonId]: quantity,
            };
        });
    }

    function validateBeforeSubmit() {
        for (const group of product.optionGroups) {
            const selected = options[group.id] ?? [];
            const count = selected.length;

            if (group.required && count === 0) {
                return `O grupo "${group.name}" é obrigatório.`;
            }

            if (count < group.minSelect) {
                return `O grupo "${group.name}" exige pelo menos ${group.minSelect} seleção(ões).`;
            }

            if (group.maxSelect !== null && count > group.maxSelect) {
                return `O grupo "${group.name}" permite no máximo ${group.maxSelect} seleção(ões).`;
            }
        }

        for (const group of product.componentGroups) {
            const selectedItems = componentItems[group.id] ?? [];
            const selectedOptions = componentOptions[group.id] ?? [];
            const count = selectedItems.length + selectedOptions.length;

            if (group.required && count === 0) {
                return `O grupo "${group.name}" é obrigatório.`;
            }

            if (count < group.minSelect) {
                return `O grupo "${group.name}" exige pelo menos ${group.minSelect} seleção(ões).`;
            }

            if (group.maxSelect !== null && count > group.maxSelect) {
                return `O grupo "${group.name}" permite no máximo ${group.maxSelect} seleção(ões).`;
            }
        }

        return null;
    }

    async function handleSubmit() {
        setError("");

        const validationError = validateBeforeSubmit();

        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        try {
            const payload: ProductSelection = {
                productId: product.id,
                options: Object.values(options).flatMap((selected) =>
                    selected.map((optionId) => ({
                        optionId,
                        quantity: 1,
                    }))
                ),
                componentItems: Object.values(componentItems).flatMap((selected) =>
                    selected.map((componentItemId) => ({
                        componentItemId,
                        quantity: 1,
                    }))
                ),
                componentOptions: Object.values(componentOptions).flatMap((selected) =>
                    selected.map((componentOptionId) => ({
                        componentOptionId,
                        quantity: 1,
                    }))
                ),
                addons: Object.entries(addons).map(([addonId, quantity]) => ({
                    addonId,
                    quantity,
                })),
                notes: notes || undefined,
            };

            const response = await fetch(`/api/products/${product.slug}/configure`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = (await response.json()) as ConfigureProductResponse & {
                error?: string;
            };

            if (!response.ok) {
                throw new Error(data.error ?? "Não foi possível configurar o produto.");
            }

            const result: ProductConfigurationResult = {
                selection: payload,
                configuration: {
                    options: data.options.map((option) => ({
                        id: option.id,
                        name: option.name,
                        price: option.price,
                        quantity: option.quantity,
                    })),

                    components: [
                        ...data.components.map((component) => ({
                            id: component.productId,
                            name: component.productName,
                            price: component.unitPrice,
                            quantity: component.quantity,
                        })),

                        ...data.componentOptions.map((option) => ({
                            id: option.id,
                            name: option.name,
                            price: option.price,
                            quantity: option.quantity,
                        })),
                    ],

                    addons: data.addons.map((addon) => ({
                        id: addon.id,
                        name: addon.name,
                        price: addon.price,
                        quantity: addon.quantity,
                    })),

                    notes: data.notes,
                },

                unitPrice: data.totalPrice,
            };

            if (mode === "selection") {
                onConfigured?.(result);
                return;
            }

            addItem({
                type: "PRODUCT",
                productId: data.productId,
                productName: data.productName,
                quantity: 1,
                unitPrice: result.unitPrice,
                totalPrice: result.unitPrice,
                selection: result.selection,
                configuration: result.configuration,
            });

            toast.success("Produto adicionado ao carrinho.", {
                action: {
                    label: "Ver carrinho",
                    onClick: () => router.push("/carrinho"),
                },
            });

            router.push("/");
        } catch (error) {
            const fallbackMessage =
                mode === "selection"
                    ? "Não foi possível salvar a configuração."
                    : "Não foi possível adicionar o produto ao carrinho.";

            const message = error instanceof Error ? error.message : fallbackMessage;

            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }

    const submitText =
        mode === "selection"
            ? loading
                ? "Salvando configuração..."
                : `Confirmar ${selectionLabel ?? "configuração"} — ${formatCurrency(totalPrice)}`
            : loading
              ? "Adicionando..."
              : `Adicionar ao carrinho — ${formatCurrency(totalPrice)}`;

    return (
        <div className="space-y-8">
            {product.optionGroups.map((group) => {
                const selected = options[group.id] ?? [];

                return (
                    <section key={group.id} className="space-y-3">
                        <div>
                            <h3 className="font-semibold">{group.name}</h3>

                            <p className="text-muted-foreground text-sm">
                                {group.maxSelect === 1
                                    ? "Escolha 1 opção"
                                    : group.maxSelect
                                      ? `Escolha até ${group.maxSelect}`
                                      : "Escolha suas opções"}
                            </p>
                        </div>

                        <div className="space-y-2">
                            {group.options.map((option) => {
                                const checked = selected.includes(option.id);

                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => toggleOption(group.id, option.id)}
                                        className={`w-full rounded-lg border p-4 text-left transition ${
                                            checked
                                                ? "border-primary bg-primary/5"
                                                : "hover:bg-muted"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>{option.name}</span>

                                            {Number(option.price) > 0 && (
                                                <span className="text-sm">
                                                    + R$ {Number(option.price).toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                );
            })}

            {product.componentGroups.map((group) => {
                const selectedItems = componentItems[group.id] ?? [];
                const selectedOptions = componentOptions[group.id] ?? [];

                return (
                    <section key={group.id} className="space-y-3">
                        <div>
                            <h3 className="font-semibold">{group.name}</h3>

                            <p className="text-muted-foreground text-sm">
                                {group.maxSelect === 1
                                    ? "Escolha 1 opção"
                                    : group.maxSelect
                                      ? `Escolha até ${group.maxSelect}`
                                      : "Escolha suas opções"}
                            </p>
                        </div>

                        <div className="space-y-2">
                            {group.items.map((item) => {
                                const checked = selectedItems.includes(item.id);

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => toggleComponentItem(group.id, item.id)}
                                        className={`w-full rounded-lg border p-4 text-left transition ${
                                            checked
                                                ? "border-primary bg-primary/5"
                                                : "hover:bg-muted"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>{item.product.name}</span>

                                            {Number(item.additionalPrice) > 0 && (
                                                <span className="text-sm">
                                                    + R$ {Number(item.additionalPrice).toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}

                            {group.options.map((option) => {
                                const checked = selectedOptions.includes(option.id);

                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => toggleComponentOption(group.id, option.id)}
                                        className={`w-full rounded-lg border p-4 text-left transition ${
                                            checked
                                                ? "border-primary bg-primary/5"
                                                : "hover:bg-muted"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>{option.name}</span>

                                            {Number(option.additionalPrice) > 0 && (
                                                <span className="text-sm">
                                                    + R$ {Number(option.additionalPrice).toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                );
            })}

            {product.addons.length > 0 && (
                <section className="space-y-3">
                    <h3 className="font-semibold">Adicionais</h3>

                    {product.addons.map((addon) => {
                        const quantity = addons[addon.id] ?? 0;

                        return (
                            <div
                                key={addon.id}
                                className="flex items-center justify-between rounded-lg border p-4"
                            >
                                <div>
                                    <div>{addon.name}</div>

                                    <div className="text-muted-foreground text-sm">
                                        R$ {Number(addon.price).toFixed(2)}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => updateAddon(addon.id, quantity - 1)}
                                        className="h-8 w-8 rounded border"
                                    >
                                        -
                                    </button>

                                    <span className="min-w-5 text-center">{quantity}</span>

                                    <button
                                        type="button"
                                        onClick={() => updateAddon(addon.id, quantity + 1)}
                                        className="h-8 w-8 rounded border"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </section>
            )}

            <section className="space-y-3">
                <h3 className="font-semibold">Observações</h3>

                <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    maxLength={500}
                    className="min-h-24 w-full rounded-lg border p-3"
                    placeholder="Alguma observação?"
                />
            </section>

            {error && (
                <div className="border-destructive text-destructive rounded-lg border p-3 text-sm">
                    {error}
                </div>
            )}

            <div className="bg-background sticky bottom-0 space-y-2 border-t py-4">
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-primary text-primary-foreground w-full rounded-lg p-4 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {submitText}
                </button>
                {mode === "selection" && onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="w-full rounded-lg border p-3 font-medium disabled:opacity-50"
                    >
                        Voltar sem salvar
                    </button>
                )}
            </div>
        </div>
    );
}
