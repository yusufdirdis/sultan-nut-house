import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { TOAST_ORDER_URL } from "@/lib/toast";

const shopLinks = [
  { href: "/collections/nuts", label: "Nuts" },
  { href: "/collections/turkish-delights", label: "Turkish Delights" },
  { href: "/collections/candies", label: "Gummies & Candy" },
  { href: "/collections/fresh-roasted-coffee", label: "Coffee" },
  { href: "/collections/baklava", label: "Baklava" },
];

const companyLinks = [
  { href: "/about", label: "Our Story" },
  { href: "/cafe", label: "Visit Us" },
  { href: TOAST_ORDER_URL, label: "Order Cafe" },
  { href: "/policies/contact-information", label: "Contact" },
];

const policyLinks = [
  { href: "/policies/refund-policy", label: "Refund Policy" },
  { href: "/policies/privacy-policy", label: "Privacy Policy" },
  { href: "/policies/terms-of-service", label: "Terms of Service" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-espresso text-cream/80">
      <Container className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <p className="font-display text-xl text-cream">Sultan Nut House</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream/60">
            Premium Middle Eastern cafe and specialty goods, roasted and made fresh in Plantation, Florida.
          </p>
        </div>

        <FooterColumn title="Shop" links={shopLinks} />
        <FooterColumn title="Sultan" links={companyLinks} />

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-cream/50">Visit</p>
          <address className="mt-4 space-y-1 text-sm not-italic text-cream/70">
            <p>1836 N University Dr</p>
            <p>Plantation, FL 33322</p>
          </address>
          <ul className="mt-6 space-y-2 text-sm">
            {policyLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-cream/60 transition-colors hover:text-cream">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      <div className="border-t border-cream/10 py-6">
        <Container className="flex flex-col gap-2 text-xs text-cream/40 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Sultan Nut House. All rights reserved.</p>
          <p>Plantation, Florida</p>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-cream/50">{title}</p>
      <ul className="mt-4 space-y-2 text-sm">
        {links.map((link) => {
          const isExternal = link.href.startsWith("http");
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="text-cream/70 transition-colors hover:text-cream"
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
