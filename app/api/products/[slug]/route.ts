import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
    params: Promise<{
        slug: string;
    }>;
};

export async function GET(_request: Request, context: RouteContext) {
    try {
        const { slug } = await context.params;

        const product = await prisma.product.findFirst({
            where: {
                slug,
                active: true,
            },
            include: {
                category: true,

                optionGroups: {
                    where: {
                        active: true,
                    },
                    orderBy: {
                        sortOrder: "asc",
                    },
                    include: {
                        options: {
                            where: {
                                active: true,
                            },
                            orderBy: {
                                sortOrder: "asc",
                            },
                        },
                    },
                },

                componentGroups: {
                    where: {
                        active: true,
                    },
                    orderBy: {
                        sortOrder: "asc",
                    },
                    include: {
                        items: {
                            where: {
                                active: true,
                            },
                            orderBy: {
                                sortOrder: "asc",
                            },
                            include: {
                                product: {
                                    select: {
                                        id: true,
                                        name: true,
                                        slug: true,
                                        price: true,
                                        imageUrl: true,
                                        active: true,
                                    },
                                },
                            },
                        },

                        options: {
                            where: {
                                active: true,
                            },
                            orderBy: {
                                sortOrder: "asc",
                            },
                        },
                    },
                },

                addons: {
                    include: {
                        addon: true,
                    },
                    orderBy: {
                        sortOrder: "asc",
                    },
                },

                comboItems: {
                    orderBy: {
                        sortOrder: "asc",
                    },
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                price: true,
                                type: true,
                                imageUrl: true,
                                active: true,
                            },
                        },
                    },
                },
            },
        });

        if (!product) {
            return NextResponse.json(
                {
                    error: "Produto não encontrado.",
                },
                {
                    status: 404,
                }
            );
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error("Product detail error:", error);

        return NextResponse.json(
            {
                error: "Não foi possível carregar o produto.",
            },
            {
                status: 500,
            }
        );
    }
}
