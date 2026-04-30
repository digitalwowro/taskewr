"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { APP_ROLE_OPTIONS } from "@/components/app/access-role-format";
import { ModalHeaderKicker } from "@/components/app/ui";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import type { UserAdminItem } from "@/hooks/use-user-admin-state";

const NEW_USER_ID = 0;
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

function SelectChevron() {
  return (
    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--ink-muted)]">
      <svg
        viewBox="0 0 16 16"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <path d="m4.5 6.5 3.5 3.5 3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function PasswordInfoTooltip() {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label="Password help"
        title="Password help"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--line-soft)] bg-white text-[10px] font-semibold leading-none text-[var(--ink-muted)] transition hover:border-[var(--line-strong)] hover:text-[var(--ink-strong)]"
      >
        i
      </button>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-max max-w-[260px] -translate-x-1/2 rounded-lg border border-[var(--line-soft)] bg-[rgb(15,23,42)] px-2.5 py-1.5 text-[11px] font-medium normal-case tracking-normal text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] group-hover:block group-focus-within:block">
        Leave both password fields empty to keep the current password.
      </span>
    </span>
  );
}

export function UserEditorModal({
  user,
  onClose,
  onSave,
  isSaving,
  error,
}: {
  user: UserAdminItem | null;
  onClose: () => void;
  onSave: (input: {
    name: string;
    email: string;
    timezone: string;
    appRole: string;
    isActive: boolean;
    password?: string;
  }) => Promise<void>;
  isSaving: boolean;
  error: string | null;
}) {
  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [timezone, setTimezone] = useState(user?.timezone ?? "Europe/Bucharest");
  const [appRole, setAppRole] = useState(user?.appRole ?? "user");
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const timezoneOptions = useMemo(() => getTimezoneOptions(timezone), [timezone]);

  useFocusTrap(dialogRef, !!user);

  useEffect(() => {
    if (user) {
      nameInputRef.current?.focus();
    }
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, onClose]);

  if (!user) {
    return null;
  }

  const isCreating = user.id === NEW_USER_ID;

  const handleSave = async () => {
    if (!displayName.trim()) {
      setFieldError("Display name is required.");
      return;
    }

    if (!email.trim()) {
      setFieldError("Email is required.");
      return;
    }

    const shouldUpdatePassword = isCreating || password.length > 0 || confirmPassword.length > 0;

    if (shouldUpdatePassword && password.length < 7) {
      setFieldError("New password must be at least 7 characters.");
      return;
    }

    if (shouldUpdatePassword && password !== confirmPassword) {
      setFieldError("New password and confirmation must match.");
      return;
    }

    setFieldError(null);
    await onSave({
      name: displayName.trim(),
      email: email.trim(),
      timezone: timezone.trim(),
      appRole,
      isActive,
      password: shouldUpdatePassword ? password : undefined,
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
        aria-labelledby="user-editor-title"
        className="relative z-[121] w-full max-w-3xl overflow-hidden rounded-[24px] border border-[var(--line-soft)] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.2)]"
      >
        <div className="border-b border-[var(--line-soft)] bg-white px-5 py-4">
          <div className="space-y-1.5">
            <ModalHeaderKicker code={isCreating ? "NEW" : `USR-${user.id}`} label="User" />
            <h2
              id="user-editor-title"
              className="text-[2rem] font-semibold leading-tight tracking-[-0.045em] text-[var(--ink-strong)]"
            >
              {isCreating ? "New user" : "Edit user"}
            </h2>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                Display name
              </label>
              <input
                ref={nameInputRef}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                disabled={isSaving}
                className="h-11 w-full rounded-[18px] border border-[var(--line-strong)] bg-white px-4 text-sm text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isSaving}
                className="h-11 w-full rounded-[18px] border border-[var(--line-strong)] bg-white px-4 text-sm text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
              />
            </div>
          </div>

          <div className="rounded-[20px] border border-[var(--line-soft)] bg-[var(--surface-subtle)]/55 p-3">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-subtle)]">
                  Timezone
                </label>
                <div className="relative">
                  <select
                    value={timezone}
                    onChange={(event) => setTimezone(event.target.value)}
                    disabled={isSaving}
                    style={{
                      appearance: "none",
                      WebkitAppearance: "none",
                      backgroundImage: "none",
                    }}
                    className="h-9 w-full appearance-none rounded-[14px] border border-[var(--line-strong)] bg-white px-3 pr-8 text-[13px] text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
                  >
                    {timezoneOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <SelectChevron />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-subtle)]">
                  App Role
                </label>
                <div className="relative">
                  <select
                    value={appRole}
                    onChange={(event) => setAppRole(event.target.value)}
                    disabled={isSaving}
                    style={{
                      appearance: "none",
                      WebkitAppearance: "none",
                      backgroundImage: "none",
                    }}
                    className="h-9 w-full appearance-none rounded-[14px] border border-[var(--line-strong)] bg-white px-3 pr-8 text-[13px] text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
                  >
                    {APP_ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <SelectChevron />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-subtle)]">
                  Status
                </label>
                <label className="flex h-9 items-center justify-between rounded-[14px] border border-[var(--line-strong)] bg-white px-3 text-[13px] text-[var(--ink-strong)]">
                  <span>{isActive ? "Active" : "Inactive"}</span>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(event) => setIsActive(event.target.checked)}
                    disabled={isSaving || isCreating}
                    className="h-4 w-4 accent-[var(--accent-strong)] disabled:cursor-not-allowed"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-[20px] border border-[var(--line-soft)] bg-[var(--surface-card)] p-4">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                New password
                {isCreating ? null : <PasswordInfoTooltip />}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="New password"
                disabled={isSaving}
                className="h-11 w-full rounded-[18px] border border-[var(--line-strong)] bg-white px-4 text-sm text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm password"
                disabled={isSaving}
                className="h-11 w-full rounded-[18px] border border-[var(--line-strong)] bg-white px-4 text-sm text-[var(--ink-strong)] outline-none disabled:cursor-not-allowed disabled:bg-[var(--surface-subtle)] disabled:text-[var(--ink-subtle)]"
              />
            </div>
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
            {isSaving ? "Saving..." : isCreating ? "Create user" : "Save changes"}
          </button>
        </div>
      </section>
    </div>
  );
}
