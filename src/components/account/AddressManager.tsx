"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { deleteAddress, saveAddress } from "@/server/actions/account-actions";
import type { SavedAddressInput } from "@/validation/account";

interface Address extends SavedAddressInput {
  id: string;
}

const emptyDraft: SavedAddressInput = {
  recipientName: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
  phone: "",
  isDefault: false,
};

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(addresses.length === 0);
  const [draft, setDraft] = useState<SavedAddressInput>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function startEdit(address: Address) {
    setEditingId(address.id);
    setDraft(address);
    setIsAdding(true);
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setDraft(emptyDraft);
    setIsAdding(false);
    setError(null);
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    const result = await saveAddress({ ...draft, id: editingId ?? undefined });
    setIsSaving(false);

    if (!result.success) {
      setError(result.message ?? "We couldn't save this address.");
      return;
    }

    resetForm();
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this address?")) return;
    const result = await deleteAddress(id);
    if (!result.success) alert(result.message);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {addresses.map((address) => (
          <div key={address.id} className="flex items-start justify-between gap-4 rounded-2xl border border-line bg-white p-5">
            <div>
              {address.isDefault && (
                <span className="mb-1 inline-block rounded-full bg-brass/15 px-2 py-0.5 text-xs font-medium text-brass">Default</span>
              )}
              <p className="font-medium text-espresso">{address.recipientName}</p>
              <p className="text-sm text-espresso-soft">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} {address.postalCode}
              </p>
            </div>
            <div className="flex shrink-0 gap-4 text-sm">
              <button type="button" onClick={() => startEdit(address)} className="font-medium text-espresso-soft hover:text-espresso">
                Edit
              </button>
              <button type="button" onClick={() => handleDelete(address.id)} className="font-medium text-red-600 hover:text-red-700">
                Remove
              </button>
            </div>
          </div>
        ))}
        {addresses.length === 0 && !isAdding && <p className="text-espresso-soft">No saved addresses yet.</p>}
      </div>

      {isAdding ? (
        <div className="rounded-2xl border border-line bg-white p-6">
          <p className="font-display text-lg text-espresso">{editingId ? "Edit address" : "Add address"}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <TextField
              id="addr-name"
              label="Full name"
              value={draft.recipientName}
              onChange={(e) => setDraft((d) => ({ ...d, recipientName: e.target.value }))}
            />
            <TextField id="addr-phone" label="Phone (optional)" value={draft.phone} onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))} />
            <div className="sm:col-span-2">
              <TextField id="addr-line1" label="Address" value={draft.line1} onChange={(e) => setDraft((d) => ({ ...d, line1: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <TextField
                id="addr-line2"
                label="Apt, suite, etc. (optional)"
                value={draft.line2}
                onChange={(e) => setDraft((d) => ({ ...d, line2: e.target.value }))}
              />
            </div>
            <TextField id="addr-city" label="City" value={draft.city} onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))} />
            <div className="grid grid-cols-2 gap-4">
              <TextField
                id="addr-state"
                label="State"
                maxLength={2}
                value={draft.state}
                onChange={(e) => setDraft((d) => ({ ...d, state: e.target.value.toUpperCase() }))}
              />
              <TextField id="addr-zip" label="ZIP" value={draft.postalCode} onChange={(e) => setDraft((d) => ({ ...d, postalCode: e.target.value }))} />
            </div>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm text-espresso-soft">
            <input type="checkbox" checked={draft.isDefault} onChange={(e) => setDraft((d) => ({ ...d, isDefault: e.target.checked }))} />
            Set as default address
          </label>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="mt-5 flex gap-3">
            <Button
              type="button"
              variant="brass"
              disabled={isSaving || !draft.recipientName || !draft.line1 || !draft.city || !draft.state || !draft.postalCode}
              onClick={handleSave}
              className="disabled:opacity-60"
            >
              {isSaving ? "Saving…" : "Save address"}
            </Button>
            <Button type="button" variant="ghost" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={() => setIsAdding(true)} className="w-fit">
          Add address
        </Button>
      )}
    </div>
  );
}
