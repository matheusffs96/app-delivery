import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { promotionCheckRateLimit } from "@/lib/rate-limit";
import { enforcePromotionRateLimit } from "@/lib/promotion-request-limit";

type RouteContext = {
    params: Promise<{ slug: string }>;
};

export async function POST(request: NextRequest, { params }: RouteContext) {
    const { slug } = await params;

    const limited = await enforcePromotionRateLimit(request, promotionCheckRateLimit);

    if (limited) return limited;

    if (slug !== "lancamento") {
        return NextResponse.json({ error: "Promoção indisponível." }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const phone = typeof body?.phone === "string" ? body.phone.replace(/\D/g, "") : "";

    if (phone.length !== 10 && phone.length !== 11) {
        return NextResponse.json({ error: "Informe um telefone válido." }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
        where: { phone },
        select: {
            promotionRedemptions: {
                where: {
                    promotion: { slug },
                },
                select: { id: true },
                take: 1,
            },
        },
    });

    return NextResponse.json({
        alreadyRedeemed: Boolean(customer?.promotionRedemptions.length),
    });
}
