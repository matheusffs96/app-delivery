import { z } from "zod";
import { productSelectionSchema } from "@/lib/validators/product";
import { customerIdentificationSchema } from "@/lib/validators/customer";

const checkoutProductItemSchema = z.object({
    type: z.literal("PRODUCT"),
    quantity: z.number().int().positive(),
    selection: productSelectionSchema,
});

const checkoutComboSelectionSchema = z.object({
    comboItemId: z.string(),
    productId: z.string(),
    instance: z.number().int().positive(),
    selection: productSelectionSchema.optional(),
});

const checkoutComboItemSchema = z.object({
    type: z.literal("COMBO"),
    productId: z.string(),
    quantity: z.number().int().positive(),
    comboSelections: z.array(checkoutComboSelectionSchema),
});

export const checkoutItemSchema = z.discriminatedUnion("type", [
    checkoutProductItemSchema,
    checkoutComboItemSchema,
]);

export const checkoutCalculateSchema = z.object({
    items: z.array(checkoutItemSchema).min(1, "O carrinho está vazio."),
});

export const checkoutAddressSchema = z.object({
    street: z.string().min(1, "Informe a rua."),

    number: z.string().min(1, "Informe o número."),

    complement: z.string().optional(),

    neighborhood: z.string().min(1, "Informe o bairro."),

    city: z.string().min(1, "Informe a cidade."),

    state: z.string().length(2, "Informe a UF."),

    zipCode: z.string().min(8, "Informe o CEP."),

    reference: z.string().optional(),
});

export const checkoutSchema = z
    .object({
        customer: customerIdentificationSchema,

        items: z.array(checkoutItemSchema).min(1, "O carrinho está vazio."),

        fulfillmentType: z.enum(["DELIVERY", "PICKUP"]),

        address: checkoutAddressSchema.optional(),

        paymentMethod: z.enum(["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH"]),

        cashReceived: z.number().positive().optional(),
    })
    .superRefine((data, ctx) => {
        if (data.fulfillmentType === "DELIVERY" && !data.address) {
            ctx.addIssue({
                code: "custom",
                path: ["address"],
                message: "Informe o endereço para entrega.",
            });
        }

        if (data.paymentMethod === "CASH" && data.cashReceived === undefined) {
            ctx.addIssue({
                code: "custom",
                path: ["cashReceived"],
                message: "Informe o valor que será pago em dinheiro.",
            });
        }
    });

export type CheckoutCalculateInput = z.infer<typeof checkoutCalculateSchema>;

export type CheckoutInput = z.infer<typeof checkoutSchema>;
