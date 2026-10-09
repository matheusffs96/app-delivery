import "server-only";

import { Prisma } from "@/lib/generated/prisma/client";
import type { AdminAdjustmentsInput } from "@/lib/validators/admin-adjustments";

type CalculateAdminAdjustmentsInput = {
    subtotal: Prisma.Decimal;
    deliveryFee: Prisma.Decimal;
    adjustments: AdminAdjustmentsInput;
};

export function calculateAdminAdjustments({
    subtotal,
    deliveryFee,
    adjustments,
}: CalculateAdminAdjustmentsInput) {
    const value = new Prisma.Decimal(adjustments.discountValue);

    const rawDiscount =
        adjustments.discountType === "PERCENT" ? subtotal.mul(value).div(100) : value;

    const discount = Prisma.Decimal.min(
        subtotal,
        rawDiscount.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
    );

    const finalDeliveryFee = adjustments.waiveDeliveryFee ? new Prisma.Decimal(0) : deliveryFee;

    const total = subtotal.sub(discount).add(finalDeliveryFee);

    return {
        discount,
        deliveryFee: finalDeliveryFee,
        total,
    };
}
