"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { deleteReview, moveReview, saveReview } from "@/server/actions/admin-review-actions";
import type { ReviewInput } from "@/validation/admin-review";

interface Review extends ReviewInput {
  id: string;
}

const emptyDraft: ReviewInput = { authorName: "", rating: 5, body: "", googleReviewUrl: "", isVisible: true };

export function ReviewManager({ reviews }: { reviews: Review[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<ReviewInput>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function startEdit(review: Review) {
    setEditingId(review.id);
    setDraft(review);
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setDraft(emptyDraft);
    setError(null);
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    const result = await saveReview({ ...draft, id: editingId ?? undefined });
    setIsSaving(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    resetForm();
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this review?")) return;
    const result = await deleteReview(id);
    if (!result.success) alert(result.message);
    router.refresh();
  }

  async function handleMove(id: string, direction: "up" | "down") {
    await moveReview(id, direction);
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="rounded-2xl border border-line bg-white">
        <ul className="divide-y divide-line">
          {reviews.map((review, index) => (
            <li key={review.id} className="flex items-start justify-between gap-4 px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-espresso">{review.authorName}</p>
                  <span className="text-sm text-brass">{"★".repeat(review.rating)}</span>
                  {!review.isVisible && <span className="text-xs text-espresso-soft">· Hidden</span>}
                </div>
                <p className="mt-1 max-w-md text-sm text-espresso-soft line-clamp-2">{review.body}</p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => handleMove(review.id, "up")}
                    disabled={index === 0}
                    aria-label="Move up"
                    className="text-espresso-soft hover:text-espresso disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(review.id, "down")}
                    disabled={index === reviews.length - 1}
                    aria-label="Move down"
                    className="text-espresso-soft hover:text-espresso disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>
                <button type="button" onClick={() => startEdit(review)} className="font-medium text-espresso-soft hover:text-espresso">
                  Edit
                </button>
                <button type="button" onClick={() => handleDelete(review.id)} className="font-medium text-red-600 hover:text-red-700">
                  Delete
                </button>
              </div>
            </li>
          ))}
          {reviews.length === 0 && <li className="px-5 py-6 text-sm text-espresso-soft">No reviews yet.</li>}
        </ul>
      </div>

      <div className="h-fit rounded-2xl border border-line bg-white p-6">
        <h2 className="font-display text-lg text-espresso">{editingId ? "Edit review" : "Add review"}</h2>
        <div className="mt-4 flex flex-col gap-4">
          <TextField
            id="review-author"
            label="Reviewer name"
            value={draft.authorName}
            onChange={(event) => setDraft((d) => ({ ...d, authorName: event.target.value }))}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-espresso" htmlFor="review-rating">
              Rating
            </label>
            <select
              id="review-rating"
              value={draft.rating}
              onChange={(event) => setDraft((d) => ({ ...d, rating: Number(event.target.value) }))}
              className="h-12 rounded-xl border border-espresso/20 bg-white px-4 text-base text-espresso outline-none focus:border-brass"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {"★".repeat(n)} ({n})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-espresso" htmlFor="review-body">
              Review text
            </label>
            <textarea
              id="review-body"
              rows={4}
              value={draft.body}
              onChange={(event) => setDraft((d) => ({ ...d, body: event.target.value }))}
              placeholder="Paste the review text from Google"
              className="rounded-xl border border-espresso/20 bg-white px-4 py-3 text-base text-espresso outline-none focus:border-brass"
            />
          </div>
          <TextField
            id="review-url"
            label="Google review link"
            value={draft.googleReviewUrl}
            onChange={(event) => setDraft((d) => ({ ...d, googleReviewUrl: event.target.value }))}
            placeholder="https://g.co/kgs/..."
          />
          <p className="-mt-2 text-xs text-espresso-soft">
            On Google Maps, open the review and use its share icon to copy a direct link to it.
          </p>
          <label className="flex items-center gap-2 text-sm text-espresso-soft">
            <input
              type="checkbox"
              checked={draft.isVisible}
              onChange={(event) => setDraft((d) => ({ ...d, isVisible: event.target.checked }))}
            />
            Visible on the homepage
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="brass"
              onClick={handleSave}
              disabled={isSaving || !draft.authorName || !draft.body || !draft.googleReviewUrl}
            >
              {isSaving ? "Saving…" : editingId ? "Save" : "Add"}
            </Button>
            {editingId && (
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
