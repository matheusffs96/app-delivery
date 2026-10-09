"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ShoppingBag } from "lucide-react";
import { useSyncExternalStore } from "react";

import { useCartStore } from "@/stores/cart-store";

function subscribe(onStoreChange: () => void) {
    return useCartStore.persist.onFinishHydration(onStoreChange);
}

export function CustomerNavigation() {
    const pathname = usePathname();

    const hydrated = useSyncExternalStore(
        subscribe,
        () => useCartStore.persist.hasHydrated(),
        () => false
    );

    const items = useCartStore((state) => state.items);

    const quantity = hydrated ? items.reduce((total, item) => total + item.quantity, 0) : 0;

    const links = [
        {
            href: "/",
            label: "Cardápio",
            icon: BookOpen,
            active: pathname === "/" || pathname.startsWith("/produto/"),
        },
        {
            href: "/carrinho",
            label: "Carrinho",
            icon: ShoppingBag,
            active: pathname === "/carrinho",
        },
    ];

    return (
        <>
            <nav
                aria-label="Navegação principal"
                className="bg-background fixed inset-x-0 top-0 z-50 hidden border-b sm:block"
            >
                <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
                    <Link href="/" className="font-bold">
                        Los Hermanos
                    </Link>

                    <div className="flex items-center gap-2">
                        {links.map((link) => {
                            const Icon = link.icon;

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    aria-current={link.active ? "page" : undefined}
                                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                                        link.active
                                            ? "bg-muted text-foreground"
                                            : "text-muted-foreground hover:bg-muted"
                                    }`}
                                >
                                    <Icon size={18} />
                                    {link.label}

                                    {link.href === "/carrinho" && quantity > 0 && (
                                        <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                                            {quantity}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>

            <nav
                aria-label="Navegação inferior"
                className="bg-background fixed inset-x-0 bottom-0 z-50 border-t pb-[env(safe-area-inset-bottom)] sm:hidden"
            >
                <div className="grid grid-cols-2">
                    {links.map((link) => {
                        const Icon = link.icon;

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                aria-current={link.active ? "page" : undefined}
                                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium ${
                                    link.active ? "text-foreground" : "text-muted-foreground"
                                }`}
                            >
                                <span className="relative">
                                    <Icon size={21} />

                                    {link.href === "/carrinho" && quantity > 0 && (
                                        <span className="bg-primary text-primary-foreground absolute -top-2 -right-4 flex min-h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px]">
                                            {quantity}
                                        </span>
                                    )}
                                </span>

                                {link.label}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
