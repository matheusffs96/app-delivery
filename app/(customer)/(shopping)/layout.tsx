import { CustomerWorkspace } from "@/components/customer/customer-workspace";

export default function ShoppingLayout({ children }: { children: React.ReactNode }) {
    return <CustomerWorkspace>{children}</CustomerWorkspace>;
}
