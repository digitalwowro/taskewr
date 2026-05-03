"use client";

import { useEffect, useRef, useState } from "react";

import {
  WORKSPACE_ROLE_OPTIONS,
  accessRoleTone,
  projectRoleLabel,
  workspaceRoleLabel,
} from "@/components/app/access-role-format";
import { ModalHeaderKicker, SearchableSelect, StatusPill } from "@/components/app/ui";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import type { WorkspaceMemberAccessDetails } from "@/hooks/use-workspace-admin-state";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function EmptyState({ children }: { children: string }) {
  return (
    <div className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-subtle)] px-4 py-4 text-sm text-[var(--ink-subtle)]">
      {children}
    </div>
  );
}

export function WorkspaceMemberEditorModal({
  member,
  loading,
  isSaving,
  error,
  onClose,
  onSaveRole,
}: {
  member: WorkspaceMemberAccessDetails | null;
  loading: boolean;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSaveRole: (role: string) => Promise<void>;
}) {
  const memberRoleKey = member
    ? `${member.currentWorkspace.id}:${member.userId}:${member.currentWorkspace.role}`
    : "";
  const [roleState, setRoleState] = useState({
    key: memberRoleKey,
    value: member?.currentWorkspace.role ?? "member",
  });
  const dialogRef = useRef<HTMLElement | null>(null);
  const isOpen = loading || member !== null;
  const role =
    member && roleState.key === memberRoleKey
      ? roleState.value
      : member?.currentWorkspace.role ?? "member";

  useFocusTrap(dialogRef, isOpen);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, onClose]);

  if (!isOpen) {
    return null;
  }

  const title = member?.name ?? "Workspace member";
  const otherWorkspaces = member?.workspaces.filter((workspace) => !workspace.isCurrent) ?? [];
  const workspaceScopeLabel =
    member?.overviewScope === "all"
      ? "App-wide access overview"
      : "Access overview for workspaces you manage";
  const roleOptions = member?.currentWorkspace.actorCanManageOwners
    ? WORKSPACE_ROLE_OPTIONS
    : WORKSPACE_ROLE_OPTIONS.filter((option) => option.value !== "owner");

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
        aria-labelledby="workspace-member-editor-title"
        className="relative z-[121] max-h-[calc(100vh-3rem)] w-full max-w-4xl overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.2)]"
      >
        <div className="border-b border-[var(--line-soft)] bg-white px-5 py-4">
          <div className="space-y-1.5">
            <ModalHeaderKicker code={member ? `USR-${member.userId}` : "USR"} label="Workspace member">
              {member ? (
                <StatusPill tone={member.isActive ? "green" : "red"}>
                  {member.isActive ? "Active" : "Inactive"}
                </StatusPill>
              ) : null}
            </ModalHeaderKicker>
            <h2
              id="workspace-member-editor-title"
              className="text-[2rem] font-semibold leading-tight tracking-[-0.045em] text-[var(--ink-strong)]"
            >
              {title}
            </h2>
            {member ? (
              <p className="text-sm text-[var(--ink-muted)]">
                {member.email} · {member.timezone ?? "No timezone"} · {workspaceScopeLabel}
              </p>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="border-b border-[rgba(193,62,62,0.14)] bg-[rgba(193,62,62,0.04)] px-5 py-3 text-sm text-[var(--accent-red)]">
            {error}
          </div>
        ) : null}

        <div className="max-h-[calc(100vh-16rem)] space-y-5 overflow-y-auto px-5 py-5">
          {loading ? (
            <EmptyState>Loading member access...</EmptyState>
          ) : member ? (
            <>
              <section className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-subtle)] p-4">
                <div className="grid gap-4 lg:grid-cols-[1fr_16rem] lg:items-end">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                      Current workspace
                    </p>
                    <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
                      {member.currentWorkspace.name}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--ink-muted)]">
                      Change the workspace role from here instead of directly in the table.
                    </p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                      Workspace Role
                    </label>
                    <SearchableSelect
                        value={role}
                      options={roleOptions.map((option) => ({
                        value: option.value,
                        label: option.label,
                      }))}
                      onChange={(nextRole) =>
                          setRoleState({
                            key: memberRoleKey,
                          value: nextRole,
                          })
                      }
                        disabled={isSaving}
                      ariaLabel="Workspace role"
                      inputClassName="h-11 border-[var(--line-strong)] bg-white px-4 pr-10 text-sm font-medium"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink-strong)]">
                    Other workspaces
                  </h3>
                  <span className="text-xs text-[var(--ink-subtle)]">
                    {otherWorkspaces.length} visible
                  </span>
                </div>
                {otherWorkspaces.length === 0 ? (
                  <EmptyState>No other visible workspace access.</EmptyState>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-[var(--line-soft)]">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-[var(--surface-subtle)] text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                          <th className="px-4 py-2">Workspace</th>
                          <th className="px-4 py-2">Workspace Role</th>
                          <th className="px-4 py-2">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--line-soft)]">
                        {otherWorkspaces.map((workspace) => (
                          <tr key={workspace.id} className="text-sm">
                            <td className="px-4 py-3">
                              <div className="font-medium text-[var(--ink-strong)]">{workspace.name}</div>
                              <div className="font-mono text-xs tracking-[0.08em] text-[var(--ink-subtle)]">
                                {workspace.slug}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <StatusPill tone={accessRoleTone(workspace.role)}>
                                {workspaceRoleLabel(workspace.role)}
                              </StatusPill>
                            </td>
                            <td className="px-4 py-3 text-[var(--ink-muted)]">
                              {formatDate(workspace.joinedAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink-strong)]">
                    Project access
                  </h3>
                  <span className="text-xs text-[var(--ink-subtle)]">
                    {member.projects.length} visible
                  </span>
                </div>
                {member.projects.length === 0 ? (
                  <EmptyState>No visible project access.</EmptyState>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-[var(--line-soft)]">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-[var(--surface-subtle)] text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                          <th className="px-4 py-2">Project</th>
                          <th className="px-4 py-2">Workspace</th>
                          <th className="px-4 py-2">Project Role</th>
                          <th className="px-4 py-2">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--line-soft)]">
                        {member.projects.map((project) => (
                          <tr key={project.id} className="text-sm">
                            <td className="px-4 py-3 font-medium text-[var(--ink-strong)]">
                              {project.name}
                            </td>
                            <td className="px-4 py-3 text-[var(--ink-muted)]">
                              {project.workspaceName}
                            </td>
                            <td className="px-4 py-3">
                              <StatusPill tone={accessRoleTone(project.role)}>
                                {projectRoleLabel(project.role)}
                              </StatusPill>
                            </td>
                            <td className="px-4 py-3 text-[var(--ink-muted)]">
                              {formatDate(project.joinedAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[var(--line-soft)] bg-white px-5 py-3">
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
            disabled={isSaving || loading || !member}
            onClick={() => void onSaveRole(role)}
            aria-busy={isSaving}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--accent-strong)] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(34,122,89,0.18)] transition hover:bg-[var(--accent-strong-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </section>
    </div>
  );
}
