import { notFound } from "next/navigation";
import { ComboConfigurator } from "@/components/customer/combo-configurator";
import { ProductConfigurator } from "@/components/customer/product-configurator";
import type { ProductDetail } from "@/types/product";

type Props = {
    params: Promise<{
        slug: string;
    }>;
};

async function getProduct(slug: string): Promise<ProductDetail | null> {
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/products/${slug}`,
        {
            cache: "no-store",
        }
    );

    if (!response.ok) {
        return null;
    }

    return response.json();
}

export default async function ProductPage({ params }: Props) {
    const { slug } = await params;

    const product = await getProduct(slug);

    if (!product) {
        notFound();
    }

    if (product.type === "COMBO") {
        return <ComboConfigurator product={product} />;
    }

    return <ProductConfigurator product={product} />;
}
