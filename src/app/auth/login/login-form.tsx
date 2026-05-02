"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LoginState = {
  error: string | null;
  pending: boolean;
};

function sanitizeNextPath(nextPath: string | null) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/";
  }

  return nextPath;
}

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [state, setState] = useState<LoginState>({
    error: null,
    pending: false,
  });
  const safeNextPath = sanitizeNextPath(nextPath ?? null);

  async function handleSubmit(formData: FormData) {
    setState({
      error: null,
      pending: true,
    });

    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setState({
          error: payload.error ?? "Unable to log in.",
          pending: false,
        });
        return;
      }

      router.replace(safeNextPath);
      router.refresh();
    } catch {
      setState({
        error: "Unable to log in right now.",
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
        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
          Email
        </label>
        <input
          type="email"
          name="email"
          autoComplete="username"
          className="h-11 w-full rounded-lg border border-[var(--line-strong)] bg-white px-4 text-sm outline-none transition focus:border-[var(--accent-strong)]"
          placeholder="you@example.com"
          disabled={state.pending}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
          Password
        </label>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          className="h-11 w-full rounded-lg border border-[var(--line-strong)] bg-white px-4 text-sm outline-none transition focus:border-[var(--accent-strong)]"
          placeholder="Password"
          disabled={state.pending}
        />
      </div>

      {state.error ? (
        <div className="rounded-lg border border-[rgba(196,61,47,0.18)] bg-[rgba(196,61,47,0.06)] px-4 py-3 text-sm text-[var(--danger-strong)]">
          {state.error}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <Link
          href="/auth/forgot-password"
          className="text-sm font-medium text-[var(--ink-muted)] transition hover:text-[var(--ink-strong)]"
        >
          Forgot password?
        </Link>
        <button
          type="submit"
          disabled={state.pending}
          className="inline-flex h-10 items-center rounded-lg bg-[var(--accent-strong)] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(34,122,89,0.18)] transition hover:bg-[var(--accent-strong-hover)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {state.pending ? "Logging in..." : "Log In"}
        </button>
      </div>
    </form>
  );
}
