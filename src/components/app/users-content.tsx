"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { UserAdminItem } from "@/hooks/use-user-admin-state";
import { appRoleLabel, appRoleTone } from "@/components/app/access-role-format";
import { ToolbarMenuFrame } from "@/components/app/filter-toolbar";
import { MetricCard, StatusPill as AppStatusPill } from "@/components/app/ui";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function UserRolePill({ role }: { role: string }) {
  return (
    <AppStatusPill tone={appRoleTone(role)}>
      {appRoleLabel(role)}
    </AppStatusPill>
  );
}

function UserStatusPill({ isActive }: { isActive: boolean }) {
  return (
    <AppStatusPill tone={isActive ? "green" : "red"}>
      {isActive ? "Active" : "Inactive"}
    </AppStatusPill>
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
        className={`pointer-events-none absolute bottom-full z-20 mb-2 hidden whitespace-nowrap rounded-lg border border-[var(--line-soft)] bg-[rgb(15,23,42)] px-2.5 py-1.5 text-[11px] font-medium text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] group-hover:block group-focus-within:block ${
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

function PasswordIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="5.25" cy="8" r="2.35" />
      <path d="M7.6 8h5.15" strokeLinecap="round" />
      <path d="M10.1 8v2" strokeLinecap="round" />
      <path d="M12.75 8v1.5" strokeLinecap="round" />
    </svg>
  );
}

function DeactivateIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="8" cy="8" r="5.6" />
      <path d="m4.25 4.25 7.5 7.5" strokeLinecap="round" />
    </svg>
  );
}

function ReactivateIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12.5 5.25A5 5 0 0 0 3.7 4.1L2.5 5.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 2.6v2.65h2.65" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 10.75a5 5 0 0 0 8.8 1.15l1.2-1.15" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.5 13.4v-2.65h-2.65" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function UsersContent({
  users,
  query,
  includeInactive,
  loading,
  loadError,
  mutationError,
  mutationPending,
  canManageUsers,
  onSearch,
  onToggleInactive,
  onEditUser,
  onResetPassword,
  onDeactivateUser,
  onReactivateUser,
}: {
  users: UserAdminItem[];
  query: string;
  includeInactive: boolean;
  loading: boolean;
  loadError: string | null;
  mutationError: string | null;
  mutationPending: boolean;
  canManageUsers: boolean;
  onSearch: (query: string) => void;
  onToggleInactive: (includeInactive: boolean) => void;
  onEditUser: (userId: number) => void;
  onResetPassword: (userId: number) => void;
  onDeactivateUser: (userId: number) => void;
  onReactivateUser: (userId: number) => void;
}) {
  const [inactiveMenuOpen, setInactiveMenuOpen] = useState(false);
  const searchFrameRef = useRef<HTMLDivElement | null>(null);
  const inactiveFrameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!inactiveMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!inactiveFrameRef.current?.contains(target)) {
        setInactiveMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [inactiveMenuOpen]);

  if (!canManageUsers) {
    return (
      <section className="rounded-2xl border border-[var(--line-soft)] bg-white px-5 py-10">
        <p className="text-sm text-[var(--ink-subtle)]">Users are available to app admins only.</p>
      </section>
    );
  }

  const activeUserCount = users.filter((user) => user.isActive).length;
  const inactiveUserCount = users.length - activeUserCount;

  return (
    <div className="space-y-5">
      <section className="grid gap-4 lg:grid-cols-3">
        <MetricCard
          label="Total users"
          value={String(users.length)}
          tone="neutral"
          detail="All visible users"
        />
        <MetricCard
          label="Active users"
          value={String(activeUserCount)}
          tone="green"
          detail="Can sign in"
        />
        <MetricCard
          label="Inactive users"
          value={String(inactiveUserCount)}
          tone="red"
          detail="Cannot sign in"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 border-b border-[var(--line-soft)] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
              User administration
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-strong)]">
              Users
            </h2>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ToolbarMenuFrame menuRef={searchFrameRef} label="Search">
              <input
                value={query}
                onChange={(event) => onSearch(event.target.value)}
                placeholder="ID, email, or display name"
                className="h-7 min-w-[16rem] rounded-lg bg-transparent px-2 text-[12px] font-medium text-[var(--ink-muted)] outline-none placeholder:text-[var(--ink-subtle)]"
              />
            </ToolbarMenuFrame>
            <ToolbarMenuFrame menuRef={inactiveFrameRef} label="Display inactive">
              <button
                type="button"
                onClick={() => setInactiveMenuOpen((current) => !current)}
                aria-haspopup="menu"
                aria-expanded={inactiveMenuOpen}
                className="inline-flex h-7 items-center rounded-lg px-2 text-[12px] font-medium text-[var(--ink-muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
              >
                {includeInactive ? "Yes" : "No"}
              </button>
              {inactiveMenuOpen ? (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 min-w-[9rem] rounded-2xl border border-[var(--line-soft)] bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
                  <div className="space-y-1">
                    {[
                      { value: false, label: "No" },
                      { value: true, label: "Yes" },
                    ].map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => {
                          onToggleInactive(option.value);
                          setInactiveMenuOpen(false);
                        }}
                        className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition ${
                          includeInactive === option.value
                            ? "bg-[var(--surface-subtle)] text-[var(--ink-strong)]"
                            : "text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </ToolbarMenuFrame>
          </div>
        </div>

        {loadError || mutationError ? (
          <div className="border-b border-[rgba(193,62,62,0.14)] bg-[rgba(193,62,62,0.04)] px-5 py-3 text-sm text-[var(--accent-red)]">
            {loadError ?? mutationError}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left">
            <thead>
              <tr className="bg-[var(--surface-subtle)] text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Display name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">App Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Timezone</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line-soft)]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-sm text-[var(--ink-subtle)]">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-sm text-[var(--ink-subtle)]">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className={`text-sm transition hover:bg-[var(--surface-card)] ${
                      user.isActive ? "text-[var(--ink-strong)]" : "bg-[rgba(193,62,62,0.025)] text-[var(--ink-muted)]"
                    }`}
                  >
                    <td className="px-5 py-4 font-mono text-xs tracking-[0.12em] text-[var(--ink-subtle)]">
                      USR-{user.id}
                    </td>
                    <td className="px-5 py-4 font-medium">{user.name}</td>
                    <td className="px-5 py-4 text-[var(--ink-muted)]">{user.email}</td>
                    <td className="px-5 py-4">
                      <UserRolePill role={user.appRole} />
                    </td>
                    <td className="px-5 py-4">
                      <UserStatusPill isActive={user.isActive} />
                    </td>
                    <td className="px-5 py-4 text-[var(--ink-muted)]">
                      {user.timezone || "Default"}
                    </td>
                    <td className="px-5 py-4 text-[var(--ink-muted)]">{formatDate(user.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <IconActionButton
                          label="Edit user"
                          onClick={() => onEditUser(user.id)}
                          disabled={mutationPending}
                        >
                          <EditIcon />
                        </IconActionButton>
                        <IconActionButton
                          label="Set password"
                          onClick={() => onResetPassword(user.id)}
                          disabled={mutationPending}
                        >
                          <PasswordIcon />
                        </IconActionButton>
                        {user.isActive ? (
                          <IconActionButton
                            label="Deactivate user"
                            tooltipAlign="right"
                            tone="danger"
                            onClick={() => onDeactivateUser(user.id)}
                            disabled={mutationPending}
                          >
                            <DeactivateIcon />
                          </IconActionButton>
                        ) : (
                          <IconActionButton
                            label="Reactivate user"
                            tooltipAlign="right"
                            tone="accent"
                            onClick={() => onReactivateUser(user.id)}
                            disabled={mutationPending}
                          >
                            <ReactivateIcon />
                          </IconActionButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
