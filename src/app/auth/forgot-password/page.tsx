import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-[var(--surface-base)] px-5 py-10 text-[var(--ink-strong)]">
      <div className="mx-auto flex min-h-[70vh] max-w-md items-center">
        <section className="w-full rounded-[24px] border border-[var(--line-soft)] bg-white p-8 shadow-[0_24px_64px_rgba(15,23,42,0.08)]">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
              Taskewr
            </p>
            <h1 className="text-3xl font-semibold leading-none tracking-[-0.05em]">
              Reset password
            </h1>
            <p className="text-sm leading-6 text-[var(--ink-muted)]">
              Enter your email address and Taskewr will send a password reset link if the account is active.
            </p>
          </div>

          <ForgotPasswordForm />
        </section>
      </div>
    </main>
  );
}
