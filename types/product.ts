import type { ProductType } from "@/lib/generated/prisma/enums";
import type { ProductSelection } from "@/lib/validators/product";

export type ProductConfigurationResult = {
    selection: ProductSelection;

    configuration: {
        options: {
            id: string;
            name: string;
            price: number;
            quantity: number;
        }[];

        components: {
            id: string;
            name: string;
            price: number;
            quantity: number;
        }[];

        addons: {
            id: string;
            name: string;
            price: number;
            quantity: number;
        }[];

        notes?: string;
    };

    unitPrice: number;
};

export type ProductOption = {
    id: string;
    name: string;
    price: number | string;
};

export type ProductOptionGroup = {
    id: string;
    name: string;
    required: boolean;
    minSelect: number;
    maxSelect: number | null;
    options: ProductOption[];
};

export type ComponentProduct = {
    id: string;
    name: string;
    slug: string;
    price: number | string;
    imageUrl: string | null;
    active: boolean;
};

export type ProductComponentItem = {
    id: string;
    productId: string;
    additionalPrice: number | string;
    product: ComponentProduct;
};

export type ProductComponentOption = {
    id: string;
    name: string;
    additionalPrice: number | string;
};

export type ProductComponentGroup = {
    id: string;
    name: string;
    required: boolean;
    minSelect: number;
    maxSelect: number | null;
    items: ProductComponentItem[];
    options: ProductComponentOption[];
};

export type ProductAddon = {
    id: string;
    name: string;
    price: number | string;
};

export type ProductDetail = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    type: ProductType;
    price: number | string;
    imageUrl: string | null;
    optionGroups: ProductOptionGroup[];
    componentGroups: ProductComponentGroup[];
    addons: ProductAddon[];
    comboItems: ProductComboItem[];
};

export type ConfiguredProduct = {
    productId: string;
    name: string;
    basePrice: number;
    additionalPrice: number;
    totalPrice: number;
    options: {
        optionId: string;
        name: string;
        price: number;
        quantity: number;
    }[];
    components: {
        type: "product" | "option";
        productId?: string;
        componentOptionId?: string;
        name: string;
        price: number;
        quantity: number;
    }[];
    addons: {
        addonId: string;
        name: string;
        price: number;
        quantity: number;
    }[];
    notes?: string;
};

export type ComboItemProduct = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    type: "SIMPLE" | "COMPOSITE" | "COMBO";
    price: number | string;
};

export type ProductComboItem = {
    id: string;
    comboProductId: string;
    productId: string;
    quantity: number;
    sortOrder: number;
    product: ComboItemProduct;
};
