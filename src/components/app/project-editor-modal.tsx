"use client";

import { useEffect, useRef, useState } from "react";
import type { AppProject, AppWorkspace } from "@/app/app-data";
import { formatProjectCode } from "@/components/app/project-format";
import { ModalHeaderKicker, SearchableSelect } from "@/components/app/ui";
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
  workspaces,
  onClose,
  onSave,
  onToggleArchive,
  isSaving,
  error,
}: {
  project: AppProject | null;
  workspaces: AppWorkspace[];
  onClose: () => void;
  onSave: (input: { workspaceId: number; name: string; description: string }) => Promise<void>;
  onToggleArchive: () => Promise<void>;
  isSaving: boolean;
  error: string | null;
}) {
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [workspaceId, setWorkspaceId] = useState(project?.workspaceId ?? workspaces[0]?.id ?? "");
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

    await onSave({
      workspaceId: Number(workspaceId),
      name: name.trim(),
      description: description.trim(),
    });
  };

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
        aria-labelledby="project-editor-title"
        className="relative z-[121] w-full max-w-3xl overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.2)]"
      >
        <div className="border-b border-[var(--line-soft)] bg-white px-5 py-4">
          <div className="space-y-1.5">
            <ModalHeaderKicker code={isCreating ? "NEW" : formatProjectCode(project.id)} label="Project" />
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
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
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
              className={`h-11 w-full rounded-lg border bg-white px-4 text-sm text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)] ${
                nameError ? "border-[rgba(193,62,62,0.35)]" : "border-[var(--line-strong)]"
              }`}
            />
            {nameError ? <p className="text-xs text-[var(--accent-red)]">{nameError}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
              Description
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              disabled={isSaving}
              className="w-full rounded-lg border border-[var(--line-strong)] bg-white px-4 py-3 text-sm leading-6 text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
              Workspace
            </label>
            <div>
              <SearchableSelect
                value={workspaceId}
                options={workspaces.map((workspace) => ({
                  value: workspace.id,
                  label: workspace.name,
                }))}
                onChange={setWorkspaceId}
                disabled={isSaving || !isCreating}
                ariaLabel="Workspace"
                inputClassName="h-11 border-[var(--line-strong)] bg-white px-4 pr-10"
                emptyMessage="No workspaces found."
              />
            </div>
            {!isCreating ? (
              <p className="text-xs text-[var(--ink-subtle)]">
                To move this project to another workspace, make sure all project users are also added to the target workspace.
              </p>
            ) : null}
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
                  className="inline-flex h-9 items-center rounded-lg border border-[rgba(193,62,62,0.14)] bg-[rgba(193,62,62,0.04)] px-4 text-sm font-medium text-[var(--accent-red)] transition hover:bg-[rgba(193,62,62,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Unarchive project
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void onToggleArchive()}
                  disabled={isSaving}
                  className="inline-flex h-9 items-center rounded-lg border border-[rgba(193,62,62,0.14)] bg-[rgba(193,62,62,0.04)] px-4 text-sm font-medium text-[var(--accent-red)] transition hover:bg-[rgba(193,62,62,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
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
              className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--line-strong)] bg-[var(--surface-card)] px-4 text-sm font-medium text-[var(--ink-muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void handleSave()}
              aria-busy={isSaving}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--accent-strong)] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(34,122,89,0.18)] transition hover:bg-[var(--accent-strong-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : isCreating ? "Create project" : "Save changes"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
