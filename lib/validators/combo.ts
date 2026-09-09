import { z } from "zod";
import { productSelectionSchema } from "@/lib/validators/product";

export const comboItemSelectionSchema = z.object({
    comboItemId: z.string(),
    productId: z.string(),
    instance: z.number().int().positive(),
    selection: productSelectionSchema.optional(),
});

export const comboSelectionSchema = z.object({
    productId: z.string(),
    items: z.array(comboItemSelectionSchema),
});

export type ComboSelection = z.infer<typeof comboSelectionSchema>;
