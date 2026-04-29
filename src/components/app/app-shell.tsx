"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AppProject } from "@/app/app-data";
import { useClickOutside } from "@/hooks/use-click-outside";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  type TaskPriority,
  type TaskStatus,
} from "@/domain/tasks/constants";

type SearchResult = {
  id: number;
  title: string;
  projectId: number;
  projectName: string;
  status: string;
  priority: string;
  dueDate: string | null;
};

type AppSection = "dashboard" | "projects" | "project_detail" | "task_detail" | "users";

type NavItem = {
  id: string;
  label: string;
  icon: ReactNode;
};

type AppSidebarProps = {
  sidebarExpanded: boolean;
  onToggleSidebar: () => void;
  navItems: NavItem[];
  initialSection: AppSection;
  activeProjects: AppProject[];
  selectedProjectId?: string;
  onOpenSection: (sectionId: string) => void;
  onNewTask: () => void;
  primaryActionLabel?: string;
  showPrimaryAction?: boolean;
  onOpenProject: (projectId: string) => void;
  onOpenProfile?: () => void;
  onLogout?: () => void;
  avatarInitial?: string;
  avatarUrl?: string | null;
};

export function AppSidebar({
  sidebarExpanded,
  onToggleSidebar,
  navItems,
  initialSection,
  activeProjects,
  selectedProjectId,
  onOpenSection,
  onNewTask,
  primaryActionLabel = "New Task",
  showPrimaryAction = true,
  onOpenProject,
  onOpenProfile,
  onLogout,
  avatarInitial = "R",
  avatarUrl,
}: AppSidebarProps) {
  const visibleNavItems = navItems.filter((item) => item.id !== "search");
  const isDashboardActive = initialSection === "dashboard";
  const isProjectsActive =
    initialSection === "projects" ||
    initialSection === "project_detail" ||
    initialSection === "task_detail";
  const isUsersActive = initialSection === "users";
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement | null>(null);

  useClickOutside([avatarMenuRef], avatarMenuOpen, () => setAvatarMenuOpen(false));

  return (
    <aside
      className={`h-full border-r border-[var(--line-soft)] bg-white transition-[width] duration-200 ${
        sidebarExpanded ? "w-[352px]" : "w-[72px]"
      }`}
    >
      <div className="flex h-full">
        <div className="relative flex w-[72px] shrink-0 flex-col border-r border-[var(--line-soft)] bg-[var(--surface-sidebar)] px-3 py-4">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--ink-strong)] text-sm font-semibold text-white shadow-[0_12px_30px_rgba(15,23,42,0.14)]">
              T
            </div>
            <button
              type="button"
              onClick={onToggleSidebar}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-[var(--ink-subtle)] transition hover:border-[var(--line-soft)] hover:bg-white"
              aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
            >
              <svg
                viewBox="0 0 20 20"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                {sidebarExpanded ? (
                  <path d="M12.5 4.5 7 10l5.5 5.5M16 4.5v11" />
                ) : (
                  <path d="M7.5 4.5 13 10l-5.5 5.5M4 4.5v11" />
                )}
              </svg>
            </button>
            <div className="mt-1 flex flex-col items-center gap-2">
              {visibleNavItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onOpenSection(item.id)}
                  title={item.label}
                  aria-current={
                    (isDashboardActive && item.id === "dashboard") ||
                    (isProjectsActive && item.id === "projects") ||
                    (isUsersActive && item.id === "users")
                      ? "page"
                      : undefined
                  }
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                    (isDashboardActive && item.id === "dashboard") ||
                    (isProjectsActive && item.id === "projects") ||
                    (isUsersActive && item.id === "users")
                      ? "border-[rgba(34,122,89,0.18)] bg-[rgba(34,122,89,0.08)] text-[var(--accent-strong)]"
                      : "border-transparent text-[var(--ink-subtle)] hover:border-[var(--line-soft)] hover:bg-white"
                  }`}
                >
                  {item.icon}
                </button>
              ))}
            </div>
          </div>
          <div
            ref={avatarMenuRef}
            className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col items-center justify-center gap-2"
          >
            {avatarMenuOpen ? (
              <div className="absolute bottom-0 left-[calc(100%+0.75rem)] w-[152px] overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-white p-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.14)]">
                <button
                  type="button"
                  onClick={() => {
                    setAvatarMenuOpen(false);
                    onOpenProfile?.();
                  }}
                  className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-[var(--ink-strong)] transition hover:bg-[var(--surface-subtle)]"
                >
                  My Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAvatarMenuOpen(false);
                    onLogout?.();
                  }}
                  className="mt-1 flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-[var(--danger-strong)] transition hover:bg-[rgba(186,73,73,0.06)]"
                >
                  Logout
                </button>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setAvatarMenuOpen((current) => !current)}
              aria-label="Open user menu"
              aria-expanded={avatarMenuOpen}
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[rgba(34,122,89,0.28)] bg-white text-sm font-semibold text-[var(--accent-strong)] shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition hover:border-[rgba(34,122,89,0.4)] hover:bg-[var(--surface-subtle)]"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt="Profile avatar"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                avatarInitial
              )}
            </button>
          </div>
        </div>

        {sidebarExpanded ? (
          <div className="min-w-0 flex-1 px-5 py-5">
            <div className="flex h-full min-h-0 flex-col">
              <div className="space-y-5">
                {showPrimaryAction ? (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={onNewTask}
                      className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[var(--accent-strong)] px-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(34,122,89,0.18)] transition hover:bg-[var(--accent-strong-hover)]"
                    >
                      {primaryActionLabel}
                    </button>
                  </div>
                ) : null}

                <nav className="space-y-1.5 text-sm">
                  {visibleNavItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onOpenSection(item.id)}
                      aria-current={
                        (isDashboardActive && item.id === "dashboard") ||
                        (isProjectsActive && item.id === "projects") ||
                        (isUsersActive && item.id === "users")
                          ? "page"
                          : undefined
                      }
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                        (isDashboardActive && item.id === "dashboard") ||
                        (isProjectsActive && item.id === "projects") ||
                        (isUsersActive && item.id === "users")
                          ? "bg-[var(--surface-subtle)] font-medium text-[var(--ink-strong)]"
                          : "text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
                      }`}
                    >
                      <span className="flex h-4 w-4 items-center justify-center">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>

                <div className="border-t border-[var(--line-soft)] pt-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ink-subtle)]">
                    Active projects
                  </p>
                  {activeProjects.length > 0 ? (
                    <div className="space-y-1.5 text-sm">
                      {activeProjects.map((project) => (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => onOpenProject(project.id)}
                          aria-current={
                            (initialSection === "project_detail" ||
                              initialSection === "task_detail") &&
                            selectedProjectId === project.id
                              ? "page"
                              : undefined
                          }
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition ${
                            (initialSection === "project_detail" ||
                              initialSection === "task_detail") &&
                            selectedProjectId === project.id
                              ? "bg-[rgba(34,122,89,0.08)] text-[var(--accent-strong)]"
                              : "text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
                          }`}
                        >
                          <span className="truncate">{project.name}</span>
                          <span className="text-xs text-[var(--ink-subtle)]">{project.taskCount}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl border border-dashed border-[var(--line-soft)] px-3 py-4 text-sm text-[var(--ink-subtle)]">
                      No active projects yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

type AppHeaderProps = {
  initialSection: AppSection;
  visibleTaskCount: number;
  activeProjectCount: number;
  userCount: number;
  selectedProjectName: string;
  selectedProjectTaskCount: number;
  searchHrefBase: string;
  showPrimaryAction?: boolean;
  onOpenTask: (taskId: string) => void;
  onPrimaryAction: () => void;
};

function formatSearchMeta(result: SearchResult) {
  const status =
    TASK_STATUS_LABELS[result.status as TaskStatus] ??
    result.status.replaceAll("_", " ");
  const priority =
    TASK_PRIORITY_LABELS[result.priority as TaskPriority] ??
    result.priority.replace(/\b\w/g, (char) => char.toUpperCase());

  return `${result.projectName} · ${status} · ${priority}`;
}

function HeaderSearch({
  placeholder,
  searchHrefBase,
  onOpenTask,
}: {
  placeholder: string;
  searchHrefBase: string;
  onOpenTask: (taskId: string) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const resultListId = "task-search-results";

  useClickOutside([containerRef], open, () => setOpen(false));

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setPending(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setPending(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/v1/search?query=${encodeURIComponent(query.trim())}&limit=8`,
          { signal: controller.signal },
        );

        const payload = (await response.json()) as SearchResult[] | { error?: string };

        if (!response.ok) {
          setResults([]);
          setError("Search failed.");
          return;
        }

        setResults(payload as SearchResult[]);
        setActiveIndex((payload as SearchResult[]).length > 0 ? 0 : -1);
        setOpen(true);
      } catch (fetchError) {
        if ((fetchError as { name?: string }).name === "AbortError") {
          return;
        }

        setResults([]);
        setError("Search failed.");
        setActiveIndex(-1);
      } finally {
        setPending(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query]);

  const openTaskResult = (taskId: string) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setActiveIndex(-1);
    router.prefetch(`/tasks/${taskId}`);
    onOpenTask(taskId);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex h-10 min-w-[320px] items-center rounded-xl border border-[var(--line-strong)] bg-[var(--surface-card)] px-3 text-sm text-[var(--ink-subtle)]">
        <svg
          viewBox="0 0 20 20"
          className="mr-2 h-4 w-4 text-[var(--ink-subtle)]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        >
          <path d="m14.5 14.5 3 3" strokeLinecap="round" />
          <circle cx="8.5" cy="8.5" r="5.5" />
        </svg>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            if (results.length > 0 || pending || error) {
              setOpen(true);
            }
          }}
          onKeyDown={(event) => {
            if (!open && event.key === "ArrowDown" && results.length > 0) {
              event.preventDefault();
              setOpen(true);
              setActiveIndex(0);
              return;
            }

            if (!open) {
              return;
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((current) => Math.min(current + 1, results.length - 1));
              return;
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((current) => Math.max(current - 1, 0));
              return;
            }

            if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
              return;
            }

            if (event.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
              event.preventDefault();
              openTaskResult(`${results[activeIndex].id}`);
            }
          }}
          placeholder={placeholder}
          className="h-full w-full bg-transparent outline-none placeholder:text-[var(--ink-subtle)]"
          aria-label="Search tasks"
          aria-expanded={open}
          aria-controls={open ? resultListId : undefined}
          aria-activedescendant={
            open && activeIndex >= 0 ? `${resultListId}-${results[activeIndex]?.id}` : undefined
          }
          aria-autocomplete="list"
          role="combobox"
        />
      </div>
      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-[420px] overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
          role="listbox"
          id={resultListId}
        >
          <div className="border-b border-[var(--line-soft)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
            {pending ? "Searching" : error ? "Search error" : "Search"}
          </div>
          {error ? (
            <div className="px-4 py-4 text-sm text-[var(--danger-strong)]">{error}</div>
          ) : pending ? (
            <div className="px-4 py-4 text-sm text-[var(--ink-subtle)]">Searching tasks…</div>
          ) : results.length > 0 ? (
            <div className="max-h-[360px] overflow-y-auto py-1">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => openTaskResult(`${result.id}`)}
                  onMouseEnter={() => setActiveIndex(index)}
                  role="option"
                  id={`${resultListId}-${result.id}`}
                  aria-selected={activeIndex === index}
                  className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition ${
                    activeIndex === index ? "bg-[var(--surface-subtle)]" : "hover:bg-[var(--surface-subtle)]"
                  }`}
                >
                  <span className="text-sm font-medium text-[var(--ink-strong)]">{result.title}</span>
                  <span className="text-xs text-[var(--ink-subtle)]">{formatSearchMeta(result)}</span>
                  <span className="text-[11px] text-[var(--accent-strong)]">{searchHrefBase}/tasks/{result.id}</span>
                </button>
              ))}
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="px-4 py-4 text-sm text-[var(--ink-subtle)]">No matching tasks found.</div>
          ) : (
            <div className="px-4 py-4 text-sm text-[var(--ink-subtle)]">Type at least 2 characters to search tasks.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function AppHeader({
  initialSection,
  visibleTaskCount,
  activeProjectCount,
  userCount,
  selectedProjectName,
  selectedProjectTaskCount,
  searchHrefBase,
  showPrimaryAction = true,
  onOpenTask,
  onPrimaryAction,
}: AppHeaderProps) {
  const searchPlaceholder =
    initialSection === "dashboard"
      ? "Search tasks and project work"
      : initialSection === "projects"
        ? "Search tasks across projects"
        : initialSection === "project_detail" || initialSection === "task_detail"
          ? `Search in ${selectedProjectName}`
          : "Search tasks";
  const showTaskSearch = initialSection !== "users";

  return (
    <header className="border-b border-[var(--line-soft)] bg-white px-6 py-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-[-0.04em]">
              {initialSection === "dashboard"
                ? "Dashboard"
                : initialSection === "projects"
                  ? "Projects"
                  : initialSection === "users"
                    ? "Users"
                  : initialSection === "project_detail" || initialSection === "task_detail"
                    ? selectedProjectName
                    : "Task"}
            </h1>
            <span className="rounded-full bg-[rgba(34,122,89,0.08)] px-2.5 py-1 text-xs font-medium text-[var(--accent-strong)]">
              {initialSection === "dashboard"
                ? `${visibleTaskCount} active`
                : initialSection === "projects"
                  ? `${activeProjectCount} active`
                  : initialSection === "users"
                    ? `${userCount} active`
                  : initialSection === "project_detail" || initialSection === "task_detail"
                    ? `${selectedProjectTaskCount} tasks`
                    : "Task"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {showTaskSearch ? (
            <HeaderSearch
              placeholder={searchPlaceholder}
              searchHrefBase={searchHrefBase}
              onOpenTask={onOpenTask}
            />
          ) : null}
          {showPrimaryAction ? (
            <button
              type="button"
              onClick={onPrimaryAction}
              className="inline-flex h-10 items-center rounded-xl bg-[var(--accent-strong)] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(34,122,89,0.18)] transition hover:bg-[var(--accent-strong-hover)]"
            >
              {initialSection === "projects"
                ? "New Project"
                : initialSection === "users"
                  ? "New User"
                  : "New Task"}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
