import type { ReactNode } from "react";

import { CartPanel } from "@/components/customer/cart-panel";

export function CustomerWorkspace({ children }: { children: ReactNode }) {
    return (
        <div className="mx-auto grid h-full min-h-0 w-full max-w-[1600px] grid-cols-1 gap-6 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-6 2xl:grid-cols-[minmax(0,1fr)_420px]">
            <section
                aria-label="Cardápio e personalização"
                className="customer-scroll min-w-0 lg:pr-2"
            >
                {children}
            </section>

            <aside className="hidden min-h-0 min-w-0 lg:flex">
                <CartPanel />
            </aside>
        </div>
    );
}
