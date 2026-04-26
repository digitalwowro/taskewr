"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

type CollapsedSections = Record<string, boolean>;
const STORAGE_CHANGE_EVENT = "taskewr:collapsed-sections-change";

function parseStoredSections(value: string): CollapsedSections {
  const parsed = JSON.parse(value) as unknown;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(parsed).filter((entry): entry is [string, boolean] => (
      typeof entry[0] === "string" && typeof entry[1] === "boolean"
    )),
  );
}

function readStoredSections(storageKey: string): CollapsedSections {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const storedValue = window.localStorage.getItem(storageKey);
    return storedValue ? parseStoredSections(storedValue) : {};
  } catch {
    return {};
  }
}

function readStoredValue(storageKey: string): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return window.localStorage.getItem(storageKey) ?? "";
  } catch {
    return "";
  }
}

function persistSections(storageKey: string, sections: CollapsedSections) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(sections));
    window.dispatchEvent(new Event(STORAGE_CHANGE_EVENT));
  } catch {
    // Keep the UI responsive even if storage is unavailable.
  }
}

export function usePersistedCollapsedSections(storageKey: string) {
  const storedValue = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener(STORAGE_CHANGE_EVENT, onStoreChange);

      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(STORAGE_CHANGE_EVENT, onStoreChange);
      };
    },
    () => readStoredValue(storageKey),
    () => "",
  );
  const collapsedSections = useMemo(() => {
    if (!storedValue) {
      return {};
    }

    try {
      return parseStoredSections(storedValue);
    } catch {
      return {};
    }
  }, [storedValue]);

  const setSectionCollapsed = useCallback(
    (sectionId: string, collapsed: boolean) => {
      const next = {
        ...readStoredSections(storageKey),
        [sectionId]: collapsed,
      };

      persistSections(storageKey, next);
    },
    [storageKey],
  );

  const toggleSection = useCallback(
    (sectionId: string) => {
      const current = readStoredSections(storageKey);
      const next = {
        ...current,
        [sectionId]: !current[sectionId],
      };

      persistSections(storageKey, next);
    },
    [storageKey],
  );

  return {
    collapsedSections,
    isSectionCollapsed: (sectionId: string) => Boolean(collapsedSections[sectionId]),
    setSectionCollapsed,
    toggleSection,
  };
}
