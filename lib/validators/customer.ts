import { z } from "zod";

export const customerIdentificationSchema = z.object({
    name: z.string().trim().min(2, "Informe seu nome."),

    phone: z.string().trim().min(10, "Informe um telefone válido."),

    email: z.string().trim().email("Informe um e-mail válido.").optional().or(z.literal("")),
});

export type CustomerIdentificationInput = z.infer<typeof customerIdentificationSchema>;
