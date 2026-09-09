import { NextResponse } from "next/server";
import { configureCombo } from "@/lib/services/combo-configurator";
import { comboSelectionSchema } from "@/lib/validators/combo";

type Props = {
    params: Promise<{
        slug: string;
    }>;
};

export async function POST(request: Request, { params }: Props) {
    try {
        const { slug } = await params;

        const body = await request.json();

        const parsed = comboSelectionSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Configuração do combo inválida.",
                    issues: parsed.error.flatten(),
                },
                {
                    status: 400,
                }
            );
        }

        const configured = await configureCombo(parsed.data, slug);

        return NextResponse.json({
            productId: configured.productId,
            productName: configured.productName,
            basePrice: configured.basePrice.toNumber(),
            additionalPrice: configured.additionalPrice.toNumber(),
            totalPrice: configured.totalPrice.toNumber(),

            items: configured.items.map((item) => ({
                comboItemId: item.comboItemId,
                productId: item.productId,
                productName: item.productName,
                instance: item.instance,
                type: item.type,
                additionalPrice: item.additionalPrice.toNumber(),

                configuration: item.configuration
                    ? {
                          productId: item.configuration.productId,
                          productName: item.configuration.productName,
                          basePrice: item.configuration.basePrice.toNumber(),
                          additionalPrice: item.configuration.additionalPrice.toNumber(),
                          totalPrice: item.configuration.totalPrice.toNumber(),

                          options: item.configuration.options.map((option) => ({
                              ...option,
                              price: option.price.toNumber(),
                          })),

                          components: item.configuration.components.map((component) => ({
                              ...component,
                              unitPrice: component.unitPrice.toNumber(),
                          })),

                          componentOptions: item.configuration.componentOptions.map((option) => ({
                              ...option,
                              price: option.price.toNumber(),
                          })),

                          addons: item.configuration.addons.map((addon) => ({
                              ...addon,
                              price: addon.price.toNumber(),
                          })),

                          notes: item.configuration.notes,
                      }
                    : null,
            })),
        });
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    error instanceof Error ? error.message : "Não foi possível configurar o combo.",
            },
            {
                status: 400,
            }
        );
    }
}
