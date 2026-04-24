"use client";

import { useEffect, useRef, useState } from "react";
import type { AppProject } from "@/app/app-data";
import { useFocusTrap } from "@/hooks/use-focus-trap";

const NEW_PROJECT_ID = "NEW_PROJECT";

function validateProjectEditorInput(input: { name: string }) {
  if (!input.name.trim()) {
    return { name: "Project name is required." };
  }

  return {};
}

export function ProjectEditorModal({
  project,
  onClose,
  onSave,
  onToggleArchive,
  isSaving,
  error,
}: {
  project: AppProject | null;
  onClose: () => void;
  onSave: (input: { name: string; description: string }) => Promise<void>;
  onToggleArchive: () => Promise<void>;
  isSaving: boolean;
  error: string | null;
}) {
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (project) {
      nameInputRef.current?.focus();
    }
  }, [project]);

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

  const isCreating = project.id === NEW_PROJECT_ID;
  const handleSave = async () => {
    const validation = validateProjectEditorInput({ name });

    if (validation.name) {
      setNameError(validation.name);
      return;
    }

    await onSave({ name: name.trim(), description: description.trim() });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(15,23,42,0.42)] px-4 py-6 backdrop-blur-sm">
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
        aria-labelledby="project-editor-title"
        className="relative z-[121] w-full max-w-3xl overflow-hidden rounded-[24px] border border-[var(--line-soft)] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.2)]"
      >
        <div className="border-b border-[var(--line-soft)] bg-white px-5 py-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[var(--surface-subtle)] px-2.5 py-1 font-mono text-[11px] tracking-[0.14em] text-[var(--ink-subtle)]">
                {isCreating ? "NEW" : project.id}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                Project
              </span>
            </div>
            <h2
              id="project-editor-title"
              className="text-[2rem] font-semibold leading-tight tracking-[-0.045em] text-[var(--ink-strong)]"
            >
              {isCreating ? "New project" : "Edit project"}
            </h2>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
              Project name
            </label>
            <input
              ref={nameInputRef}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setNameError(null);
              }}
              disabled={isSaving}
              aria-invalid={Boolean(nameError)}
              className={`h-11 w-full rounded-[18px] border bg-white px-4 text-sm text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)] ${
                nameError ? "border-[rgba(193,62,62,0.35)]" : "border-[var(--line-strong)]"
              }`}
            />
            {nameError ? <p className="text-xs text-[var(--accent-red)]">{nameError}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
              Description
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              disabled={isSaving}
              className="w-full rounded-[18px] border border-[var(--line-strong)] bg-white px-4 py-3 text-sm leading-6 text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
            />
          </div>
          {error ? (
            <p aria-live="polite" className="text-sm text-[var(--accent-red)]">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--line-soft)] bg-white px-5 py-3">
          <div>
            {!isCreating ? (
              project.isArchived ? (
                <button
                  type="button"
                  onClick={() => void onToggleArchive()}
                  disabled={isSaving}
                  className="inline-flex h-9 items-center rounded-xl border border-[rgba(193,62,62,0.14)] bg-[rgba(193,62,62,0.04)] px-4 text-sm font-medium text-[var(--accent-red)] transition hover:bg-[rgba(193,62,62,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Unarchive project
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void onToggleArchive()}
                  disabled={isSaving}
                  className="inline-flex h-9 items-center rounded-xl border border-[rgba(193,62,62,0.14)] bg-[rgba(193,62,62,0.04)] px-4 text-sm font-medium text-[var(--accent-red)] transition hover:bg-[rgba(193,62,62,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Archive project
                </button>
              )
            ) : null}
          </div>
          <div className="flex items-center gap-3">
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
              onClick={() => void handleSave()}
              aria-busy={isSaving}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-[var(--accent-strong)] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(34,122,89,0.18)] transition hover:bg-[var(--accent-strong-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : isCreating ? "Create project" : "Save changes"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
