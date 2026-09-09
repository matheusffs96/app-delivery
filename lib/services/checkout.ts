import { Prisma } from "@/lib/generated/prisma/client";
import { configureCombo } from "@/lib/services/combo-configurator";
import { configureProduct } from "@/lib/services/product-configurator";
import type { CheckoutCalculateInput } from "@/lib/validators/checkout";

export async function calculateCheckout(input: CheckoutCalculateInput) {
    const configuredItems = await Promise.all(
        input.items.map(async (item) => {
            if (item.type === "PRODUCT") {
                const configured = await configureProduct(item.selection);

                return {
                    type: "PRODUCT" as const,
                    input: item,
                    quantity: item.quantity,
                    product: configured,
                    total: configured.totalPrice.mul(item.quantity),
                };
            }

            const configured = await configureCombo({
                productId: item.productId,
                items: item.comboSelections.map((selection) => ({
                    comboItemId: selection.comboItemId,
                    productId: selection.productId,
                    instance: selection.instance,
                    selection: selection.selection,
                })),
            });

            return {
                type: "COMBO" as const,
                input: item,
                quantity: item.quantity,
                product: configured,
                total: configured.totalPrice.mul(item.quantity),
            };
        })
    );

    const subtotal = configuredItems.reduce(
        (total, item) => total.add(item.total),
        new Prisma.Decimal(0)
    );

    return {
        items: configuredItems,
        subtotal,
    };
}
