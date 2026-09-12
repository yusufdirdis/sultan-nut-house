import { listReviewsForAdmin } from "@/server/actions/admin-review-actions";
import { ReviewManager } from "@/components/admin/ReviewManager";

export default async function AdminReviewsPage() {
  const reviews = await listReviewsForAdmin();

  return (
    <div>
      <h1 className="font-display text-3xl text-espresso">Reviews</h1>
      <p className="mt-1 text-sm text-espresso-soft">
        Curated Google reviews shown on the homepage. Copy the text and a direct link from Google Maps.
      </p>
      <div className="mt-8">
        <ReviewManager
          reviews={reviews.map((r) => ({
            id: r.id,
            authorName: r.authorName,
            rating: r.rating,
            body: r.body,
            googleReviewUrl: r.googleReviewUrl,
            isVisible: r.isVisible,
          }))}
        />
      </div>
    </div>
  );
}
