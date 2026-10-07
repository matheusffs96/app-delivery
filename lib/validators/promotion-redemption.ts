import { z } from "zod";

const optionalEmail = z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .optional()
    .or(z.literal(""));

const optionalCpf = z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || value.replace(/\D/g, "").length === 11, "Informe um CPF válido.");

export const promotionRedemptionSchema = z.object({
    name: z.string().trim().min(2, "Informe seu nome."),

    phone: z
        .string()
        .trim()
        .refine((value) => {
            const digits = value.replace(/\D/g, "");
            return digits.length === 10 || digits.length === 11;
        }, "Informe um telefone válido."),

    email: optionalEmail,
    cpf: optionalCpf,

    address: z.object({
        street: z.string().trim().min(2, "Informe a rua."),
        number: z.string().trim().min(1, "Informe o número."),
        complement: z.string().trim().optional().or(z.literal("")),
        neighborhood: z.string().trim().min(2, "Informe o bairro."),
        city: z.string().trim().min(2, "Informe a cidade."),
        state: z.string().trim().length(2, "Informe a UF."),
        zipCode: z
            .string()
            .trim()
            .refine((value) => value.replace(/\D/g, "").length === 8, "Informe um CEP válido."),
        reference: z.string().trim().optional().or(z.literal("")),
    }),
});

export type PromotionRedemptionInput = z.infer<typeof promotionRedemptionSchema>;
