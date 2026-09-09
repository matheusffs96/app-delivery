import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const store = await prisma.store.findFirst({
        where: {
            active: true,
        },
        select: {
            id: true,
            acceptingOrders: true,
            paymentMethods: {
                where: {
                    active: true,
                },
                select: {
                    method: true,
                },
            },
        },
    });

    if (!store) {
        return NextResponse.json(
            {
                error: "Loja não encontrada.",
            },
            {
                status: 404,
            }
        );
    }

    return NextResponse.json({
        storeId: store.id,
        acceptingOrders: store.acceptingOrders,
        paymentMethods: store.paymentMethods.map((item) => item.method),
    });
}
