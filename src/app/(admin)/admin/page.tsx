import Link from "next/link";
import { db } from "@/lib/db";

export default async function AdminDashboardPage() {
  const [productCount, activeProductCount, categoryCount, modifierGroupCount] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { status: "ACTIVE" } }),
    db.category.count(),
    db.modifierGroup.count(),
  ]);

  const stats = [
    { label: "Products", value: productCount, href: "/admin/products" },
    { label: "Active products", value: activeProductCount, href: "/admin/products" },
    { label: "Categories", value: categoryCount, href: "/admin/categories" },
    { label: "Modifier groups", value: modifierGroupCount, href: "/admin/modifiers" },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl text-espresso">Dashboard</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-2xl border border-line bg-white p-6 transition-shadow hover:shadow-md"
          >
            <p className="text-3xl font-semibold text-espresso">{stat.value}</p>
            <p className="mt-1 text-sm text-espresso-soft">{stat.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
