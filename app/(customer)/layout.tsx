import { CustomerNavigation } from "@/components/customer/customer-navigation";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="customer-shell">
            <CustomerNavigation />

            <div className="customer-main">{children}</div>
        </div>
    );
}
