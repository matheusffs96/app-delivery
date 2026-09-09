import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateCheckout } from "@/lib/services/checkout";
import { findOrCreateCustomer } from "@/lib/services/customer";
import type { CheckoutInput } from "@/lib/validators/checkout";

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function createProductOrderItem(
    tx: TransactionClient,
    orderId: string,
    item: Awaited<ReturnType<typeof calculateCheckout>>["items"][number]
) {
    if (item.type !== "PRODUCT") {
        throw new Error("Item de produto inválido.");
    }

    const configured = item.product;

    const orderItem = await tx.orderItem.create({
        data: {
            orderId,
            productId: configured.productId,
            productName: configured.productName,
            unitPrice: configured.totalPrice,
            quantity: item.quantity,
            totalPrice: item.total,
            notes: configured.notes ?? null,
        },
    });

    const options = [
        ...configured.options.map((option) => ({
            orderItemId: orderItem.id,
            name: option.name,
            price: option.price,
            quantity: option.quantity,
        })),

        ...configured.components.map((component) => ({
            orderItemId: orderItem.id,
            name: component.productName,
            price: component.unitPrice,
            quantity: component.quantity,
        })),

        ...configured.componentOptions.map((option) => ({
            orderItemId: orderItem.id,
            name: option.name,
            price: option.price,
            quantity: option.quantity,
        })),

        ...configured.addons.map((addon) => ({
            orderItemId: orderItem.id,
            name: addon.name,
            price: addon.price,
            quantity: addon.quantity,
        })),
    ];

    if (options.length > 0) {
        await tx.orderItemOption.createMany({
            data: options,
        });
    }
}

async function createComboOrderItem(
    tx: TransactionClient,
    orderId: string,
    item: Awaited<ReturnType<typeof calculateCheckout>>["items"][number]
) {
    if (item.type !== "COMBO") {
        throw new Error("Item de combo inválido.");
    }

    const configured = item.product;

    const parentItem = await tx.orderItem.create({
        data: {
            orderId,
            productId: configured.productId,
            productName: configured.productName,
            unitPrice: configured.totalPrice,
            quantity: item.quantity,
            totalPrice: item.total,
        },
    });

    for (const child of configured.items) {
        const childItem = await tx.orderItem.create({
            data: {
                orderId,
                parentItemId: parentItem.id,
                productId: child.productId,
                productName: child.productName,

                /*
                 * O filho não é cobrado novamente.
                 * O valor comercial pertence ao combo pai.
                 */
                unitPrice: new Prisma.Decimal(0),
                quantity: 1,
                totalPrice: new Prisma.Decimal(0),

                notes: child.configuration?.notes ?? null,
            },
        });

        if (!child.configuration) {
            continue;
        }

        const childOptions = [
            ...child.configuration.options.map((option) => ({
                orderItemId: childItem.id,
                name: option.name,
                price: option.price,
                quantity: option.quantity,
            })),

            ...child.configuration.components.map((component) => ({
                orderItemId: childItem.id,
                name: component.productName,
                price: component.unitPrice,
                quantity: component.quantity,
            })),

            ...child.configuration.componentOptions.map((option) => ({
                orderItemId: childItem.id,
                name: option.name,
                price: option.price,
                quantity: option.quantity,
            })),

            ...child.configuration.addons.map((addon) => ({
                orderItemId: childItem.id,
                name: addon.name,
                price: addon.price,
                quantity: addon.quantity,
            })),
        ];

        if (childOptions.length > 0) {
            await tx.orderItemOption.createMany({
                data: childOptions,
            });
        }
    }
}

export async function createOrder(input: CheckoutInput) {
    const store = await prisma.store.findFirst({
        where: {
            active: true,
        },
        include: {
            paymentMethods: {
                where: {
                    active: true,
                },
            },
        },
    });

    if (!store) {
        throw new Error("Loja não encontrada.");
    }

    if (!store.acceptingOrders) {
        throw new Error("A loja não está aceitando pedidos no momento.");
    }

    const acceptsPaymentMethod = store.paymentMethods.some(
        (item) => item.method === input.paymentMethod
    );

    if (!acceptsPaymentMethod) {
        throw new Error("A forma de pagamento selecionada não é aceita pela loja.");
    }

    const calculated = await calculateCheckout({
        items: input.items,
    });

    const subtotal = calculated.subtotal;

    /*
     * Taxa de entrega ainda é zero.
     * Vamos evoluir a regra depois.
     */
    const deliveryFee = new Prisma.Decimal(0);

    const discount = new Prisma.Decimal(0);

    const total = subtotal.add(deliveryFee).sub(discount);

    if (input.paymentMethod === "CASH" && input.cashReceived !== undefined) {
        const cashReceived = new Prisma.Decimal(input.cashReceived);

        if (cashReceived.lt(total)) {
            throw new Error("O valor em dinheiro é menor que o total do pedido.");
        }
    }

    const customer = await findOrCreateCustomer(input.customer);

    return prisma.$transaction(async (tx) => {
        let addressId: string | null = null;

        if (input.fulfillmentType === "DELIVERY") {
            if (!input.address) {
                throw new Error("Informe o endereço para entrega.");
            }

            const address = await tx.address.create({
                data: {
                    customerId: customer.id,

                    street: input.address.street,

                    number: input.address.number,

                    complement: input.address.complement || null,

                    neighborhood: input.address.neighborhood,

                    city: input.address.city,

                    state: input.address.state,

                    zipCode: input.address.zipCode,

                    reference: input.address.reference || null,
                },
            });

            addressId = address.id;
        }

        const order = await tx.order.create({
            data: {
                customerId: customer.id,

                addressId,

                status: "PENDING",

                fulfillmentType: input.fulfillmentType,

                subtotal,

                deliveryFee,

                discount,

                total,

                deliveryStreet: input.fulfillmentType === "DELIVERY" ? input.address?.street : null,

                deliveryNumber: input.fulfillmentType === "DELIVERY" ? input.address?.number : null,

                deliveryComplement:
                    input.fulfillmentType === "DELIVERY" ? input.address?.complement || null : null,

                deliveryNeighborhood:
                    input.fulfillmentType === "DELIVERY" ? input.address?.neighborhood : null,

                deliveryCity: input.fulfillmentType === "DELIVERY" ? input.address?.city : null,

                deliveryState: input.fulfillmentType === "DELIVERY" ? input.address?.state : null,

                deliveryZipCode:
                    input.fulfillmentType === "DELIVERY" ? input.address?.zipCode : null,

                deliveryReference:
                    input.fulfillmentType === "DELIVERY" ? input.address?.reference || null : null,

                cashReceived:
                    input.paymentMethod === "CASH" && input.cashReceived !== undefined
                        ? new Prisma.Decimal(input.cashReceived)
                        : null,

                payment: {
                    create: {
                        method: input.paymentMethod,

                        status: "PENDING",

                        amount: total,
                    },
                },
            },
        });

        for (const item of calculated.items) {
            if (item.type === "PRODUCT") {
                await createProductOrderItem(tx, order.id, item);
                continue;
            }

            await createComboOrderItem(tx, order.id, item);
        }

        return {
            order,
            calculated,
        };
    });
}
