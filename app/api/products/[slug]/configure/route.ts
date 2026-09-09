import { NextResponse } from "next/server";
import { productSelectionSchema } from "@/lib/validators/product";
import { configureProduct } from "@/lib/services/product-configurator";

type RouteContext = {
    params: Promise<{
        slug: string;
    }>;
};

export async function POST(request: Request, context: RouteContext) {
    try {
        const { slug } = await context.params;

        const body = await request.json();

        const parsed = productSelectionSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Dados de configuração inválidos.",
                    details: parsed.error.flatten(),
                },
                {
                    status: 400,
                }
            );
        }

        const configuredProduct = await configureProduct(parsed.data, slug);

        return NextResponse.json(configuredProduct);
    } catch (error) {
        console.error("Configure product error:", error);

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível configurar o produto.",
            },
            {
                status: 400,
            }
        );
    }
}
