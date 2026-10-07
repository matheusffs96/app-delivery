import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RouteContext = {
    params: Promise<{
        slug: string;
    }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
    const { slug } = await params;

    const phone = request.nextUrl.searchParams.get("phone")?.replace(/\D/g, "");

    if (!phone || (phone.length !== 10 && phone.length !== 11)) {
        return NextResponse.json(
            {
                error: "Informe um telefone válido.",
            },
            {
                status: 400,
            }
        );
    }

    const promotion = await prisma.promotion.findUnique({
        where: {
            slug,
        },
        select: {
            id: true,
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

    const customer = await prisma.customer.findUnique({
        where: {
            phone,
        },
        select: {
            id: true,
        },
    });

    if (!customer) {
        return NextResponse.json({
            redemption: null,
        });
    }

    const redemption = await prisma.promotionRedemption.findUnique({
        where: {
            promotionId_customerId: {
                promotionId: promotion.id,
                customerId: customer.id,
            },
        },
        select: {
            code: true,
            redeemedAt: true,
            expiresAt: true,
        },
    });

    if (!redemption) {
        return NextResponse.json({
            redemption: null,
        });
    }

    return NextResponse.json({
        redemption: {
            ...redemption,
            alreadyRedeemed: true,
        },
    });
}
