import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Container } from "@/components/ui/Container";
import { SignOutButton } from "@/components/account/SignOutButton";

const navLinks = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/profile", label: "Profile" },
];

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/account");
  }

  return (
    <Container className="py-12">
      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium text-espresso-soft transition-colors hover:bg-white hover:text-espresso"
            >
              {link.label}
            </Link>
          ))}
          <div className="lg:mt-2 lg:border-t lg:border-line lg:pt-2">
            <SignOutButton />
          </div>
        </nav>
        <div>{children}</div>
      </div>
    </Container>
  );
}
