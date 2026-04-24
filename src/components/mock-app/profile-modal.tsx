"use client";

import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useFocusTrap } from "@/hooks/use-focus-trap";

export function ProfileModal({
  open,
  onClose,
  profile,
  isSaving,
  error,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  profile: {
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  isSaving: boolean;
  error: string | null;
  onSave: (input: {
    name: string;
    email: string;
    currentPassword: string;
    newPassword: string;
    avatarUrl: string | null;
  }) => Promise<void>;
}) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [username, setUsername] = useState(profile?.name ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatarUrl ?? null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const avatarInitial = (username.trim().charAt(0) || "R").toUpperCase();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setFieldError("Please upload an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
        setFieldError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!username.trim()) {
      setFieldError("Username is required.");
      return;
    }

    if (!email.trim()) {
      setFieldError("Email is required.");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setFieldError("New password and confirmation must match.");
      return;
    }

    setFieldError(null);
    await onSave({
      name: username.trim(),
      email: email.trim(),
      currentPassword,
      newPassword,
      avatarUrl,
    });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(15,23,42,0.42)] px-4 py-6 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        className="relative z-[121] w-full max-w-3xl overflow-hidden rounded-[24px] border border-[var(--line-soft)] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.2)]"
      >
        <div className="border-b border-[var(--line-soft)] bg-white px-5 py-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[var(--surface-subtle)] px-2.5 py-1 font-mono text-[11px] tracking-[0.14em] text-[var(--ink-subtle)]">
                PROFILE
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                Account
              </span>
            </div>
            <h2
              id="profile-modal-title"
              className="text-[2rem] font-semibold leading-tight tracking-[-0.045em] text-[var(--ink-strong)]"
            >
              My Profile
            </h2>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="flex items-start gap-5 rounded-[20px] border border-[var(--line-soft)] bg-[var(--surface-card)] p-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-[rgba(34,122,89,0.24)] bg-white text-2xl font-semibold text-[var(--accent-strong)]">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Profile avatar" className="h-full w-full rounded-full object-cover" />
              ) : (
                avatarInitial
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                  Avatar
                </p>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">
                  Use the first letter of your name for now. We can wire real uploads later.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(event) => void handleFileChange(event)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-[var(--line-strong)] bg-white px-4 text-sm font-medium text-[var(--ink-strong)] transition hover:bg-[var(--surface-subtle)]"
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarUrl(null)}
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-[var(--line-soft)] bg-[var(--surface-subtle)] px-4 text-sm font-medium text-[var(--ink-muted)] transition hover:bg-[var(--surface-card)]"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                Name
              </label>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="h-11 w-full rounded-[18px] border border-[var(--line-strong)] bg-white px-4 text-sm text-[var(--ink-strong)] outline-none"
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
                className="h-11 w-full rounded-[18px] border border-[var(--line-strong)] bg-white px-4 text-sm text-[var(--ink-strong)] outline-none"
              />
            </div>
          </div>

          <div className="space-y-3 rounded-[20px] border border-[var(--line-soft)] bg-[var(--surface-card)] p-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                Change Password
              </p>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">Update your account password.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Current password"
                className="h-11 w-full rounded-[18px] border border-[var(--line-strong)] bg-white px-4 text-sm text-[var(--ink-strong)] outline-none"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="New password"
                className="h-11 w-full rounded-[18px] border border-[var(--line-strong)] bg-white px-4 text-sm text-[var(--ink-strong)] outline-none"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm password"
                className="h-11 w-full rounded-[18px] border border-[var(--line-strong)] bg-white px-4 text-sm text-[var(--ink-strong)] outline-none"
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
            onClick={onClose}
            disabled={isSaving}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-[var(--line-strong)] bg-[var(--surface-card)] px-4 text-sm font-medium text-[var(--ink-muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-[var(--accent-strong)] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(34,122,89,0.18)] transition hover:bg-[var(--accent-strong-hover)]"
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </section>
    </div>
  );
}
