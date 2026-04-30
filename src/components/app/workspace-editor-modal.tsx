"use client";

import { useEffect, useRef, useState } from "react";

import { ModalHeaderKicker } from "@/components/app/ui";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import type {
  WorkspaceAdminItem,
  WorkspaceUserCandidate,
} from "@/hooks/use-workspace-admin-state";

const NEW_WORKSPACE_ID = 0;

function SelectChevron() {
  return (
    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[var(--ink-muted)]">
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="m4.5 6.5 3.5 3.5 3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function WorkspaceEditorModal({
  workspace,
  ownerCandidates,
  canChooseOwner,
  onClose,
  onSave,
  onDeleteWorkspace,
  isSaving,
  error,
}: {
  workspace: WorkspaceAdminItem | null;
  ownerCandidates: WorkspaceUserCandidate[];
  canChooseOwner: boolean;
  onClose: () => void;
  onSave: (input: { name: string; description: string; ownerUserId?: number }) => Promise<void>;
  onDeleteWorkspace: (workspaceId: number) => void;
  isSaving: boolean;
  error: string | null;
}) {
  const [name, setName] = useState(workspace?.name ?? "");
  const [description, setDescription] = useState(workspace?.description ?? "");
  const [ownerUserId, setOwnerUserId] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);

  useFocusTrap(dialogRef, !!workspace);

  useEffect(() => {
    if (workspace) {
      nameInputRef.current?.focus();
    }
  }, [workspace]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, onClose]);

  if (!workspace) {
    return null;
  }

  const isCreating = workspace.id === NEW_WORKSPACE_ID;
  const showOwnerSelector = isCreating && canChooseOwner;
  const deleteTooltip = !workspace.actorCanDelete
    ? "Only workspace owners can delete workspaces."
    : workspace.canDelete
      ? "Delete workspace"
      : "Delete requires an empty workspace. Remove projects, cycles, labels, and repeat rules first; members must also belong to another workspace.";

  const handleSave = async () => {
    if (!name.trim()) {
      setFieldError("Workspace name is required.");
      return;
    }

    if (showOwnerSelector && !ownerUserId) {
      setFieldError("Workspace owner is required.");
      return;
    }

    setFieldError(null);
    await onSave({
      name: name.trim(),
      description: description.trim(),
      ...(showOwnerSelector ? { ownerUserId: Number(ownerUserId) } : {}),
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
        aria-labelledby="workspace-editor-title"
        className="relative z-[121] w-full max-w-3xl overflow-hidden rounded-[24px] border border-[var(--line-soft)] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.2)]"
      >
        <div className="border-b border-[var(--line-soft)] bg-white px-5 py-4">
          <div className="space-y-1.5">
            <ModalHeaderKicker code={isCreating ? "NEW" : `WKS-${workspace.id}`} label="Workspace" />
            <h2
              id="workspace-editor-title"
              className="text-[2rem] font-semibold leading-tight tracking-[-0.045em] text-[var(--ink-strong)]"
            >
              {isCreating ? "New workspace" : "Edit workspace"}
            </h2>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
              Name
            </label>
            <input
              ref={nameInputRef}
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isSaving}
              className="h-11 w-full rounded-[18px] border border-[var(--line-strong)] bg-white px-4 text-sm text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
              Description
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={isSaving}
              rows={5}
              className="w-full resize-none rounded-[18px] border border-[var(--line-strong)] bg-white px-4 py-3 text-sm text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
            />
          </div>
          {showOwnerSelector ? (
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                Owner
              </label>
              <div className="relative">
                <select
                  value={ownerUserId}
                  onChange={(event) => setOwnerUserId(event.target.value)}
                  disabled={isSaving || ownerCandidates.length === 0}
                  style={{
                    appearance: "none",
                    WebkitAppearance: "none",
                    backgroundImage: "none",
                  }}
                  className="h-11 w-full appearance-none rounded-[18px] border border-[var(--line-strong)] bg-white px-4 pr-10 text-sm text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
                >
                  <option value="">
                    {ownerCandidates.length === 0 ? "No active users available" : "Select owner"}
                  </option>
                  {ownerCandidates.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
                <SelectChevron />
              </div>
            </div>
          ) : null}

          {fieldError || error ? (
            <p aria-live="polite" className="text-sm text-[var(--accent-red)]">
              {fieldError ?? error}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--line-soft)] bg-white px-5 py-3">
          <div>
            {!isCreating ? (
              <span className="group relative inline-flex">
                <button
                  type="button"
                  disabled={isSaving || !workspace.actorCanDelete || !workspace.canDelete}
                  onClick={() => onDeleteWorkspace(workspace.id)}
                  aria-label="Delete workspace"
                  title={deleteTooltip}
                  className="inline-flex h-9 items-center rounded-xl border border-[rgba(193,62,62,0.14)] bg-[rgba(193,62,62,0.04)] px-4 text-sm font-medium text-[var(--accent-red)] transition hover:bg-[rgba(193,62,62,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Delete workspace
                </button>
                {!workspace.actorCanDelete || !workspace.canDelete ? (
                  <span className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 hidden max-w-[22rem] rounded-lg border border-[var(--line-soft)] bg-[rgb(15,23,42)] px-2.5 py-1.5 text-[11px] font-medium leading-5 text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] group-hover:block group-focus-within:block">
                    {deleteTooltip}
                  </span>
                ) : null}
              </span>
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
              {isSaving ? "Saving..." : isCreating ? "Create workspace" : "Save changes"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
