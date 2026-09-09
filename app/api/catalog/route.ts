import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            where: {
                active: true,
            },
            orderBy: {
                sortOrder: "asc",
            },
            include: {
                products: {
                    where: {
                        active: true,
                    },
                    orderBy: {
                        sortOrder: "asc",
                    },
                },
            },
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error("Catalog error:", error);

        return NextResponse.json(
            {
                error: "Não foi possível carregar o catálogo.",
            },
            {
                status: 500,
            }
        );
    }
}
