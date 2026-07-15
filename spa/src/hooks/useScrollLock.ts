import { useEffect } from "react";

export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) {
      return;
    }

    const scrollY = window.scrollY;
    const { style } = document.body;
    const previousOverflow = style.overflow;
    const previousPosition = style.position;
    const previousTop = style.top;
    const previousWidth = style.width;
    const previousPaddingRight = style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    style.overflow = "hidden";
    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.width = "100%";

    if (scrollbarWidth > 0) {
      style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      style.overflow = previousOverflow;
      style.position = previousPosition;
      style.top = previousTop;
      style.width = previousWidth;
      style.paddingRight = previousPaddingRight;
      window.scrollTo(0, scrollY);
    };
  }, [active]);
}
