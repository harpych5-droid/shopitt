import { useEffect, useState } from "react";

/**
 * Tracks vertical scroll direction on a target element (or window).
 * Returns `hidden = true` when user is scrolling down past the threshold,
 * and false when scrolling up — used to auto-hide nav bars smoothly.
 */
export function useScrollDirection(opts?: {
  target?: HTMLElement | null;
  threshold?: number;
  offset?: number;
}) {
  const { target, threshold = 12, offset = 64 } = opts ?? {};
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = getY();
    let ticking = false;

    const getY = () =>
      target ? target.scrollTop : window.scrollY || document.documentElement.scrollTop;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = getY();
        const delta = y - lastY;

        // Keep the navigation available at the beginning of a feed and ignore
        // the small direction changes that occur during normal touch scrolling.
        if (y <= offset) {
          lastY = y;
          setHidden((wasHidden) => wasHidden ? false : wasHidden);
        } else if (Math.abs(delta) >= threshold) {
          const shouldHide = delta > 0;
          lastY = y;
          setHidden((wasHidden) => wasHidden === shouldHide ? wasHidden : shouldHide);
        }
        ticking = false;
      });
    };

    const el: EventTarget = target ?? window;
    el.addEventListener("scroll", onScroll, { passive: true } as AddEventListenerOptions);
    return () => el.removeEventListener("scroll", onScroll as EventListener);
  }, [target, threshold, offset]);

  return hidden;
}
