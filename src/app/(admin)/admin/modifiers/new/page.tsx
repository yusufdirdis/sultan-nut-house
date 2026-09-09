import { ModifierGroupForm } from "@/components/admin/ModifierGroupForm";

export default function NewModifierGroupPage() {
  return (
    <div>
      <h1 className="font-display text-3xl text-espresso">Add modifier group</h1>
      <div className="mt-8">
        <ModifierGroupForm />
      </div>
    </div>
  );
}
