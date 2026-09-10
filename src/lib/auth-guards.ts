import "server-only";
import { auth } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import type { Role } from "@/generated/prisma/enums";

const ADMIN_ROLES: Role[] = ["MANAGER", "ADMIN", "SUPERADMIN"];

/**
 * Guards every admin server action / server component data-load. Never rely
 * on the admin layout hiding UI alone — each mutation checks this too.
 */
export async function requireAdmin() {
  const session = await auth();

  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
    throw new AppError("You don't have permission to do that.", "FORBIDDEN");
  }

  return session.user;
}

/** Guards every signed-in-customer server action (account/orders/addresses). */
export async function requireUser() {
  const session = await auth();

  if (!session?.user) {
    throw new AppError("Please sign in to do that.", "UNAUTHENTICATED");
  }

  return session.user;
}
