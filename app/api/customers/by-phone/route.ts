import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const phone = request.nextUrl.searchParams.get("phone");
    const normalizedPhone = phone?.replace(/\D/g, "") ?? "";

    if (normalizedPhone.length < 10) {
        return NextResponse.json(
            {
                error: "Telefone inválido.",
            },
            {
                status: 400,
            }
        );
    }

    const customer = await prisma.customer.findUnique({
        where: {
            phone: normalizedPhone,
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            addresses: {
                orderBy: {
                    updatedAt: "desc",
                },
                select: {
                    id: true,
                    label: true,
                    street: true,
                    number: true,
                    complement: true,
                    neighborhood: true,
                    city: true,
                    state: true,
                    zipCode: true,
                    reference: true,
                },
            },
        },
    });

    if (!customer) {
        return NextResponse.json({
            customer: null,
        });
    }

    return NextResponse.json({
        customer,
    });
}
