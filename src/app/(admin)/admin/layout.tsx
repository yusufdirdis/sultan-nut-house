import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Container } from "@/components/ui/Container";

const ADMIN_ROLES = ["MANAGER", "ADMIN", "SUPERADMIN"];

const navLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/modifiers", label: "Modifiers" },
  { href: "/admin/orders/shipping", label: "Shipping orders" },
  { href: "/admin/orders/pickup", label: "Pickup orders" },
  { href: "/admin/reviews", label: "Reviews" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }

  if (!ADMIN_ROLES.includes(session.user.role)) {
    return (
      <Container className="py-24 text-center">
        <h1 className="font-display text-3xl text-espresso">Access restricted</h1>
        <p className="mt-3 text-espresso-soft">
          Your account ({session.user.email ?? "signed in"}) doesn&apos;t have admin access.
        </p>
      </Container>
    );
  }

  return (
    <div className="min-h-[70vh] bg-cream-deep">
      <div className="border-b border-line bg-white">
        <Container className="flex items-center gap-8 overflow-x-auto py-4">
          <span className="font-display shrink-0 text-lg text-espresso">Sultan Admin</span>
          <nav className="flex gap-6 text-sm font-medium text-espresso-soft">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="whitespace-nowrap transition-colors hover:text-espresso">
                {link.label}
              </Link>
            ))}
          </nav>
        </Container>
      </div>
      <Container className="py-10">{children}</Container>
    </div>
  );
}
