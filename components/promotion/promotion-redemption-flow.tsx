"use client";

import { useState } from "react";
import { ArrowLeft, Check, CheckCircle2, Copy, Gift, MapPin, Share2 } from "lucide-react";
import { toast } from "sonner";

import {
    type AddressForm,
    type AddressSearchResult,
    findAddressByCep,
    findAddressesByStreet,
    formatCep,
    initialAddress,
} from "@/lib/address";
import { formatPhone } from "@/lib/formatters/phone";

type Promotion = {
    slug: string;
    name: string;
    description: string | null;
    discountPercentage: string | null;
    discountFixed: string | null;
    freeDelivery: boolean;
    startsAt: string;
    endsAt: string;
    redemptionValidityDays: number | null;
    paymentMethods: string[];
};

type Redemption = {
    code: string;
    redeemedAt: string;
    expiresAt: string;
    alreadyRedeemed: boolean;
};

type CustomerErrors = {
    name?: string;
    phone?: string;
};

type AddressErrors = Partial<Record<"zipCode" | "street" | "number" | "neighborhood", string>>;

type Props = {
    promotion: Promotion;
};

type Step = "presentation" | "customer" | "address" | "success";

export function PromotionRedemptionFlow({ promotion }: Props) {
    const [step, setStep] = useState<Step>("presentation");

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");

    const [address, setAddress] = useState<AddressForm>({
        ...initialAddress,
        city: "Dracena",
        state: "SP",
    });
    const [addressResolvedByCep, setAddressResolvedByCep] = useState(false);

    const [streetResults, setStreetResults] = useState<AddressSearchResult[]>([]);

    const [loadingCep, setLoadingCep] = useState(false);
    const [loadingStreet, setLoadingStreet] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState("");
    const [redemption, setRedemption] = useState<Redemption | null>(null);

    const [customerErrors, setCustomerErrors] = useState<CustomerErrors>({});
    const [addressErrors, setAddressErrors] = useState<AddressErrors>({});

    const [checkingRedemption, setCheckingRedemption] = useState(false);

    const stepIndex = {
        presentation: 0,
        customer: 1,
        address: 2,
        success: 3,
    }[step];

    function updateAddress(field: keyof AddressForm, value: string) {
        if (field === "zipCode") {
            setAddressResolvedByCep(false);
            setStreetResults([]);

            setAddressErrors((current) => ({
                ...current,
                zipCode: undefined,
            }));

            setAddress((current) => ({
                ...current,
                zipCode: value,
                street: "",
                neighborhood: "",
                city: "Dracena",
                state: "SP",
            }));

            return;
        }

        setAddress((current) => ({
            ...current,
            [field]: value,
        }));
    }

    async function continueCustomer() {
        setError("");

        const errors: CustomerErrors = {};
        const normalizedPhone = phone.replace(/\D/g, "");

        if (name.trim().length < 2) {
            errors.name = "Informe seu nome.";
        }

        if (normalizedPhone.length !== 10 && normalizedPhone.length !== 11) {
            errors.phone = "Informe um telefone válido.";
        }

        setCustomerErrors(errors);

        if (Object.keys(errors).length > 0) {
            return;
        }

        try {
            setCheckingRedemption(true);

            const response = await fetch(`/api/promotions/${promotion.slug}/check-redemption`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ phone: normalizedPhone }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error ?? "Não foi possível verificar o cadastro.");
            }

            if (data.alreadyRedeemed) {
                setError(
                    "Este telefone já possui um resgate da promoção. Entre em contato com o Los Hermanos para recuperar seu código."
                );
                return;
            }

            setStep("address");
        } catch (error) {
            setError(
                error instanceof Error ? error.message : "Não foi possível verificar o cadastro."
            );
        } finally {
            setCheckingRedemption(false);
        }
    }

    async function searchCep() {
        try {
            setLoadingCep(true);
            setError("");

            const result = await findAddressByCep(address.zipCode);

            const city = result.city?.trim().toLowerCase();
            const state = result.state?.trim().toUpperCase();

            if (city !== "dracena" || state !== "SP") {
                setAddressResolvedByCep(false);

                setAddress((current) => ({
                    ...current,
                    street: "",
                    neighborhood: "",
                    city: "Dracena",
                    state: "SP",
                }));

                throw new Error("Esta promoção é válida apenas para endereços em Dracena/SP.");
            }

            setAddress((current) => ({
                ...current,
                ...result,
            }));

            setAddressResolvedByCep(true);
        } catch (error) {
            setAddressResolvedByCep(false);

            setError(error instanceof Error ? error.message : "Não foi possível consultar o CEP.");
        } finally {
            setLoadingCep(false);
        }
    }

    async function searchStreet() {
        try {
            setLoadingStreet(true);
            setError("");
            setStreetResults([]);

            const results = await findAddressesByStreet("SP", "Dracena", address.street);

            setStreetResults(
                results.filter(
                    (result) =>
                        result.localidade.trim().toLowerCase() === "dracena" &&
                        result.uf.trim().toUpperCase() === "SP"
                )
            );
        } catch (error) {
            setError(
                error instanceof Error ? error.message : "Não foi possível pesquisar o endereço."
            );
        } finally {
            setLoadingStreet(false);
        }
    }

    function selectStreet(result: AddressSearchResult) {
        setAddress((current) => ({
            ...current,
            zipCode: result.cep.replace(/\D/g, ""),
            street: result.logradouro,
            neighborhood: result.bairro,
            city: "Dracena",
            state: "SP",
        }));

        setStreetResults([]);
        setAddressResolvedByCep(true);
        setError("");
    }

    async function redeem() {
        setError("");

        const errors: AddressErrors = {};

        if (address.zipCode.replace(/\D/g, "").length !== 8) {
            errors.zipCode = "Informe um CEP válido.";
        }

        if (!address.street.trim()) {
            errors.street = "Informe a rua.";
        }

        if (!address.number.trim()) {
            errors.number = "Informe o número.";
        }

        if (!address.neighborhood.trim()) {
            errors.neighborhood = "Informe o bairro.";
        }

        setAddressErrors(errors);

        if (Object.keys(errors).length > 0) {
            requestAnimationFrame(() => {
                document.querySelector('[aria-invalid="true"]')?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
            });

            return;
        }

        try {
            setSubmitting(true);

            const response = await fetch(
                `/api/promotions/${encodeURIComponent(promotion.slug)}/redeem`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: name.trim(),
                        phone: phone.replace(/\D/g, ""),
                        address,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error ?? "Não foi possível resgatar a promoção.");
            }

            setRedemption(data.redemption);
            setStep("success");
        } catch (error) {
            setError(
                error instanceof Error ? error.message : "Não foi possível resgatar a promoção."
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function copyCode() {
        if (!redemption) return;

        await navigator.clipboard.writeText(redemption.code);
        toast.success("Código copiado");
    }

    async function shareCode() {
        if (!redemption) return;

        const expiresAt = new Date(redemption.expiresAt).toLocaleDateString("pt-BR");

        const text = `${promotion.name} — código ${redemption.code}, válido até ${expiresAt}.`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: promotion.name,
                    text,
                });
                return;
            } catch {
                return;
            }
        }

        await navigator.clipboard.writeText(text);
        toast.success("Informações copiadas");
    }

    return (
        <main className="bg-background mx-auto min-h-dvh w-full max-w-md overflow-hidden">
            {step !== "presentation" && step !== "success" && (
                <header className="flex items-center gap-3 px-5 py-4">
                    <button
                        type="button"
                        onClick={() => setStep(step === "address" ? "customer" : "presentation")}
                        className="flex size-10 items-center justify-center rounded-full border"
                        aria-label="Voltar"
                    >
                        <ArrowLeft className="size-5" />
                    </button>

                    <div className="flex flex-1 gap-1.5">
                        {[0, 1, 2].map((item) => (
                            <div
                                key={item}
                                className={`h-1.5 flex-1 rounded-full ${
                                    item <= stepIndex ? "bg-primary" : "bg-muted"
                                }`}
                            />
                        ))}
                    </div>
                </header>
            )}

            <div
                className="flex transition-transform duration-300 ease-out"
                style={{
                    width: "400%",
                    transform: `translateX(-${stepIndex * 25}%)`,
                }}
            >
                <section className="w-1/4 shrink-0 px-6 py-10">
                    <div className="flex min-h-[75dvh] flex-col justify-center">
                        <div className="bg-primary/10 mb-6 flex size-16 items-center justify-center rounded-2xl">
                            <Gift className="text-primary size-8" />
                        </div>

                        <p className="text-primary mb-2 text-sm font-semibold tracking-wide uppercase">
                            Promoção especial
                        </p>

                        <h1 className="text-3xl font-bold">{promotion.name}</h1>

                        {promotion.description && (
                            <p className="text-muted-foreground mt-3">{promotion.description}</p>
                        )}

                        <div className="mt-8 space-y-3 rounded-2xl border p-5">
                            {promotion.discountPercentage && (
                                <Benefit>{promotion.discountPercentage}% de desconto</Benefit>
                            )}

                            {promotion.freeDelivery && <Benefit>Entrega grátis</Benefit>}

                            <Benefit>Resgate disponível por tempo limitado</Benefit>

                            {promotion.redemptionValidityDays && (
                                <Benefit>
                                    Use em até {promotion.redemptionValidityDays} dias após o
                                    resgate
                                </Benefit>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => setStep("customer")}
                            className="bg-primary text-primary-foreground mt-8 h-12 rounded-xl px-5 font-semibold"
                        >
                            Resgatar promoção
                        </button>
                    </div>
                </section>

                <section className="w-1/4 shrink-0 px-6 py-6">
                    <h2 className="text-2xl font-bold">Seus dados</h2>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Precisamos identificar quem está resgatando a promoção.
                    </p>

                    <div className="mt-8 space-y-5">
                        <Field label="Nome" error={customerErrors.name}>
                            <input
                                value={name}
                                onChange={(event) => {
                                    setName(event.target.value);

                                    if (customerErrors.name) {
                                        setCustomerErrors((current) => ({
                                            ...current,
                                            name: undefined,
                                        }));
                                    }
                                }}
                                aria-invalid={Boolean(customerErrors.name)}
                                placeholder="Seu nome"
                                className="bg-background focus:ring-ring h-12 w-full rounded-xl border px-4 outline-none focus:ring-2"
                            />
                        </Field>

                        <Field label="Telefone" error={customerErrors.phone}>
                            <input
                                value={phone}
                                onChange={(event) => {
                                    setPhone(formatPhone(event.target.value));

                                    if (customerErrors.phone) {
                                        setCustomerErrors((current) => ({
                                            ...current,
                                            phone: undefined,
                                        }));
                                    }
                                }}
                                aria-invalid={Boolean(customerErrors.phone)}
                                inputMode="tel"
                                placeholder="(18) 99999-9999"
                                className="bg-background focus:ring-ring h-12 w-full rounded-xl border px-4 outline-none focus:ring-2"
                            />
                        </Field>

                        {error && (
                            <p role="alert" className="text-destructive text-sm">
                                {error}
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={continueCustomer}
                            disabled={checkingRedemption}
                            className="bg-primary text-primary-foreground h-12 w-full rounded-xl font-semibold disabled:opacity-60"
                        >
                            {checkingRedemption ? "Verificando..." : "Continuar"}
                        </button>
                    </div>
                </section>

                <section className="w-1/4 shrink-0 px-6 py-6">
                    <div className="flex items-center gap-3">
                        <MapPin className="text-primary size-6" />
                        <h2 className="text-2xl font-bold">Seu endereço</h2>
                    </div>

                    <p className="text-muted-foreground mt-2 text-sm">
                        Informe onde você costuma receber seus pedidos.
                    </p>

                    <fieldset
                        disabled={loadingCep || loadingStreet || submitting}
                        className="mt-6 space-y-4 disabled:opacity-60"
                    >
                        <Field label="CEP" error={addressErrors.zipCode}>
                            <div className="flex gap-2">
                                <input
                                    value={formatCep(address.zipCode)}
                                    onChange={(event) =>
                                        updateAddress("zipCode", event.target.value)
                                    }
                                    inputMode="numeric"
                                    placeholder="00000-000"
                                    className="bg-background h-12 min-w-0 flex-1 rounded-xl border px-4"
                                />

                                <button
                                    type="button"
                                    onClick={searchCep}
                                    className="rounded-xl border px-4 font-medium"
                                >
                                    {loadingCep ? "Buscando..." : "Buscar"}
                                </button>
                            </div>
                        </Field>

                        <div className="border-t pt-4">
                            <p className="text-muted-foreground mb-3 text-center text-sm">ou</p>

                            <Field label="Rua" error={addressErrors.street}>
                                <div className="flex gap-2">
                                    <input
                                        value={address.street}
                                        onChange={(event) => {
                                            updateAddress("street", event.target.value);

                                            setStreetResults([]);

                                            setAddressErrors((current) => ({
                                                ...current,
                                                street: undefined,
                                            }));
                                        }}
                                        aria-invalid={Boolean(addressErrors.street)}
                                        disabled={addressResolvedByCep}
                                        placeholder="Nome da rua"
                                        className="bg-background h-12 min-w-0 flex-1 rounded-xl border px-4"
                                    />

                                    <button
                                        type="button"
                                        onClick={searchStreet}
                                        disabled={addressResolvedByCep}
                                        className="rounded-xl border px-4 font-medium disabled:opacity-50"
                                    >
                                        {loadingStreet ? "Buscando..." : "Buscar"}
                                    </button>
                                </div>
                            </Field>

                            <div className="bg-muted/50 mt-3 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm">
                                <MapPin className="text-primary size-4 shrink-0" />
                                <span>
                                    Endereço em <strong>Dracena/SP</strong>
                                </span>
                            </div>

                            {streetResults.length > 0 && (
                                <div className="mt-2 overflow-hidden rounded-xl border">
                                    {streetResults.map((result) => (
                                        <button
                                            type="button"
                                            key={`${result.cep}-${result.logradouro}`}
                                            onClick={() => selectStreet(result)}
                                            className="block w-full border-b p-3 text-left text-sm last:border-b-0"
                                        >
                                            <strong>{result.logradouro}</strong>

                                            <span className="text-muted-foreground block">
                                                {result.bairro} · CEP {formatCep(result.cep)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Número" error={addressErrors.number}>
                                <input
                                    value={address.number}
                                    onChange={(event) => {
                                        updateAddress("number", event.target.value);

                                        setAddressErrors((current) => ({
                                            ...current,
                                            number: undefined,
                                        }));
                                    }}
                                    aria-invalid={Boolean(addressErrors.number)}
                                    className="bg-background h-12 w-full rounded-xl border px-4"
                                />
                            </Field>

                            <Field label="Complemento">
                                <input
                                    value={address.complement}
                                    onChange={(event) =>
                                        updateAddress("complement", event.target.value)
                                    }
                                    className="bg-background h-12 w-full rounded-xl border px-4"
                                />
                            </Field>
                        </div>

                        <Field label="Bairro" error={addressErrors.neighborhood}>
                            <input
                                value={address.neighborhood}
                                onChange={(event) =>
                                    updateAddress("neighborhood", event.target.value)
                                }
                                disabled={addressResolvedByCep}
                                className="bg-background h-12 w-full rounded-xl border px-4"
                            />
                        </Field>

                        <Field label="Referência">
                            <input
                                value={address.reference}
                                onChange={(event) => updateAddress("reference", event.target.value)}
                                placeholder="Opcional"
                                className="bg-background h-12 w-full rounded-xl border px-4"
                            />
                        </Field>

                        {error && <p className="text-destructive text-sm">{error}</p>}

                        <button
                            type="button"
                            onClick={redeem}
                            className="bg-primary text-primary-foreground h-12 w-full rounded-xl font-semibold"
                        >
                            {submitting ? "Resgatando..." : "Confirmar e resgatar"}
                        </button>
                    </fieldset>
                </section>

                <section className="w-1/4 shrink-0 px-6 py-10">
                    {redemption && (
                        <div className="flex min-h-[75dvh] flex-col justify-center text-center">
                            <CheckCircle2 className="text-primary mx-auto size-16" />

                            <h2 className="mt-6 text-3xl font-bold">
                                {redemption.alreadyRedeemed
                                    ? "Você já resgatou!"
                                    : "Promoção resgatada!"}
                            </h2>

                            <p className="text-muted-foreground mt-3">
                                {redemption.alreadyRedeemed
                                    ? "Encontramos o seu código de resgate."
                                    : "Guarde este código para usar no seu pedido."}
                            </p>

                            <div className="mt-8 rounded-2xl border border-dashed p-6">
                                <span className="text-muted-foreground text-sm">Seu código</span>

                                <strong className="mt-2 block text-3xl tracking-wider">
                                    {redemption.code}
                                </strong>
                            </div>

                            <p className="text-muted-foreground mt-4 text-sm">
                                Válido até{" "}
                                <strong className="text-foreground">
                                    {new Date(redemption.expiresAt).toLocaleDateString("pt-BR")}
                                </strong>
                            </p>

                            <div className="mt-8 grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={copyCode}
                                    className="flex h-12 items-center justify-center gap-2 rounded-xl border font-medium"
                                >
                                    <Copy className="size-4" />
                                    Copiar
                                </button>

                                <button
                                    type="button"
                                    onClick={shareCode}
                                    className="flex h-12 items-center justify-center gap-2 rounded-xl border font-medium"
                                >
                                    <Share2 className="size-4" />
                                    Compartilhar
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

function Benefit({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3 text-sm">
            <span className="bg-primary/10 flex size-6 shrink-0 items-center justify-center rounded-full">
                <Check className="text-primary size-4" />
            </span>
            <span>{children}</span>
        </div>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-medium">{label}</span>

            {children}

            {error && <span className="text-destructive mt-1.5 block text-sm">{error}</span>}
        </label>
    );
}
