import { CAFE_MAP_EMBED_URL } from "@/lib/cafe";

/** Google map of the cafe. Fills whatever box it's put in (give the box a height / aspect ratio). */
export function CafeMap() {
  return (
    <iframe
      title="Map to Sultan Nut House"
      src={CAFE_MAP_EMBED_URL}
      className="h-full min-h-[320px] w-full"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
