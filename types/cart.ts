import type { ProductSelection } from "@/lib/validators/product";

export type CartConfigurationOption = {
    id: string;
    name: string;
    price: number;
    quantity: number;
};

export type CartConfigurationComponent = {
    id: string;
    name: string;
    price: number;
    quantity: number;
};

export type CartConfigurationAddon = {
    id: string;
    name: string;
    price: number;
    quantity: number;
};

export type CartItemConfiguration = {
    options: CartConfigurationOption[];
    components: CartConfigurationComponent[];
    addons: CartConfigurationAddon[];
    notes?: string;
};

export type CartComboItemSelection = {
    comboItemId: string;
    productId: string;
    productName: string;
    productDescription?: string | null;
    instance: number;

    selection?: ProductSelection;
    configuration?: CartItemConfiguration;
    unitPrice?: number;
};

type CartItemBase = {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
};

export type ProductCartItem = CartItemBase & {
    type: "PRODUCT";
    selection: ProductSelection;
    configuration: CartItemConfiguration;
};

export type ComboCartItem = CartItemBase & {
    type: "COMBO";
    comboSelections: CartComboItemSelection[];
};

export type CartItem = ProductCartItem | ComboCartItem;

export type CartItemInput = Omit<ProductCartItem, "id"> | Omit<ComboCartItem, "id">;

export type CartState = {
    items: CartItem[];

    addItem: (item: CartItemInput) => void;

    updateQuantity: (id: string, quantity: number) => void;

    removeItem: (id: string) => void;

    clear: () => void;
};
