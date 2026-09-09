import { NextResponse } from "next/server";
import { checkoutCalculateSchema } from "@/lib/validators/checkout";
import { calculateCheckout } from "@/lib/services/checkout";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const parsed = checkoutCalculateSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Dados do checkout inválidos.",
                    details: parsed.error.flatten(),
                },
                {
                    status: 400,
                }
            );
        }

        const checkout = await calculateCheckout(parsed.data);

        return NextResponse.json({
            items: checkout.items.map((item) => ({
                type: item.type,
                quantity: item.quantity,
                productId: item.product.productId,
                productName: item.product.productName,
                unitPrice: item.product.totalPrice.toNumber(),
                total: item.total.toNumber(),
            })),

            subtotal: checkout.subtotal.toNumber(),
        });
    } catch (error) {
        console.error("Checkout calculation error:", error);

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível calcular o checkout.",
            },
            {
                status: 400,
            }
        );
    }
}
