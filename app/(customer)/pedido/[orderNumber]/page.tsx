import { notFound } from "next/navigation";

type Props = {
    params: Promise<{
        orderNumber: string;
    }>;
};

type OrderDetail = {
    orderNumber: string;
    status: string;
    fulfillmentType: "DELIVERY" | "PICKUP";

    customer: {
        name: string;
        phone: string;
    };

    delivery: {
        street: string | null;
        number: string | null;
        complement: string | null;
        neighborhood: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        reference: string | null;
    } | null;

    payment: {
        method: string;
        status: string;
        amount: number;
    } | null;

    subtotal: number;
    deliveryFee: number;
    discount: number;
    total: number;

    items: {
        id: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        notes: string | null;

        options: {
            id: string;
            name: string;
            price: number;
            quantity: number;
        }[];

        childItems: {
            id: string;
            productName: string;
            quantity: number;
            notes: string | null;

            options: {
                id: string;
                name: string;
                price: number;
                quantity: number;
            }[];
        }[];
    }[];
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

async function getOrder(orderNumber: string): Promise<OrderDetail | null> {
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/orders/${orderNumber}`,
        {
            cache: "no-store",
        }
    );

    if (!response.ok) {
        return null;
    }

    return response.json();
}

export default async function OrderPage({ params }: Props) {
    const { orderNumber } = await params;

    const order = await getOrder(orderNumber);

    if (!order) {
        notFound();
    }

    return (
        <main className="mx-auto max-w-2xl px-4 py-6">
            <div className="space-y-2">
                <p className="text-muted-foreground text-sm">Pedido</p>

                <h1 className="text-2xl font-bold">#{order.orderNumber}</h1>

                <p className="text-muted-foreground text-sm">Status: {order.status}</p>
            </div>

            <section className="mt-8 space-y-4">
                <h2 className="text-lg font-semibold">Itens</h2>

                <div className="space-y-4">
                    {order.items.map((item) => (
                        <div key={item.id} className="rounded-xl border p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="font-medium">
                                        {item.quantity}× {item.productName}
                                    </p>
                                </div>

                                <p className="font-medium">{formatCurrency(item.totalPrice)}</p>
                            </div>

                            {item.options.length > 0 && (
                                <div className="text-muted-foreground mt-3 space-y-1 text-sm">
                                    {item.options.map((option) => (
                                        <p key={option.id}>
                                            {option.quantity > 1 ? `${option.quantity}× ` : ""}
                                            {option.name}
                                        </p>
                                    ))}
                                </div>
                            )}

                            {item.notes && (
                                <p className="text-muted-foreground mt-3 text-sm">
                                    Observação: {item.notes}
                                </p>
                            )}

                            {item.childItems.length > 0 && (
                                <div className="mt-4 space-y-3 border-t pt-4">
                                    {item.childItems.map((child) => (
                                        <div key={child.id}>
                                            <p className="text-sm font-medium">
                                                {child.productName}
                                            </p>

                                            {child.options.length > 0 && (
                                                <div className="text-muted-foreground mt-1 space-y-1 text-sm">
                                                    {child.options.map((option) => (
                                                        <p key={option.id}>
                                                            {option.quantity > 1
                                                                ? `${option.quantity}× `
                                                                : ""}
                                                            {option.name}
                                                        </p>
                                                    ))}
                                                </div>
                                            )}

                                            {child.notes && (
                                                <p className="text-muted-foreground mt-1 text-sm">
                                                    Observação: {child.notes}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            <section className="mt-8 rounded-xl border p-4">
                <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                </div>

                {order.deliveryFee > 0 && (
                    <div className="mt-2 flex justify-between text-sm">
                        <span>Entrega</span>
                        <span>{formatCurrency(order.deliveryFee)}</span>
                    </div>
                )}

                {order.discount > 0 && (
                    <div className="mt-2 flex justify-between text-sm">
                        <span>Desconto</span>
                        <span>- {formatCurrency(order.discount)}</span>
                    </div>
                )}

                <div className="mt-4 flex justify-between border-t pt-4 font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(order.total)}</span>
                </div>
            </section>

            <section className="mt-8 space-y-2">
                <h2 className="text-lg font-semibold">Pagamento</h2>

                {order.payment ? (
                    <>
                        <p className="text-sm">{order.payment.method}</p>

                        <p className="text-muted-foreground text-sm">
                            Status: {order.payment.status}
                        </p>
                    </>
                ) : (
                    <p className="text-muted-foreground text-sm">Pagamento não encontrado.</p>
                )}
            </section>

            <section className="mt-8 space-y-2">
                <h2 className="text-lg font-semibold">
                    {order.fulfillmentType === "DELIVERY" ? "Entrega" : "Retirada"}
                </h2>

                {order.delivery ? (
                    <div className="text-muted-foreground text-sm">
                        <p>
                            {order.delivery.street}, {order.delivery.number}
                        </p>

                        {order.delivery.complement && <p>{order.delivery.complement}</p>}

                        <p>
                            {order.delivery.neighborhood} — {order.delivery.city}/
                            {order.delivery.state}
                        </p>

                        <p>CEP: {order.delivery.zipCode}</p>

                        {order.delivery.reference && <p>Referência: {order.delivery.reference}</p>}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-sm">Retirada no estabelecimento.</p>
                )}
            </section>
        </main>
    );
}
