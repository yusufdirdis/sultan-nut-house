"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

const ADMIN_ROLES = ["MANAGER", "ADMIN", "SUPERADMIN"];

const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "Our Story" },
  { href: "/cafe", label: "Visit Us" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session } = useSession();
  const isAdmin = Boolean(session?.user?.role && ADMIN_ROLES.includes(session.user.role));

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-cream/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between py-3">
        <Link href="/" className="font-display text-xl tracking-tight text-espresso">
          Sultan Nut House
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-espresso-soft md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-espresso">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAdmin && (
            <Link
              href="/admin"
              className="rounded-full border border-espresso/20 px-4 py-2 text-sm font-medium text-espresso-soft transition-colors hover:border-espresso hover:text-espresso"
            >
              Admin
            </Link>
          )}
          <Link
            href="/account"
            aria-label="Account"
            className="rounded-full p-2 text-espresso-soft transition-colors hover:bg-espresso/5 hover:text-espresso"
          >
            <AccountIcon />
          </Link>
          <Link
            href="/cart"
            aria-label="Cart"
            className="rounded-full p-2 text-espresso-soft transition-colors hover:bg-espresso/5 hover:text-espresso"
          >
            <CartIcon />
          </Link>
          <Button href="/order" variant="brass" size="md">
            Order Pickup
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full p-2 text-espresso md:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </Container>

      {menuOpen && (
        <div className="border-t border-line bg-cream md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-3 text-base font-medium text-espresso-soft hover:bg-espresso/5"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/account"
              className="rounded-lg px-3 py-3 text-base font-medium text-espresso-soft hover:bg-espresso/5"
              onClick={() => setMenuOpen(false)}
            >
              Account
            </Link>
            <Link
              href="/cart"
              className="rounded-lg px-3 py-3 text-base font-medium text-espresso-soft hover:bg-espresso/5"
              onClick={() => setMenuOpen(false)}
            >
              Cart
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="rounded-lg px-3 py-3 text-base font-medium text-espresso-soft hover:bg-espresso/5"
                onClick={() => setMenuOpen(false)}
              >
                Admin
              </Link>
            )}
            <Button href="/order" variant="brass" size="lg" className="mt-2 w-full">
              Order Pickup
            </Button>
          </Container>
        </div>
      )}

      {/* Persistent mobile pickup CTA, per the brief's requirement that "Order
          Pickup" stays prominent on mobile even when the menu is collapsed. */}
      <div className="border-t border-line bg-cream-deep px-4 py-2 md:hidden">
        <Button href="/order" variant="brass" size="md" className="w-full">
          Order Pickup
        </Button>
      </div>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.5-4 5-5.5 7.5-5.5s6 1.5 7.5 5.5" strokeLinecap="round" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 4h2l1 12.2A2 2 0 0 0 8 18h9a2 2 0 0 0 2-1.7L20.5 8H6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="21" r="1.4" />
      <circle cx="17" cy="21" r="1.4" />
    </svg>
  );
}
