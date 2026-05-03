"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  PROJECT_ROLE_OPTIONS,
  WORKSPACE_ROLE_OPTIONS,
  accessRoleTone,
  projectRoleLabel,
  workspaceRoleLabel,
} from "@/components/app/access-role-format";
import {
  IconTooltip,
  ModalHeaderKicker,
  SearchableSelect,
  StatusPill,
} from "@/components/app/ui";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import type { UserAdminItem, UserProjectAccess } from "@/hooks/use-user-admin-state";

function AddIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M8 3.25v9.5" strokeLinecap="round" />
      <path d="M3.25 8h9.5" strokeLinecap="round" />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="8" cy="8" r="5.25" />
      <path d="M5.75 8h4.5" strokeLinecap="round" />
    </svg>
  );
}

function EmptyState({ children }: { children: string }) {
  return (
    <div className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-subtle)] px-4 py-4 text-sm text-[var(--ink-subtle)]">
      {children}
    </div>
  );
}

type AddAccessMode = "workspace" | "project";

export function UserProjectAccessModal({
  user,
  details,
  loading,
  isSaving,
  error,
  onClose,
  onAddWorkspace,
  onAddProject,
  onRemoveProject,
  onRemoveWorkspace,
}: {
  user: UserAdminItem | null;
  details: UserProjectAccess | null;
  loading: boolean;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onAddWorkspace: (workspaceId: number, role: string) => Promise<void>;
  onAddProject: (projectId: number, role: string) => Promise<void>;
  onRemoveProject: (projectId: number) => Promise<void>;
  onRemoveWorkspace: (workspaceId: number) => Promise<void>;
}) {
  const [addAccessMode, setAddAccessMode] = useState<AddAccessMode>("workspace");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [selectedWorkspaceRole, setSelectedWorkspaceRole] = useState("member");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedProjectRole, setSelectedProjectRole] = useState("member");
  const dialogRef = useRef<HTMLElement | null>(null);
  const isOpen = Boolean(user) || loading || Boolean(details);
  const availableWorkspaceOptions = details?.availableWorkspaces ?? [];
  const availableProjectOptions = useMemo(
    () =>
      details?.workspaces.flatMap((workspace) =>
        workspace.availableProjects.map((project) => ({
          ...project,
          workspaceId: workspace.id,
          workspaceName: workspace.name,
        })),
      ) ?? [],
    [details],
  );

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

  const displayUser = details?.user ?? user;
  const title = displayUser?.name ?? "User projects";
  const selectedWorkspaceValue = availableWorkspaceOptions.some(
    (workspace) => String(workspace.id) === selectedWorkspaceId,
  )
    ? selectedWorkspaceId
    : String(availableWorkspaceOptions[0]?.id ?? "");
  const selectedProjectValue = availableProjectOptions.some(
    (project) => String(project.id) === selectedProjectId,
  )
    ? selectedProjectId
    : String(availableProjectOptions[0]?.id ?? "");
  const canAddWorkspace = Boolean(selectedWorkspaceValue) && !isSaving;
  const canAddProject = Boolean(selectedProjectValue) && !isSaving;
  const handleAddWorkspace = async () => {
    if (!selectedWorkspaceValue) {
      return;
    }

    await onAddWorkspace(Number(selectedWorkspaceValue), selectedWorkspaceRole);
  };
  const handleAddProject = async () => {
    if (!selectedProjectValue) {
      return;
    }

    await onAddProject(Number(selectedProjectValue), selectedProjectRole);
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
        aria-labelledby="user-project-access-title"
        className="relative z-[121] max-h-[calc(100vh-3rem)] w-full max-w-3xl overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.2)]"
      >
        <div className="border-b border-[var(--line-soft)] bg-white px-5 py-4">
          <div className="space-y-1.5">
            <ModalHeaderKicker
              code={displayUser ? `USR-${displayUser.id}` : "USR"}
              label="Project access"
            />
            <h2
              id="user-project-access-title"
              className="text-[2rem] font-semibold leading-tight tracking-[-0.045em] text-[var(--ink-strong)]"
            >
              {title}
            </h2>
            {displayUser ? (
              <p className="text-sm leading-6 text-[var(--ink-muted)]">
                {displayUser.email}
              </p>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="border-b border-[rgba(193,62,62,0.14)] bg-[rgba(193,62,62,0.04)] px-5 py-3 text-sm text-[var(--accent-red)]">
            {error}
          </div>
        ) : null}

        <div className="max-h-[calc(100vh-15rem)] overflow-y-auto px-5 py-5">
          {loading ? (
            <EmptyState>Loading project access...</EmptyState>
          ) : details && details.workspaces.length > 0 ? (
            <div className="space-y-4">
              <section className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-subtle)] p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink-strong)]">
                    Add access
                  </h3>
                  <div className="inline-flex rounded-lg border border-[var(--line-strong)] bg-white p-1">
                    {(["workspace", "project"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setAddAccessMode(mode)}
                        disabled={isSaving}
                        className={`h-8 rounded-lg px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          addAccessMode === mode
                            ? "bg-[var(--accent-strong)] text-white"
                            : "text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
                        }`}
                      >
                        {mode === "workspace" ? "Workspace" : "Project"}
                      </button>
                    ))}
                  </div>
                </div>

                {addAccessMode === "workspace" ? (
                  <div className="grid gap-3 lg:grid-cols-[1fr_14rem_auto] lg:items-end">
                    <label className="block">
                      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                        Workspace
                      </span>
                      <SearchableSelect
                          value={selectedWorkspaceValue}
                        options={availableWorkspaceOptions.map((workspace) => ({
                          value: String(workspace.id),
                          label: workspace.name,
                        }))}
                        onChange={setSelectedWorkspaceId}
                        placeholder={
                          availableWorkspaceOptions.length > 0
                            ? "Select workspace"
                            : "No workspaces to add"
                        }
                        emptyMessage="No workspaces to add."
                          disabled={isSaving || availableWorkspaceOptions.length === 0}
                        ariaLabel="Workspace"
                        inputClassName="h-11 border-[var(--line-strong)] bg-white px-4 pr-10 text-sm font-medium"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                        Workspace Role
                      </span>
                      <SearchableSelect
                          value={selectedWorkspaceRole}
                        options={WORKSPACE_ROLE_OPTIONS.map((option) => ({
                          value: option.value,
                          label: option.label,
                        }))}
                        onChange={setSelectedWorkspaceRole}
                          disabled={isSaving}
                        ariaLabel="Workspace role"
                        inputClassName="h-11 border-[var(--line-strong)] bg-white px-4 pr-10 text-sm font-medium"
                      />
                    </label>

                    <button
                      type="button"
                      disabled={!canAddWorkspace}
                      onClick={() => void handleAddWorkspace()}
                      className="inline-flex h-11 min-w-[8.5rem] items-center justify-center rounded-lg border border-transparent bg-[var(--accent-strong)] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(34,122,89,0.18)] transition hover:bg-[var(--accent-strong-hover)] disabled:cursor-not-allowed disabled:border-[var(--line-strong)] disabled:bg-white disabled:text-[var(--ink-muted)] disabled:shadow-none"
                    >
                      <AddIcon />
                      <span className="ml-2">{isSaving ? "Adding..." : "Add workspace"}</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-3 lg:grid-cols-[1fr_14rem_auto] lg:items-end">
                    <label className="block">
                      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                        Project
                      </span>
                      <SearchableSelect
                          value={selectedProjectValue}
                        options={availableProjectOptions.map((project) => ({
                          value: String(project.id),
                          label: `${project.workspaceName} / ${project.name}${
                            project.isArchived ? " (archived)" : ""
                          }`,
                          searchText: `${project.workspaceName} ${project.name}`,
                        }))}
                        onChange={setSelectedProjectId}
                        placeholder={
                          availableProjectOptions.length > 0
                            ? "Select project"
                            : "No projects to add"
                        }
                        emptyMessage="No projects to add."
                          disabled={isSaving || availableProjectOptions.length === 0}
                        ariaLabel="Project"
                        inputClassName="h-11 border-[var(--line-strong)] bg-white px-4 pr-10 text-sm font-medium"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                        Project Role
                      </span>
                      <SearchableSelect
                          value={selectedProjectRole}
                        options={PROJECT_ROLE_OPTIONS.map((option) => ({
                          value: option.value,
                          label: option.label,
                        }))}
                        onChange={setSelectedProjectRole}
                          disabled={isSaving}
                        ariaLabel="Project role"
                        inputClassName="h-11 border-[var(--line-strong)] bg-white px-4 pr-10 text-sm font-medium"
                      />
                    </label>

                    <button
                      type="button"
                      disabled={!canAddProject}
                      onClick={() => void handleAddProject()}
                      className="inline-flex h-11 min-w-[8.5rem] items-center justify-center rounded-lg border border-transparent bg-[var(--accent-strong)] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(34,122,89,0.18)] transition hover:bg-[var(--accent-strong-hover)] disabled:cursor-not-allowed disabled:border-[var(--line-strong)] disabled:bg-white disabled:text-[var(--ink-muted)] disabled:shadow-none"
                    >
                      <AddIcon />
                      <span className="ml-2">{isSaving ? "Adding..." : "Add project"}</span>
                    </button>
                  </div>
                )}
              </section>

              {details.workspaces.map((workspace) => (
                <section
                  key={workspace.id}
                  className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-card)] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-base font-semibold tracking-[-0.02em] text-[var(--ink-strong)]">
                      {workspace.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={accessRoleTone(workspace.role)}>
                        {workspaceRoleLabel(workspace.role)}
                      </StatusPill>
                      <IconTooltip
                        tooltipAlign="right"
                        label={
                          workspace.projects.length > 0
                            ? "Remove project access first"
                            : details.workspaces.length <= 1
                              ? "User must belong to at least one workspace"
                              : "Remove from workspace"
                        }
                      >
                        <button
                          type="button"
                          disabled={isSaving || workspace.projects.length > 0 || details.workspaces.length <= 1}
                          onClick={() => void onRemoveWorkspace(workspace.id)}
                          aria-label={`Remove ${workspace.name} workspace access`}
                          title="Remove from workspace"
                          className="inline-flex h-8 items-center justify-center rounded-lg border border-[rgba(193,62,62,0.14)] bg-[rgba(193,62,62,0.04)] px-2.5 text-xs font-semibold text-[var(--accent-red)] transition hover:bg-[rgba(193,62,62,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <RemoveIcon />
                          <span className="ml-1.5">Remove from workspace</span>
                        </button>
                      </IconTooltip>
                    </div>
                  </div>

                  {workspace.projects.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {workspace.projects.map((project) => (
                        <li
                          key={project.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[var(--ink-strong)]">
                              {project.name}
                            </p>
                            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-subtle)]">
                              PRJ-{project.id}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {project.isArchived ? (
                              <StatusPill tone="neutral">Archived</StatusPill>
                            ) : null}
                            <StatusPill tone={accessRoleTone(project.role)}>
                              {projectRoleLabel(project.role)}
                            </StatusPill>
                            <IconTooltip tooltipAlign="right" label="Remove project access">
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => void onRemoveProject(project.id)}
                                aria-label={`Remove ${project.name} access`}
                                className="inline-flex h-8 items-center justify-center rounded-lg border border-[rgba(193,62,62,0.14)] bg-[rgba(193,62,62,0.04)] px-2.5 text-xs font-semibold text-[var(--accent-red)] transition hover:bg-[rgba(193,62,62,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <RemoveIcon />
                                <span className="ml-1.5">Remove</span>
                              </button>
                            </IconTooltip>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 rounded-lg border border-dashed border-[var(--line-strong)] bg-white px-3 py-3 text-sm text-[var(--ink-subtle)]">
                      This user has access to this workspace but does not have access to any
                      projects in it.
                    </p>
                  )}
                </section>
              ))}
            </div>
          ) : (
            <EmptyState>This user does not have access to any workspaces.</EmptyState>
          )}
        </div>

        <div className="flex justify-end border-t border-[var(--line-soft)] bg-white px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--line-strong)] bg-[var(--surface-card)] px-4 text-sm font-medium text-[var(--ink-muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Close
          </button>
        </div>
      </section>
    </div>
  );
}
