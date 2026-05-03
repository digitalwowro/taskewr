"use client";

import Link from "next/link";
import { useState } from "react";

type ForgotPasswordState = {
  error: string | null;
  sent: boolean;
  pending: boolean;
};

export function ForgotPasswordForm() {
  const [state, setState] = useState<ForgotPasswordState>({
    error: null,
    sent: false,
    pending: false,
  });

  async function handleSubmit(formData: FormData) {
    setState({
      error: null,
      sent: false,
      pending: true,
    });

    try {
      const response = await fetch("/api/v1/auth/password-reset/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: String(formData.get("email") ?? ""),
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setState({
          error: payload?.error ?? "Unable to request a reset link.",
          sent: false,
          pending: false,
        });
        return;
      }

      setState({
        error: null,
        sent: true,
        pending: false,
      });
    } catch {
      setState({
        error: "Unable to request a reset link right now.",
        sent: false,
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
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
          Email
        </label>
        <input
          type="email"
          name="email"
          autoComplete="username"
          className="h-11 w-full rounded-lg border border-[var(--line-strong)] bg-white px-4 text-sm outline-none transition focus:border-[var(--accent-strong)]"
          placeholder="you@example.com"
          disabled={state.pending || state.sent}
        />
      </div>

      {state.error ? (
        <div className="rounded-lg border border-[rgba(196,61,47,0.18)] bg-[rgba(196,61,47,0.06)] px-4 py-3 text-sm text-[var(--danger-strong)]">
          {state.error}
        </div>
      ) : null}

      {state.sent ? (
        <div className="rounded-lg border border-[rgba(34,122,89,0.18)] bg-[rgba(34,122,89,0.06)] px-4 py-3 text-sm text-[var(--accent-strong)]">
          If that email address belongs to an active account, a password reset link will be sent.
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
          disabled={state.pending || state.sent}
          className="inline-flex h-10 items-center rounded-lg bg-[var(--accent-strong)] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(34,122,89,0.18)] transition hover:bg-[var(--accent-strong-hover)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {state.pending ? "Sending..." : "Send reset link"}
        </button>
      </div>
    </form>
  );
}
