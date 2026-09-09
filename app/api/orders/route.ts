import { NextResponse } from "next/server";
import { createOrder } from "@/lib/services/order";
import { checkoutSchema } from "@/lib/validators/checkout";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const parsed = checkoutSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Dados do pedido inválidos.",

                    issues: parsed.error.flatten(),
                },
                {
                    status: 400,
                }
            );
        }

        const result = await createOrder(parsed.data);

        return NextResponse.json(
            {
                orderId: result.order.id,

                orderNumber: result.order.orderNumber,

                status: result.order.status,

                total: result.order.total.toNumber(),
            },
            {
                status: 201,
            }
        );
    } catch (error) {
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Não foi possível criar o pedido.",
            },
            {
                status: 400,
            }
        );
    }
}
