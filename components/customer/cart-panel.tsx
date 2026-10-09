"use client";

import { CartContent } from "@/components/customer/cart-content";

export function CartPanel() {
    return (
        <aside
            aria-label="Resumo do carrinho"
            className="bg-card flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border"
        >
            <div className="flex min-h-0 flex-1 flex-col p-4">
                <CartContent variant="sidebar" />
            </div>
        </aside>
    );
}
