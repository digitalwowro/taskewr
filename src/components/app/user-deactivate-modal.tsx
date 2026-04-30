"use client";

import { useEffect, useRef } from "react";
import { ModalHeaderKicker } from "@/components/app/ui";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import type { UserAdminItem } from "@/hooks/use-user-admin-state";

export function UserDeactivateModal({
  user,
  onClose,
  onConfirm,
  isSaving,
  error,
}: {
  user: UserAdminItem | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isSaving: boolean;
  error: string | null;
}) {
  const dialogRef = useRef<HTMLElement | null>(null);

  useFocusTrap(dialogRef, !!user);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, onClose]);

  if (!user) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(15,23,42,0.42)] px-4 py-5 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={() => {
          if (!isSaving) {
            onClose();
          }
        }}
      />
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="deactivate-user-title"
        className="relative z-[121] w-full max-w-xl overflow-hidden rounded-[24px] border border-[var(--line-soft)] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.2)]"
      >
        <div className="border-b border-[var(--line-soft)] bg-white px-5 py-4">
          <div className="space-y-1.5">
            <ModalHeaderKicker code={`USR-${user.id}`} tone="danger" />
            <h2
              id="deactivate-user-title"
              className="text-[2rem] font-semibold leading-tight tracking-[-0.045em] text-[var(--ink-strong)]"
            >
              Deactivate user?
            </h2>
            <p className="text-sm leading-6 text-[var(--ink-muted)]">
              {user.name} will no longer be able to log in. Their tasks, project memberships,
              and historical records will remain in place.
            </p>
          </div>
        </div>

        {error ? (
          <div className="border-b border-[rgba(193,62,62,0.14)] bg-[rgba(193,62,62,0.04)] px-5 py-3 text-sm text-[var(--accent-red)]">
            {error}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3 bg-white px-5 py-3">
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-[var(--line-strong)] bg-[var(--surface-card)] px-4 text-sm font-medium text-[var(--ink-muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => void onConfirm()}
            aria-busy={isSaving}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-[rgba(193,62,62,0.16)] bg-[rgba(193,62,62,0.08)] px-4 text-sm font-semibold text-[var(--accent-red)] transition hover:bg-[rgba(193,62,62,0.12)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Deactivating..." : "Deactivate user"}
          </button>
        </div>
      </section>
    </div>
  );
}
