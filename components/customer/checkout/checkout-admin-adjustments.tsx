"use client";

import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

export type AdminAdjustments = {
    discountType: "FIXED" | "PERCENT";
    discountValue: number;
    waiveDeliveryFee: boolean;
};

type Props = {
    subtotal: number;
    deliveryFee: number;
    onChange?: (adjustments: AdminAdjustments) => void;
};

const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});

export function CheckoutAdminAdjustments({ subtotal, deliveryFee, onChange }: Props) {
    const [discountType, setDiscountType] = useState<AdminAdjustments["discountType"]>("FIXED");

    const [discountValue, setDiscountValue] = useState(0);
    const [waiveDeliveryFee, setWaiveDeliveryFee] = useState(false);

    const safeSubtotal = Math.max(0, subtotal);
    const safeDeliveryFee = Math.max(0, deliveryFee);

    const discount =
        discountType === "PERCENT"
            ? (safeSubtotal * Math.min(discountValue, 100)) / 100
            : Math.min(discountValue, safeSubtotal);

    const total = Math.max(0, safeSubtotal - discount + (waiveDeliveryFee ? 0 : safeDeliveryFee));

    function update(next: AdminAdjustments) {
        setDiscountType(next.discountType);
        setDiscountValue(next.discountValue);
        setWaiveDeliveryFee(next.waiveDeliveryFee);
        onChange?.(next);
    }

    const current = {
        discountType,
        discountValue,
        waiveDeliveryFee,
    };

    return (
        <details className="group rounded-xl border">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 marker:content-none [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-3">
                    <SlidersHorizontal className="text-primary size-5" />

                    <div>
                        <h2 className="font-semibold">Ajustes administrativos</h2>

                        <p className="text-muted-foreground mt-1 text-xs">
                            Descontos e isenção de entrega
                        </p>
                    </div>
                </div>

                <ChevronDown className="text-muted-foreground size-5 shrink-0 transition-transform duration-200 group-open:rotate-180" />
            </summary>

            <div className="space-y-4 border-t p-4">
                <fieldset className="space-y-2">
                    <legend className="text-sm font-medium">Tipo de desconto</legend>

                    <div className="grid grid-cols-2 gap-2">
                        {(
                            [
                                ["FIXED", "Valor (R$)"],
                                ["PERCENT", "Percentual (%)"],
                            ] as const
                        ).map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                aria-pressed={discountType === value}
                                onClick={() =>
                                    update({
                                        ...current,
                                        discountType: value,
                                        discountValue: 0,
                                    })
                                }
                                className={`rounded-lg border p-3 text-sm ${
                                    discountType === value
                                        ? "border-primary bg-primary/5 font-semibold"
                                        : ""
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </fieldset>

                <label className="block space-y-2">
                    <span className="text-sm font-medium">Valor do desconto</span>

                    <input
                        type="number"
                        min={0}
                        max={discountType === "PERCENT" ? 100 : safeSubtotal}
                        step={discountType === "PERCENT" ? 1 : 0.01}
                        value={discountValue}
                        onChange={(event) => {
                            const value = Number(event.target.value);
                            const limit = discountType === "PERCENT" ? 100 : safeSubtotal;

                            update({
                                ...current,
                                discountValue: Number.isFinite(value)
                                    ? Math.min(Math.max(0, value), limit)
                                    : 0,
                            });
                        }}
                        className="bg-background w-full rounded-lg border px-3 py-2"
                    />
                </label>

                <label className="flex items-center gap-3 rounded-lg border p-3">
                    <input
                        type="checkbox"
                        checked={waiveDeliveryFee}
                        onChange={(event) =>
                            update({
                                ...current,
                                waiveDeliveryFee: event.target.checked,
                            })
                        }
                        className="accent-primary size-4"
                    />

                    <span className="text-sm">Isentar taxa de entrega</span>
                </label>

                <div className="space-y-2 border-t pt-4 text-sm">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{currency.format(safeSubtotal)}</span>
                    </div>

                    <div className="flex justify-between">
                        <span>Desconto simulado</span>
                        <span className="text-primary">- {currency.format(discount)}</span>
                    </div>

                    <div className="flex justify-between">
                        <span>Entrega</span>
                        <span>
                            {waiveDeliveryFee ? "Grátis" : currency.format(safeDeliveryFee)}
                        </span>
                    </div>

                    <div className="flex justify-between border-t pt-3 font-semibold">
                        <span>Total simulado</span>
                        <span>{currency.format(total)}</span>
                    </div>
                </div>
            </div>
        </details>
    );
}
