import "server-only";

import { getSessionUser } from "@/lib/auth/session";
import { getCheckoutPermissions } from "@/lib/auth/permissions";

export async function getCheckoutAccess() {
    const user = await getSessionUser();

    return {
        user,
        permissions: getCheckoutPermissions(user?.role ?? null),
    };
}
