import { z } from "zod";

export const adminAdjustmentsSchema = z
    .object({
        discountType: z.enum(["FIXED", "PERCENT"]),
        discountValue: z.number().finite().min(0),
        waiveDeliveryFee: z.boolean(),
        reason: z.string().trim().max(500).optional(),
    })
    .superRefine((data, ctx) => {
        if (data.discountType === "PERCENT" && data.discountValue > 100) {
            ctx.addIssue({
                code: "custom",
                path: ["discountValue"],
                message: "O percentual não pode superar 100%.",
            });
        }

        if (
            data.discountType === "FIXED" &&
            Math.round(data.discountValue * 100) / 100 !== data.discountValue
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["discountValue"],
                message: "Informe no máximo duas casas decimais.",
            });
        }
    });

export type AdminAdjustmentsInput = z.infer<typeof adminAdjustmentsSchema>;
