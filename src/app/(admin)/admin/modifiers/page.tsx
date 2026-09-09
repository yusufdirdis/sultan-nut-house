import Link from "next/link";
import { listModifierGroupsForAdmin } from "@/server/actions/admin-product-actions";
import { Button } from "@/components/ui/Button";
import { ModifierGroupRowActions } from "@/components/admin/ModifierGroupRowActions";

export default async function AdminModifiersPage() {
  const groups = await listModifierGroupsForAdmin();

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-espresso">Modifiers</h1>
          <p className="mt-1 text-sm text-espresso-soft">
            Reusable option groups (size, milk, sweetness, extras) attached to cafe menu items.
          </p>
        </div>
        <Button href="/admin/modifiers/new" variant="brass">
          Add modifier group
        </Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <div key={group.id} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <Link href={`/admin/modifiers/${group.id}/edit`} className="font-display text-lg text-espresso hover:text-brass">
                  {group.name}
                </Link>
                <p className="mt-1 text-xs text-espresso-soft">
                  {group.selectionType === "SINGLE" ? "Single choice" : "Multiple choice"} ·{" "}
                  {group.required ? "Required" : "Optional"}
                </p>
              </div>
              <ModifierGroupRowActions groupId={group.id} />
            </div>
            <ul className="mt-3 flex flex-wrap gap-2">
              {group.options.map((option) => (
                <li key={option.id} className="rounded-full bg-cream-deep px-2.5 py-1 text-xs text-espresso-soft">
                  {option.name}
                  {option.priceDeltaCents > 0 && ` +$${(option.priceDeltaCents / 100).toFixed(2)}`}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {groups.length === 0 && (
          <p className="text-sm text-espresso-soft">
            No modifier groups yet.{" "}
            <Link href="/admin/modifiers/new" className="text-brass hover:underline">
              Create your first one
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
