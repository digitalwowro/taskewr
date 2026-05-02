"use client";

import { useMemo, useRef } from "react";
import type { ReactNode } from "react";

import { ToolbarMenuFrame } from "@/components/app/filter-toolbar";
import { MetricCard } from "@/components/app/ui";
import type { WorkspaceAdminItem } from "@/hooks/use-workspace-admin-state";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function pluralize(value: number, singular: string, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function WorkspaceMetaItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-fit items-center gap-2 rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
        {label}
      </dt>
      <dd className="text-xs font-medium text-[var(--ink-muted)]">{value}</dd>
    </div>
  );
}

function WorkspaceMetaRail({ workspace }: { workspace: WorkspaceAdminItem }) {
  return (
    <dl className="flex max-w-full flex-wrap gap-1.5">
      <WorkspaceMetaItem label="ID" value={`WKS-${workspace.id}`} />
      <WorkspaceMetaItem label="Workspace Owner" value={workspace.ownerName ?? "Unassigned"} />
      <WorkspaceMetaItem label="Workspace Members" value={pluralize(workspace.memberCount, "member")} />
      <WorkspaceMetaItem label="Projects" value={String(workspace.projectCount)} />
      <WorkspaceMetaItem label="Updated" value={formatDate(workspace.updatedAt)} />
    </dl>
  );
}

function IconActionButton({
  label,
  tooltipAlign = "center",
  tone = "neutral",
  disabled,
  onClick,
  children,
}: {
  label: string;
  tooltipAlign?: "center" | "right";
  tone?: "neutral" | "accent" | "danger";
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const toneClass =
    tone === "danger"
      ? "border-[rgba(193,62,62,0.14)] bg-[rgba(193,62,62,0.04)] text-[var(--accent-red)] hover:bg-[rgba(193,62,62,0.08)]"
      : tone === "accent"
        ? "border-[rgba(34,122,89,0.16)] bg-[rgba(34,122,89,0.08)] text-[var(--accent-strong)] hover:bg-[rgba(34,122,89,0.12)]"
        : "border-[var(--line-soft)] bg-white text-[var(--ink-muted)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]";

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        title={label}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-60 ${toneClass}`}
      >
        {children}
      </button>
      <span
        className={`pointer-events-none absolute bottom-full z-20 mb-2 hidden whitespace-nowrap rounded-lg border border-[var(--line-soft)] bg-[rgb(15,23,42)] px-2.5 py-1.5 text-xs font-medium text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] group-hover:block group-focus-within:block ${
          tooltipAlign === "right" ? "right-0" : "left-1/2 -translate-x-1/2"
        }`}
      >
        {label}
      </span>
    </span>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3.25 11.75 4 8.85l5.9-5.9a1.35 1.35 0 0 1 1.9 0l1.25 1.25a1.35 1.35 0 0 1 0 1.9L7.15 12l-2.9.75h-1Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m9.1 3.75 3.15 3.15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3.25 4.5h9.5" strokeLinecap="round" />
      <path d="M6.25 4.5V3.25h3.5V4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 6.25v5.3A1.45 1.45 0 0 0 6.45 13h3.1A1.45 1.45 0 0 0 11 11.55v-5.3" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M6.4 7.15a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" />
      <path d="M2.35 13.15c.35-2.25 1.95-3.65 4.05-3.65 1 0 1.88.32 2.55.9" strokeLinecap="round" />
      <path d="M11.4 7.55a1.8 1.8 0 1 0 0-3.6" strokeLinecap="round" />
      <path d="M10.65 13.1c.45-.9 1.2-1.45 2.15-1.45.52 0 1 .12 1.45.38" strokeLinecap="round" />
    </svg>
  );
}

function MoveUpIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M8 12.5v-9M4.5 7 8 3.5 11.5 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MoveDownIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M8 3.5v9M4.5 9 8 12.5 11.5 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WorkspaceMoveButton({
  label,
  tooltipAlign = "center",
  disabled,
  onClick,
  children,
}: {
  label: string;
  tooltipAlign?: "center" | "right";
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const horizontalClass = tooltipAlign === "right" ? "right-0" : "left-1/2 -translate-x-1/2";

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[var(--ink-subtle)] transition hover:bg-white hover:text-[var(--ink-strong)] disabled:cursor-wait disabled:opacity-60"
        aria-label={label}
        title={label}
      >
        {children}
      </button>
      <span
        className={`pointer-events-none absolute bottom-full z-20 mb-2 hidden whitespace-nowrap rounded-lg border border-[var(--line-soft)] bg-[rgb(15,23,42)] px-2.5 py-1.5 text-xs font-medium text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] group-hover:block group-focus-within:block ${horizontalClass}`}
      >
        {label}
      </span>
    </span>
  );
}

export function WorkspacesContent({
  workspaces,
  query,
  loading,
  loadError,
  mutationError,
  mutationPending,
  workspaceReorderPendingId,
  onSearch,
  onEditWorkspace,
  onDeleteWorkspace,
  onManageMembers,
  onMoveWorkspace,
}: {
  workspaces: WorkspaceAdminItem[];
  query: string;
  loading: boolean;
  loadError: string | null;
  mutationError: string | null;
  mutationPending: boolean;
  workspaceReorderPendingId: number | null;
  onSearch: (query: string) => void;
  onEditWorkspace: (workspaceId: number) => void;
  onDeleteWorkspace: (workspaceId: number) => void;
  onManageMembers: (workspaceId: number) => void;
  onMoveWorkspace: (workspaceId: number, direction: "up" | "down") => void;
}) {
  const searchFrameRef = useRef<HTMLDivElement | null>(null);
  const totalMembers = useMemo(
    () => workspaces.reduce((sum, workspace) => sum + workspace.memberCount, 0),
    [workspaces],
  );
  const emptyWorkspaceCount = useMemo(
    () => workspaces.filter((workspace) => workspace.canDelete).length,
    [workspaces],
  );

  return (
    <div className="space-y-5">
      <section className="grid gap-4 lg:grid-cols-3">
        <MetricCard
          label="Total workspaces"
          value={String(workspaces.length)}
          tone="green"
          detail="Visible to manage"
        />
        <MetricCard
          label="Members"
          value={String(totalMembers)}
          tone="neutral"
          detail="Across workspaces"
        />
        <MetricCard
          label="Empty"
          value={String(emptyWorkspaceCount)}
          tone="amber"
          detail="Can be deleted"
        />
      </section>

      <section className="overflow-visible rounded-2xl border border-[var(--line-soft)] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 border-b border-[var(--line-soft)] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
              Workspace administration
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-strong)]">
              Workspaces
            </h2>
          </div>
          <ToolbarMenuFrame menuRef={searchFrameRef} label="Search">
            <input
              value={query}
              onChange={(event) => onSearch(event.target.value)}
              placeholder="ID, name, slug, or description"
              className="h-7 min-w-[18rem] rounded-lg bg-transparent px-2 text-[12px] font-medium text-[var(--ink-muted)] outline-none placeholder:text-[var(--ink-subtle)]"
            />
          </ToolbarMenuFrame>
        </div>

        {loadError || mutationError ? (
          <div className="border-b border-[rgba(193,62,62,0.14)] bg-[rgba(193,62,62,0.04)] px-5 py-3 text-sm text-[var(--accent-red)]">
            {loadError ?? mutationError}
          </div>
        ) : null}

        <div className="space-y-5 bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(248,252,250,1)_100%)] p-5">
          {loading ? (
            <div className="rounded-2xl border border-[var(--line-soft)] bg-white px-5 py-10 text-center text-sm text-[var(--ink-subtle)]">
              Loading workspaces...
            </div>
          ) : workspaces.length === 0 ? (
            <div className="rounded-2xl border border-[var(--line-soft)] bg-white px-5 py-10 text-center text-sm text-[var(--ink-subtle)]">
              No workspaces found.
            </div>
          ) : (
            workspaces.map((workspace) => {
              return (
                <article
                  key={workspace.id}
                  className="overflow-visible rounded-2xl border border-[rgba(34,122,89,0.12)] bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]"
                >
                  <div className="flex flex-col gap-5">
                    <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                            Workspace
                          </p>
                          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-strong)]">
                            {workspace.name}
                          </h3>
                          <p className="max-w-3xl text-sm leading-6 text-[var(--ink-muted)]">
                            {workspace.description || "No description yet."}
                          </p>
                        </div>
                        <WorkspaceMetaRail workspace={workspace} />
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <IconActionButton
                          label="Edit workspace"
                          onClick={() => onEditWorkspace(workspace.id)}
                          disabled={mutationPending || !workspace.actorCanManage}
                        >
                          <EditIcon />
                        </IconActionButton>
                        <IconActionButton
                          label="Manage workspace users"
                          onClick={() => onManageMembers(workspace.id)}
                          disabled={mutationPending}
                        >
                          <UsersIcon />
                        </IconActionButton>
                        <IconActionButton
                          label={
                            !workspace.actorCanDelete
                              ? "Only Workspace Owners can delete workspaces"
                              : workspace.canDelete
                                ? "Delete workspace"
                                : "Only empty workspaces can be deleted"
                          }
                          tooltipAlign="right"
                          tone="danger"
                          onClick={() => onDeleteWorkspace(workspace.id)}
                          disabled={mutationPending || !workspace.actorCanDelete || !workspace.canDelete}
                        >
                          <DeleteIcon />
                        </IconActionButton>
                        <div className="flex h-8 items-center gap-0.5 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-subtle)] px-0.5">
                          <WorkspaceMoveButton
                            label="Move workspace up"
                            onClick={() => onMoveWorkspace(workspace.id, "up")}
                            disabled={
                              mutationPending ||
                              workspaceReorderPendingId === workspace.id ||
                              !workspace.actorCanManage
                            }
                          >
                            <MoveUpIcon />
                          </WorkspaceMoveButton>
                          <WorkspaceMoveButton
                            label="Move workspace down"
                            tooltipAlign="right"
                            onClick={() => onMoveWorkspace(workspace.id, "down")}
                            disabled={
                              mutationPending ||
                              workspaceReorderPendingId === workspace.id ||
                              !workspace.actorCanManage
                            }
                          >
                            <MoveDownIcon />
                          </WorkspaceMoveButton>
                        </div>
                      </div>
                    </header>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
