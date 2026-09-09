"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProduct, setProductStatus } from "@/server/actions/admin-product-actions";

export function ProductRowActions({ productId, status }: { productId: string; status: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleArchiveToggle() {
    setError(null);
    startTransition(async () => {
      const result = await setProductStatus(productId, status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED");
      if (!result.success) setError(result.message);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("Permanently delete this product? This can't be undone.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteProduct(productId);
      if (!result.success) setError(result.message);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-3 text-sm">
        <button
          type="button"
          onClick={handleArchiveToggle}
          disabled={isPending}
          className="font-medium text-espresso-soft hover:text-espresso disabled:opacity-50"
        >
          {status === "ARCHIVED" ? "Unarchive" : "Archive"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
      {error && <p className="max-w-xs text-right text-xs text-red-600">{error}</p>}
    </div>
  );
}
