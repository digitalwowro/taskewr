"use client";

import { useEffect, useRef, useState } from "react";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import type { UserAdminItem } from "@/hooks/use-user-admin-state";

export function UserPasswordModal({
  user,
  onClose,
  onSave,
  isSaving,
  error,
}: {
  user: UserAdminItem | null;
  onClose: () => void;
  onSave: (password: string) => Promise<void>;
  isSaving: boolean;
  error: string | null;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);

  useFocusTrap(dialogRef, !!user);

  useEffect(() => {
    if (user) {
      passwordInputRef.current?.focus();
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

  const handleSave = async () => {
    if (password.length < 7) {
      setFieldError("Password must be at least 7 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setFieldError("Password and confirmation must match.");
      return;
    }

    setFieldError(null);
    await onSave(password);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(15,23,42,0.42)] px-4 py-6 backdrop-blur-sm">
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
        aria-labelledby="password-modal-title"
        className="relative z-[121] w-full max-w-xl overflow-hidden rounded-[24px] border border-[var(--line-soft)] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.2)]"
      >
        <div className="border-b border-[var(--line-soft)] bg-white px-5 py-4">
          <div className="space-y-1.5">
            <span className="rounded-full bg-[var(--surface-subtle)] px-2.5 py-1 font-mono text-[11px] tracking-[0.14em] text-[var(--ink-subtle)]">
              USR-{user.id}
            </span>
            <h2
              id="password-modal-title"
              className="text-[2rem] font-semibold leading-tight tracking-[-0.045em] text-[var(--ink-strong)]"
            >
              Reset password
            </h2>
            <p className="text-sm text-[var(--ink-muted)]">
              Set a temporary password for {user.name}. The user can change it from My Profile.
            </p>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5">
          <input
            ref={passwordInputRef}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Temporary password"
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
            {isSaving ? "Saving..." : "Set password"}
          </button>
        </div>
      </section>
    </div>
  );
}
