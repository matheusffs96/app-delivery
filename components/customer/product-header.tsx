import type { ProductDetail } from "@/types/product";

type Props = {
    product: Pick<ProductDetail, "name" | "description" | "price">;
};

const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});

export function ProductHeader({ product }: Props) {
    return (
        <header className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>

            {product.description && (
                <p className="text-muted-foreground text-sm">{product.description}</p>
            )}

            <p className="text-lg font-semibold">{currency.format(Number(product.price))}</p>
        </header>
    );
}
