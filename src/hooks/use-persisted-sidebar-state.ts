"use client";

import { useCallback, useSyncExternalStore } from "react";

const DEFAULT_SIDEBAR_EXPANDED = false;

function subscribe(storageKey: string, onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === storageKey) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener("storage", handleStorage);
  };
}

export function usePersistedSidebarState(storageKey: string) {
  const getSnapshot = useCallback(() => {
    const storedValue = window.localStorage.getItem(storageKey);
    return storedValue === "true";
  }, [storageKey]);

  const sidebarExpanded = useSyncExternalStore(
    (onStoreChange) => subscribe(storageKey, onStoreChange),
    getSnapshot,
    () => DEFAULT_SIDEBAR_EXPANDED,
  );

  const setSidebarExpanded = useCallback(
    (nextValue: boolean | ((current: boolean) => boolean)) => {
      const resolvedValue =
        typeof nextValue === "function"
          ? (nextValue as (current: boolean) => boolean)(getSnapshot())
          : nextValue;

      window.localStorage.setItem(storageKey, String(resolvedValue));
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: storageKey,
          newValue: String(resolvedValue),
        }),
      );
    },
    [getSnapshot, storageKey],
  );

  return [sidebarExpanded, setSidebarExpanded] as const;
}
