import { clsx } from "clsx";

export function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div className={clsx("flex h-full w-full items-center justify-center bg-cream-deep", className)}>
      <svg width="15%" height="15%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" className="text-espresso/20">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="1.75" />
        <path d="M21 15l-5-5a2 2 0 0 0-2.83 0L4 19" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
