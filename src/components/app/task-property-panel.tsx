import type { ReactNode } from "react";

export type TaskPropertyIconName =
  | "project"
  | "parent"
  | "assignee"
  | "createdBy"
  | "status"
  | "priority"
  | "startDate"
  | "dueDate"
  | "reminder"
  | "labels"
  | "repeat"
  | "schedule";

function TaskPropertyIcon({ name }: { name: TaskPropertyIconName }) {
  const commonProps = {
    className: "h-[18px] w-[18px]",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: "1.7",
    viewBox: "0 0 20 20",
  };

  if (name === "project") {
    return (
      <svg {...commonProps}>
        <path d="M3.5 6.25h4.4l1.35 1.5h7.25v6.5a1.75 1.75 0 0 1-1.75 1.75H5.25A1.75 1.75 0 0 1 3.5 14.25v-8Z" />
        <path d="M3.5 6.25v-.5A1.75 1.75 0 0 1 5.25 4h2.2l1.35 1.5h5.95A1.75 1.75 0 0 1 16.5 7.25v.5" />
      </svg>
    );
  }

  if (name === "parent") {
    return (
      <svg {...commonProps}>
        <path d="M5 5.5h4.5a2.5 2.5 0 0 1 2.5 2.5v6.5" />
        <path d="M5 14.5h7" />
        <path d="M12 11.5v3h3" />
        <path d="M3.5 4h3v3h-3z" />
      </svg>
    );
  }

  if (name === "assignee") {
    return (
      <svg {...commonProps}>
        <circle cx="8" cy="7" r="2.75" />
        <path d="M3.75 15.5a4.25 4.25 0 0 1 8.5 0" />
        <path d="M14.25 8.5v4" />
        <path d="M12.25 10.5h4" />
      </svg>
    );
  }

  if (name === "createdBy") {
    return (
      <svg {...commonProps}>
        <circle cx="10" cy="7" r="3" />
        <path d="M4.75 16a5.25 5.25 0 0 1 10.5 0" />
        <path d="m13.75 12.25 1.5 1.5 2.25-2.5" />
      </svg>
    );
  }

  if (name === "status") {
    return (
      <svg {...commonProps}>
        <circle cx="10" cy="10" r="6.25" />
        <circle cx="10" cy="10" r="2.5" />
      </svg>
    );
  }

  if (name === "priority") {
    return (
      <svg {...commonProps}>
        <path d="M5 14.5v-3" />
        <path d="M10 14.5v-7" />
        <path d="M15 14.5v-10" />
      </svg>
    );
  }

  if (name === "startDate") {
    return (
      <svg {...commonProps}>
        <path d="M6 3.5v3" />
        <path d="M14 3.5v3" />
        <path d="M4 7.5h12" />
        <rect x="3.5" y="5" width="13" height="11.5" rx="2" />
        <path d="M12.75 13.5a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" />
        <path d="M12.75 10.1v1.3l.9.7" />
      </svg>
    );
  }

  if (name === "dueDate") {
    return (
      <svg {...commonProps}>
        <path d="M6 3.5v3" />
        <path d="M14 3.5v3" />
        <path d="M4 7.5h12" />
        <rect x="3.5" y="5" width="13" height="11.5" rx="2" />
        <path d="m7.25 12 1.75 1.75 3.75-4" />
      </svg>
    );
  }

  if (name === "reminder") {
    return (
      <svg {...commonProps}>
        <path d="M5.5 8.75a4.5 4.5 0 0 1 9 0c0 4 1.5 4.5 1.5 4.5H4s1.5-.5 1.5-4.5Z" />
        <path d="M8.5 15.25a1.75 1.75 0 0 0 3 0" />
        <path d="M7.25 4.5a3.8 3.8 0 0 1 5.5 0" />
      </svg>
    );
  }

  if (name === "labels") {
    return (
      <svg {...commonProps}>
        <path d="M4 5.75v4.45a2 2 0 0 0 .6 1.42l4.85 4.78a1.85 1.85 0 0 0 2.6-.02l4.2-4.2a1.85 1.85 0 0 0 .02-2.6L11.5 4.75a2 2 0 0 0-1.43-.6H5.6A1.6 1.6 0 0 0 4 5.75Z" />
        <path d="M7.25 7.25h.01" />
      </svg>
    );
  }

  if (name === "schedule") {
    return (
      <svg {...commonProps}>
        <path d="M6 3.5v3" />
        <path d="M14 3.5v3" />
        <path d="M4 7.5h12" />
        <rect x="3.5" y="5" width="13" height="11.5" rx="2" />
        <path d="M7 10.5h6" />
        <path d="M7 13.25h3.5" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M4.5 10a5.5 5.5 0 1 0 1.6-3.9" />
      <path d="M4.5 4.75v3.5H8" />
      <path d="M10 6.75v3.5l2.25 1.35" />
    </svg>
  );
}

export function TaskPropertiesPanel({ children }: { children: ReactNode }) {
  return (
    <section className="space-y-1.5">
      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
        Properties
      </h3>
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}

export function TaskPropertyRow({
  icon,
  label,
  children,
}: {
  icon: TaskPropertyIconName;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-8 grid-cols-[8.5rem_minmax(0,1fr)] items-center gap-1 rounded-lg py-0.5">
      <div className="flex min-w-0 items-center gap-2.5 text-[var(--ink-muted)]">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center">
          <TaskPropertyIcon name={icon} />
        </span>
        <span className="min-w-0 truncate text-sm font-medium">{label}</span>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
