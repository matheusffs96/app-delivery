"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductConfigurator } from "@/components/customer/product-configurator";
import type { ProductComboItem, ProductConfigurationResult, ProductDetail } from "@/types/product";
import type { CartComboItemSelection } from "@/types/cart";
import { useCartStore } from "@/stores/cart-store";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Props = {
    product: ProductDetail;
};

type ComboUnit = {
    comboItem: ProductComboItem;
    instance: number;
};

function formatCurrency(value: number | string) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(value));
}

function getUnitKey(unit: ComboUnit) {
    return `${unit.comboItem.id}-${unit.instance}`;
}

function getUnitLabel(unit: ComboUnit) {
    return `${unit.comboItem.product.name}${
        unit.comboItem.quantity > 1 ? ` #${unit.instance}` : ""
    }`;
}

function ConfigurationSummary({ selection }: { selection: CartComboItemSelection | undefined }) {
    const configuration = selection?.configuration;

    if (!configuration) {
        return <p className="text-muted-foreground mt-1 text-sm">Personalização necessária</p>;
    }

    return (
        <div className="text-muted-foreground mt-2 space-y-1 text-sm">
            {configuration.options.length > 0 && (
                <p>
                    <span className="text-foreground font-medium">Opções:</span>{" "}
                    {configuration.options.map((option) => option.name).join(", ")}
                </p>
            )}

            {configuration.components.length > 0 && (
                <p>
                    <span className="text-foreground font-medium">Itens:</span>{" "}
                    {configuration.components.map((component) => component.name).join(", ")}
                </p>
            )}

            {configuration.addons.length > 0 && (
                <p>
                    <span className="text-foreground font-medium">Adicionais:</span>{" "}
                    {configuration.addons
                        .map((addon) =>
                            addon.quantity > 1 ? `${addon.quantity}x ${addon.name}` : addon.name
                        )
                        .join(", ")}
                </p>
            )}

            {configuration.notes && (
                <p>
                    <span className="text-foreground font-medium">Obs.:</span> {configuration.notes}
                </p>
            )}
        </div>
    );
}

export function ComboConfigurator({ product }: Props) {
    const addItem = useCartStore((state) => state.addItem);

    const router = useRouter();
    const [addingToCart, setAddingToCart] = useState(false);

    const [comboSelections, setComboSelections] = useState<CartComboItemSelection[]>([]);
    const [activeUnit, setActiveUnit] = useState<ComboUnit | null>(null);
    const [activeProduct, setActiveProduct] = useState<ProductDetail | null>(null);
    const [loadingUnitKey, setLoadingUnitKey] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const units = useMemo<ComboUnit[]>(() => {
        return product.comboItems.flatMap((comboItem) =>
            Array.from(
                {
                    length: comboItem.quantity,
                },
                (_, index) => ({
                    comboItem,
                    instance: index + 1,
                })
            )
        );
    }, [product.comboItems]);

    useEffect(() => {
        function handlePopState() {
            setActiveUnit(null);
            setActiveProduct(null);
            setLoadingUnitKey(null);
        }

        window.addEventListener("popstate", handlePopState);

        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, []);

    function getSelection(comboItemId: string, instance: number) {
        return comboSelections.find(
            (item) => item.comboItemId === comboItemId && item.instance === instance
        );
    }

    function isUnitConfigured(unit: ComboUnit) {
        if (unit.comboItem.product.type === "SIMPLE") {
            return true;
        }

        return Boolean(getSelection(unit.comboItem.id, unit.instance)?.selection);
    }

    function handleConfigured(result: ProductConfigurationResult) {
        if (!activeUnit) {
            return;
        }

        setComboSelections((current) => {
            const filtered = current.filter(
                (item) =>
                    !(
                        item.comboItemId === activeUnit.comboItem.id &&
                        item.instance === activeUnit.instance
                    )
            );

            return [
                ...filtered,
                {
                    comboItemId: activeUnit.comboItem.id,
                    productId: activeUnit.comboItem.product.id,
                    productName: activeUnit.comboItem.product.name,
                    productDescription: activeUnit.comboItem.product.description,
                    instance: activeUnit.instance,
                    selection: result.selection,
                    configuration: result.configuration,
                    unitPrice: result.unitPrice,
                },
            ];
        });

        setError("");
        setSuccess("");

        window.history.back();
    }

    function closeConfigurator() {
        window.history.back();
    }

    async function configureUnit(unit: ComboUnit) {
        if (unit.comboItem.product.type === "SIMPLE" || loadingUnitKey) {
            return;
        }

        const unitKey = getUnitKey(unit);

        try {
            setError("");
            setSuccess("");
            setLoadingUnitKey(unitKey);

            const response = await fetch(`/api/products/${unit.comboItem.product.slug}`, {
                cache: "no-store",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error ?? "Não foi possível carregar o produto.");
            }

            window.history.pushState(
                {
                    comboConfigurator: true,
                    unitKey,
                },
                "",
                window.location.href
            );

            setActiveUnit(unit);
            setActiveProduct(data);
        } catch (error) {
            setError(
                error instanceof Error ? error.message : "Não foi possível carregar o produto."
            );
        } finally {
            setLoadingUnitKey(null);
        }
    }

    async function handleAddToCart() {
        setError("");

        const missingConfiguration = units.find((unit) => !isUnitConfigured(unit));

        if (missingConfiguration) {
            setError(
                `Configure "${getUnitLabel(missingConfiguration)}" antes de adicionar o combo.`
            );
            return;
        }

        try {
            setAddingToCart(true);

            const payload = {
                productId: product.id,

                items: units.map((unit) => {
                    const configured = getSelection(unit.comboItem.id, unit.instance);

                    return {
                        comboItemId: unit.comboItem.id,
                        productId: unit.comboItem.product.id,
                        instance: unit.instance,

                        ...(unit.comboItem.product.type !== "SIMPLE"
                            ? {
                                  selection: configured?.selection,
                              }
                            : {}),
                    };
                }),
            };

            const response = await fetch(`/api/products/${product.slug}/configure-combo`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error ?? "Não foi possível configurar o combo.");
            }

            const cartComboSelections: CartComboItemSelection[] = units.map((unit) => {
                const configured = getSelection(unit.comboItem.id, unit.instance);

                if (configured) {
                    return configured;
                }

                return {
                    comboItemId: unit.comboItem.id,
                    productId: unit.comboItem.product.id,
                    productName: unit.comboItem.product.name,
                    productDescription: unit.comboItem.product.description,
                    instance: unit.instance,
                };
            });

            addItem({
                type: "COMBO",
                productId: data.productId,
                productName: data.productName,
                quantity: 1,
                unitPrice: data.totalPrice,
                totalPrice: data.totalPrice,
                comboSelections: cartComboSelections,
            });

            toast.success("Combo adicionado ao carrinho.", {
                action: {
                    label: "Ver carrinho",
                    onClick: () => router.push("/carrinho"),
                },
            });

            router.push("/");
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Não foi possível adicionar o combo ao carrinho.";

            setError(message);
            toast.error(message);
        } finally {
            setAddingToCart(false);
        }
    }

    if (activeUnit && activeProduct) {
        const existingSelection = getSelection(activeUnit.comboItem.id, activeUnit.instance);

        return (
            <div className="space-y-4">
                <div>
                    <button
                        type="button"
                        onClick={closeConfigurator}
                        className="text-muted-foreground hover:text-foreground text-sm font-medium"
                    >
                        ← Voltar para o combo
                    </button>

                    <div className="mt-4">
                        <p className="text-muted-foreground text-sm">
                            {existingSelection
                                ? "Editando item do combo"
                                : "Configurando item do combo"}
                        </p>

                        <h2 className="text-xl font-semibold">{getUnitLabel(activeUnit)}</h2>
                    </div>
                </div>

                <ProductConfigurator
                    key={getUnitKey(activeUnit)}
                    product={activeProduct}
                    mode="selection"
                    initialSelection={existingSelection?.selection}
                    selectionLabel={getUnitLabel(activeUnit)}
                    onConfigured={handleConfigured}
                    onCancel={closeConfigurator}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{product.name}</h1>

                {product.description && (
                    <p className="text-muted-foreground mt-2">{product.description}</p>
                )}

                <div className="mt-3 text-xl font-semibold">{formatCurrency(product.price)}</div>
            </div>

            <section className="space-y-3">
                <div>
                    <h2 className="text-lg font-semibold">Configure seu combo</h2>

                    <p className="text-muted-foreground text-sm">
                        Personalize os itens que fazem parte do combo.
                    </p>
                </div>

                {units.map((unit) => {
                    const unitKey = getUnitKey(unit);
                    const configured = isUnitConfigured(unit);
                    const selection = getSelection(unit.comboItem.id, unit.instance);
                    const isLoading = loadingUnitKey === unitKey;
                    const description = unit.comboItem.product.description?.trim();

                    return (
                        <article key={unitKey} className="rounded-xl border p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold">{getUnitLabel(unit)}</h3>

                                    {unit.comboItem.product.type === "SIMPLE" ? (
                                        <p className="text-muted-foreground mt-1 text-sm">
                                            {description || "Incluído no combo"}
                                        </p>
                                    ) : (
                                        <ConfigurationSummary selection={selection} />
                                    )}
                                </div>

                                {unit.comboItem.product.type !== "SIMPLE" && (
                                    <button
                                        type="button"
                                        disabled={loadingUnitKey !== null}
                                        onClick={() => configureUnit(unit)}
                                        className="hover:bg-muted shrink-0 rounded-lg border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed"
                                    >
                                        {isLoading
                                            ? "Carregando..."
                                            : configured
                                              ? "Editar"
                                              : "Configurar"}
                                    </button>
                                )}
                            </div>
                        </article>
                    );
                })}
            </section>

            {error && (
                <div className="border-destructive text-destructive rounded-lg border p-3 text-sm">
                    {error}
                </div>
            )}

            {success && <div className="rounded-lg border p-3 text-sm">{success}</div>}

            <button
                type="button"
                disabled={addingToCart}
                onClick={handleAddToCart}
                className="bg-primary text-primary-foreground w-full rounded-lg p-4 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
                {addingToCart
                    ? "Adicionando..."
                    : `Adicionar combo — ${formatCurrency(product.price)}`}
            </button>
        </div>
    );
}
