import Link from "next/link";

import { PromotionRedemptionFlow } from "@/components/promotion/promotion-redemption-flow";
import { prisma } from "@/lib/prisma";

type Props = {
    params: Promise<{
        slug: string;
    }>;
};

export default async function PromotionPage({ params }: Props) {
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
        return <UnavailablePromotion />;
    }

    const now = new Date();

    const available = promotion.active && now >= promotion.startsAt && now <= promotion.endsAt;

    if (!available) {
        return <UnavailablePromotion />;
    }

    if (!promotion.requiresRedemption) {
        return <UnavailablePromotion />;
    }

    return (
        <PromotionRedemptionFlow
            promotion={{
                slug: promotion.slug,
                name: promotion.name,
                description: promotion.description,
                discountPercentage: promotion.discountPercentage?.toString() ?? null,
                discountFixed: promotion.discountFixed?.toString() ?? null,
                freeDelivery: promotion.freeDelivery,
                startsAt: promotion.startsAt.toISOString(),
                endsAt: promotion.endsAt.toISOString(),
                redemptionValidityDays: promotion.redemptionValidityDays,
                paymentMethods: promotion.paymentMethods.map(({ method }) => method),
            }}
        />
    );
}

function UnavailablePromotion() {
    return (
        <main className="mx-auto flex min-h-dvh w-full max-w-md items-center px-6">
            <div className="w-full text-center">
                <h1 className="text-3xl font-bold">Promoção indisponível</h1>

                <p className="text-muted-foreground mt-3">
                    O período para resgatar esta promoção não está disponível.
                </p>

                <Link
                    href="/"
                    className="bg-primary text-primary-foreground mt-8 inline-flex h-12 items-center justify-center rounded-xl px-6 font-semibold"
                >
                    Ver cardápio
                </Link>
            </div>
        </main>
    );
}
