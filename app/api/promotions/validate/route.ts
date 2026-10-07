import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { calculateCheckout } from "@/lib/services/checkout";
import { validatePromotionRedemption } from "@/lib/services/promotion";
import { checkoutItemSchema } from "@/lib/validators/checkout";

const promotionValidationSchema = z.object({
    code: z.string().trim().min(1, "Informe o código promocional."),

    phone: z
        .string()
        .trim()
        .refine((value) => {
            const digits = value.replace(/\D/g, "");
            return digits.length === 10 || digits.length === 11;
        }, "Informe um telefone válido."),

    paymentMethod: z.enum(["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH"]),

    items: z.array(checkoutItemSchema).min(1, "O carrinho está vazio."),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const parsed = promotionValidationSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    valid: false,
                    error: "Dados inválidos.",
                    issues: parsed.error.flatten(),
                },
                {
                    status: 400,
                }
            );
        }

        const phone = parsed.data.phone.replace(/\D/g, "");

        /*
         * A pré-validação nunca cria ou atualiza clientes.
         */
        const customer = await prisma.customer.findUnique({
            where: {
                phone,
            },
        });

        if (!customer) {
            return NextResponse.json(
                {
                    valid: false,
                    error: "Não encontramos este código para o cliente informado.",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * Recalculamos os itens no servidor. O frontend não informa
         * subtotal, desconto ou total.
         */
        const calculated = await calculateCheckout({
            items: parsed.data.items,
        });

        const result = await prisma.$transaction(async (tx) => {
            return validatePromotionRedemption(tx, {
                code: parsed.data.code,
                customerId: customer.id,
                paymentMethod: parsed.data.paymentMethod,
                subtotal: calculated.subtotal,
            });
        });

        /*
         * Por enquanto a taxa-base de entrega é zero, assim como
         * no serviço de criação do pedido.
         */
        const deliveryFee = calculated.subtotal.mul(0);

        const total = calculated.subtotal.add(deliveryFee).sub(result.discount);

        return NextResponse.json({
            valid: true,

            code: result.redemption.code,

            promotion: {
                name: result.promotion.name,
                freeDelivery: result.freeDelivery,
            },

            subtotal: calculated.subtotal.toNumber(),
            discount: result.discount.toNumber(),
            deliveryFee: deliveryFee.toNumber(),
            total: total.toNumber(),
        });
    } catch (error) {
        return NextResponse.json(
            {
                valid: false,
                error:
                    error instanceof Error ? error.message : "Não foi possível validar a promoção.",
            },
            {
                status: 400,
            }
        );
    }
}
