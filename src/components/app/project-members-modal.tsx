"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  PROJECT_ROLE_OPTIONS,
  accessRoleTone,
  projectRoleLabel,
} from "@/components/app/access-role-format";
import { IconTooltip, ModalHeaderKicker, StatusPill } from "@/components/app/ui";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import type {
  ProjectMemberItem,
  ProjectMembersDetails,
} from "@/hooks/use-project-members-state";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function SelectChevron() {
  return (
    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[var(--ink-muted)]">
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="m4.5 6.5 3.5 3.5 3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
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
    <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-subtle)] px-4 py-4 text-sm text-[var(--ink-subtle)]">
      {children}
    </div>
  );
}

function roleOptionsFor(details: ProjectMembersDetails | null) {
  if (!details) {
    return PROJECT_ROLE_OPTIONS.filter((option) => option.value !== "owner");
  }

  return details.actorCanManageOwners
    ? PROJECT_ROLE_OPTIONS
    : PROJECT_ROLE_OPTIONS.filter((option) => option.value !== "owner");
}

function canManageMember(details: ProjectMembersDetails, member: ProjectMemberItem) {
  if (member.userId === details.actorUserId) {
    return false;
  }

  if (member.role === "owner") {
    return details.actorCanManageOwners;
  }

  return details.actorCanManage;
}

export function ProjectMembersModal({
  details,
  loading,
  isSaving,
  error,
  onClose,
  onAddMember,
  onUpdateRole,
  onRemoveMember,
}: {
  details: ProjectMembersDetails | null;
  loading: boolean;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onAddMember: (userId: number, role: string) => Promise<void>;
  onUpdateRole: (userId: number, role: string) => Promise<void>;
  onRemoveMember: (userId: number) => Promise<void>;
}) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("member");
  const [addPending, setAddPending] = useState(false);
  const dialogRef = useRef<HTMLElement | null>(null);
  const isOpen = loading || details !== null;
  const roleOptions = useMemo(() => roleOptionsFor(details), [details]);

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

  const canAdd = Boolean(details?.actorCanManage && selectedUserId);
  const title = details?.projectName ?? "Project users";
  const handleAddMember = async () => {
    if (!selectedUserId) {
      return;
    }

    setAddPending(true);

    try {
      await onAddMember(Number(selectedUserId), selectedRole);
      setSelectedUserId("");
    } finally {
      setAddPending(false);
    }
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
        aria-labelledby="project-members-title"
        className="relative z-[121] max-h-[calc(100vh-3rem)] w-full max-w-4xl overflow-hidden rounded-[24px] border border-[var(--line-soft)] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.2)]"
      >
        <div className="border-b border-[var(--line-soft)] bg-white px-5 py-4">
          <div className="space-y-1.5">
            <ModalHeaderKicker code={details ? `PRJ-${details.projectId}` : "PRJ"} label="Project users" />
            <h2
              id="project-members-title"
              className="text-[2rem] font-semibold leading-tight tracking-[-0.045em] text-[var(--ink-strong)]"
            >
              {title}
            </h2>
            {details ? (
              <p className="text-sm leading-6 text-[var(--ink-muted)]">
                Manage users who can access this project.
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
            <EmptyState>Loading project users...</EmptyState>
          ) : details ? (
            <>
              {details.actorCanManage ? (
                <section className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-subtle)] p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink-strong)]">
                        Add user
                      </h3>
                      <p className="mt-1 text-xs text-[var(--ink-subtle)]">
                        If a user isn&apos;t listed below, ensure they have access to the{" "}
                        <strong className="font-semibold text-[var(--accent-strong)]">
                          {details.workspaceName}
                        </strong>{" "}
                        workspace.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1fr_16rem_auto] lg:items-end">
                    <label className="space-y-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                        User
                      </span>
                      <div className="relative">
                        <select
                          value={selectedUserId}
                          onChange={(event) => setSelectedUserId(event.target.value)}
                          disabled={isSaving || details.candidates.length === 0}
                          style={{
                            appearance: "none",
                            WebkitAppearance: "none",
                            backgroundImage: "none",
                          }}
                          className="h-11 w-full appearance-none rounded-[18px] border border-[var(--line-strong)] bg-white px-4 pr-10 text-sm font-medium text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
                        >
                          <option value="">
                            {details.candidates.length > 0
                              ? "Select user"
                              : "No workspace users to add"}
                          </option>
                          {details.candidates.map((candidate) => (
                            <option key={candidate.id} value={candidate.id}>
                              {candidate.name} ({candidate.email})
                            </option>
                          ))}
                        </select>
                        <SelectChevron />
                      </div>
                    </label>

                    <label className="space-y-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                        Project Role
                      </span>
                      <div className="relative">
                        <select
                          value={selectedRole}
                          onChange={(event) => setSelectedRole(event.target.value)}
                          disabled={isSaving}
                          style={{
                            appearance: "none",
                            WebkitAppearance: "none",
                            backgroundImage: "none",
                          }}
                          className="h-11 w-full appearance-none rounded-[18px] border border-[var(--line-strong)] bg-white px-4 pr-10 text-sm font-medium text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
                        >
                          {roleOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <SelectChevron />
                      </div>
                    </label>

                    <button
                      type="button"
                      disabled={!canAdd || isSaving || addPending}
                      onClick={() => void handleAddMember()}
                      className="inline-flex h-11 min-w-[7.5rem] items-center justify-center rounded-[16px] border border-transparent bg-[var(--accent-strong)] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(34,122,89,0.18)] transition hover:bg-[var(--accent-strong-hover)] disabled:cursor-not-allowed disabled:border-[var(--line-strong)] disabled:bg-white disabled:text-[var(--ink-muted)] disabled:shadow-none"
                    >
                      {addPending ? "Adding..." : "Add user"}
                    </button>
                  </div>
                </section>
              ) : (
                <EmptyState>You can view project users, but cannot change project access.</EmptyState>
              )}

              <section className="overflow-visible rounded-2xl border border-[var(--line-soft)]">
                <div className="flex items-center justify-between border-b border-[var(--line-soft)] bg-[var(--surface-subtle)] px-4 py-3">
                  <h3 className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink-strong)]">
                    Users
                  </h3>
                  <span className="text-xs text-[var(--ink-subtle)]">
                    {details.members.length} visible
                  </span>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[var(--surface-subtle)] text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                      <th className="px-4 py-2">User</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Project Role</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Joined</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line-soft)]">
                    {details.members.map((member) => {
                      const canEdit = canManageMember(details, member);
                      const memberRoleOptions = details.actorCanManageOwners
                        ? PROJECT_ROLE_OPTIONS
                        : PROJECT_ROLE_OPTIONS.filter((option) => option.value !== "owner");

                      return (
                        <tr key={member.userId} className="text-sm">
                          <td className="px-4 py-3 font-medium text-[var(--ink-strong)]">
                            {member.name}
                          </td>
                          <td className="px-4 py-3 text-[var(--ink-muted)]">
                            {member.email}
                          </td>
                          <td className="px-4 py-3">
                            {canEdit ? (
                              <div className="relative max-w-[13rem]">
                                <select
                                  value={member.role}
                                  onChange={(event) =>
                                    void onUpdateRole(member.userId, event.target.value)
                                  }
                                  disabled={isSaving}
                                  style={{
                                    appearance: "none",
                                    WebkitAppearance: "none",
                                    backgroundImage: "none",
                                  }}
                                  className="h-9 w-full appearance-none rounded-[14px] border border-[var(--line-strong)] bg-white px-3 pr-9 text-xs font-medium text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
                                >
                                  {memberRoleOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                                <SelectChevron />
                              </div>
                            ) : (
                              <StatusPill tone={accessRoleTone(member.role)}>
                                {projectRoleLabel(member.role)}
                              </StatusPill>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <StatusPill tone={member.isActive ? "green" : "red"}>
                              {member.isActive ? "Active" : "Inactive"}
                            </StatusPill>
                          </td>
                          <td className="px-4 py-3 text-[var(--ink-muted)]">
                            {formatDate(member.joinedAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end">
                              <IconTooltip
                                tooltipAlign="right"
                                label={
                                  member.userId === details.actorUserId
                                    ? "You cannot remove yourself"
                                    : "Remove project user"
                                }
                              >
                                <button
                                  type="button"
                                  disabled={!canEdit || isSaving}
                                  onClick={() => void onRemoveMember(member.userId)}
                                  aria-label="Remove project user"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(193,62,62,0.14)] bg-[rgba(193,62,62,0.04)] text-[var(--accent-red)] transition hover:bg-[rgba(193,62,62,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <RemoveIcon />
                                </button>
                              </IconTooltip>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            </>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[var(--line-soft)] bg-white px-5 py-3">
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-[var(--line-strong)] bg-[var(--surface-card)] px-4 text-sm font-medium text-[var(--ink-muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Close
          </button>
        </div>
      </section>
    </div>
  );
}
