import { CustomerNavigation } from "@/components/customer/customer-navigation";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen">
            <CustomerNavigation />

            <div className="pb-20 sm:pb-0">{children}</div>
        </div>
    );
}
