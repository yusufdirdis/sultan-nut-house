"use client";

import { useEffect, useState } from "react";

export interface ReviewData {
  id: string;
  authorName: string;
  rating: number;
  body: string;
  googleReviewUrl: string;
}

export function ReviewsCarousel({ reviews }: { reviews: ReviewData[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reviews.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % reviews.length), 6000);
    return () => clearInterval(timer);
  }, [reviews.length]);

  if (reviews.length === 0) return null;

  const review = reviews[index];

  return (
    <div className="mx-auto max-w-2xl text-center">
      <a
        href={review.googleReviewUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group block rounded-2xl border border-line bg-white p-8 transition-shadow hover:shadow-lg hover:shadow-espresso/5 sm:p-10"
      >
        <p className="text-lg text-brass" aria-hidden>
          {"★".repeat(review.rating)}
          <span className="text-espresso/15">{"★".repeat(5 - review.rating)}</span>
        </p>
        <p className="font-display mt-4 text-xl leading-relaxed text-espresso sm:text-2xl">&ldquo;{review.body}&rdquo;</p>
        <p className="mt-5 text-sm font-medium text-espresso-soft">
          {review.authorName}
          <span className="ml-2 text-espresso-soft/60 group-hover:text-brass">— Read on Google &rarr;</span>
        </p>
      </a>

      {reviews.length > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {reviews.map((r, i) => (
            <button
              key={r.id}
              type="button"
              aria-label={`Show review ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 w-2 rounded-full transition-colors ${i === index ? "bg-brass" : "bg-espresso/15"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
