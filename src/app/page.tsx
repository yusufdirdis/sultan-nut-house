import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

const categories = [
  { slug: "nuts", name: "Shop Nuts", blurb: "Slow-roasted, small-batch." },
  { slug: "turkish-delights", name: "Turkish Delights", blurb: "Rosewater, pistachio, pomegranate." },
  { slug: "candies", name: "Gummies & Candy", blurb: "Halal-certified favorites." },
  { slug: "tea-coffee", name: "Tea & Coffee", blurb: "Turkish coffee, loose-leaf tea." },
];

export default function Home() {
  return (
    <>
      {/* ------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(179,130,63,0.16),transparent_45%),radial-gradient(circle_at_85%_75%,rgba(95,112,72,0.14),transparent_45%)]"
        />
        <Container className="relative py-24 sm:py-32">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brass">Plantation, Florida</p>
            <h1 className="font-display text-balance mt-5 text-5xl leading-[1.05] tracking-tight text-espresso sm:text-6xl lg:text-7xl">
              A modern table for old-world flavor.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-espresso-soft">
              Sultan Nut House roasts, brews, and bakes fresh every day — order ahead for pickup at our Plantation
              cafe, or shop our nuts, sweets, and specialty goods shipped anywhere in the country.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button href="/order" variant="primary" size="lg">
                Order Pickup
              </Button>
              <Button href="/shop" variant="outline" size="lg">
                Shop Online
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* --------------------------------------------------------- Two paths */}
      <section className="border-b border-line">
        <Container className="grid divide-y divide-line lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          <PathCard
            eyebrow="Near the cafe?"
            title="Order from the cafe"
            description="Coffee, matcha, kunafa, baklava, and fresh-made pastries — order ahead and pick up at 1836 N University Dr."
            cta="Order From The Cafe"
            href="/order"
            tone="brass"
          />
          <PathCard
            eyebrow="Anywhere in the US"
            title="Shop Sultan online"
            description="Nuts, Turkish delights, gummies, tea and coffee, and gift boxes — packed fresh and shipped nationwide."
            cta="Shop Best Sellers"
            href="/shop"
            tone="pistachio"
          />
        </Container>
      </section>

      {/* ----------------------------------------------------- Category strip */}
      <section className="py-24">
        <Container>
          <div className="flex items-end justify-between gap-6">
            <h2 className="font-display text-3xl text-espresso sm:text-4xl">Shop by category</h2>
            <Link href="/shop" className="hidden text-sm font-medium text-espresso-soft hover:text-espresso sm:block">
              View all &rarr;
            </Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category, index) => (
              <Link
                key={category.slug}
                href={`/collections/${category.slug}`}
                className="group block overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-lg hover:shadow-espresso/5"
              >
                <div
                  aria-hidden
                  className="h-48 w-full"
                  style={{ background: categoryGradient(index) }}
                />
                <div className="p-5">
                  <p className="font-display text-lg text-espresso">{category.name}</p>
                  <p className="mt-1 text-sm text-espresso-soft">{category.blurb}</p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------- Sultan story */}
      <section className="border-y border-line bg-cream-deep py-24">
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <div
            aria-hidden
            className="h-80 w-full rounded-2xl"
            style={{ background: categoryGradient(4) }}
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brass">Our story</p>
            <h2 className="font-display mt-4 text-3xl text-espresso sm:text-4xl">
              Three generations of roasting, brewing, and hospitality.
            </h2>
            <p className="mt-5 max-w-lg text-espresso-soft leading-relaxed">
              Sultan Nut House began as a family tradition of sourcing the finest nuts, sweets, and coffee from
              across the Middle East — now roasted, brewed, and packed fresh in Plantation, Florida, and shared with
              guests near and far.
            </p>
            <Button href="/about" variant="ghost" className="mt-6 px-0 hover:bg-transparent hover:underline">
              Read our story &rarr;
            </Button>
          </div>
        </Container>
      </section>

      {/* ---------------------------------------------------------- Visit us */}
      <section className="py-24">
        <Container className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brass">Visit Sultan</p>
            <h2 className="font-display mt-4 text-3xl text-espresso sm:text-4xl">Sultan Nut House</h2>
            <address className="mt-4 space-y-1 text-lg not-italic text-espresso-soft">
              <p>1836 N University Dr</p>
              <p>Plantation, FL 33322</p>
            </address>
            <dl className="mt-8 space-y-2 text-sm text-espresso-soft">
              <div className="flex gap-3">
                <dt className="w-28 shrink-0 font-medium text-espresso">Every day</dt>
                <dd>9:00 AM – 9:00 PM</dd>
              </div>
            </dl>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button href="/order" variant="brass">
                Order Pickup
              </Button>
              <Button href="/cafe" variant="outline">
                Directions & Hours
              </Button>
            </div>
          </div>
          <div
            aria-hidden
            className="h-80 w-full rounded-2xl border border-line"
            style={{ background: categoryGradient(5) }}
          />
        </Container>
      </section>
    </>
  );
}

function PathCard({
  eyebrow,
  title,
  description,
  cta,
  href,
  tone,
}: {
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  tone: "brass" | "pistachio";
}) {
  return (
    <div className="flex flex-col justify-between gap-8 py-16 pr-0 lg:pr-12">
      <div>
        <p className={tone === "brass" ? "text-xs font-semibold uppercase tracking-[0.25em] text-brass" : "text-xs font-semibold uppercase tracking-[0.25em] text-pistachio"}>
          {eyebrow}
        </p>
        <h3 className="font-display mt-4 text-3xl text-espresso">{title}</h3>
        <p className="mt-4 max-w-md text-espresso-soft leading-relaxed">{description}</p>
      </div>
      <Button href={href} variant={tone === "brass" ? "brass" : "primary"} size="lg" className="w-fit">
        {cta}
      </Button>
    </div>
  );
}

function categoryGradient(seed: number) {
  const palettes = [
    "linear-gradient(135deg, #b3823f 0%, #d9b877 100%)",
    "linear-gradient(135deg, #5f7048 0%, #8a9a6c 100%)",
    "linear-gradient(135deg, #7a4b3a 0%, #b3823f 100%)",
    "linear-gradient(135deg, #4a3f34 0%, #7a6a57 100%)",
    "linear-gradient(135deg, #241c15 0%, #4a3f34 100%)",
    "linear-gradient(135deg, #b3823f 0%, #5f7048 100%)",
  ];
  return palettes[seed % palettes.length];
}
