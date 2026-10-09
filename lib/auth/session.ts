import "server-only";
import type { UserRole } from "@/lib/generated/prisma/client";

export type SessionUser = {
    id: string;
    name: string;
    role: UserRole;
};

export async function getSessionUser(): Promise<SessionUser | null> {
    if (process.env.NODE_ENV === "development" && process.env.DEV_ADMIN_SESSION === "true") {
        return {
            id: "dev-admin",
            name: "Administrador de desenvolvimento",
            role: "ADMIN",
        };
    }

    // Futuramente, resolver a sessão autenticada.
    return null;
}
