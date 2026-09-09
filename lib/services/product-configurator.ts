import { prisma } from "@/lib/prisma";
import { ProductSelection } from "@/lib/validators/product";
import { Prisma } from "@/lib/generated/prisma/client";

type ConfiguredItem = {
    productId: string;
    productName: string;
    unitPrice: Prisma.Decimal;
    quantity: number;
};

type ConfiguredOption = {
    id: string;
    name: string;
    price: Prisma.Decimal;
    quantity: number;
};

type ConfiguredProduct = {
    productId: string;
    productName: string;
    basePrice: Prisma.Decimal;
    additionalPrice: Prisma.Decimal;
    totalPrice: Prisma.Decimal;
    options: ConfiguredOption[];
    components: ConfiguredItem[];
    componentOptions: ConfiguredOption[];
    addons: ConfiguredOption[];
    notes?: string;
};

function decimal(value: Prisma.Decimal | string | number) {
    return new Prisma.Decimal(value);
}

function validateSelectionCount(
    groupName: string,
    count: number,
    minSelect: number,
    maxSelect: number | null,
    required: boolean
) {
    if (required && count === 0) {
        throw new Error(`O grupo "${groupName}" é obrigatório.`);
    }

    if (count < minSelect) {
        throw new Error(`O grupo "${groupName}" exige pelo menos ${minSelect} seleção(ões).`);
    }

    if (maxSelect !== null && count > maxSelect) {
        throw new Error(`O grupo "${groupName}" permite no máximo ${maxSelect} seleção(ões).`);
    }
}

export async function configureProduct(
    selection: ProductSelection,
    expectedSlug?: string
): Promise<ConfiguredProduct> {
    const product = await prisma.product.findFirst({
        where: {
            id: selection.productId,
            active: true,
            ...(expectedSlug
                ? {
                      slug: expectedSlug,
                  }
                : {}),
        },
        include: {
            optionGroups: {
                where: {
                    active: true,
                },
                include: {
                    options: {
                        where: {
                            active: true,
                        },
                    },
                },
            },

            componentGroups: {
                where: {
                    active: true,
                },
                include: {
                    items: {
                        where: {
                            active: true,
                        },
                        include: {
                            product: true,
                        },
                    },
                    options: {
                        where: {
                            active: true,
                        },
                    },
                },
            },

            addons: {
                include: {
                    addon: true,
                },
            },
        },
    });

    if (!product) {
        throw new Error("Produto não encontrado.");
    }

    const configuredOptions: ConfiguredOption[] = [];
    const configuredComponents: ConfiguredItem[] = [];
    const configuredComponentOptions: ConfiguredOption[] = [];
    const configuredAddons: ConfiguredOption[] = [];

    let additionalPrice = decimal(0);

    // ============================================================
    // OPTIONS
    // ============================================================

    for (const group of product.optionGroups) {
        const selected = selection.options.filter((selectionOption) =>
            group.options.some((option) => option.id === selectionOption.optionId)
        );

        const uniqueOptionIds = new Set(selected.map((item) => item.optionId));

        validateSelectionCount(
            group.name,
            uniqueOptionIds.size,
            group.minSelect,
            group.maxSelect,
            group.required
        );

        for (const selectedOption of selected) {
            const option = group.options.find((item) => item.id === selectedOption.optionId);

            if (!option) {
                throw new Error(`Opção inválida no grupo "${group.name}".`);
            }

            const quantity = selectedOption.quantity;

            configuredOptions.push({
                id: option.id,
                name: option.name,
                price: option.price,
                quantity,
            });

            additionalPrice = additionalPrice.add(decimal(option.price).mul(quantity));
        }
    }

    // ============================================================
    // COMPONENTS
    // ============================================================

    for (const group of product.componentGroups) {
        const selectedProducts = selection.componentItems.filter((selected) =>
            group.items.some((item) => item.id === selected.componentItemId)
        );

        const selectedOptions = selection.componentOptions.filter((selectionOption) =>
            group.options.some((option) => option.id === selectionOption.componentOptionId)
        );

        const selectedCount =
            selectedProducts.reduce((total, item) => total + item.quantity, 0) +
            selectedOptions.reduce((total, item) => total + item.quantity, 0);

        validateSelectionCount(
            group.name,
            selectedCount,
            group.minSelect,
            group.maxSelect,
            group.required
        );

        for (const selectedItem of selectedProducts) {
            const component = group.items.find((item) => item.id === selectedItem.componentItemId);

            if (!component) {
                throw new Error(`Componente inválido no grupo "${group.name}".`);
            }

            const quantity = selectedItem.quantity;

            const price = decimal(component.additionalPrice);

            configuredComponents.push({
                productId: component.product.id,
                productName: component.product.name,
                unitPrice: price,
                quantity,
            });

            additionalPrice = additionalPrice.add(price.mul(quantity));
        }

        for (const selectedOption of selectedOptions) {
            const option = group.options.find(
                (item) => item.id === selectedOption.componentOptionId
            );

            if (!option) {
                throw new Error(`Opção de componente inválida no grupo "${group.name}".`);
            }

            const quantity = selectedOption.quantity;
            const price = decimal(option.additionalPrice);

            configuredComponentOptions.push({
                id: option.id,
                name: option.name,
                price,
                quantity,
            });

            additionalPrice = additionalPrice.add(price.mul(quantity));
        }
    }

    // ============================================================
    // ADDONS
    // ============================================================

    for (const selectedAddon of selection.addons) {
        const addon = product.addons.find(
            (item) => item.addonId === selectedAddon.addonId && item.addon.active
        );

        if (!addon) {
            throw new Error("Adicional inválido.");
        }

        const quantity = selectedAddon.quantity;
        const price = decimal(addon.addon.price);

        configuredAddons.push({
            id: addon.addon.id,
            name: addon.addon.name,
            price,
            quantity,
        });

        additionalPrice = additionalPrice.add(price.mul(quantity));
    }

    const basePrice = decimal(product.price);
    const totalPrice = basePrice.add(additionalPrice);

    return {
        productId: product.id,
        productName: product.name,
        basePrice,
        additionalPrice,
        totalPrice,
        options: configuredOptions,
        components: configuredComponents,
        componentOptions: configuredComponentOptions,
        addons: configuredAddons,
        notes: selection.notes,
    };
}
