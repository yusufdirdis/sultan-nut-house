"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";

/**
 * A horizontally scrolling <nav> that brings the current item (aria-current)
 * into view. Without it, tapping a category far along the row on a phone lands
 * on a page whose row has snapped back to the start, hiding the one you chose.
 */
export function ScrollingNav({ className, children, ...props }: ComponentPropsWithoutRef<"nav">) {
  const ref = useRef<HTMLElement>(null);

  // No dependency list on purpose: moving between category pages re-renders this
  // same instance rather than remounting it, and the row needs re-centering each time.
  useEffect(() => {
    const nav = ref.current;
    const current = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !current) return;
    nav.scrollLeft = current.offsetLeft - (nav.clientWidth - current.offsetWidth) / 2;
  });

  return (
    // `relative` makes the nav the offsetParent, so offsetLeft is measured from its own edge.
    <nav ref={ref} className={`relative ${className ?? ""}`} {...props}>
      {children}
    </nav>
  );
}
