import Link from "next/link";

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

    return (
        <main className="mx-auto max-w-4xl px-4 py-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Nosso cardápio</h1>

                <p className="text-muted-foreground">Escolha seus favoritos.</p>
            </div>

            <div className="space-y-10">
                {categories.map((category) => (
                    <section key={category.id} className="space-y-4">
                        <h2 className="text-xl font-bold">{category.name}</h2>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {category.products.map((product) => (
                                <Link
                                    key={product.id}
                                    href={`/produto/${product.slug}`}
                                    className="hover:bg-muted rounded-xl border p-4 transition"
                                >
                                    {product.imageUrl && (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="mb-4 aspect-video w-full rounded-lg object-cover"
                                        />
                                    )}

                                    <h3 className="font-semibold">{product.name}</h3>

                                    {product.description && (
                                        <p className="text-muted-foreground mt-1 text-sm">
                                            {product.description}
                                        </p>
                                    )}

                                    <p className="mt-3 font-semibold">
                                        R$ {Number(product.price).toFixed(2)}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </main>
    );
}
