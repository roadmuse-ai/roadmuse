import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useEffectiveTheme } from "./useEffectiveTheme";

type ChangeListener = (event: { matches: boolean }) => void;

function stubMatchMedia(initialMatches: boolean) {
  let listener: ChangeListener | undefined;

  const query = {
    matches: initialMatches,
    addEventListener: vi.fn((_: string, callback: ChangeListener) => {
      listener = callback;
    }),
    removeEventListener: vi.fn(),
  };

  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue(query));

  return {
    query,
    emitChange(matches: boolean) {
      listener?.({ matches });
    },
  };
}

describe("useEffectiveTheme", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns the explicit mode without listening for system changes", () => {
    const media = stubMatchMedia(true);

    const { result } = renderHook(() => useEffectiveTheme("light"));

    expect(result.current).toBe("light");
    expect(media.query.addEventListener).not.toHaveBeenCalled();
  });

  it("follows the system preference in auto mode", () => {
    stubMatchMedia(true);

    const { result } = renderHook(() => useEffectiveTheme("auto"));

    expect(result.current).toBe("dark");
  });

  it("updates when the system color scheme changes in auto mode", () => {
    const media = stubMatchMedia(false);

    const { result } = renderHook(() => useEffectiveTheme("auto"));
    expect(result.current).toBe("light");

    act(() => {
      media.emitChange(true);
    });
    expect(result.current).toBe("dark");

    act(() => {
      media.emitChange(false);
    });
    expect(result.current).toBe("light");
  });

  it("removes the system listener when leaving auto mode", () => {
    const media = stubMatchMedia(false);

    const { rerender } = renderHook(({ mode }) => useEffectiveTheme(mode), {
      initialProps: { mode: "auto" as const },
    });
    expect(media.query.addEventListener).toHaveBeenCalledTimes(1);

    rerender({ mode: "dark" as never });
    expect(media.query.removeEventListener).toHaveBeenCalledTimes(1);
  });

  it("falls back to light in auto mode when matchMedia is unavailable", () => {
    const { result } = renderHook(() => useEffectiveTheme("auto"));

    expect(result.current).toBe("light");
  });
});
