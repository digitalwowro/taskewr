"use client";

import type { ReactNode, RefObject } from "react";
import type { TaskSortDirection } from "@/domain/tasks/constants";
import { CountPill, FilterChip } from "@/components/app/ui";

type LabeledOption<T extends string> = {
  value: T;
  label: string;
};

type SharedTaskToolbarProps<TSort extends string, TStatus extends string, TPriority extends string> = {
  sortMenuRef: RefObject<HTMLDivElement | null>;
  statusMenuRef: RefObject<HTMLDivElement | null>;
  priorityMenuRef: RefObject<HTMLDivElement | null>;
  dateMenuRef: RefObject<HTMLDivElement | null>;
  sortMenuOpen: boolean;
  statusMenuOpen: boolean;
  priorityMenuOpen: boolean;
  dateMenuOpen: boolean;
  sortLabel: string;
  direction: TaskSortDirection;
  sortOptions: LabeledOption<TSort>[];
  selectedSort: TSort;
  statusSummary: string;
  prioritySummary: string;
  selectedStatuses: TStatus[];
  selectedPriorities: TPriority[];
  statusOptions: LabeledOption<TStatus>[];
  priorityOptions: LabeledOption<TPriority>[];
  onToggleSortMenu: () => void;
  onToggleStatusMenu: () => void;
  onTogglePriorityMenu: () => void;
  onToggleDateMenu: () => void;
  onSelectSort: (value: TSort) => void;
  onSelectDirection: (value: TaskSortDirection) => void;
  onResetStatuses: () => void;
  onToggleStatus: (value: TStatus) => void;
  onResetPriorities: () => void;
  onTogglePriority: (value: TPriority) => void;
  startDate: string | null;
  endDate: string | null;
  onSetStartDate: (value: string | null) => void;
  onSetEndDate: (value: string | null) => void;
  onReset: () => void;
};

export function ToolbarShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-end gap-2 rounded-lg border border-[var(--line-soft)] bg-white px-4 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.03)] ${className}`.trim()}
    >
      {children}
    </div>
  );
}

export function ToolbarMenuFrame({
  menuRef,
  label,
  children,
}: {
  menuRef: RefObject<HTMLDivElement | null>;
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      ref={menuRef}
      className="relative flex items-center gap-2 rounded-lg border border-[var(--line-soft)] bg-white px-2.5 py-1 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
    >
      <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
        {label}
      </span>
      <div className="h-3.5 w-px bg-[var(--line-soft)]" />
      {children}
    </div>
  );
}

export function ToolbarSortMenu<T extends string>({
  menuRef,
  isOpen,
  label,
  direction,
  options,
  selectedValue,
  onToggle,
  onSelectValue,
  onSelectDirection,
}: {
  menuRef: RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  label: string;
  direction: TaskSortDirection;
  options: LabeledOption<T>[];
  selectedValue: T;
  onToggle: () => void;
  onSelectValue: (value: T) => void;
  onSelectDirection: (value: TaskSortDirection) => void;
}) {
  const directionSymbol = direction === "desc" ? "\u2193" : "\u2191";

  return (
    <ToolbarMenuFrame menuRef={menuRef} label="Sort">
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="inline-flex h-7 items-center rounded-lg px-2 text-[12px] font-medium text-[var(--ink-muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
      >
        {label}
      </button>
      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 min-w-[14rem] rounded-lg border border-[var(--line-soft)] bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
          <div className="space-y-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onSelectValue(option.value)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                  selectedValue === option.value
                    ? "bg-[var(--surface-subtle)] text-[var(--ink-strong)]"
                    : "text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
                }`}
              >
                <span>{option.label}</span>
                {selectedValue === option.value ? (
                  <span className="text-[var(--accent-strong)]">{directionSymbol}</span>
                ) : null}
              </button>
            ))}
          </div>
          <div className="mt-2 border-t border-[var(--line-soft)] pt-2">
            {[
              { value: "desc", label: "Descending" },
              { value: "asc", label: "Ascending" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onSelectDirection(option.value as TaskSortDirection)}
                className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition ${
                  direction === option.value
                    ? "bg-[var(--surface-subtle)] text-[var(--ink-strong)]"
                    : "text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </ToolbarMenuFrame>
  );
}

export function ToolbarMultiSelectMenu<T extends string>({
  menuRef,
  label,
  summary,
  count,
  isOpen,
  options,
  selectedValues,
  onToggle,
  onReset,
  onToggleValue,
}: {
  menuRef: RefObject<HTMLDivElement | null>;
  label: string;
  summary: string;
  count: number;
  isOpen: boolean;
  options: LabeledOption<T>[];
  selectedValues: T[];
  onToggle: () => void;
  onReset: () => void;
  onToggleValue: (value: T) => void;
}) {
  return (
    <ToolbarMenuFrame menuRef={menuRef} label={label}>
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="inline-flex h-7 max-w-[14rem] items-center gap-1.5 rounded-lg pl-2 pr-1.5 text-[12px] font-medium text-[var(--ink-muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
      >
        <span className="truncate">{summary}</span>
        {count > 0 ? <CountPill tone="green">{count}</CountPill> : null}
      </button>
      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 min-w-[19rem] rounded-lg border border-[var(--line-soft)] bg-white p-3 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
          <div className="flex flex-wrap gap-2">
            <FilterChip active={selectedValues.length === 0} onClick={onReset}>
              {label === "Status" ? "All statuses" : "All priorities"}
            </FilterChip>
            {options.map((option) => (
              <FilterChip
                key={option.value}
                active={selectedValues.includes(option.value)}
                onClick={() => onToggleValue(option.value)}
              >
                {option.label}
              </FilterChip>
            ))}
          </div>
        </div>
      ) : null}
    </ToolbarMenuFrame>
  );
}

export function ToolbarDateMenu({
  menuRef,
  isOpen,
  startDate,
  endDate,
  onToggle,
  onSetStartDate,
  onSetEndDate,
}: {
  menuRef: RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  startDate: string | null;
  endDate: string | null;
  onToggle: () => void;
  onSetStartDate: (value: string | null) => void;
  onSetEndDate: (value: string | null) => void;
}) {
  const summary = startDate || endDate ? `${startDate ?? "Any"} → ${endDate ?? "Any"}` : "Any date";

  return (
    <ToolbarMenuFrame menuRef={menuRef} label="Date">
      <button
        type="button"
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="inline-flex h-7 max-w-[14rem] items-center rounded-lg px-2 text-[12px] font-medium text-[var(--ink-muted)] transition hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
      >
        <span className="truncate">{summary}</span>
      </button>
      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 min-w-[18rem] rounded-lg border border-[var(--line-soft)] bg-white p-3 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
          <div className="grid gap-3">
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-subtle)]">
                Starting date
              </label>
              <input
                type="date"
                value={startDate ?? ""}
                onChange={(event) => onSetStartDate(event.target.value || null)}
                className="h-9 w-full rounded-lg border border-[var(--line-strong)] bg-white px-3 text-[13px] text-[var(--ink-strong)] outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-subtle)]">
                Ending date
              </label>
              <input
                type="date"
                value={endDate ?? ""}
                onChange={(event) => onSetEndDate(event.target.value || null)}
                className="h-9 w-full rounded-lg border border-[var(--line-strong)] bg-white px-3 text-[13px] text-[var(--ink-strong)] outline-none"
              />
            </div>
          </div>
        </div>
      ) : null}
    </ToolbarMenuFrame>
  );
}

export function ToolbarViewToggle({
  value,
  onChange,
}: {
  value: "list" | "board";
  onChange: (value: "list" | "board") => void;
}) {
  return (
    <ToolbarMenuFrame menuRef={{ current: null }} label="View">
      <div className="flex flex-wrap items-center gap-1">
        <FilterChip active={value === "list"} compact onClick={() => onChange("list")}>
          List
        </FilterChip>
        <FilterChip active={value === "board"} compact onClick={() => onChange("board")}>
          Board
        </FilterChip>
      </div>
    </ToolbarMenuFrame>
  );
}

export function ToolbarResetButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-[34px] items-center rounded-lg border border-[var(--line-soft)] bg-[var(--surface-subtle)] px-2.5 text-[12px] font-medium text-[var(--ink-subtle)] shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition hover:bg-[var(--surface-card)] hover:text-[var(--ink-strong)]"
    >
      Reset
    </button>
  );
}

export function DashboardTaskToolbar<TSort extends string, TStatus extends string, TPriority extends string>({
  sortMenuRef,
  statusMenuRef,
  priorityMenuRef,
  dateMenuRef,
  sortMenuOpen,
  statusMenuOpen,
  priorityMenuOpen,
  dateMenuOpen,
  sortLabel,
  direction,
  sortOptions,
  selectedSort,
  statusSummary,
  prioritySummary,
  selectedStatuses,
  selectedPriorities,
  statusOptions,
  priorityOptions,
  onToggleSortMenu,
  onToggleStatusMenu,
  onTogglePriorityMenu,
  onToggleDateMenu,
  onSelectSort,
  onSelectDirection,
  onResetStatuses,
  onToggleStatus,
  onResetPriorities,
  onTogglePriority,
  startDate,
  endDate,
  onSetStartDate,
  onSetEndDate,
  onReset,
}: SharedTaskToolbarProps<TSort, TStatus, TPriority>) {
  return (
    <ToolbarShell>
      <ToolbarSortMenu
        menuRef={sortMenuRef}
        isOpen={sortMenuOpen}
        label={sortLabel}
        direction={direction}
        options={sortOptions}
        selectedValue={selectedSort}
        onToggle={onToggleSortMenu}
        onSelectValue={onSelectSort}
        onSelectDirection={onSelectDirection}
      />
      <ToolbarMultiSelectMenu
        menuRef={statusMenuRef}
        label="Status"
        summary={statusSummary}
        count={selectedStatuses.length}
        isOpen={statusMenuOpen}
        options={statusOptions}
        selectedValues={selectedStatuses}
        onToggle={onToggleStatusMenu}
        onReset={onResetStatuses}
        onToggleValue={onToggleStatus}
      />
      <ToolbarMultiSelectMenu
        menuRef={priorityMenuRef}
        label="Priority"
        summary={prioritySummary}
        count={selectedPriorities.length}
        isOpen={priorityMenuOpen}
        options={priorityOptions}
        selectedValues={selectedPriorities}
        onToggle={onTogglePriorityMenu}
        onReset={onResetPriorities}
        onToggleValue={onTogglePriority}
      />
      <ToolbarDateMenu
        menuRef={dateMenuRef}
        isOpen={dateMenuOpen}
        startDate={startDate}
        endDate={endDate}
        onToggle={onToggleDateMenu}
        onSetStartDate={onSetStartDate}
        onSetEndDate={onSetEndDate}
      />
      <ToolbarResetButton onClick={onReset} />
    </ToolbarShell>
  );
}

export function ProjectTaskToolbar<TSort extends string, TStatus extends string, TPriority extends string>({
  view,
  onChangeView,
  ...rest
}: {
  view: "list" | "board";
  onChangeView: (value: "list" | "board") => void;
} & SharedTaskToolbarProps<TSort, TStatus, TPriority>) {
  return (
    <ToolbarShell className="justify-end">
      <ToolbarViewToggle value={view} onChange={onChangeView} />
      <ToolbarSortMenu
        menuRef={rest.sortMenuRef}
        isOpen={rest.sortMenuOpen}
        label={rest.sortLabel}
        direction={rest.direction}
        options={rest.sortOptions}
        selectedValue={rest.selectedSort}
        onToggle={rest.onToggleSortMenu}
        onSelectValue={rest.onSelectSort}
        onSelectDirection={rest.onSelectDirection}
      />
      <ToolbarMultiSelectMenu
        menuRef={rest.statusMenuRef}
        label="Status"
        summary={rest.statusSummary}
        count={rest.selectedStatuses.length}
        isOpen={rest.statusMenuOpen}
        options={rest.statusOptions}
        selectedValues={rest.selectedStatuses}
        onToggle={rest.onToggleStatusMenu}
        onReset={rest.onResetStatuses}
        onToggleValue={rest.onToggleStatus}
      />
      <ToolbarMultiSelectMenu
        menuRef={rest.priorityMenuRef}
        label="Priority"
        summary={rest.prioritySummary}
        count={rest.selectedPriorities.length}
        isOpen={rest.priorityMenuOpen}
        options={rest.priorityOptions}
        selectedValues={rest.selectedPriorities}
        onToggle={rest.onTogglePriorityMenu}
        onReset={rest.onResetPriorities}
        onToggleValue={rest.onTogglePriority}
      />
      <ToolbarDateMenu
        menuRef={rest.dateMenuRef}
        isOpen={rest.dateMenuOpen}
        startDate={rest.startDate}
        endDate={rest.endDate}
        onToggle={rest.onToggleDateMenu}
        onSetStartDate={rest.onSetStartDate}
        onSetEndDate={rest.onSetEndDate}
      />
      <ToolbarResetButton onClick={rest.onReset} />
    </ToolbarShell>
  );
}
