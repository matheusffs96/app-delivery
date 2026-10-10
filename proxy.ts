import { NextRequest, NextResponse } from "next/server";

const PROMOTION_PATH = "/promocao/lancamento";
const REDEMPTION_API = "/api/promotions/lancamento/redeem";
const CHECK_REDEMPTION_API = "/api/promotions/lancamento/check-redemption";

export function proxy(request: NextRequest) {
    if (process.env.PROMOTION_ONLY_MODE !== "true") {
        return NextResponse.next();
    }

    const pathname = request.nextUrl.pathname;

    // Página pública da campanha.
    if (pathname === PROMOTION_PATH || pathname === `${PROMOTION_PATH}/`) {
        return NextResponse.next();
    }

    // Endpoint necessário para emitir o código.
    if (pathname === REDEMPTION_API) {
        if (request.method === "POST") {
            return NextResponse.next();
        }

        return new NextResponse(null, { status: 405 });
    }

    if (pathname === CHECK_REDEMPTION_API) {
        if (request.method === "POST") {
            return NextResponse.next();
        }

        return new NextResponse(null, { status: 405 });
    }

    // Bloqueia as demais APIs.
    if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Recurso indisponível." }, { status: 404 });
    }

    // Redireciona outras páginas para a campanha.
    const url = request.nextUrl.clone();
    url.pathname = PROMOTION_PATH;
    url.search = "";

    return NextResponse.redirect(url);
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2)$).*)",
    ],
};
