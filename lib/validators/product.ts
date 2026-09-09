import { z } from "zod";

export const productOptionSchema = z.object({
    optionId: z.string(),
    quantity: z.number().int().positive().default(1),
});

export const productComponentItemSchema = z.object({
    componentItemId: z.string(),
    quantity: z.number().int().positive().default(1),
});

export const productComponentOptionSchema = z.object({
    componentOptionId: z.string(),
    quantity: z.number().int().positive().default(1),
});

export const productSelectionSchema = z.object({
    productId: z.string(),

    options: z.array(productOptionSchema).default([]),

    componentItems: z.array(productComponentItemSchema).default([]),

    componentOptions: z.array(productComponentOptionSchema).default([]),

    addons: z
        .array(
            z.object({
                addonId: z.string(),
                quantity: z.number().int().positive().default(1),
            })
        )
        .default([]),

    notes: z.string().max(500).optional(),
});

export type ProductSelection = z.infer<typeof productSelectionSchema>;
