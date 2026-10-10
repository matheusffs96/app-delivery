import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";

export async function enforcePromotionRateLimit(request: NextRequest, limiter: Ratelimit) {
    const forwardedFor = request.headers.get("x-forwarded-for");

    // Na Vercel, o primeiro IP é atribuído pela infraestrutura.
    // Não exponha este endpoint em uma origem que aceite
    // x-forwarded-for arbitrário sem um proxy confiável.
    const ip = forwardedFor?.split(",")[0]?.trim();

    if (!ip) {
        return NextResponse.json(
            { error: "Não foi possível validar a origem da solicitação." },
            { status: 503 }
        );
    }

    try {
        const result = await limiter.limit(ip);

        if (!result.success) {
            return NextResponse.json(
                {
                    error: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
                },
                {
                    status: 429,
                    headers: {
                        "Retry-After": String(
                            Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))
                        ),
                    },
                }
            );
        }
    } catch {
        return NextResponse.json(
            { error: "Verificação temporariamente indisponível." },
            { status: 503 }
        );
    }

    return null;
}
