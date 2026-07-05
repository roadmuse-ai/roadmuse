import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useScrollLock } from "./useScrollLock";

function stubScrollY(value: number) {
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    value,
  });
}

describe("useScrollLock", () => {
  afterEach(() => {
    document.body.removeAttribute("style");
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("locks body scroll while active and restores position on release", () => {
    stubScrollY(180);
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);

    const { rerender } = renderHook(({ active }) => useScrollLock(active), {
      initialProps: { active: false },
    });

    expect(document.body.style.overflow).toBe("");

    rerender({ active: true });

    expect(document.body.style.overflow).toBe("hidden");
    expect(document.body.style.position).toBe("fixed");
    expect(document.body.style.top).toBe("-180px");

    rerender({ active: false });

    expect(document.body.style.overflow).toBe("");
    expect(document.body.style.position).toBe("");
    expect(scrollTo).toHaveBeenCalledWith(0, 180);
  });

  it("restores scroll position when the hook unmounts while locked", () => {
    stubScrollY(240);
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);

    const { unmount } = renderHook(() => useScrollLock(true));

    expect(document.body.style.overflow).toBe("hidden");

    unmount();

    expect(document.body.style.overflow).toBe("");
    expect(scrollTo).toHaveBeenCalledWith(0, 240);
  });
});
