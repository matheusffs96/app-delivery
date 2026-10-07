import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
    params: Promise<{
        slug: string;
    }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
    const { slug } = await params;

    const promotion = await prisma.promotion.findUnique({
        where: {
            slug,
        },
        include: {
            paymentMethods: {
                select: {
                    method: true,
                },
            },
        },
    });

    if (!promotion) {
        return NextResponse.json(
            {
                error: "Promoção não encontrada.",
            },
            {
                status: 404,
            }
        );
    }

    const now = new Date();

    const available = promotion.active && now >= promotion.startsAt && now <= promotion.endsAt;

    return NextResponse.json({
        promotion: {
            slug: promotion.slug,
            name: promotion.name,
            description: promotion.description,

            discountPercentage: promotion.discountPercentage?.toString() ?? null,

            discountFixed: promotion.discountFixed?.toString() ?? null,

            freeDelivery: promotion.freeDelivery,

            minOrderValue: promotion.minOrderValue?.toString() ?? null,

            startsAt: promotion.startsAt,
            endsAt: promotion.endsAt,

            requiresRedemption: promotion.requiresRedemption,
            redemptionValidityDays: promotion.redemptionValidityDays,

            paymentMethods: promotion.paymentMethods.map((item) => item.method),

            available,
        },
    });
}
