"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { saveModifierGroup } from "@/server/actions/admin-modifier-actions";
import type { ModifierGroupInput } from "@/validation/admin-modifier";

type OptionRow = ModifierGroupInput["options"][number] & { priceDeltaDollars: string };

function centsToDollars(cents: number) {
  return (cents / 100).toFixed(2);
}

function dollarsToCents(value: string): number {
  const parsed = Number.parseFloat(value || "0");
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

function emptyOption(isDefault: boolean): OptionRow {
  return { name: "", priceDeltaCents: 0, priceDeltaDollars: "0.00", isDefault, isAvailable: true };
}

export function ModifierGroupForm({ initialGroup }: { initialGroup?: ModifierGroupInput & { id: string } }) {
  const router = useRouter();
  const isEditing = Boolean(initialGroup);

  const [name, setName] = useState(initialGroup?.name ?? "");
  const [selectionType, setSelectionType] = useState<ModifierGroupInput["selectionType"]>(
    initialGroup?.selectionType ?? "SINGLE",
  );
  const [minSelect, setMinSelect] = useState(initialGroup?.minSelect ?? 1);
  const [maxSelect, setMaxSelect] = useState(initialGroup?.maxSelect ?? 1);
  const [required, setRequired] = useState(initialGroup?.required ?? true);
  const [options, setOptions] = useState<OptionRow[]>(
    initialGroup && initialGroup.options.length > 0
      ? initialGroup.options.map((option) => ({ ...option, priceDeltaDollars: centsToDollars(option.priceDeltaCents) }))
      : [emptyOption(true)],
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateOption(index: number, patch: Partial<OptionRow>) {
    setOptions((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeOption(index: number) {
    setOptions((rows) => rows.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await saveModifierGroup({
      id: initialGroup?.id,
      name,
      selectionType,
      minSelect,
      maxSelect,
      required,
      options: options.map((option) => ({
        id: option.id,
        name: option.name,
        priceDeltaCents: dollarsToCents(option.priceDeltaDollars),
        isDefault: option.isDefault,
        isAvailable: option.isAvailable,
      })),
    });

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    router.push("/admin/modifiers");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <section className="grid gap-5 rounded-2xl border border-line bg-white p-6 sm:grid-cols-2">
        <TextField
          id="modifier-group-name"
          label="Group name (e.g. Size, Milk, Extras)"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-espresso">Selection type</label>
          <select
            value={selectionType}
            onChange={(event) => {
              const value = event.target.value as ModifierGroupInput["selectionType"];
              setSelectionType(value);
              if (value === "SINGLE") setMaxSelect(1);
            }}
            className="h-12 rounded-xl border border-espresso/20 bg-white px-4 text-base text-espresso outline-none focus:border-brass"
          >
            <option value="SINGLE">Single choice (e.g. Size)</option>
            <option value="MULTI">Multiple choice (e.g. Extras)</option>
          </select>
        </div>

        <TextField
          id="modifier-group-min-select"
          label="Minimum selections"
          type="number"
          min={0}
          value={minSelect}
          onChange={(event) => setMinSelect(Number(event.target.value))}
        />
        <TextField
          id="modifier-group-max-select"
          label="Maximum selections"
          type="number"
          min={1}
          disabled={selectionType === "SINGLE"}
          value={maxSelect}
          onChange={(event) => setMaxSelect(Number(event.target.value))}
        />

        <label className="flex items-center gap-2 text-sm text-espresso-soft sm:col-span-2">
          <input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} />
          Required — customer must choose before adding to cart
        </label>
      </section>

      <section className="rounded-2xl border border-line bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-espresso">Options</h2>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOptions((rows) => [...rows, emptyOption(rows.length === 0)])}
          >
            Add option
          </Button>
        </div>
        <div className="mt-5 flex flex-col gap-3">
          {options.map((option, index) => (
            <div key={index} className="grid items-end gap-3 rounded-xl border border-line p-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <TextField
                  id={`option-${index}-name`}
                  label="Name"
                  required
                  value={option.name}
                  onChange={(e) => updateOption(index, { name: e.target.value })}
                />
              </div>
              <TextField
                id={`option-${index}-price`}
                label="Price add-on ($)"
                inputMode="decimal"
                value={option.priceDeltaDollars}
                onChange={(event) => updateOption(index, { priceDeltaDollars: event.target.value })}
              />
              <label className="flex items-center gap-2 text-sm text-espresso-soft">
                <input
                  type="radio"
                  name="defaultOption"
                  checked={option.isDefault}
                  onChange={() =>
                    setOptions((rows) => rows.map((row, i) => ({ ...row, isDefault: i === index })))
                  }
                />
                Default
              </label>
              <label className="flex items-center gap-2 text-sm text-espresso-soft">
                <input
                  type="checkbox"
                  checked={option.isAvailable}
                  onChange={(event) => updateOption(index, { isAvailable: event.target.checked })}
                />
                Available
              </label>
              {options.length > 1 && (
                <button type="button" onClick={() => removeOption(index)} className="text-sm font-medium text-red-600">
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-4">
        <Button type="submit" size="lg" variant="brass" disabled={isSubmitting} className="disabled:opacity-60">
          {isSubmitting ? "Saving…" : isEditing ? "Save changes" : "Create modifier group"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/modifiers")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
