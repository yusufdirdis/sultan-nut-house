import { notFound } from "next/navigation";
import { getAdminModifierGroup } from "@/server/actions/admin-modifier-actions";
import { ModifierGroupForm } from "@/components/admin/ModifierGroupForm";

export default async function EditModifierGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = await getAdminModifierGroup(id);

  if (!group) notFound();

  return (
    <div>
      <h1 className="font-display text-3xl text-espresso">Edit {group.name}</h1>
      <div className="mt-8">
        <ModifierGroupForm
          initialGroup={{
            id: group.id,
            name: group.name,
            selectionType: group.selectionType,
            minSelect: group.minSelect,
            maxSelect: group.maxSelect,
            required: group.required,
            options: group.options.map((option) => ({
              id: option.id,
              name: option.name,
              priceDeltaCents: option.priceDeltaCents,
              isDefault: option.isDefault,
              isAvailable: option.isAvailable,
            })),
          }}
        />
      </div>
    </div>
  );
}
