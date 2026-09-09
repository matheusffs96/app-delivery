import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { configureProduct } from "@/lib/services/product-configurator";
import type { ComboSelection } from "@/lib/validators/combo";

type ConfiguredComboChild = {
    comboItemId: string;
    productId: string;
    productName: string;
    instance: number;
    type: "SIMPLE" | "COMPOSITE";
    additionalPrice: Prisma.Decimal;
    configuration: Awaited<ReturnType<typeof configureProduct>> | null;
};

type ConfiguredCombo = {
    productId: string;
    productName: string;
    basePrice: Prisma.Decimal;
    additionalPrice: Prisma.Decimal;
    totalPrice: Prisma.Decimal;
    items: ConfiguredComboChild[];
};

function decimal(value: Prisma.Decimal | string | number) {
    return new Prisma.Decimal(value);
}

export async function configureCombo(
    selection: ComboSelection,
    expectedSlug?: string
): Promise<ConfiguredCombo> {
    const combo = await prisma.product.findFirst({
        where: {
            id: selection.productId,
            type: "COMBO",
            active: true,
            ...(expectedSlug ? { slug: expectedSlug } : {}),
        },
        include: {
            comboItems: {
                orderBy: {
                    sortOrder: "asc",
                },
                include: {
                    product: true,
                },
            },
        },
    });

    if (!combo) {
        throw new Error("Combo não encontrado.");
    }

    const expectedUnits = combo.comboItems.flatMap((comboItem) =>
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

    if (selection.items.length !== expectedUnits.length) {
        throw new Error("A composição do combo está incompleta.");
    }

    const configuredItems: ConfiguredComboChild[] = [];

    let additionalPrice = decimal(0);

    for (const expectedUnit of expectedUnits) {
        const { comboItem, instance } = expectedUnit;

        const matches = selection.items.filter(
            (item) => item.comboItemId === comboItem.id && item.instance === instance
        );

        if (matches.length !== 1) {
            throw new Error(
                `A unidade ${instance} de "${comboItem.product.name}" é inválida ou está duplicada.`
            );
        }

        const selectedItem = matches[0];

        if (selectedItem.productId !== comboItem.productId) {
            throw new Error(`Produto inválido no combo: "${comboItem.product.name}".`);
        }

        if (comboItem.product.type === "COMBO") {
            throw new Error("Combos dentro de combos ainda não são suportados.");
        }

        if (comboItem.product.type === "SIMPLE") {
            if (selectedItem.selection) {
                throw new Error(
                    `O produto "${comboItem.product.name}" não possui configuração neste combo.`
                );
            }

            configuredItems.push({
                comboItemId: comboItem.id,
                productId: comboItem.product.id,
                productName: comboItem.product.name,
                instance,
                type: "SIMPLE",
                additionalPrice: decimal(0),
                configuration: null,
            });

            continue;
        }

        if (!selectedItem.selection) {
            throw new Error(`Configure "${comboItem.product.name}" antes de continuar.`);
        }

        if (selectedItem.selection.productId !== comboItem.product.id) {
            throw new Error(`Configuração inválida para "${comboItem.product.name}".`);
        }

        const configuredProduct = await configureProduct(
            selectedItem.selection,
            comboItem.product.slug
        );

        /*
         * Muito importante:
         *
         * Não usamos configuredProduct.totalPrice.
         *
         * O preço-base do filho já está embutido comercialmente
         * no preço do combo.
         *
         * Portanto cobramos somente additionalPrice.
         */
        additionalPrice = additionalPrice.add(configuredProduct.additionalPrice);

        configuredItems.push({
            comboItemId: comboItem.id,
            productId: comboItem.product.id,
            productName: comboItem.product.name,
            instance,
            type: "COMPOSITE",
            additionalPrice: configuredProduct.additionalPrice,
            configuration: configuredProduct,
        });
    }

    /*
     * Também rejeitamos qualquer item que não pertença
     * às unidades esperadas do combo.
     */
    for (const selectedItem of selection.items) {
        const exists = expectedUnits.some(
            ({ comboItem, instance }) =>
                comboItem.id === selectedItem.comboItemId &&
                instance === selectedItem.instance &&
                comboItem.productId === selectedItem.productId
        );

        if (!exists) {
            throw new Error("Foi enviada uma composição que não pertence a este combo.");
        }
    }

    const basePrice = decimal(combo.price);
    const totalPrice = basePrice.add(additionalPrice);

    return {
        productId: combo.id,
        productName: combo.name,
        basePrice,
        additionalPrice,
        totalPrice,
        items: configuredItems,
    };
}
