import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import type { PromotionRedemptionInput } from "@/lib/validators/promotion-redemption";

export class PromotionRedemptionError extends Error {
    constructor(
        message: string,
        public status = 400
    ) {
        super(message);
        this.name = "PromotionRedemptionError";
    }
}

function normalizePhone(value: string) {
    return value.replace(/\D/g, "");
}

function normalizeCpf(value?: string) {
    const normalized = value?.replace(/\D/g, "") ?? "";
    return normalized || null;
}

function normalizeEmail(value?: string) {
    const normalized = value?.trim().toLowerCase() ?? "";
    return normalized || null;
}

function normalizeZipCode(value: string) {
    return value.replace(/\D/g, "");
}

function generateRedemptionCode() {
    return `LH-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function redeemPromotion(slug: string, input: PromotionRedemptionInput) {
    const phone = normalizePhone(input.phone);
    const email = normalizeEmail(input.email);
    const cpf = normalizeCpf(input.cpf);

    return prisma.$transaction(async (tx) => {
        const promotion = await tx.promotion.findUnique({
            where: {
                slug,
            },
        });

        if (!promotion || !promotion.active) {
            throw new PromotionRedemptionError("Promoção indisponível.", 404);
        }

        if (!promotion.requiresRedemption) {
            throw new PromotionRedemptionError("Esta promoção não precisa ser resgatada.");
        }

        const now = new Date();

        if (now < promotion.startsAt) {
            throw new PromotionRedemptionError("O período de resgate ainda não começou.");
        }

        if (now > promotion.endsAt) {
            throw new PromotionRedemptionError("O período de resgate desta promoção terminou.");
        }

        if (!promotion.redemptionValidityDays) {
            throw new PromotionRedemptionError(
                "A promoção não possui prazo de utilização configurado.",
                500
            );
        }

        if (promotion.slug === "lancamento") {
            const city = input.address.city.trim().toLowerCase();
            const state = input.address.state.trim().toUpperCase();

            if (city !== "dracena" || state !== "SP") {
                throw new PromotionRedemptionError(
                    "Esta promoção é válida apenas para endereços em Dracena/SP."
                );
            }
        }

        if (email) {
            const customerWithEmail = await tx.customer.findUnique({
                where: {
                    email,
                },
            });

            if (customerWithEmail && customerWithEmail.phone !== phone) {
                throw new PromotionRedemptionError(
                    "Este e-mail já está vinculado a outro cliente.",
                    409
                );
            }
        }

        if (cpf) {
            const customerWithCpf = await tx.customer.findUnique({
                where: {
                    cpf,
                },
            });

            if (customerWithCpf && customerWithCpf.phone !== phone) {
                throw new PromotionRedemptionError(
                    "Este CPF já está vinculado a outro cliente.",
                    409
                );
            }
        }

        let customer = await tx.customer.findUnique({
            where: {
                phone,
            },
        });

        if (customer) {
            // Não alteramos dados de clientes existentes
            // sem autenticação ou confirmação de titularidade.
        } else {
            customer = await tx.customer.create({
                data: {
                    name: input.name.trim(),
                    phone,
                    email,
                    cpf,
                },
            });
        }

        const existingRedemption = await tx.promotionRedemption.findUnique({
            where: {
                promotionId_customerId: {
                    promotionId: promotion.id,
                    customerId: customer.id,
                },
            },
        });

        if (existingRedemption) {
            throw new PromotionRedemptionError(
                "Já existe um resgate associado a este cadastro. Entre em contato com o Los Hermanos para recuperar seu código.",
                409
            );
        }

        /*
         * A promoção de lançamento é exclusiva para
         * clientes que ainda não realizaram pedidos.
         */
        if (promotion.slug === "lancamento") {
            const previousOrder = await tx.order.findFirst({
                where: {
                    customerId: customer.id,
                },
                select: {
                    id: true,
                },
            });

            if (previousOrder) {
                throw new PromotionRedemptionError(
                    "Esta promoção é exclusiva para o primeiro pedido."
                );
            }
        }

        await tx.address.create({
            data: {
                customerId: customer.id,
                street: input.address.street.trim(),
                number: input.address.number.trim(),
                complement: input.address.complement?.trim() || null,
                neighborhood: input.address.neighborhood.trim(),
                city: input.address.city.trim(),
                state: input.address.state.trim().toUpperCase(),
                zipCode: normalizeZipCode(input.address.zipCode),
                reference: input.address.reference?.trim() || null,
            },
        });

        const redeemedAt = new Date();

        const expiresAt = new Date(redeemedAt);
        expiresAt.setDate(expiresAt.getDate() + promotion.redemptionValidityDays);

        /*
         * O código possui aleatoriedade suficiente para tornar uma
         * colisão extremamente improvável. A constraint UNIQUE no
         * banco continua sendo a garantia final.
         */
        const redemption = await tx.promotionRedemption.create({
            data: {
                promotionId: promotion.id,
                customerId: customer.id,
                code: generateRedemptionCode(),
                redeemedAt,
                expiresAt,
            },
        });

        return {
            redemption,
            alreadyRedeemed: false,
        };
    });
}
