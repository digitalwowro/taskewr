"use client";

import Link from "next/link";
import { useState } from "react";

type ResetPasswordState = {
  error: string | null;
  complete: boolean;
  pending: boolean;
};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, setState] = useState<ResetPasswordState>({
    error: token ? null : "This reset link is missing a token.",
    complete: false,
    pending: false,
  });

  async function handleSubmit(formData: FormData) {
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password.length < 7) {
      setState({
        error: "New password must be at least 7 characters.",
        complete: false,
        pending: false,
      });
      return;
    }

    if (password !== confirmPassword) {
      setState({
        error: "New password and confirmation must match.",
        complete: false,
        pending: false,
      });
      return;
    }

    setState({
      error: null,
      complete: false,
      pending: true,
    });

    try {
      const response = await fetch("/api/v1/auth/password-reset/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setState({
          error: payload?.error ?? "Unable to reset password.",
          complete: false,
          pending: false,
        });
        return;
      }

      setState({
        error: null,
        complete: true,
        pending: false,
      });
    } catch {
      setState({
        error: "Unable to reset password right now.",
        complete: false,
        pending: false,
      });
    }
  }

  return (
    <form
      className="mt-4 space-y-4"
      action={async (formData) => {
        await handleSubmit(formData);
      }}
    >
      <div className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
          New password
        </label>
        <input
          type="password"
          name="password"
          autoComplete="new-password"
          className="h-11 w-full rounded-[18px] border border-[var(--line-strong)] bg-white px-4 text-sm outline-none transition focus:border-[var(--accent-strong)]"
          placeholder="New password"
          disabled={!token || state.pending || state.complete}
        />
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
          Confirm password
        </label>
        <input
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          className="h-11 w-full rounded-[18px] border border-[var(--line-strong)] bg-white px-4 text-sm outline-none transition focus:border-[var(--accent-strong)]"
          placeholder="Confirm password"
          disabled={!token || state.pending || state.complete}
        />
      </div>

      {state.error ? (
        <div className="rounded-2xl border border-[rgba(196,61,47,0.18)] bg-[rgba(196,61,47,0.06)] px-4 py-3 text-sm text-[var(--danger-strong)]">
          {state.error}
        </div>
      ) : null}

      {state.complete ? (
        <div className="rounded-2xl border border-[rgba(34,122,89,0.18)] bg-[rgba(34,122,89,0.06)] px-4 py-3 text-sm text-[var(--accent-strong)]">
          Password updated. You can now log in with your new password.
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <Link
          href="/auth/login"
          className="text-sm font-medium text-[var(--ink-muted)] transition hover:text-[var(--ink-strong)]"
        >
          Back to login
        </Link>
        <button
          type="submit"
          disabled={!token || state.pending || state.complete}
          className="inline-flex h-10 items-center rounded-xl bg-[var(--accent-strong)] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(34,122,89,0.18)] transition hover:bg-[var(--accent-strong-hover)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {state.pending ? "Saving..." : "Set password"}
        </button>
      </div>
    </form>
  );
}
