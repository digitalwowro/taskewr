"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AppProject, AppWorkspace, ProjectGroup } from "@/app/app-data";
import type { TaskStatus } from "@/domain/tasks/constants";
import type { TaskListItem } from "@/domain/tasks/types";
import { usePersistedCollapsedSections } from "@/hooks/use-persisted-collapsed-sections";
import {
  actionButtonClassName,
  CountPill,
  DashboardCompactTaskRow,
  FocusItem,
  HorizontalListRow,
  MetricCard,
  ProjectBoardLane,
  ProjectRow,
  ProjectSection,
  TaskTableHeader,
} from "@/components/app/ui";
import { ToolbarMenuFrame } from "@/components/app/filter-toolbar";
import type { ProjectView } from "@/domain/projects/constants";

function IconActionButton({
  label,
  tone = "neutral",
  onClick,
  children,
}: {
  label: string;
  tone?: "neutral" | "accent";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "accent"
      ? "border-[rgba(34,122,89,0.16)] bg-[rgba(34,122,89,0.08)] text-[var(--accent-strong)] hover:bg-[rgba(34,122,89,0.12)]"
      : "border-[var(--line-soft)] bg-white text-[var(--ink-muted)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]";

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        onClick={(event) => {
          onClick();
          event.currentTarget.blur();
        }}
        aria-label={label}
        title={label}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${toneClass}`}
      >
        {children}
      </button>
      <span className="pointer-events-none absolute bottom-full right-0 z-20 mb-2 hidden whitespace-nowrap rounded-lg border border-[var(--line-soft)] bg-[rgb(15,23,42)] px-2.5 py-1.5 text-[11px] font-medium text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] group-hover:block group-focus-within:block">
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

function BackIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M6.75 4.25 3 8l3.75 3.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 8h9.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type WorkspaceDisplayMode = "single" | "two";

type WorkspaceDisplaySetting = {
  mode: WorkspaceDisplayMode;
  leftWorkspaceId: string;
  rightWorkspaceId: string;
};

const DASHBOARD_WORKSPACE_SETTINGS_KEY = "taskewr.dashboard.workspaceDisplaySettings";
const WORKSPACE_DISPLAY_MODE_OPTIONS: Array<{ value: WorkspaceDisplayMode; label: string }> = [
  { value: "single", label: "Single Workspace" },
  { value: "two", label: "Two Workspaces" },
];

function normalizeWorkspaceSetting(
  value: Partial<WorkspaceDisplaySetting> | null | undefined,
  workspaces: AppWorkspace[],
): WorkspaceDisplaySetting {
  const firstWorkspaceId = workspaces[0]?.id ?? "";
  const secondWorkspaceId = workspaces[1]?.id ?? firstWorkspaceId;
  const leftWorkspaceId = workspaces.some((workspace) => workspace.id === value?.leftWorkspaceId)
    ? value!.leftWorkspaceId!
    : firstWorkspaceId;
  let rightWorkspaceId = workspaces.some((workspace) => workspace.id === value?.rightWorkspaceId)
    ? value!.rightWorkspaceId!
    : secondWorkspaceId;

  if (rightWorkspaceId === leftWorkspaceId) {
    rightWorkspaceId = workspaces.find((workspace) => workspace.id !== leftWorkspaceId)?.id ?? leftWorkspaceId;
  }

  return {
    mode: value?.mode === "two" && workspaces.length > 1 ? "two" : "single",
    leftWorkspaceId,
    rightWorkspaceId,
  };
}

function readDashboardWorkspaceSettings(sectionId: string, workspaces: AppWorkspace[]) {
  if (typeof window === "undefined") {
    return normalizeWorkspaceSetting(null, workspaces);
  }

  try {
    const storedValue = window.localStorage.getItem(DASHBOARD_WORKSPACE_SETTINGS_KEY);
    const parsed = storedValue ? (JSON.parse(storedValue) as Record<string, Partial<WorkspaceDisplaySetting>>) : {};
    return normalizeWorkspaceSetting(parsed[sectionId], workspaces);
  } catch {
    return normalizeWorkspaceSetting(null, workspaces);
  }
}

function persistDashboardWorkspaceSetting(sectionId: string, setting: WorkspaceDisplaySetting) {
  try {
    const storedValue = window.localStorage.getItem(DASHBOARD_WORKSPACE_SETTINGS_KEY);
    const parsed = storedValue ? (JSON.parse(storedValue) as Record<string, WorkspaceDisplaySetting>) : {};
    window.localStorage.setItem(
      DASHBOARD_WORKSPACE_SETTINGS_KEY,
      JSON.stringify({
        ...parsed,
        [sectionId]: setting,
      }),
    );
  } catch {
    // Storage is a preference only; keep the dashboard usable without it.
  }
}

function useDashboardWorkspaceSetting(sectionId: string, workspaces: AppWorkspace[]) {
  const [setting, setSetting] = useState(() => normalizeWorkspaceSetting(null, workspaces));

  useEffect(() => {
    setSetting(readDashboardWorkspaceSettings(sectionId, workspaces));
  }, [sectionId, workspaces]);

  const updateSetting = (nextValue: Partial<WorkspaceDisplaySetting>) => {
    setSetting((current) => {
      const next = normalizeWorkspaceSetting({ ...current, ...nextValue }, workspaces);
      persistDashboardWorkspaceSetting(sectionId, next);
      return next;
    });
  };

  return [setting, updateSetting] as const;
}

function uniqueTaskItems(items: TaskListItem[]) {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

function formatWorkspaceSplit(items: TaskListItem[], workspaces: AppWorkspace[]) {
  const counts = new Map<string, number>();

  for (const item of uniqueTaskItems(items)) {
    const workspaceId = item.workspaceId ?? "";
    counts.set(workspaceId, (counts.get(workspaceId) ?? 0) + 1);
  }

  const details = workspaces
    .map((workspace) => ({
      name: workspace.name.toLowerCase(),
      count: counts.get(workspace.id) ?? 0,
    }))
    .filter((item) => item.count > 0)
    .map((item) => `${item.count} ${item.name}`);

  return details.length > 0 ? details.join(" · ") : "No visible tasks";
}

function WorkspaceDisplayControls({
  setting,
  workspaces,
  onChange,
}: {
  setting: WorkspaceDisplaySetting;
  workspaces: AppWorkspace[];
  onChange: (value: Partial<WorkspaceDisplaySetting>) => void;
}) {
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [leftMenuOpen, setLeftMenuOpen] = useState(false);
  const [rightMenuOpen, setRightMenuOpen] = useState(false);
  const modeMenuRef = useRef<HTMLDivElement | null>(null);
  const leftMenuRef = useRef<HTMLDivElement | null>(null);
  const rightMenuRef = useRef<HTMLDivElement | null>(null);
  const selectedModeLabel =
    WORKSPACE_DISPLAY_MODE_OPTIONS.find((option) => option.value === setting.mode)?.label ?? "Single Workspace";
  const leftWorkspaceName =
    workspaces.find((workspace) => workspace.id === setting.leftWorkspaceId)?.name ?? "Workspace";
  const rightWorkspaceName =
    workspaces.find((workspace) => workspace.id === setting.rightWorkspaceId)?.name ?? "Workspace";

  useEffect(() => {
    if (!modeMenuOpen && !leftMenuOpen && !rightMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !modeMenuRef.current?.contains(target) &&
        !leftMenuRef.current?.contains(target) &&
        !rightMenuRef.current?.contains(target)
      ) {
        setModeMenuOpen(false);
        setLeftMenuOpen(false);
        setRightMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [leftMenuOpen, modeMenuOpen, rightMenuOpen]);

  if (workspaces.length < 2) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ToolbarMenuFrame menuRef={modeMenuRef} label="Layout">
        <button
          type="button"
          onClick={() => {
            setModeMenuOpen((current) => !current);
            setLeftMenuOpen(false);
            setRightMenuOpen(false);
          }}
          aria-haspopup="menu"
          aria-expanded={modeMenuOpen}
          className="inline-flex h-7 max-w-[13rem] items-center rounded-lg px-2 text-[12px] font-medium text-[var(--ink-muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
        >
          <span className="truncate">{selectedModeLabel}</span>
        </button>
        {modeMenuOpen ? (
          <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 min-w-[13rem] rounded-2xl border border-[var(--line-soft)] bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
            <div className="space-y-1">
              {WORKSPACE_DISPLAY_MODE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange({ mode: option.value });
                    setModeMenuOpen(false);
                  }}
                  className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition ${
                    setting.mode === option.value
                      ? "bg-[var(--surface-subtle)] text-[var(--ink-strong)]"
                      : "text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
                  }`}
                >
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </ToolbarMenuFrame>
      {setting.mode === "two" ? (
        <>
          <ToolbarMenuFrame menuRef={leftMenuRef} label="Left">
            <button
              type="button"
              onClick={() => {
                setLeftMenuOpen((current) => !current);
                setModeMenuOpen(false);
                setRightMenuOpen(false);
              }}
              aria-haspopup="menu"
              aria-expanded={leftMenuOpen}
              className="inline-flex h-7 max-w-[10rem] items-center rounded-lg px-2 text-[12px] font-medium text-[var(--ink-muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
            >
              <span className="truncate">{leftWorkspaceName}</span>
            </button>
            {leftMenuOpen ? (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 min-w-[13rem] rounded-2xl border border-[var(--line-soft)] bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
                <div className="space-y-1">
                  {workspaces.map((workspace) => (
                    <button
                      key={workspace.id}
                      type="button"
                      onClick={() => {
                        onChange({ leftWorkspaceId: workspace.id });
                        setLeftMenuOpen(false);
                      }}
                      className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition ${
                        setting.leftWorkspaceId === workspace.id
                          ? "bg-[var(--surface-subtle)] text-[var(--ink-strong)]"
                          : "text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
                      }`}
                    >
                      {workspace.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </ToolbarMenuFrame>
          <ToolbarMenuFrame menuRef={rightMenuRef} label="Right">
            <button
              type="button"
              onClick={() => {
                setRightMenuOpen((current) => !current);
                setModeMenuOpen(false);
                setLeftMenuOpen(false);
              }}
              aria-haspopup="menu"
              aria-expanded={rightMenuOpen}
              className="inline-flex h-7 max-w-[10rem] items-center rounded-lg px-2 text-[12px] font-medium text-[var(--ink-muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
            >
              <span className="truncate">{rightWorkspaceName}</span>
            </button>
            {rightMenuOpen ? (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 min-w-[13rem] rounded-2xl border border-[var(--line-soft)] bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
                <div className="space-y-1">
                  {workspaces.map((workspace) => (
                    <button
                      key={workspace.id}
                      type="button"
                      onClick={() => {
                        onChange({ rightWorkspaceId: workspace.id });
                        setRightMenuOpen(false);
                      }}
                      className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition ${
                        setting.rightWorkspaceId === workspace.id
                          ? "bg-[var(--surface-subtle)] text-[var(--ink-strong)]"
                          : "text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
                      }`}
                    >
                      {workspace.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </ToolbarMenuFrame>
        </>
      ) : null}
    </div>
  );
}

function CollapseButton({
  collapsed,
  label,
  onClick,
  tooltipPlacement = "bottom",
}: {
  collapsed: boolean;
  label: string;
  onClick: () => void;
  tooltipPlacement?: "top" | "bottom";
}) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipSuppressed, setTooltipSuppressed] = useState(false);
  const tooltipLabel = `${collapsed ? "Expand" : "Collapse"} ${label}`;
  const tooltipPlacementClass =
    tooltipPlacement === "top" ? "bottom-full mb-2" : "top-full mt-2";
  const showTooltip = () => {
    if (!tooltipSuppressed) {
      setTooltipVisible(true);
    }
  };

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={() => {
        setTooltipVisible(false);
        setTooltipSuppressed(false);
      }}
      onFocus={showTooltip}
      onBlur={() => setTooltipVisible(false)}
    >
      <button
        type="button"
        onClick={(event) => {
          onClick();
          setTooltipVisible(false);
          setTooltipSuppressed(true);
          event.currentTarget.blur();
        }}
        aria-expanded={!collapsed}
        aria-label={tooltipLabel}
        className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl border border-[var(--line-soft)] bg-white text-[var(--ink-subtle)] shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
      >
        <svg
          viewBox="0 0 16 16"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        >
          {collapsed ? (
            <path d="m4.5 6.25 3.5 3.5 3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path d="m4.5 9.75 3.5-3.5 3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </svg>
      </button>
      <span
        className={`pointer-events-none absolute right-0 z-20 whitespace-nowrap rounded-lg border border-[var(--line-soft)] bg-[rgb(15,23,42)] px-2.5 py-1.5 text-[11px] font-medium text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] ${tooltipPlacementClass} ${
          tooltipVisible ? "block" : "hidden"
        }`}
      >
        {tooltipLabel}
      </span>
    </span>
  );
}

function DashboardTaskSubsection({
  title,
  countTone,
  count,
  eyebrow,
  eyebrowTone,
  borderClass,
  headerClass,
  collapsed,
  collapseLabel,
  onToggleCollapsed,
  items,
  rowKind,
  rowLayout = "table",
  emptyMessage,
  onEditTask,
  onCompleteTask,
  completingTaskId,
}: {
  title: string;
  countTone: "green" | "red" | "blue";
  count: number;
  eyebrow: string;
  eyebrowTone: string;
  borderClass: string;
  headerClass: string;
  collapsed: boolean;
  collapseLabel: string;
  onToggleCollapsed: () => void;
  items: TaskListItem[];
  rowKind: "horizontal" | "focus";
  rowLayout?: "table" | "compact";
  emptyMessage: string;
  onEditTask: (taskId: string) => void;
  onCompleteTask: (task: Pick<TaskListItem, "id" | "statusValue">) => void;
  completingTaskId: string | null;
}) {
  return (
    <section className={`overflow-hidden rounded-xl border bg-white ${borderClass}`}>
      <div className={`flex items-center justify-between border-b px-4 py-2 ${headerClass}`}>
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink-strong)]">
            {title}
          </h3>
          <CountPill tone={countTone}>{count}</CountPill>
        </div>
        <div className="flex items-center gap-3">
          <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${eyebrowTone}`}>
            {eyebrow}
          </p>
          <CollapseButton
            collapsed={collapsed}
            label={collapseLabel}
            onClick={onToggleCollapsed}
          />
        </div>
      </div>
      {!collapsed ? (
        items.length > 0 ? (
          rowLayout === "compact" ? (
            <div>
              {items.map((item) => (
                <DashboardCompactTaskRow
                  key={item.id}
                  {...item}
                  onEdit={onEditTask}
                  onComplete={onCompleteTask}
                  isCompleting={completingTaskId === item.id}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border-collapse">
                <TaskTableHeader />
                <tbody>
                  {items.map((item) =>
                    rowKind === "horizontal" ? (
                      <HorizontalListRow
                        key={item.id}
                        {...item}
                        onEdit={onEditTask}
                        onComplete={onCompleteTask}
                        isCompleting={completingTaskId === item.id}
                      />
                    ) : (
                      <FocusItem
                        key={item.id}
                        {...item}
                        onEdit={onEditTask}
                        onComplete={onCompleteTask}
                        isCompleting={completingTaskId === item.id}
                      />
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="px-4 py-6 text-sm text-[var(--ink-subtle)]">
            {emptyMessage}
          </div>
        )
      ) : null}
    </section>
  );
}

export function DashboardContent({
  visibleTaskCount,
  workspaces,
  filteredRecurringOverdueItems,
  filteredRecurringTodayItems,
  filteredOverdueItems,
  filteredTodayItems,
  filteredProjects,
  onEditTask,
  onCompleteTask,
  completingTaskId,
  onOpenProjects,
  onOpenProject,
}: {
  visibleTaskCount: number;
  workspaces: AppWorkspace[];
  filteredRecurringOverdueItems: TaskListItem[];
  filteredRecurringTodayItems: TaskListItem[];
  filteredOverdueItems: TaskListItem[];
  filteredTodayItems: TaskListItem[];
  filteredProjects: ProjectGroup[];
  onEditTask: (taskId: string) => void;
  onCompleteTask: (task: Pick<TaskListItem, "id" | "statusValue">) => void;
  completingTaskId: string | null;
  onOpenProjects: () => void;
  onOpenProject: (projectId: string) => void;
}) {
  const { isSectionCollapsed, toggleSection } = usePersistedCollapsedSections(
    "taskewr.dashboard.collapsedSections",
  );
  const [recurringWorkspaceSetting, setRecurringWorkspaceSetting] =
    useDashboardWorkspaceSetting("recurring", workspaces);
  const [focusWorkspaceSetting, setFocusWorkspaceSetting] =
    useDashboardWorkspaceSetting("focus", workspaces);
  const recurringCollapsed = isSectionCollapsed("recurring");
  const recurringOverdueCollapsed = isSectionCollapsed("recurring.overdue");
  const recurringTodayCollapsed = isSectionCollapsed("recurring.today");
  const focusCollapsed = isSectionCollapsed("focus");
  const focusOverdueCollapsed = isSectionCollapsed("focus.overdue");
  const focusTodayCollapsed = isSectionCollapsed("focus.today");
  const projectsCollapsed = isSectionCollapsed("projects");
  const allOverdueMetricItems = uniqueTaskItems([
    ...filteredRecurringOverdueItems,
    ...filteredOverdueItems,
  ]);
  const allTodayMetricItems = uniqueTaskItems([
    ...filteredRecurringTodayItems,
    ...filteredTodayItems,
  ]);
  const allVisibleMetricItems = uniqueTaskItems([
    ...filteredRecurringOverdueItems,
    ...filteredRecurringTodayItems,
    ...filteredOverdueItems,
    ...filteredTodayItems,
    ...filteredProjects.flatMap((project) => project.items),
  ]);
  const projectWorkspaceGroups = useMemo(() => {
    const groups = new Map<string, { workspaceId: string | null; workspaceName: string; projects: ProjectGroup[] }>();

    for (const project of filteredProjects) {
      const key = project.workspaceId ?? "none";
      const existing = groups.get(key) ?? {
        workspaceId: project.workspaceId,
        workspaceName: project.workspaceName,
        projects: [],
      };
      existing.projects.push(project);
      groups.set(key, existing);
    }

    const workspaceOrder = new Map(workspaces.map((workspace, index) => [workspace.id, index]));

    return [...groups.values()].sort((left, right) => {
      const leftOrder = left.workspaceId ? workspaceOrder.get(left.workspaceId) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
      const rightOrder = right.workspaceId ? workspaceOrder.get(right.workspaceId) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
      return leftOrder - rightOrder || left.workspaceName.localeCompare(right.workspaceName);
    });
  }, [filteredProjects, workspaces]);

  const renderTaskWindow = ({
    setting,
    overdueItems,
    todayItems,
    overdueCollapsed,
    todayCollapsed,
    overdueSectionId,
    todaySectionId,
    todayTone,
    todayBorderClass,
    todayHeaderClass,
    todayEyebrow,
    todayEyebrowTone,
    todayEmptyMessage,
  }: {
    setting: WorkspaceDisplaySetting;
    overdueItems: TaskListItem[];
    todayItems: TaskListItem[];
    overdueCollapsed: boolean;
    todayCollapsed: boolean;
    overdueSectionId: string;
    todaySectionId: string;
    todayTone: "green" | "blue";
    todayBorderClass: string;
    todayHeaderClass: string;
    todayEyebrow: string;
    todayEyebrowTone: string;
    todayEmptyMessage: string;
  }) => {
    const renderSections = (
      sectionOverdueItems: TaskListItem[],
      sectionTodayItems: TaskListItem[],
      rowLayout: "table" | "compact" = "table",
    ) => (
      <div className="space-y-5">
        {sectionOverdueItems.length > 0 ? (
          <DashboardTaskSubsection
            title="Overdue"
            countTone="red"
            count={sectionOverdueItems.length}
            eyebrow="Needs action now"
            eyebrowTone="text-[var(--accent-red)]"
            borderClass="border-[rgba(193,62,62,0.14)]"
            headerClass="border-[rgba(193,62,62,0.14)] bg-[rgba(193,62,62,0.04)]"
            collapsed={overdueCollapsed}
            collapseLabel="overdue"
            onToggleCollapsed={() => toggleSection(overdueSectionId)}
            items={sectionOverdueItems}
            rowKind="horizontal"
            rowLayout={rowLayout}
            emptyMessage=""
            onEditTask={onEditTask}
            onCompleteTask={onCompleteTask}
            completingTaskId={completingTaskId}
          />
        ) : null}

        <DashboardTaskSubsection
          title="Today and Unscheduled"
          countTone={todayTone}
          count={sectionTodayItems.length}
          eyebrow={todayEyebrow}
          eyebrowTone={todayEyebrowTone}
          borderClass={todayBorderClass}
          headerClass={todayHeaderClass}
          collapsed={todayCollapsed}
          collapseLabel="today and unscheduled"
          onToggleCollapsed={() => toggleSection(todaySectionId)}
          items={sectionTodayItems}
          rowKind="focus"
          rowLayout={rowLayout}
          emptyMessage={todayEmptyMessage}
          onEditTask={onEditTask}
          onCompleteTask={onCompleteTask}
          completingTaskId={completingTaskId}
        />
      </div>
    );

    if (setting.mode === "single") {
      return <div className="mt-4">{renderSections(overdueItems, todayItems)}</div>;
    }

    const columns = [
      {
        workspaceId: setting.leftWorkspaceId,
        workspaceName:
          workspaces.find((workspace) => workspace.id === setting.leftWorkspaceId)?.name ?? "Left",
      },
      {
        workspaceId: setting.rightWorkspaceId,
        workspaceName:
          workspaces.find((workspace) => workspace.id === setting.rightWorkspaceId)?.name ?? "Right",
      },
    ];

    return (
      <div className="mt-4 grid gap-5 xl:grid-cols-2">
        {columns.map((column) => {
          const columnOverdueItems = overdueItems.filter((item) => item.workspaceId === column.workspaceId);
          const columnTodayItems = todayItems.filter((item) => item.workspaceId === column.workspaceId);
          const columnCount = uniqueTaskItems([...columnOverdueItems, ...columnTodayItems]).length;

          return (
            <div key={column.workspaceId} className="space-y-5">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink-strong)]">
                  {column.workspaceName}
                </h3>
                <span className="text-xs text-[var(--ink-subtle)]">{columnCount} visible</span>
              </div>
              {renderSections(columnOverdueItems, columnTodayItems, "compact")}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <section className="grid gap-2 lg:grid-cols-3">
        <MetricCard
          label="Active tasks"
          value={String(visibleTaskCount)}
          tone="green"
          detail={formatWorkspaceSplit(allVisibleMetricItems, workspaces)}
        />
        <MetricCard
          label="Overdue"
          value={String(allOverdueMetricItems.length)}
          tone="red"
          detail={formatWorkspaceSplit(allOverdueMetricItems, workspaces)}
        />
        <MetricCard
          label="Due today"
          value={String(allTodayMetricItems.length)}
          tone="amber"
          detail={formatWorkspaceSplit(allTodayMetricItems, workspaces)}
        />
      </section>

      <section className="space-y-5">
        <article className="rounded-2xl border border-[rgba(37,99,235,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(246,249,255,1)_100%)] p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
          <header className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(37,99,235)]">
                Recurring tasks
              </p>
              <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em]">
                Scheduled work window
              </h2>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <WorkspaceDisplayControls
                setting={recurringWorkspaceSetting}
                workspaces={workspaces}
                onChange={setRecurringWorkspaceSetting}
              />
              <CollapseButton
                collapsed={recurringCollapsed}
                label="recurring tasks"
                onClick={() => toggleSection("recurring")}
              />
            </div>
          </header>
          {!recurringCollapsed ? (
            renderTaskWindow({
              setting: recurringWorkspaceSetting,
              overdueItems: filteredRecurringOverdueItems,
              todayItems: filteredRecurringTodayItems,
              overdueCollapsed: recurringOverdueCollapsed,
              todayCollapsed: recurringTodayCollapsed,
              overdueSectionId: "recurring.overdue",
              todaySectionId: "recurring.today",
              todayTone: "blue",
              todayBorderClass: "border-[rgba(37,99,235,0.12)]",
              todayHeaderClass: "border-[rgba(37,99,235,0.12)] bg-[rgba(37,99,235,0.04)]",
              todayEyebrow: "Scheduled focus",
              todayEyebrowTone: "text-[rgb(37,99,235)]",
              todayEmptyMessage: "No recurring tasks due today or unscheduled match the current filters.",
            })
          ) : null}
        </article>

        <article className="rounded-2xl border border-[rgba(34,122,89,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(248,252,250,1)_100%)] p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
          <header className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                Focus for today
              </p>
              <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em]">
                Current work window
              </h2>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <WorkspaceDisplayControls
                setting={focusWorkspaceSetting}
                workspaces={workspaces}
                onChange={setFocusWorkspaceSetting}
              />
              <CollapseButton
                collapsed={focusCollapsed}
                label="focus"
                onClick={() => toggleSection("focus")}
              />
            </div>
          </header>
          {!focusCollapsed ? (
            renderTaskWindow({
              setting: focusWorkspaceSetting,
              overdueItems: filteredOverdueItems,
              todayItems: filteredTodayItems,
              overdueCollapsed: focusOverdueCollapsed,
              todayCollapsed: focusTodayCollapsed,
              overdueSectionId: "focus.overdue",
              todaySectionId: "focus.today",
              todayTone: "green",
              todayBorderClass: "border-[rgba(34,122,89,0.12)]",
              todayHeaderClass: "border-[rgba(34,122,89,0.12)] bg-[rgba(34,122,89,0.04)]",
              todayEyebrow: "Active today",
              todayEyebrowTone: "text-[var(--accent-strong)]",
              todayEmptyMessage: "No tasks due today or unscheduled match the current filters.",
            })
          ) : null}
        </article>
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-subtle)]">
              By project
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em]">
              Active tasks grouped by project
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenProjects}
              className={actionButtonClassName("neutral")}
            >
              View all projects
            </button>
            <CollapseButton
              collapsed={projectsCollapsed}
              label="project groups"
              onClick={() => toggleSection("projects")}
              tooltipPlacement="top"
            />
          </div>
        </div>

        {!projectsCollapsed && projectWorkspaceGroups.length > 0 ? (
          <div className="space-y-5">
            {projectWorkspaceGroups.map((workspaceGroup) => (
              <div key={workspaceGroup.workspaceId ?? workspaceGroup.workspaceName} className="space-y-5">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink-strong)]">
                    {workspaceGroup.workspaceName}
                  </h3>
                  <span className="text-xs text-[var(--ink-subtle)]">
                    {workspaceGroup.projects.length} projects
                  </span>
                </div>
                {workspaceGroup.projects.map((project) => (
                  <ProjectSection
                    key={project.id}
                    {...project}
                    onEdit={onEditTask}
                    onComplete={onCompleteTask}
                    completingTaskId={completingTaskId}
                    onOpenProject={onOpenProject}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : !projectsCollapsed ? (
          <section className="rounded-2xl border border-[var(--line-soft)] bg-white px-5 py-8 text-sm text-[var(--ink-subtle)]">
            No project groups match the current filters.
          </section>
        ) : null}
      </section>
    </div>
  );
}

export function ProjectsContent({
  activeProjects,
  archivedProjects,
  visibleProjectTaskCount,
  showArchivedProjects,
  onToggleArchived,
  onEditProject,
  onMoveProject,
  onQuickArchive,
  onQuickUnarchive,
  projectReorderPendingId,
  onOpenProject,
}: {
  activeProjects: AppProject[];
  archivedProjects: AppProject[];
  visibleProjectTaskCount: number;
  showArchivedProjects: boolean;
  onToggleArchived: () => void;
  onEditProject: (projectId: string) => void;
  onMoveProject: (projectId: string, direction: "up" | "down") => void;
  onQuickArchive: (projectId: string) => void;
  onQuickUnarchive: (projectId: string) => void;
  projectReorderPendingId: string | null;
  onOpenProject: (projectId: string) => void;
}) {
  return (
    <div className="space-y-5">
      <section className="grid gap-4 lg:grid-cols-2">
        <MetricCard
          label="Active projects"
          value={String(activeProjects.length)}
          tone="green"
          detail={`${visibleProjectTaskCount} active tasks`}
        />
        <MetricCard
          label="Archived"
          value={String(archivedProjects.length)}
          tone="neutral"
          detail="Hidden from dashboard"
        />
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-subtle)]">
              Projects
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em]">
              Active projects
            </h2>
          </div>
          <p className="text-sm text-[var(--ink-subtle)]">
            Reorder, edit, or archive projects without leaving the list.
          </p>
        </div>

        {activeProjects.length > 0 ? (
          <div className="space-y-5">
            {activeProjects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                onEdit={onEditProject}
                onMove={onMoveProject}
                onArchive={onQuickArchive}
                onUnarchive={onQuickUnarchive}
                isReordering={projectReorderPendingId === project.id}
                onOpen={onOpenProject}
              />
            ))}
          </div>
        ) : (
          <section className="rounded-2xl border border-[var(--line-soft)] bg-white px-5 py-8 text-sm text-[var(--ink-subtle)]">
            No active projects yet. Create the first one to start organizing work.
          </section>
        )}
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-subtle)] px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-[var(--ink-strong)]">
              Archived projects
            </p>
            <p className="mt-1 text-sm text-[var(--ink-subtle)]">
              Hidden from the dashboard, but still available for reference.
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleArchived}
            className={actionButtonClassName("neutral")}
          >
            {showArchivedProjects ? "Hide archived" : "Show archived"}
          </button>
        </div>

        {showArchivedProjects ? (
          archivedProjects.length > 0 ? (
            <div className="space-y-5">
              {archivedProjects.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  onEdit={onEditProject}
                  onMove={onMoveProject}
                  onArchive={onQuickArchive}
                  onUnarchive={onQuickUnarchive}
                  isReordering={projectReorderPendingId === project.id}
                  onOpen={onOpenProject}
                />
              ))}
            </div>
          ) : (
            <section className="rounded-2xl border border-[var(--line-soft)] bg-white px-5 py-8 text-sm text-[var(--ink-subtle)]">
              No archived projects yet.
            </section>
          )
        ) : null}
      </section>
    </div>
  );
}

export function ProjectDetailContent({
  selectedProject,
  selectedProjectOverdueTasks,
  selectedProjectActiveTasks,
  selectedProjectCompletedTasks,
  projectView,
  projectBoardGroups,
  selectedProjectTasks,
  draggingProjectTaskId,
  onDragTaskStart,
  onDragTaskEnd,
  onEditTask,
  onCompleteTask,
  completingTaskId,
  onMoveTask,
  onEditProject,
  onBackToProjects,
}: {
  selectedProject: AppProject;
  selectedProjectOverdueTasks: TaskListItem[];
  selectedProjectActiveTasks: TaskListItem[];
  selectedProjectCompletedTasks: TaskListItem[];
  projectView: ProjectView;
  projectBoardGroups: {
    todo: TaskListItem[];
    inProgress: TaskListItem[];
    completed: TaskListItem[];
  };
  selectedProjectTasks: TaskListItem[];
  draggingProjectTaskId: string | null;
  onDragTaskStart: (taskId: string) => void;
  onDragTaskEnd: () => void;
  onEditTask: (taskId: string) => void;
  onCompleteTask: (task: Pick<TaskListItem, "id" | "statusValue">) => void;
  completingTaskId: string | null;
  onMoveTask: (taskId: string, nextStatus: TaskStatus) => void;
  onEditProject: () => void;
  onBackToProjects: () => void;
}) {
  const { isSectionCollapsed, toggleSection } = usePersistedCollapsedSections(
    `taskewr.project.${selectedProject.id}.collapsedSections`,
  );
  const projectOverdueCollapsed = isSectionCollapsed("overdue");
  const projectActiveCollapsed = isSectionCollapsed("active");
  const projectCompletedCollapsed = isSectionCollapsed("completed");

  return (
    <section className="rounded-2xl border border-[var(--line-soft)] bg-white px-5 py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
            Project
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-strong)]">
            {selectedProject.name}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ink-muted)]">
            {selectedProject.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <IconActionButton label="Edit project" onClick={onEditProject}>
            <EditIcon />
          </IconActionButton>
          <IconActionButton label="Back to projects" tone="accent" onClick={onBackToProjects}>
            <BackIcon />
          </IconActionButton>
        </div>
      </div>

      <div className="mt-5">
        <div className="space-y-5">
          {selectedProjectOverdueTasks.length > 0 ? (
            <section className="overflow-hidden rounded-xl border border-[rgba(193,62,62,0.14)] bg-white">
              <div className="flex items-center justify-between border-b border-[rgba(193,62,62,0.14)] bg-[rgba(193,62,62,0.04)] px-4 py-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink-strong)]">
                    Overdue
                  </h3>
                  <CountPill tone="red">{selectedProjectOverdueTasks.length}</CountPill>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-red)]">
                    Needs action now
                  </p>
                  <CollapseButton
                    collapsed={projectOverdueCollapsed}
                    label="overdue"
                    onClick={() => toggleSection("overdue")}
                  />
                </div>
              </div>
              {!projectOverdueCollapsed ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto border-collapse">
                    <TaskTableHeader showProject={false} />
                    <tbody>
                      {selectedProjectOverdueTasks.map((item) => (
                        <HorizontalListRow
                          key={item.id}
                          {...item}
                          onEdit={onEditTask}
                          onComplete={onCompleteTask}
                          isCompleting={completingTaskId === item.id}
                          showProject={false}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>
          ) : null}

          {projectView === "board" ? (
            <div className="grid gap-5 xl:grid-cols-3">
              <ProjectBoardLane
                title="Todo"
                laneStatus="todo"
                items={projectBoardGroups.todo}
                onEdit={onEditTask}
                onComplete={onCompleteTask}
                completingTaskId={completingTaskId}
                onMoveTask={onMoveTask}
                draggingTaskId={draggingProjectTaskId}
                onDragTaskStart={onDragTaskStart}
                onDragTaskEnd={onDragTaskEnd}
              />
              <ProjectBoardLane
                title="In progress"
                laneStatus="in_progress"
                items={projectBoardGroups.inProgress}
                onEdit={onEditTask}
                onComplete={onCompleteTask}
                completingTaskId={completingTaskId}
                onMoveTask={onMoveTask}
                draggingTaskId={draggingProjectTaskId}
                onDragTaskStart={onDragTaskStart}
                onDragTaskEnd={onDragTaskEnd}
              />
              <ProjectBoardLane
                title="Completed"
                laneStatus="done"
                items={projectBoardGroups.completed}
                onEdit={onEditTask}
                onComplete={onCompleteTask}
                completingTaskId={completingTaskId}
                onMoveTask={onMoveTask}
                draggingTaskId={draggingProjectTaskId}
                onDragTaskStart={onDragTaskStart}
                onDragTaskEnd={onDragTaskEnd}
              />
            </div>
          ) : (
            <>
              {selectedProjectActiveTasks.length > 0 ? (
                <section className="overflow-hidden rounded-xl border border-[var(--line-soft)] bg-white">
                  <div className="flex items-center justify-between border-b border-[var(--line-soft)] bg-[var(--surface-subtle)]/60 px-4 py-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink-strong)]">
                        Active
                      </h3>
                      <CountPill tone="green">{selectedProjectActiveTasks.length}</CountPill>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                        Current work
                      </p>
                      <CollapseButton
                        collapsed={projectActiveCollapsed}
                        label="active"
                        onClick={() => toggleSection("active")}
                      />
                    </div>
                  </div>
                  {!projectActiveCollapsed ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full table-auto border-collapse">
                        <TaskTableHeader showProject={false} />
                        <tbody>
                          {selectedProjectActiveTasks.map((item) => (
                            <HorizontalListRow
                              key={item.id}
                              {...item}
                              onEdit={onEditTask}
                              onComplete={onCompleteTask}
                              isCompleting={completingTaskId === item.id}
                              showProject={false}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </section>
              ) : null}

              {selectedProjectCompletedTasks.length > 0 ? (
                <section className="overflow-hidden rounded-xl border border-[var(--line-soft)] bg-white">
                  <div className="flex items-center justify-between border-b border-[var(--line-soft)] bg-[var(--surface-subtle)]/60 px-4 py-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink-strong)]">
                        Completed
                      </h3>
                      <CountPill tone="green">{selectedProjectCompletedTasks.length}</CountPill>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                        Finished work
                      </p>
                      <CollapseButton
                        collapsed={projectCompletedCollapsed}
                        label="completed"
                        onClick={() => toggleSection("completed")}
                      />
                    </div>
                  </div>
                  {!projectCompletedCollapsed ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full table-auto border-collapse">
                        <TaskTableHeader showProject={false} />
                        <tbody>
                          {selectedProjectCompletedTasks.map((item) => (
                            <HorizontalListRow
                              key={item.id}
                              {...item}
                              onEdit={onEditTask}
                              onComplete={onCompleteTask}
                              isCompleting={completingTaskId === item.id}
                              showProject={false}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </section>
              ) : null}

              {selectedProjectTasks.length === 0 ? (
                <section className="rounded-xl border border-[var(--line-soft)] bg-white px-4 py-6 text-sm text-[var(--ink-subtle)]">
                  No tasks match the current view and filters for this project.
                </section>
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
