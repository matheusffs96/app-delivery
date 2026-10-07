import { Prisma } from "@/lib/generated/prisma/client";

type TransactionClient = Parameters<
    Parameters<typeof import("@/lib/prisma").prisma.$transaction>[0]
>[0];

type ValidatePromotionInput = {
    code: string;
    customerId: string;
    paymentMethod: "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "CASH";
    subtotal: Prisma.Decimal;
};

export async function validatePromotionRedemption(
    tx: TransactionClient,
    input: ValidatePromotionInput
) {
    const code = input.code.trim().toUpperCase();

    const redemption = await tx.promotionRedemption.findUnique({
        where: {
            code,
        },
        include: {
            promotion: {
                include: {
                    paymentMethods: true,
                },
            },
        },
    });

    if (!redemption) {
        throw new Error("Código promocional inválido.");
    }

    if (redemption.customerId !== input.customerId) {
        throw new Error("Este código promocional pertence a outro cliente.");
    }

    if (redemption.usedAt || redemption.orderId) {
        throw new Error("Este código promocional já foi utilizado.");
    }

    if (new Date() > redemption.expiresAt) {
        throw new Error("Este código promocional expirou.");
    }

    const promotion = redemption.promotion;

    if (!promotion.active) {
        throw new Error("Esta promoção não está ativa.");
    }

    const acceptsPaymentMethod = promotion.paymentMethods.some(
        (item) => item.method === input.paymentMethod
    );

    if (promotion.paymentMethods.length > 0 && !acceptsPaymentMethod) {
        throw new Error("A forma de pagamento selecionada não é válida para esta promoção.");
    }

    if (promotion.minOrderValue && input.subtotal.lt(promotion.minOrderValue)) {
        throw new Error(
            `O pedido mínimo para esta promoção é R$ ${promotion.minOrderValue
                .toNumber()
                .toFixed(2)
                .replace(".", ",")}.`
        );
    }

    let discount = new Prisma.Decimal(0);

    if (promotion.discountPercentage) {
        discount = discount.add(input.subtotal.mul(promotion.discountPercentage).div(100));
    }

    if (promotion.discountFixed) {
        discount = discount.add(promotion.discountFixed);
    }

    /*
     * O desconto nunca pode superar o subtotal.
     */
    if (discount.gt(input.subtotal)) {
        discount = input.subtotal;
    }

    return {
        redemption,
        promotion,
        discount,
        freeDelivery: promotion.freeDelivery,
    };
}
