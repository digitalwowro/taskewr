import { redirectAuthenticatedUser } from "@/lib/page-auth";

import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await redirectAuthenticatedUser("/");
  const resolvedSearchParams = await searchParams;
  const nextPath =
    typeof resolvedSearchParams.next === "string" ? resolvedSearchParams.next : undefined;

  return (
    <main className="min-h-screen bg-[var(--surface-base)] px-6 py-10 text-[var(--ink-strong)]">
      <div className="mx-auto flex min-h-[70vh] max-w-md items-center">
        <section className="w-full rounded-[24px] border border-[var(--line-soft)] bg-white p-8 shadow-[0_24px_64px_rgba(15,23,42,0.08)]">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
              Taskewr
            </p>
            <h1 className="text-3xl font-semibold leading-none tracking-[-0.05em]">Log in</h1>
          </div>

          <LoginForm nextPath={nextPath} />
        </section>
      </div>
    </main>
  );
}
