import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Props = {
    params: Promise<{
        orderNumber: string;
    }>;
};

export async function GET(_request: Request, { params }: Props) {
    const { orderNumber } = await params;

    const parsedOrderNumber = Number(orderNumber);

    if (!Number.isInteger(parsedOrderNumber) || parsedOrderNumber <= 0) {
        return NextResponse.json(
            {
                error: "Número do pedido inválido.",
            },
            {
                status: 400,
            }
        );
    }

    const order = await prisma.order.findUnique({
        where: {
            orderNumber: parsedOrderNumber,
        },
        include: {
            customer: true,
            payment: true,
            items: {
                where: {
                    parentItemId: null,
                },
                orderBy: {
                    createdAt: "asc",
                },
                include: {
                    options: true,
                    childItems: {
                        orderBy: {
                            createdAt: "asc",
                        },
                        include: {
                            options: true,
                        },
                    },
                },
            },
        },
    });

    if (!order) {
        return NextResponse.json(
            {
                error: "Pedido não encontrado.",
            },
            {
                status: 404,
            }
        );
    }

    return NextResponse.json({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        fulfillmentType: order.fulfillmentType,

        customer: {
            name: order.customer.name,
            phone: order.customer.phone,
        },

        delivery:
            order.fulfillmentType === "DELIVERY"
                ? {
                      street: order.deliveryStreet,
                      number: order.deliveryNumber,
                      complement: order.deliveryComplement,
                      neighborhood: order.deliveryNeighborhood,
                      city: order.deliveryCity,
                      state: order.deliveryState,
                      zipCode: order.deliveryZipCode,
                      reference: order.deliveryReference,
                  }
                : null,

        payment: order.payment
            ? {
                  method: order.payment.method,
                  status: order.payment.status,
                  amount: order.payment.amount.toNumber(),
              }
            : null,

        subtotal: order.subtotal.toNumber(),
        deliveryFee: order.deliveryFee.toNumber(),
        discount: order.discount.toNumber(),
        total: order.total.toNumber(),

        items: order.items.map((item) => ({
            id: item.id,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toNumber(),
            totalPrice: item.totalPrice.toNumber(),
            notes: item.notes,

            options: item.options.map((option) => ({
                id: option.id,
                name: option.name,
                price: option.price.toNumber(),
                quantity: option.quantity,
            })),

            childItems: item.childItems.map((child) => ({
                id: child.id,
                productName: child.productName,
                quantity: child.quantity,
                notes: child.notes,

                options: child.options.map((option) => ({
                    id: option.id,
                    name: option.name,
                    price: option.price.toNumber(),
                    quantity: option.quantity,
                })),
            })),
        })),

        createdAt: order.createdAt,
    });
}
