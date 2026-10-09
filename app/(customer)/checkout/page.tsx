import { CheckoutClient } from "@/components/customer/checkout/checkout-client";
import { getCheckoutAccess } from "@/lib/auth/checkout-access";

export default async function CheckoutPage() {
    const { permissions } = await getCheckoutAccess();

    return <CheckoutClient permissions={permissions} />;
}
