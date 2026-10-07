import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { PromotionRedemptionError, redeemPromotion } from "@/lib/services/promotion-redemption";

import { promotionRedemptionSchema } from "@/lib/validators/promotion-redemption";

type RouteContext = {
    params: Promise<{
        slug: string;
    }>;
};

export async function POST(request: NextRequest, { params }: RouteContext) {
    try {
        const { slug } = await params;
        const body = await request.json();

        const input = promotionRedemptionSchema.parse(body);

        const result = await redeemPromotion(slug, input);

        return NextResponse.json({
            redemption: {
                code: result.redemption.code,
                redeemedAt: result.redemption.redeemedAt,
                expiresAt: result.redemption.expiresAt,
                alreadyRedeemed: result.alreadyRedeemed,
            },
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                {
                    error: "Dados inválidos.",
                    issues: error.issues,
                },
                {
                    status: 400,
                }
            );
        }

        if (error instanceof PromotionRedemptionError) {
            return NextResponse.json(
                {
                    error: error.message,
                },
                {
                    status: error.status,
                }
            );
        }

        console.error("Erro ao resgatar promoção:", error);

        return NextResponse.json(
            {
                error: "Não foi possível resgatar a promoção.",
            },
            {
                status: 500,
            }
        );
    }
}
