export type AddressForm = {
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    reference: string;
};

export type AddressSearchResult = {
    cep: string;
    logradouro: string;
    complemento: string;
    bairro: string;
    localidade: string;
    uf: string;
};

export const initialAddress: AddressForm = {
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    reference: "",
};

export function normalizeCep(value: string) {
    return value.replace(/\D/g, "").slice(0, 8);
}

export function formatCep(value: string) {
    const digits = normalizeCep(value);

    return digits.replace(/^(\d{5})(\d)/, "$1-$2");
}

export async function findAddressByCep(zipCode: string): Promise<Partial<AddressForm>> {
    const normalizedZipCode = normalizeCep(zipCode);

    if (normalizedZipCode.length !== 8) {
        throw new Error("Informe um CEP válido.");
    }

    const response = await fetch(`https://viacep.com.br/ws/${normalizedZipCode}/json/`);

    if (!response.ok) {
        throw new Error("Não foi possível consultar o CEP.");
    }

    const data = await response.json();

    if (data.erro) {
        throw new Error("CEP não encontrado.");
    }

    return {
        zipCode: normalizedZipCode,
        street: data.logradouro ?? "",
        neighborhood: data.bairro ?? "",
        city: data.localidade ?? "",
        state: data.uf ?? "",
    };
}

export async function findAddressesByStreet(
    state: string,
    city: string,
    street: string
): Promise<AddressSearchResult[]> {
    const normalizedState = state.trim().toUpperCase();
    const normalizedCity = city.trim();
    const normalizedStreet = street.trim();

    if (normalizedState.length !== 2) {
        throw new Error("Informe a UF antes de pesquisar.");
    }

    if (normalizedCity.length < 3) {
        throw new Error("Informe a cidade antes de pesquisar.");
    }

    if (normalizedStreet.length < 3) {
        throw new Error("Digite pelo menos 3 caracteres da rua.");
    }

    const response = await fetch(
        `https://viacep.com.br/ws/${encodeURIComponent(normalizedState)}/${encodeURIComponent(
            normalizedCity
        )}/${encodeURIComponent(normalizedStreet)}/json/`
    );

    if (!response.ok) {
        throw new Error("Não foi possível pesquisar o endereço.");
    }

    const data = (await response.json()) as AddressSearchResult[];

    if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Nenhum endereço encontrado.");
    }

    return data;
}
