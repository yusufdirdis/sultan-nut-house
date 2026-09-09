"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteModifierGroup } from "@/server/actions/admin-modifier-actions";

export function ModifierGroupRowActions({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!confirm("Delete this modifier group?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteModifierGroup(groupId);
      if (!result.success) setError(result.message);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" onClick={handleDelete} disabled={isPending} className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50">
        Delete
      </button>
      {error && <p className="max-w-xs text-right text-xs text-red-600">{error}</p>}
    </div>
  );
}
