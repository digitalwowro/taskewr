"use client";

import { useEffect, useRef } from "react";

import { ModalHeaderKicker } from "@/components/app/ui";
import { useFocusTrap } from "@/hooks/use-focus-trap";

export function TaskProjectRequiredModal({
  open,
  onClose,
  onOpenProjects,
}: {
  open: boolean;
  onClose: () => void;
  onOpenProjects: () => void;
}) {
  const dialogRef = useRef<HTMLElement | null>(null);

  useFocusTrap(dialogRef, open);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(15,23,42,0.42)] px-4 py-5 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-project-required-title"
        className="relative z-[121] w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.2)]"
      >
        <div className="border-b border-[var(--line-soft)] bg-white px-5 py-4">
          <div className="space-y-1.5">
            <ModalHeaderKicker code="TASK" label="New task" />
            <h2
              id="task-project-required-title"
              className="text-[2rem] font-semibold leading-tight tracking-[-0.045em] text-[var(--ink-strong)]"
            >
              Create a project first
            </h2>
            <p className="text-sm leading-6 text-[var(--ink-muted)]">
              Tasks must belong to a project. Create a new project, or ask an admin to add you
              to an existing project before creating tasks.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 bg-white px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--line-strong)] bg-[var(--surface-card)] px-4 text-sm font-medium text-[var(--ink-muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onOpenProjects}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--accent-strong)] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(34,122,89,0.18)] transition hover:bg-[var(--accent-strong-hover)]"
          >
            Open projects
          </button>
        </div>
      </section>
    </div>
  );
}
