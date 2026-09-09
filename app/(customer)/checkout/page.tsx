"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCartStore } from "@/stores/cart-store";

type FulfillmentType = "DELIVERY" | "PICKUP";

type PaymentMethod = "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "CASH";

type AddressForm = {
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    reference: string;
};

type CheckoutResult = {
    subtotal: number;

    items: {
        type: "PRODUCT" | "COMBO";
        productId: string;
        productName: string;
        unitPrice: number;
        quantity: number;
        total: number;
    }[];
};

type StoreCheckoutConfig = {
    storeId: string;
    acceptingOrders: boolean;
    paymentMethods: PaymentMethod[];
};

type CustomerForm = {
    name: string;
    phone: string;
    email: string;
};

type SavedAddress = {
    id: string;
    label: string | null;
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    reference: string | null;
};

type CustomerLookupResponse = {
    customer: {
        id: string;
        name: string;
        email: string | null;
        phone: string;
        addresses: SavedAddress[];
    } | null;
};

type AddressSearchResult = {
    cep: string;
    logradouro: string;
    complemento: string;
    bairro: string;
    localidade: string;
    uf: string;
};

const initialAddress: AddressForm = {
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    reference: "",
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

function parseCurrency(value: string) {
    const normalized = value
        .replace(/\s/g, "")
        .replace("R$", "")
        .replace(/\./g, "")
        .replace(",", ".");

    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : 0;
}

const paymentMethodLabels: Record<
    PaymentMethod,
    {
        label: string;
        description: string;
    }
> = {
    PIX: {
        label: "PIX",
        description: "Pagamento via PIX",
    },

    CREDIT_CARD: {
        label: "Cartão de crédito",
        description: "Pagamento com cartão de crédito",
    },

    DEBIT_CARD: {
        label: "Cartão de débito",
        description: "Pagamento com cartão de débito",
    },

    CASH: {
        label: "Dinheiro",
        description: "Pagamento em dinheiro",
    },
};

export default function CheckoutPage() {
    const lastSearchedPhone = useRef("");

    const clear = useCartStore((state) => state.clear);
    const items = useCartStore((state) => state.items);

    const [checkout, setCheckout] = useState<CheckoutResult | null>(null);

    const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("DELIVERY");

    const [address, setAddress] = useState<AddressForm>(initialAddress);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

    const [cashReceived, setCashReceived] = useState("");
    const [loading, setLoading] = useState(items.length > 0);
    const [error, setError] = useState("");

    const [storeConfig, setStoreConfig] = useState<StoreCheckoutConfig | null>(null);

    const [loadingStoreConfig, setLoadingStoreConfig] = useState(true);
    const [loadingCep, setLoadingCep] = useState(false);
    const [cepError, setCepError] = useState("");

    const [customer, setCustomer] = useState<CustomerForm>({
        name: "",
        phone: "",
        email: "",
    });

    const [submitting, setSubmitting] = useState(false);

    const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
    const [loadingCustomer, setLoadingCustomer] = useState(false);
    const [customerFound, setCustomerFound] = useState(false);

    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

    const [addressSearch, setAddressSearch] = useState("");
    const [addressSearchResults, setAddressSearchResults] = useState<AddressSearchResult[]>([]);
    const [loadingAddressSearch, setLoadingAddressSearch] = useState(false);
    const [addressSearchError, setAddressSearchError] = useState("");

    const [loadingLocation, setLoadingLocation] = useState(false);
    const [locationError, setLocationError] = useState("");

    useEffect(() => {
        if (items.length === 0) {
            return;
        }

        async function calculate() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch("/api/checkout/calculate", {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify({
                        items: items.map((item) => {
                            if (item.type === "PRODUCT") {
                                return {
                                    type: "PRODUCT" as const,
                                    quantity: item.quantity,
                                    selection: item.selection,
                                };
                            }

                            return {
                                type: "COMBO" as const,
                                productId: item.productId,
                                quantity: item.quantity,

                                comboSelections: item.comboSelections.map((selection) => ({
                                    comboItemId: selection.comboItemId,
                                    productId: selection.productId,
                                    instance: selection.instance,
                                    selection: selection.selection,
                                })),
                            };
                        }),
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error ?? "Não foi possível calcular o checkout.");
                }

                setCheckout(data);
            } catch (error) {
                setError(
                    error instanceof Error ? error.message : "Não foi possível calcular o checkout."
                );
            } finally {
                setLoading(false);
            }
        }

        calculate();
    }, [items]);

    useEffect(() => {
        async function loadStoreConfig() {
            try {
                setLoadingStoreConfig(true);

                const response = await fetch("/api/store/checkout-config", {
                    cache: "no-store",
                });

                const data: StoreCheckoutConfig = await response.json();

                if (!response.ok) {
                    throw new Error("Não foi possível carregar as configurações da loja.");
                }

                setStoreConfig(data);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Não foi possível carregar as configurações da loja."
                );
            } finally {
                setLoadingStoreConfig(false);
            }
        }

        loadStoreConfig();
    }, []);

    async function searchCustomer(phone: string) {
        const normalizedPhone = phone.replace(/\D/g, "");

        if (normalizedPhone.length < 10) {
            setCustomerFound(false);
            setSavedAddresses([]);
            return;
        }

        try {
            setLoadingCustomer(true);

            const response = await fetch(
                `/api/customers/by-phone?phone=${encodeURIComponent(normalizedPhone)}`
            );

            const data = (await response.json()) as CustomerLookupResponse & {
                error?: string;
            };

            if (!response.ok) {
                throw new Error(data.error ?? "Não foi possível buscar o cliente.");
            }

            if (!data.customer) {
                setCustomerFound(false);
                setSavedAddresses([]);

                setCustomer((current) => ({
                    ...current,
                    name: "",
                    email: "",
                }));

                return;
            }
            setCustomerFound(true);
            setSavedAddresses(data.customer.addresses);

            setCustomer((current) => ({
                ...current,
                name: data.customer?.name ?? "",
                email: data.customer?.email ?? "",
            }));
        } catch (error) {
            setCustomerFound(false);
            setSavedAddresses([]);

            setError(error instanceof Error ? error.message : "Não foi possível buscar o cliente.");
        } finally {
            setLoadingCustomer(false);
        }
    }

    useEffect(() => {
        const normalizedPhone = customer.phone.replace(/\D/g, "");

        if (normalizedPhone.length < 10) {
            return;
        }

        if (lastSearchedPhone.current === normalizedPhone) {
            return;
        }

        const timeout = window.setTimeout(() => {
            lastSearchedPhone.current = normalizedPhone;
            searchCustomer(normalizedPhone);
        }, 500);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [customer.phone]);

    const cashValue = useMemo(() => parseCurrency(cashReceived), [cashReceived]);

    const change = useMemo(() => {
        if (!checkout || paymentMethod !== "CASH") {
            return 0;
        }

        return Math.max(cashValue - checkout.subtotal, 0);
    }, [cashValue, checkout, paymentMethod]);

    function formatPhone(value: string) {
        const digits = value.replace(/\D/g, "").slice(0, 11);

        if (digits.length <= 10) {
            return digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
        }

        return digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
    }

    function updateCustomer(field: keyof CustomerForm, value: string) {
        setCustomer((current) => ({
            ...current,
            [field]: value,
        }));
    }

    function updateAddress(field: keyof AddressForm, value: string) {
        setSelectedAddressId(null);

        setAddress((current) => ({
            ...current,
            [field]: value,
        }));
    }

    function selectAddressSearchResult(result: AddressSearchResult) {
        setSelectedAddressId(null);

        setAddress((current) => ({
            ...current,
            zipCode: result.cep.replace(/\D/g, ""),
            street: result.logradouro,
            neighborhood: result.bairro,
            city: result.localidade,
            state: result.uf,
        }));

        setAddressSearch(result.logradouro);
        setAddressSearchResults([]);
        setAddressSearchError("");
    }

    async function useCurrentLocation() {
        setLocationError("");

        if (!navigator.geolocation) {
            setLocationError("Seu dispositivo não oferece suporte à localização.");
            return;
        }

        try {
            setLoadingLocation(true);

            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000,
                });
            });

            const { latitude, longitude } = position.coords;

            const response = await fetch(
                `/api/geolocation/reverse?lat=${latitude}&lng=${longitude}`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error ?? "Não foi possível identificar seu endereço.");
            }

            setSelectedAddressId(null);

            setAddress((current) => ({
                ...current,
                street: data.street ?? "",
                number: data.number ?? "",
                neighborhood: data.neighborhood ?? "",
                city: data.city ?? "",
                state: data.state ?? "",
                zipCode: data.zipCode ?? "",
            }));

            setAddressSearch(data.street ?? "");
            setAddressSearchResults([]);
            setCepError("");
        } catch (error) {
            if (error instanceof GeolocationPositionError) {
                if (error.code === error.PERMISSION_DENIED) {
                    setLocationError("Permita o acesso à localização para usar este recurso.");
                    return;
                }

                if (error.code === error.POSITION_UNAVAILABLE) {
                    setLocationError("Não foi possível determinar sua localização.");
                    return;
                }

                if (error.code === error.TIMEOUT) {
                    setLocationError("A localização demorou muito para responder.");
                    return;
                }
            }

            setLocationError(
                error instanceof Error ? error.message : "Não foi possível usar sua localização."
            );
        } finally {
            setLoadingLocation(false);
        }
    }

    async function searchAddress() {
        const street = addressSearch.trim();
        const city = address.city.trim();
        const state = address.state.trim().toUpperCase();

        if (state.length !== 2) {
            setAddressSearchError("Informe a UF antes de pesquisar.");
            return;
        }

        if (city.length < 3) {
            setAddressSearchError("Informe a cidade antes de pesquisar.");
            return;
        }

        if (street.length < 3) {
            setAddressSearchError("Digite pelo menos 3 caracteres da rua.");
            return;
        }

        try {
            setLoadingAddressSearch(true);
            setAddressSearchError("");
            setAddressSearchResults([]);

            const response = await fetch(
                `https://viacep.com.br/ws/${encodeURIComponent(state)}/${encodeURIComponent(
                    city
                )}/${encodeURIComponent(street)}/json/`
            );

            if (!response.ok) {
                throw new Error("Não foi possível pesquisar o endereço.");
            }

            const data = (await response.json()) as AddressSearchResult[];

            if (!Array.isArray(data) || data.length === 0) {
                setAddressSearchError("Nenhum endereço encontrado.");
                return;
            }

            setAddressSearchResults(data);
        } catch (error) {
            setAddressSearchError(
                error instanceof Error ? error.message : "Não foi possível pesquisar o endereço."
            );
        } finally {
            setLoadingAddressSearch(false);
        }
    }

    async function searchCep(zipCode: string) {
        const normalizedZipCode = zipCode.replace(/\D/g, "");

        if (normalizedZipCode.length !== 8) {
            return;
        }

        try {
            setSelectedAddressId(null);
            setLoadingCep(true);
            setCepError("");

            const response = await fetch(`https://viacep.com.br/ws/${normalizedZipCode}/json/`);

            if (!response.ok) {
                throw new Error("Não foi possível consultar o CEP.");
            }

            const data = await response.json();

            if (data.erro) {
                throw new Error("CEP não encontrado.");
            }

            setAddress((current) => ({
                ...current,
                zipCode: normalizedZipCode,
                street: data.logradouro ?? "",
                neighborhood: data.bairro ?? "",
                city: data.localidade ?? "",
                state: data.uf ?? "",
            }));
        } catch (error) {
            setCepError(
                error instanceof Error ? error.message : "Não foi possível consultar o CEP."
            );
        } finally {
            setLoadingCep(false);
        }
    }

    function selectPaymentMethod(method: PaymentMethod) {
        setPaymentMethod(method);
        setError("");

        if (method !== "CASH") {
            setCashReceived("");
        }
    }

    async function handleContinue() {
        setError("");

        if (!checkout) {
            return;
        }

        if (!storeConfig) {
            setError("Não foi possível carregar as configurações da loja.");
            return;
        }

        if (!storeConfig.acceptingOrders) {
            setError("A loja não está aceitando pedidos no momento.");
            return;
        }

        if (!customer.name.trim()) {
            setError("Informe seu nome.");
            return;
        }

        if (customer.name.trim().length < 2) {
            setError("Informe um nome válido.");
            return;
        }

        const normalizedPhone = customer.phone.replace(/\D/g, "");

        if (normalizedPhone.length < 10) {
            setError("Informe um telefone válido.");
            return;
        }

        if (fulfillmentType === "DELIVERY") {
            if (!address.street.trim()) {
                setError("Informe a rua.");
                return;
            }

            if (!address.number.trim()) {
                setError("Informe o número.");
                return;
            }

            if (!address.neighborhood.trim()) {
                setError("Informe o bairro.");
                return;
            }

            if (!address.city.trim()) {
                setError("Informe a cidade.");
                return;
            }

            if (address.state.trim().length !== 2) {
                setError("Informe a UF.");
                return;
            }

            if (!address.zipCode.trim()) {
                setError("Informe o CEP.");
                return;
            }
        }

        if (!paymentMethod) {
            setError("Selecione uma forma de pagamento.");
            return;
        }

        if (!storeConfig.paymentMethods.includes(paymentMethod)) {
            setError("A forma de pagamento selecionada não é mais aceita pela loja.");
            return;
        }

        if (paymentMethod === "CASH") {
            if (cashValue <= 0) {
                setError("Informe o valor que será pago em dinheiro.");
                return;
            }

            if (cashValue < checkout.subtotal) {
                setError(
                    `O valor em dinheiro deve ser pelo menos ${formatCurrency(checkout.subtotal)}.`
                );
                return;
            }
        }

        const checkoutPayload = {
            customer: {
                name: customer.name.trim(),
                phone: customer.phone,
                email: customer.email.trim(),
            },

            items: items.map((item) => {
                if (item.type === "PRODUCT") {
                    return {
                        type: "PRODUCT" as const,
                        quantity: item.quantity,
                        selection: item.selection,
                    };
                }

                return {
                    type: "COMBO" as const,
                    productId: item.productId,
                    quantity: item.quantity,
                    comboSelections: item.comboSelections.map((selection) => ({
                        comboItemId: selection.comboItemId,
                        productId: selection.productId,
                        instance: selection.instance,
                        selection: selection.selection,
                    })),
                };
            }),

            fulfillmentType,

            addressId:
                fulfillmentType === "DELIVERY" && selectedAddressId ? selectedAddressId : undefined,

            address: fulfillmentType === "DELIVERY" && !selectedAddressId ? address : undefined,

            paymentMethod,

            cashReceived: paymentMethod === "CASH" ? cashValue : undefined,
        };

        try {
            setSubmitting(true);

            const response = await fetch("/api/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(checkoutPayload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error ?? "Não foi possível criar o pedido.");
            }

            clear();

            window.location.href = `/pedido/${data.orderNumber}`;
        } catch (error) {
            setError(error instanceof Error ? error.message : "Não foi possível criar o pedido.");
        } finally {
            setSubmitting(false);
        }
    }

    if (loading || loadingStoreConfig) {
        return (
            <main className="mx-auto max-w-2xl px-4 py-6">
                <p>Calculando pedido...</p>
            </main>
        );
    }

    if (items.length === 0) {
        return (
            <main className="mx-auto max-w-2xl px-4 py-6">
                <h1 className="text-2xl font-bold">Checkout</h1>

                <p className="text-muted-foreground mt-4">Seu carrinho está vazio.</p>
            </main>
        );
    }

    if (!checkout) {
        return (
            <main className="mx-auto max-w-2xl px-4 py-6">
                {error && (
                    <div className="border-destructive text-destructive rounded-lg border p-4">
                        {error}
                    </div>
                )}
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-2xl px-4 py-6">
            <h1 className="text-2xl font-bold">Finalizar pedido</h1>
            <section className="mt-8 space-y-4">
                <div>
                    <h2 className="text-lg font-semibold">Seus dados</h2>

                    <p className="text-muted-foreground text-sm">
                        Precisamos dessas informações para identificar seu pedido.
                    </p>
                </div>

                <div className="space-y-3">
                    <input
                        value={customer.name}
                        onChange={(event) => updateCustomer("name", event.target.value)}
                        placeholder="Nome"
                        className="w-full rounded-lg border p-3"
                    />

                    <input
                        value={customer.phone}
                        onChange={(event) => {
                            const formattedPhone = formatPhone(event.target.value);

                            updateCustomer("phone", formattedPhone);

                            if (formattedPhone.replace(/\D/g, "").length < 10) {
                                setCustomerFound(false);
                                setSavedAddresses([]);
                                lastSearchedPhone.current = "";
                            }
                        }}
                        placeholder="Telefone"
                        inputMode="tel"
                        maxLength={15}
                        className="w-full rounded-lg border p-3"
                    />

                    {loadingCustomer && (
                        <p className="text-muted-foreground text-sm">Buscando seus dados...</p>
                    )}

                    {customerFound && (
                        <p className="text-sm">
                            Cliente encontrado. Seus dados foram preenchidos automaticamente.
                        </p>
                    )}

                    <input
                        value={customer.email}
                        onChange={(event) => updateCustomer("email", event.target.value)}
                        placeholder="E-mail (opcional)"
                        inputMode="email"
                        className="w-full rounded-lg border p-3"
                    />

                    {savedAddresses.length > 0 && fulfillmentType === "DELIVERY" && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Endereços salvos</p>

                            {savedAddresses.map((savedAddress) => (
                                <button
                                    key={savedAddress.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedAddressId(savedAddress.id);

                                        setAddress({
                                            street: savedAddress.street,
                                            number: savedAddress.number,
                                            complement: savedAddress.complement ?? "",
                                            neighborhood: savedAddress.neighborhood,
                                            city: savedAddress.city,
                                            state: savedAddress.state,
                                            zipCode: savedAddress.zipCode,
                                            reference: savedAddress.reference ?? "",
                                        });
                                    }}
                                    className="w-full rounded-lg border p-3 text-left"
                                >
                                    <div className="font-medium">
                                        {savedAddress.label ?? "Endereço salvo"}
                                    </div>

                                    <div className="text-muted-foreground text-sm">
                                        {savedAddress.street}, {savedAddress.number} —{" "}
                                        {savedAddress.neighborhood}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </section>
            <section className="mt-8 space-y-4">
                <div>
                    <h2 className="text-lg font-semibold">Como você quer receber?</h2>

                    <p className="text-muted-foreground text-sm">
                        Escolha entre entrega ou retirada.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setFulfillmentType("DELIVERY")}
                        className={`rounded-xl border p-4 text-left transition ${
                            fulfillmentType === "DELIVERY"
                                ? "border-primary bg-primary/5"
                                : "hover:bg-muted"
                        }`}
                    >
                        <div className="font-semibold">Entrega</div>

                        <div className="text-muted-foreground mt-1 text-sm">
                            Receber no meu endereço
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setFulfillmentType("PICKUP")}
                        className={`rounded-xl border p-4 text-left transition ${
                            fulfillmentType === "PICKUP"
                                ? "border-primary bg-primary/5"
                                : "hover:bg-muted"
                        }`}
                    >
                        <div className="font-semibold">Retirada</div>

                        <div className="text-muted-foreground mt-1 text-sm">Retirar no local</div>
                    </button>
                </div>
            </section>

            {fulfillmentType === "DELIVERY" && (
                <section className="mt-8 space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold">Endereço de entrega</h2>

                        <p className="text-muted-foreground text-sm">
                            Informe onde devemos entregar.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={useCurrentLocation}
                        disabled={loadingLocation}
                        className="w-full rounded-lg border p-3 font-medium"
                    >
                        {loadingLocation ? "Obtendo localização..." : "Usar minha localização"}
                    </button>

                    {locationError && <p className="text-destructive text-sm">{locationError}</p>}

                    <div className="space-y-3">
                        <div>
                            <input
                                value={address.zipCode}
                                onChange={(event) => {
                                    const value = event.target.value.replace(/\D/g, "").slice(0, 8);

                                    updateAddress("zipCode", value);

                                    if (value.length === 8) {
                                        searchCep(value);
                                    }
                                }}
                                placeholder="CEP"
                                inputMode="numeric"
                                maxLength={8}
                                className="w-full rounded-lg border p-3"
                            />

                            {loadingCep && (
                                <p className="text-muted-foreground mt-2 text-sm">
                                    Buscando endereço...
                                </p>
                            )}

                            {cepError && (
                                <p className="text-destructive mt-2 text-sm">{cepError}</p>
                            )}
                        </div>

                        <input
                            value={address.street}
                            onChange={(event) => updateAddress("street", event.target.value)}
                            placeholder="Rua"
                            className="w-full rounded-lg border p-3"
                        />

                        <div className="grid grid-cols-3 gap-3">
                            <input
                                value={address.number}
                                onChange={(event) => updateAddress("number", event.target.value)}
                                placeholder="Número"
                                className="w-full rounded-lg border p-3"
                            />

                            <input
                                value={address.complement}
                                onChange={(event) =>
                                    updateAddress("complement", event.target.value)
                                }
                                placeholder="Complemento"
                                className="col-span-2 w-full rounded-lg border p-3"
                            />
                        </div>

                        <input
                            value={address.neighborhood}
                            onChange={(event) => updateAddress("neighborhood", event.target.value)}
                            placeholder="Bairro"
                            className="w-full rounded-lg border p-3"
                        />

                        <div className="grid grid-cols-4 gap-3">
                            <input
                                value={address.city}
                                onChange={(event) => updateAddress("city", event.target.value)}
                                placeholder="Cidade"
                                className="col-span-3 w-full rounded-lg border p-3"
                            />

                            <input
                                value={address.state}
                                onChange={(event) =>
                                    updateAddress(
                                        "state",
                                        event.target.value.toUpperCase().slice(0, 2)
                                    )
                                }
                                placeholder="UF"
                                maxLength={2}
                                className="w-full rounded-lg border p-3 uppercase"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Não sabe o CEP?</label>

                            <div className="flex gap-2">
                                <input
                                    value={addressSearch}
                                    onChange={(event) => {
                                        setAddressSearch(event.target.value);
                                        setAddressSearchError("");
                                    }}
                                    placeholder="Digite o nome da rua"
                                    className="w-full rounded-lg border p-3"
                                />

                                <button
                                    type="button"
                                    onClick={searchAddress}
                                    disabled={loadingAddressSearch}
                                    className="rounded-lg border px-4"
                                >
                                    {loadingAddressSearch ? "Buscando..." : "Buscar"}
                                </button>
                            </div>

                            {addressSearchError && (
                                <p className="text-destructive text-sm">{addressSearchError}</p>
                            )}

                            {addressSearchResults.length > 0 && (
                                <div className="space-y-2">
                                    {addressSearchResults.map((result) => (
                                        <button
                                            key={`${result.cep}-${result.logradouro}`}
                                            type="button"
                                            onClick={() => selectAddressSearchResult(result)}
                                            className="w-full rounded-lg border p-3 text-left"
                                        >
                                            <div className="font-medium">{result.logradouro}</div>

                                            <div className="text-muted-foreground text-sm">
                                                {result.bairro}
                                                {result.bairro ? " — " : ""}
                                                {result.localidade}/{result.uf}
                                            </div>

                                            <div className="text-muted-foreground text-sm">
                                                CEP {result.cep}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <input
                            value={address.reference}
                            onChange={(event) => updateAddress("reference", event.target.value)}
                            placeholder="Ponto de referência (opcional)"
                            className="w-full rounded-lg border p-3"
                        />
                    </div>
                </section>
            )}

            <section className="mt-8 space-y-4">
                <div>
                    <h2 className="text-lg font-semibold">Forma de pagamento</h2>

                    <p className="text-muted-foreground text-sm">Escolha como deseja pagar.</p>
                </div>
                <div className="space-y-2">
                    {storeConfig?.paymentMethods.length === 0 && (
                        <div className="text-muted-foreground rounded-lg border p-4 text-sm">
                            Nenhuma forma de pagamento está disponível no momento.
                        </div>
                    )}
                    {storeConfig?.paymentMethods.map((method) => (
                        <PaymentButton
                            key={method}
                            label={paymentMethodLabels[method].label}
                            description={paymentMethodLabels[method].description}
                            selected={paymentMethod === method}
                            onClick={() => selectPaymentMethod(method)}
                        />
                    ))}
                </div>

                {paymentMethod === "CASH" && (
                    <div className="rounded-xl border p-4">
                        <label className="block text-sm font-medium">Vai pagar com quanto?</label>

                        <input
                            value={cashReceived}
                            onChange={(event) => setCashReceived(event.target.value)}
                            placeholder="Ex: 50,00"
                            inputMode="decimal"
                            className="mt-2 w-full rounded-lg border p-3"
                        />

                        {cashValue >= checkout.subtotal && (
                            <div className="mt-3 flex justify-between text-sm">
                                <span>Troco</span>

                                <strong>{formatCurrency(change)}</strong>
                            </div>
                        )}
                    </div>
                )}
            </section>

            <section className="mt-8 space-y-4">
                <h2 className="text-lg font-semibold">Seu pedido</h2>

                {checkout.items.map((item, index) => (
                    <article key={`${item.productId}-${index}`} className="rounded-xl border p-4">
                        <div className="flex justify-between gap-4">
                            <div>
                                <h3 className="font-semibold">{item.productName}</h3>

                                <p className="text-muted-foreground text-sm">
                                    {item.quantity}x {formatCurrency(item.unitPrice)}
                                </p>
                            </div>

                            <strong>{formatCurrency(item.total)}</strong>
                        </div>
                    </article>
                ))}
            </section>

            <section className="mt-8 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                    <span>Subtotal</span>

                    <strong className="text-lg">{formatCurrency(checkout.subtotal)}</strong>
                </div>
            </section>

            {error && (
                <div className="border-destructive text-destructive mt-4 rounded-lg border p-3 text-sm">
                    {error}
                </div>
            )}

            <div className="bg-background sticky bottom-0 mt-8 border-t py-4">
                <button
                    type="button"
                    onClick={handleContinue}
                    disabled={submitting}
                    className="bg-primary text-primary-foreground w-full rounded-lg p-4 font-semibold disabled:opacity-50"
                >
                    {submitting
                        ? "Enviando pedido..."
                        : `Finalizar pedido — ${formatCurrency(checkout.subtotal)}`}
                </button>
            </div>
        </main>
    );
}

type PaymentButtonProps = {
    label: string;
    description: string;
    selected: boolean;
    onClick: () => void;
};

function PaymentButton({ label, description, selected, onClick }: PaymentButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full rounded-xl border p-4 text-left transition ${
                selected ? "border-primary bg-primary/5" : "hover:bg-muted"
            }`}
        >
            <div className="font-semibold">{label}</div>

            <div className="text-muted-foreground mt-1 text-sm">{description}</div>
        </button>
    );
}
