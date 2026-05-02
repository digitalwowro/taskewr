"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { WORKSPACE_ROLE_OPTIONS } from "@/components/app/access-role-format";
import { ModalHeaderKicker, SearchableSelect } from "@/components/app/ui";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import type {
  WorkspaceAdminItem,
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

function getTimezoneOptions(currentTimezone: string) {
  const supportedTimezones =
    typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("timeZone")
      : FALLBACK_TIMEZONES;
  const timezoneSet = new Set([...supportedTimezones, currentTimezone].filter(Boolean));

  return Array.from(timezoneSet).sort((first, second) => first.localeCompare(second));
}

export function WorkspaceMemberAddModal({
  workspace,
  userCandidates,
  isSaving,
  error,
  onClose,
  onAddMember,
  onCreateAndAddMember,
}: {
  workspace: WorkspaceAdminItem | null;
  userCandidates: WorkspaceUserCandidate[];
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onAddMember: (workspaceId: number, userId: number, role: string) => Promise<void>;
  onCreateAndAddMember: (workspaceId: number, input: WorkspaceNewMemberInput) => Promise<void>;
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

  const availableUsers = useMemo(() => {
    if (!workspace) {
      return [];
    }

    const existingMemberIds = new Set(workspace.members.map((member) => member.userId));
    return userCandidates.filter((user) => !existingMemberIds.has(user.id));
  }, [userCandidates, workspace]);
  const roleOptions = useMemo(() => {
    if (workspace?.actorCanManageOwners) {
      return WORKSPACE_ROLE_OPTIONS;
    }

    return WORKSPACE_ROLE_OPTIONS.filter((option) => option.value !== "owner");
  }, [workspace?.actorCanManageOwners]);

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

  const handleSave = async () => {
    if (mode === "existing") {
      if (!userId) {
        setFieldError("Select a user to add.");
        return;
      }

      setFieldError(null);
      await onAddMember(workspace.id, Number(userId), role);
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
        aria-labelledby="workspace-member-add-title"
        className="relative z-[121] w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.2)]"
      >
        <div className="border-b border-[var(--line-soft)] bg-white px-5 py-4">
          <div className="space-y-1.5">
            <ModalHeaderKicker code={`WKS-${workspace.id}`} label="Workspace member" />
            <h2
              id="workspace-member-add-title"
              className="text-[2rem] font-semibold leading-tight tracking-[-0.045em] text-[var(--ink-strong)]"
            >
              Add member
            </h2>
            <p className="text-sm text-[var(--ink-muted)]">
              Add an existing user or create a new one for {workspace.name}.
            </p>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="inline-flex rounded-lg border border-[var(--line-soft)] bg-white p-1 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            {[
              { value: "existing", label: "Existing user" },
              { value: "new", label: "New user" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={isSaving}
                onClick={() => {
                  setMode(option.value as "existing" | "new");
                  setFieldError(null);
                  if (option.value === "new" && role === "owner" && !workspace.actorCanManageOwners) {
                    setRole("member");
                  }
                }}
                className={`inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition ${
                  mode === option.value
                    ? "bg-[rgba(34,122,89,0.08)] text-[var(--accent-strong)]"
                    : "text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-subtle)] p-4">
            {mode === "existing" ? (
              <div className="grid gap-4 lg:grid-cols-[1fr_12rem]">
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                    User
                  </label>
                  <SearchableSelect
                      value={userId}
                    options={availableUsers.map((user) => ({
                      value: String(user.id),
                      label: `${user.name} (${user.email})`,
                      searchText: `${user.name} ${user.email}`,
                    }))}
                    onChange={setUserId}
                    placeholder={availableUsers.length === 0 ? "No available users" : "Select user"}
                    emptyMessage="No available users."
                      disabled={isSaving || availableUsers.length === 0}
                    ariaLabel="User"
                    inputClassName="h-11 border-[var(--line-strong)] bg-white px-4 pr-10 text-sm font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                    Workspace Role
                  </label>
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
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                      Display name
                    </label>
                    <input
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      disabled={isSaving}
                      className="h-11 w-full rounded-lg border border-[var(--line-strong)] bg-white px-4 text-sm font-medium text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                      Email
                    </label>
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      disabled={isSaving}
                      type="email"
                      className="h-11 w-full rounded-lg border border-[var(--line-strong)] bg-white px-4 text-sm font-medium text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
                    />
                  </div>
                </div>
                <div className="grid gap-4 lg:grid-cols-[1fr_12rem]">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                      Timezone
                    </label>
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
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                      Workspace Role
                    </label>
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
                  </div>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isSaving}
                    placeholder="New password"
                    className="h-11 w-full rounded-lg border border-[var(--line-strong)] bg-white px-4 text-sm font-medium text-[var(--ink-strong)] outline-none placeholder:text-[var(--ink-subtle)] disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    disabled={isSaving}
                    placeholder="Confirm password"
                    className="h-11 w-full rounded-lg border border-[var(--line-strong)] bg-white px-4 text-sm font-medium text-[var(--ink-strong)] outline-none placeholder:text-[var(--ink-subtle)] disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
                  />
                </div>
              </div>
            )}
          </div>

          {fieldError || error ? (
            <p aria-live="polite" className="text-sm text-[var(--accent-red)]">
              {fieldError ?? error}
            </p>
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
            disabled={isSaving || (mode === "existing" && availableUsers.length === 0)}
            onClick={() => void handleSave()}
            aria-busy={isSaving}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--accent-strong)] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(34,122,89,0.18)] transition hover:bg-[var(--accent-strong-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Adding..." : mode === "existing" ? "Add member" : "Create and add"}
          </button>
        </div>
      </section>
    </div>
  );
}
