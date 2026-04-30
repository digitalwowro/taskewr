"use client";

import { useEffect, useRef } from "react";

import type { AppProject } from "@/app/app-data";
import { formatProjectCode } from "@/components/app/project-format";
import { ModalHeaderKicker } from "@/components/app/ui";
import { useFocusTrap } from "@/hooks/use-focus-trap";

export function ProjectArchiveModal({
  project,
  onClose,
  onConfirm,
  isSaving,
  error,
}: {
  project: AppProject | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isSaving: boolean;
  error: string | null;
}) {
  const dialogRef = useRef<HTMLElement | null>(null);

  useFocusTrap(dialogRef, !!project);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, onClose]);

  if (!project) {
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
        aria-labelledby="archive-project-title"
        className="relative z-[121] w-full max-w-xl overflow-hidden rounded-[24px] border border-[var(--line-soft)] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.2)]"
      >
        <div className="border-b border-[var(--line-soft)] bg-white px-5 py-4">
          <div className="space-y-1.5">
            <ModalHeaderKicker code={formatProjectCode(project.id)} tone="danger" />
            <h2
              id="archive-project-title"
              className="text-[2rem] font-semibold leading-tight tracking-[-0.045em] text-[var(--ink-strong)]"
            >
              Archive project?
            </h2>
            <p className="text-sm leading-6 text-[var(--ink-muted)]">
              {project.name} will be hidden from the dashboard and active project lists.
              Its tasks and history will remain available in archived projects.
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
            {isSaving ? "Archiving..." : "Archive project"}
          </button>
        </div>
      </section>
    </div>
  );
}
