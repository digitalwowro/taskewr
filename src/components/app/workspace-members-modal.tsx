"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  WORKSPACE_ROLE_OPTIONS,
  accessRoleTone,
  workspaceRoleLabel,
} from "@/components/app/access-role-format";
import {
  IconTooltip,
  ModalHeaderKicker,
  SearchableSelect,
  StatusPill,
} from "@/components/app/ui";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import type {
  WorkspaceAdminItem,
  WorkspaceAdminMemberItem,
  WorkspaceNewMemberInput,
  WorkspaceUserCandidate,
} from "@/hooks/use-workspace-admin-state";

const FALLBACK_TIMEZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Bucharest",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getTimezoneOptions(currentTimezone: string) {
  const supportedTimezones =
    typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("timeZone")
      : FALLBACK_TIMEZONES;
  const timezoneSet = new Set([...supportedTimezones, currentTimezone].filter(Boolean));

  return Array.from(timezoneSet).sort((first, second) => first.localeCompare(second));
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

function roleOptionsFor(workspace: WorkspaceAdminItem | null) {
  if (workspace?.actorCanManageOwners) {
    return WORKSPACE_ROLE_OPTIONS;
  }

  return WORKSPACE_ROLE_OPTIONS.filter((option) => option.value !== "owner");
}

function canManageMember(workspace: WorkspaceAdminItem, member: WorkspaceAdminMemberItem) {
  if (!workspace.actorCanManage) {
    return false;
  }

  if (member.role === "owner") {
    return workspace.actorCanManageOwners;
  }

  return true;
}

export function WorkspaceMembersModal({
  workspace,
  userCandidates,
  isSaving,
  error,
  onClose,
  onAddMember,
  onCreateAndAddMember,
  onUpdateRole,
  onRemoveMember,
}: {
  workspace: WorkspaceAdminItem | null;
  userCandidates: WorkspaceUserCandidate[];
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onAddMember: (workspaceId: number, userId: number, role: string) => Promise<void>;
  onCreateAndAddMember: (workspaceId: number, input: WorkspaceNewMemberInput) => Promise<void>;
  onUpdateRole: (workspaceId: number, userId: number, role: string) => Promise<void>;
  onRemoveMember: (workspaceId: number, userId: number) => Promise<void>;
}) {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("member");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("Europe/Bucharest");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const timezoneOptions = useMemo(() => getTimezoneOptions(timezone), [timezone]);
  const roleOptions = useMemo(() => roleOptionsFor(workspace), [workspace]);
  const availableUsers = useMemo(() => {
    if (!workspace) {
      return [];
    }

    const existingMemberIds = new Set(workspace.members.map((member) => member.userId));
    return userCandidates.filter((user) => !existingMemberIds.has(user.id));
  }, [userCandidates, workspace]);

  useFocusTrap(dialogRef, workspace !== null);

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

  const handleAddMember = async () => {
    if (mode === "existing") {
      if (!userId) {
        setFieldError("Select a user to add.");
        return;
      }

      setFieldError(null);
      await onAddMember(workspace.id, Number(userId), role);
      setUserId("");
      return;
    }

    if (!displayName.trim()) {
      setFieldError("Display name is required.");
      return;
    }

    if (!email.trim()) {
      setFieldError("Email is required.");
      return;
    }

    if (password.length < 7) {
      setFieldError("New password must be at least 7 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setFieldError("New password and confirmation must match.");
      return;
    }

    setFieldError(null);
    await onCreateAndAddMember(workspace.id, {
      name: displayName.trim(),
      email: email.trim(),
      timezone: timezone.trim(),
      password,
      role,
    });
    setDisplayName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
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
        aria-labelledby="workspace-members-title"
        className="relative z-[121] max-h-[calc(100vh-3rem)] w-full max-w-4xl overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.2)]"
      >
        <div className="border-b border-[var(--line-soft)] bg-white px-5 py-4">
          <div className="space-y-1.5">
            <ModalHeaderKicker code={`WKS-${workspace.id}`} label="Workspace users" />
            <h2
              id="workspace-members-title"
              className="text-[2rem] font-semibold leading-tight tracking-[-0.045em] text-[var(--ink-strong)]"
            >
              {workspace.name}
            </h2>
            <p className="text-sm leading-6 text-[var(--ink-muted)]">
              Manage users who can access this workspace.
            </p>
          </div>
        </div>

        {error ? (
          <div className="border-b border-[rgba(193,62,62,0.14)] bg-[rgba(193,62,62,0.04)] px-5 py-3 text-sm text-[var(--accent-red)]">
            {error}
          </div>
        ) : null}

        <div className="max-h-[calc(100vh-16rem)] space-y-5 overflow-y-auto px-5 py-5">
          {workspace.actorCanManage ? (
            <section className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-subtle)] p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink-strong)]">
                    Add user
                  </h3>
                  <p className="mt-1 text-xs text-[var(--ink-subtle)]">
                    Add an existing user or create a new user for this workspace.
                  </p>
                </div>
                <div className="inline-flex rounded-lg border border-[var(--line-strong)] bg-white p-1">
                  {[
                    { value: "existing", label: "Existing" },
                    { value: "new", label: "New user" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      disabled={isSaving}
                      onClick={() => {
                        setMode(option.value as "existing" | "new");
                        setFieldError(null);
                      }}
                      className={`h-8 rounded-lg px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        mode === option.value
                          ? "bg-[var(--accent-strong)] text-white"
                          : "text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {mode === "existing" ? (
                <div className="grid gap-4 lg:grid-cols-[1fr_14rem_auto] lg:items-end">
                  <label className="space-y-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                      User
                    </span>
                    <SearchableSelect
                        value={userId}
                      options={availableUsers.map((user) => ({
                        value: String(user.id),
                        label: `${user.name} (${user.email})`,
                        searchText: `${user.name} ${user.email}`,
                      }))}
                      onChange={setUserId}
                      placeholder={availableUsers.length === 0 ? "No users to add" : "Select user"}
                      emptyMessage="No users to add."
                        disabled={isSaving || availableUsers.length === 0}
                      ariaLabel="User"
                      inputClassName="h-11 border-[var(--line-strong)] bg-white px-4 pr-10 text-sm font-medium"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                      Workspace Role
                    </span>
                    <SearchableSelect
                        value={role}
                      options={roleOptions.map((option) => ({
                        value: option.value,
                        label: option.label,
                      }))}
                      onChange={setRole}
                        disabled={isSaving}
                      ariaLabel="Workspace role"
                      inputClassName="h-11 border-[var(--line-strong)] bg-white px-4 pr-10 text-sm font-medium"
                    />
                  </label>

                  <button
                    type="button"
                    disabled={isSaving || !userId}
                    onClick={() => void handleAddMember()}
                    className="inline-flex h-11 min-w-[7.5rem] items-center justify-center rounded-lg border border-transparent bg-[var(--accent-strong)] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(34,122,89,0.18)] transition hover:bg-[var(--accent-strong-hover)] disabled:cursor-not-allowed disabled:border-[var(--line-strong)] disabled:bg-white disabled:text-[var(--ink-muted)] disabled:shadow-none"
                  >
                    {isSaving ? "Adding..." : "Add user"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                        Display name
                      </span>
                      <input
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        disabled={isSaving}
                        className="h-11 w-full rounded-lg border border-[var(--line-strong)] bg-white px-4 text-sm font-medium text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                        Email
                      </span>
                      <input
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        disabled={isSaving}
                        type="email"
                        className="h-11 w-full rounded-lg border border-[var(--line-strong)] bg-white px-4 text-sm font-medium text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
                      />
                    </label>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-3">
                    <label className="space-y-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                        Timezone
                      </span>
                      <SearchableSelect
                          value={timezone}
                        options={timezoneOptions.map((option) => ({
                          value: option,
                          label: option,
                        }))}
                        onChange={setTimezone}
                          disabled={isSaving}
                        ariaLabel="Timezone"
                        inputClassName="h-11 border-[var(--line-strong)] bg-white px-4 pr-10 text-sm font-medium"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                        Password
                      </span>
                      <input
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        disabled={isSaving}
                        type="password"
                        className="h-11 w-full rounded-lg border border-[var(--line-strong)] bg-white px-4 text-sm font-medium text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                        Confirm Password
                      </span>
                      <input
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        disabled={isSaving}
                        type="password"
                        className="h-11 w-full rounded-lg border border-[var(--line-strong)] bg-white px-4 text-sm font-medium text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
                      />
                    </label>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                    <label className="space-y-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                        Workspace Role
                      </span>
                      <SearchableSelect
                          value={role}
                        options={roleOptions.map((option) => ({
                          value: option.value,
                          label: option.label,
                        }))}
                        onChange={setRole}
                          disabled={isSaving}
                        ariaLabel="Workspace role"
                        inputClassName="h-11 border-[var(--line-strong)] bg-white px-4 pr-10 text-sm font-medium"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => void handleAddMember()}
                      className="inline-flex h-11 min-w-[8rem] items-center justify-center rounded-lg border border-transparent bg-[var(--accent-strong)] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(34,122,89,0.18)] transition hover:bg-[var(--accent-strong-hover)] disabled:cursor-not-allowed disabled:border-[var(--line-strong)] disabled:bg-white disabled:text-[var(--ink-muted)] disabled:shadow-none"
                    >
                      {isSaving ? "Creating..." : "Create user"}
                    </button>
                  </div>
                </div>
              )}
              {fieldError ? <p className="mt-3 text-sm text-[var(--accent-red)]">{fieldError}</p> : null}
            </section>
          ) : (
            <EmptyState>You can view workspace users, but cannot change workspace access.</EmptyState>
          )}

          <section className="overflow-visible rounded-lg border border-[var(--line-soft)]">
            <div className="flex items-center justify-between border-b border-[var(--line-soft)] bg-[var(--surface-subtle)] px-4 py-3">
              <h3 className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink-strong)]">
                Users
              </h3>
              <span className="text-xs text-[var(--ink-subtle)]">
                {workspace.members.length} visible
              </span>
            </div>

            {workspace.members.length === 0 ? (
              <EmptyState>No users in this workspace.</EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="bg-[var(--surface-subtle)] text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                      <th className="px-4 py-2">User</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Workspace Role</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Joined</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line-soft)]">
                    {workspace.members.map((member) => {
                      const canEdit = canManageMember(workspace, member);

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
                              <div className="max-w-[14rem]">
                                <SearchableSelect
                                  value={member.role}
                                  options={roleOptions.map((option) => ({
                                    value: option.value,
                                    label: option.label,
                                  }))}
                                  onChange={(nextRole) =>
                                    void onUpdateRole(workspace.id, member.userId, nextRole)
                                  }
                                  disabled={isSaving}
                                  ariaLabel={`Workspace role for ${member.name}`}
                                  inputClassName="h-9 border-[var(--line-strong)] bg-white px-3 pr-9 text-xs font-medium"
                                />
                              </div>
                            ) : (
                              <StatusPill tone={accessRoleTone(member.role)}>
                                {workspaceRoleLabel(member.role)}
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
                              <IconTooltip tooltipAlign="right" label="Remove workspace user">
                                <button
                                  type="button"
                                  disabled={!canEdit || isSaving}
                                  onClick={() => void onRemoveMember(workspace.id, member.userId)}
                                  aria-label="Remove workspace user"
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
              </div>
            )}
          </section>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[var(--line-soft)] bg-white px-5 py-3">
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-[var(--line-strong)] bg-[var(--surface-card)] px-4 text-sm font-medium text-[var(--ink-muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Close
          </button>
        </div>
      </section>
    </div>
  );
}
