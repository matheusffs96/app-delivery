import type { UserRole } from "@/lib/generated/prisma/client";

export type CheckoutPermissions = {
    canApplyManualDiscount: boolean;
    canWaiveDeliveryFee: boolean;
};

export function getCheckoutPermissions(role: UserRole | null): CheckoutPermissions {
    const isAdmin = role === "ADMIN";

    return {
        canApplyManualDiscount: isAdmin,
        canWaiveDeliveryFee: isAdmin,
    };
}
