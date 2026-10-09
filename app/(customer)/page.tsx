import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, UtensilsCrossed } from "lucide-react";

type Category = {
    id: string;
    name: string;
    slug: string;
    products: {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        price: string | number;
        imageUrl: string | null;
    }[];
};

function formatCurrency(value: number | string) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(value));
}

async function getCatalog(): Promise<Category[]> {
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/catalog`,
        {
            cache: "no-store",
        }
    );

    if (!response.ok) {
        throw new Error("Não foi possível carregar o catálogo.");
    }

    return response.json();
}

export default async function CustomerHomePage() {
    const categories = await getCatalog();

    const availableCategories = categories.filter((category) => category.products.length > 0);

    return (
        <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-8">
            <header className="mb-8 space-y-2">
                <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
                    Los Hermanos
                </p>

                <h1 className="text-3xl font-bold tracking-tight">Nosso cardápio</h1>

                <p className="text-muted-foreground text-sm">
                    Escolha seus favoritos e monte seu pedido do seu jeito.
                </p>
            </header>

            {availableCategories.length === 0 ? (
                <div className="rounded-xl border px-4 py-12 text-center">
                    <UtensilsCrossed size={30} className="text-muted-foreground mx-auto mb-3" />

                    <h2 className="font-semibold">Cardápio indisponível</h2>

                    <p className="text-muted-foreground mt-2 text-sm">
                        Ainda não há produtos disponíveis.
                    </p>
                </div>
            ) : (
                <div className="space-y-10">
                    {availableCategories.map((category) => (
                        <section key={category.id} className="space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-xl font-bold">{category.name}</h2>

                                <span className="text-muted-foreground text-xs">
                                    {category.products.length}{" "}
                                    {category.products.length === 1 ? "opção" : "opções"}
                                </span>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                {category.products.map((product) => (
                                    <Link
                                        key={product.id}
                                        href={`/produto/${product.slug}`}
                                        className="group bg-card hover:bg-muted/30 overflow-hidden rounded-xl border transition-colors"
                                    >
                                        {product.imageUrl && (
                                            <div className="bg-muted relative aspect-[16/9] w-full overflow-hidden">
                                                <Image
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    fill
                                                    sizes="(max-width: 640px) 100vw, 50vw"
                                                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                                    unoptimized
                                                />
                                            </div>
                                        )}

                                        <div className="flex min-h-32 flex-col justify-between gap-4 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <h3 className="leading-snug font-semibold">
                                                        {product.name}
                                                    </h3>

                                                    {product.description && (
                                                        <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                                                            {product.description}
                                                        </p>
                                                    )}
                                                </div>

                                                <span className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5">
                                                    <ArrowUpRight size={17} />
                                                </span>
                                            </div>

                                            <div className="flex items-end justify-between gap-3">
                                                <strong className="text-base">
                                                    {formatCurrency(product.price)}
                                                </strong>

                                                <span className="text-muted-foreground group-hover:text-foreground text-xs font-medium">
                                                    Ver produto
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </main>
    );
}
