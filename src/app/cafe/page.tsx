import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { TOAST_ORDER_URL } from "@/lib/toast";

const ADDRESS = "1836 N University Dr, Plantation, FL 33322";
const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ADDRESS)}`;
const MAP_EMBED_URL = `https://maps.google.com/maps?q=${encodeURIComponent(ADDRESS)}&z=15&output=embed`;

export const metadata: Metadata = {
  title: "Visit Us",
  description:
    "Visit Sultan Nut House, a Middle Eastern cafe and specialty goods shop in Plantation, FL. Order ahead for pickup — Turkish coffee, kunafa, baklava, and more.",
};

const hours = [{ label: "Every day", value: "9:00 AM – 9:00 PM" }];

function categoryGradient(seed: number) {
  const palettes = [
    "linear-gradient(135deg, #b3823f 0%, #d9b877 100%)",
    "linear-gradient(135deg, #5f7048 0%, #8a9a6c 100%)",
    "linear-gradient(135deg, #7a4b3a 0%, #b3823f 100%)",
  ];
  return palettes[seed % palettes.length];
}

export default function CafePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://sultannuthouse.com/#localbusiness",
    name: "Sultan Nut House",
    address: {
      "@type": "PostalAddress",
      streetAddress: "1836 N University Dr",
      addressLocality: "Plantation",
      addressRegion: "FL",
      postalCode: "33322",
      addressCountry: "US",
    },
    servesCuisine: ["Middle Eastern", "Turkish"],
    priceRange: "$$",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "09:00",
        closes: "21:00",
      },
    ],
    url: "https://sultannuthouse.com/cafe",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="border-b border-line">
        <Container className="py-16 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brass">Visit Sultan</p>
          <h1 className="font-display mt-4 max-w-2xl text-4xl text-espresso sm:text-5xl">
            A Middle Eastern cafe in the heart of Plantation
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-espresso-soft">
            Stop by for Turkish coffee, fresh kunafa and baklava, matcha, and pastries made in-house daily — or order
            ahead and skip the line.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button href={TOAST_ORDER_URL} target="_blank" rel="noopener noreferrer" variant="brass" size="lg">
              Order Cafe
            </Button>
            <Button href={DIRECTIONS_URL} variant="outline" size="lg">
              Get Directions
            </Button>
          </div>
        </Container>
      </section>

      <section className="border-b border-line">
        <Container className="grid gap-0 py-16 lg:grid-cols-2 lg:gap-12">
          <div>
            <h2 className="font-display text-2xl text-espresso">Sultan Nut House</h2>
            <address className="mt-3 space-y-1 text-lg not-italic text-espresso-soft">
              <p>1836 N University Dr</p>
              <p>Plantation, FL 33322</p>
            </address>

            <dl className="mt-8 space-y-2 text-sm text-espresso-soft">
              {hours.map((row) => (
                <div key={row.label} className="flex gap-3">
                  <dt className="w-28 shrink-0 font-medium text-espresso">{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button href={DIRECTIONS_URL} variant="brass">
                Get Directions
              </Button>
              <Button href="/policies/contact-information" variant="ghost">
                Contact Us
              </Button>
            </div>

            <p className="mt-10 max-w-md text-sm leading-relaxed text-espresso-soft">
              Sultan Nut House is a Middle Eastern cafe and specialty grocer in Plantation, Florida, serving Turkish
              coffee, kunafa, baklava, and fresh nuts alongside a shop of Turkish delights, teas, and gift boxes
              shipped nationwide.
            </p>
          </div>

          <div className="mt-10 aspect-square w-full overflow-hidden rounded-2xl border border-line lg:mt-0 lg:aspect-auto">
            <iframe
              title="Map to Sultan Nut House"
              src={MAP_EMBED_URL}
              className="h-full min-h-[320px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <h2 className="font-display text-2xl text-espresso">Inside Sultan</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} aria-hidden className="aspect-[4/5] w-full rounded-2xl" style={{ background: categoryGradient(i) }} />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
