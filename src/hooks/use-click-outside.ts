"use client";

import { RefObject, useEffect } from "react";

export function useClickOutside(
  refs: Array<RefObject<HTMLElement | null>>,
  isEnabled: boolean,
  onOutsideClick: () => void,
) {
  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInside = refs.some((ref) => ref.current?.contains(target) ?? false);

      if (!clickedInside) {
        onOutsideClick();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isEnabled, onOutsideClick, refs]);
}
