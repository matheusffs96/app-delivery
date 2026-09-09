import { prisma } from "@/lib/prisma";
import type { CustomerIdentificationInput } from "@/lib/validators/customer";

function normalizePhone(phone: string) {
    return phone.replace(/\D/g, "");
}

export async function findOrCreateCustomer(input: CustomerIdentificationInput) {
    const phone = normalizePhone(input.phone);
    const email = input.email?.trim() || null;

    const existingCustomer = await prisma.customer.findUnique({
        where: {
            phone,
        },
    });

    if (existingCustomer) {
        return prisma.customer.update({
            where: {
                id: existingCustomer.id,
            },
            data: {
                name: input.name.trim(),
                ...(email
                    ? {
                          email,
                      }
                    : {}),
            },
        });
    }

    return prisma.customer.create({
        data: {
            name: input.name.trim(),
            phone,
            email,
        },
    });
}
