"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import type { AppProject } from "@/app/app-data";
import type { TaskStatus } from "@/domain/tasks/constants";
import type { TaskListItem } from "@/domain/tasks/types";

// Shared UI primitives follow docs/design-system.md.
const DROPDOWN_PANEL_MAX_HEIGHT = 448;
const DROPDOWN_PANEL_MIN_HEIGHT = 176;
const DROPDOWN_PANEL_BOTTOM_GUTTER = 96;

export const searchableSelectPanelClassName =
  "absolute left-0 right-0 top-full z-50 mt-2 overflow-auto rounded-lg border border-[var(--line-strong)] bg-white p-1 shadow-[0_18px_40px_rgba(15,23,42,0.18)]";

export type SearchableSelectOption = {
  value: string;
  label: string;
  searchText?: string;
  meta?: string;
  disabled?: boolean;
};

export function useDropdownPanelMaxHeight(
  isOpen: boolean,
  anchorRef: RefObject<HTMLElement | null>,
) {
  const [maxHeight, setMaxHeight] = useState(DROPDOWN_PANEL_MAX_HEIGHT);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const updateMaxHeight = () => {
      const anchor = anchorRef.current;

      if (!anchor) {
        return;
      }

      const anchorRect = anchor.getBoundingClientRect();
      const dialog = anchor.closest('[role="dialog"]') as HTMLElement | null;
      const boundaryBottom = dialog?.getBoundingClientRect().bottom ?? window.innerHeight;
      const availableBelow = boundaryBottom - anchorRect.bottom - DROPDOWN_PANEL_BOTTOM_GUTTER;
      const nextMaxHeight = Math.round(
        Math.min(
          DROPDOWN_PANEL_MAX_HEIGHT,
          Math.max(DROPDOWN_PANEL_MIN_HEIGHT, availableBelow),
        ),
      );

      setMaxHeight(nextMaxHeight);
    };

    updateMaxHeight();

    const dialog = anchorRef.current?.closest('[role="dialog"]');

    window.addEventListener("resize", updateMaxHeight);
    dialog?.addEventListener("scroll", updateMaxHeight, { passive: true });

    return () => {
      window.removeEventListener("resize", updateMaxHeight);
      dialog?.removeEventListener("scroll", updateMaxHeight);
    };
  }, [anchorRef, isOpen]);

  return maxHeight;
}

function SearchableSelectChevron() {
  return (
    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--ink-muted)]">
      <svg
        viewBox="0 0 16 16"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <path d="m4.5 6.5 3.5 3.5 3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function findNextEnabledOption(
  options: SearchableSelectOption[],
  currentIndex: number,
  direction: 1 | -1,
) {
  if (options.length === 0) {
    return -1;
  }

  for (let offset = 1; offset <= options.length; offset += 1) {
    const nextIndex = (currentIndex + offset * direction + options.length) % options.length;

    if (!options[nextIndex]?.disabled) {
      return nextIndex;
    }
  }

  return -1;
}

export function SearchableSelect({
  value,
  options,
  onChange,
  placeholder = "Select",
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  ariaInvalid,
  renderOption,
  emptyMessage = "No matching options.",
  className = "",
  inputClassName = "",
}: {
  value: string;
  options: SearchableSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel: string;
  ariaDescribedBy?: string;
  ariaInvalid?: boolean;
  renderOption?: (
    option: SearchableSelectOption,
    state: { selected: boolean; active: boolean },
  ) => ReactNode;
  emptyMessage?: string;
  className?: string;
  inputClassName?: string;
}) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [hasEditedSearch, setHasEditedSearch] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const selectedOption = options.find((option) => option.value === value);
  const selectedLabel = selectedOption?.label ?? "";
  const query = hasEditedSearch ? searchValue.trim().toLowerCase() : "";
  const panelMaxHeight = useDropdownPanelMaxHeight(open, rootRef);
  const filteredOptions = useMemo(() => {
    if (!query) {
      return options;
    }

    return options.filter((option) => {
      const searchableValue = [
        option.label,
        option.meta,
        option.searchText,
        option.value,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableValue.includes(query);
    });
  }, [options, query]);
  const selectedFilteredIndex = filteredOptions.findIndex(
    (option) => option.value === value && !option.disabled,
  );
  const fallbackFilteredIndex = filteredOptions.findIndex((option) => !option.disabled);
  const effectiveActiveIndex =
    open &&
    activeIndex >= 0 &&
    activeIndex < filteredOptions.length &&
    !filteredOptions[activeIndex]?.disabled
      ? activeIndex
      : selectedFilteredIndex >= 0
        ? selectedFilteredIndex
        : fallbackFilteredIndex;

  const openDropdown = () => {
    if (disabled) {
      return;
    }

    setSearchValue(selectedLabel);
    setHasEditedSearch(false);
    setActiveIndex(-1);
    setOpen(true);

    window.requestAnimationFrame(() => {
      inputRef.current?.select();
    });
  };

  const closeDropdown = () => {
    setOpen(false);
    setSearchValue("");
    setHasEditedSearch(false);
    setActiveIndex(-1);
  };

  const selectOption = (option: SearchableSelectOption | undefined) => {
    if (!option || option.disabled) {
      return;
    }

    onChange(option.value);
    closeDropdown();
    inputRef.current?.blur();
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDropdown();
      inputRef.current?.blur();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (!open) {
        openDropdown();
        return;
      }

      setActiveIndex((currentIndex) =>
        findNextEnabledOption(
          filteredOptions,
          currentIndex >= 0 ? currentIndex : effectiveActiveIndex,
          1,
        ),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (!open) {
        openDropdown();
        return;
      }

      setActiveIndex((currentIndex) =>
        findNextEnabledOption(
          filteredOptions,
          currentIndex >= 0 ? currentIndex : effectiveActiveIndex,
          -1,
        ),
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (!open) {
        openDropdown();
        return;
      }

      selectOption(filteredOptions[effectiveActiveIndex]);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="search"
        value={open ? searchValue : selectedLabel}
        onFocus={openDropdown}
        onChange={(event) => {
          setSearchValue(event.target.value);
          setHasEditedSearch(true);
          setActiveIndex(-1);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-options`}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        autoComplete="off"
        className={`h-8 w-full rounded-lg border border-transparent bg-transparent px-2 pr-8 text-sm text-[var(--ink-strong)] outline-none transition placeholder:text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] focus:border-[var(--line-strong)] focus:bg-white disabled:cursor-not-allowed disabled:text-[var(--ink-subtle)] ${inputClassName}`}
      />
      <SearchableSelectChevron />
      {open && !disabled ? (
        <div
          id={`${id}-options`}
          role="listbox"
          className={searchableSelectPanelClassName}
          style={{ maxHeight: panelMaxHeight }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => {
              const selected = option.value === value;
              const active = index === effectiveActiveIndex;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={option.disabled}
                  onMouseEnter={() => {
                    if (!option.disabled) {
                      setActiveIndex(index);
                    }
                  }}
                  onClick={() => selectOption(option)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-[13px] transition disabled:cursor-not-allowed disabled:text-[var(--ink-subtle)] ${
                    selected || active
                      ? "bg-[var(--surface-subtle)] text-[var(--accent-strong)]"
                      : "text-[var(--ink-strong)] hover:bg-[var(--surface-subtle)]"
                  }`}
                >
                  {renderOption ? (
                    renderOption(option, { selected, active })
                  ) : (
                    <>
                      <span className="min-w-0 truncate">{option.label}</span>
                      {option.meta ? (
                        <span className="shrink-0 text-xs text-[var(--ink-subtle)]">
                          {option.meta}
                        </span>
                      ) : null}
                    </>
                  )}
                </button>
              );
            })
          ) : (
            <p className="px-3 py-2 text-[13px] text-[var(--ink-subtle)]">
              {emptyMessage}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function StatusPill({
  tone,
  compact = false,
  children,
}: {
  tone:
    | "neutral"
    | "green"
    | "amber"
    | "red"
    | "blue"
    | "black"
    | "priorityGray"
    | "priorityBlue"
    | "priorityOrange"
    | "priorityRed";
  compact?: boolean;
  children: ReactNode;
}) {
  const tones = {
    neutral:
      "border-[var(--line-strong)] bg-[var(--surface-subtle)] text-[var(--ink-muted)]",
    green:
      "border-[rgba(34,122,89,0.18)] bg-[rgba(34,122,89,0.08)] text-[var(--accent-strong)]",
    amber:
      "border-[rgba(199,138,20,0.18)] bg-[rgba(199,138,20,0.08)] text-[var(--accent-amber)]",
    red: "border-[rgba(193,62,62,0.18)] bg-[rgba(193,62,62,0.08)] text-[var(--accent-red)]",
    blue: "border-[rgba(37,99,235,0.18)] bg-[rgba(37,99,235,0.08)] text-[rgb(37,99,235)]",
    black:
      "border-[rgba(15,23,42,0.28)] bg-[rgba(15,23,42,0.12)] text-[rgb(15,23,42)]",
    priorityGray:
      "border-[rgba(100,116,139,0.2)] bg-[rgba(100,116,139,0.08)] text-[rgb(71,85,105)]",
    priorityBlue:
      "border-[rgba(59,130,246,0.2)] bg-[rgba(59,130,246,0.1)] text-[rgb(30,64,175)]",
    priorityOrange:
      "border-[rgba(234,88,12,0.2)] bg-[rgba(234,88,12,0.09)] text-[rgb(194,65,12)]",
    priorityRed:
      "border-[rgba(220,38,38,0.2)] bg-[rgba(220,38,38,0.09)] text-[rgb(185,28,28)]",
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg border text-center font-medium leading-none whitespace-nowrap ${compact ? "h-6 px-2 text-[10px]" : "h-7 px-2.5 text-xs"} ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function ModalHeaderKicker({
  code,
  label,
  tone = "neutral",
  children,
}: {
  code: ReactNode;
  label?: ReactNode;
  tone?: "neutral" | "danger";
  children?: ReactNode;
}) {
  const codeTone =
    tone === "danger"
      ? "bg-[rgba(193,62,62,0.06)] text-[var(--accent-red)]"
      : "bg-[var(--surface-subtle)] text-[var(--ink-subtle)]";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span
        className={`inline-flex h-7 items-center justify-center rounded-lg px-3 font-mono text-xs uppercase leading-none tracking-[0.14em] ${codeTone}`}
      >
        {code}
      </span>
      {label ? (
        <span className="text-xs font-semibold uppercase leading-none tracking-[0.2em] text-[var(--accent-strong)]">
          {label}
        </span>
      ) : null}
      {children}
    </div>
  );
}

export type ActionButtonTone = "neutral" | "accent" | "blue" | "danger";

const actionButtonToneClasses: Record<ActionButtonTone, string> = {
  neutral:
    "border-[var(--line-soft)] bg-white text-[var(--ink-muted)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]",
  accent:
    "border-[rgba(34,122,89,0.16)] bg-[rgba(34,122,89,0.08)] text-[var(--accent-strong)] hover:bg-[rgba(34,122,89,0.12)]",
  blue:
    "border-[rgba(37,99,235,0.16)] bg-[rgba(37,99,235,0.08)] text-[rgb(37,99,235)] hover:bg-[rgba(37,99,235,0.12)]",
  danger:
    "border-[rgba(193,62,62,0.14)] bg-[rgba(193,62,62,0.04)] text-[var(--accent-red)] hover:bg-[rgba(193,62,62,0.08)]",
};

export function actionButtonClassName(tone: ActionButtonTone = "neutral") {
  return `inline-flex h-8 items-center rounded-lg border px-2.5 text-[13px] font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${actionButtonToneClasses[tone]}`;
}

function IconActionButton({
  label,
  tooltipAlign = "center",
  tooltipSide = "top",
  tone = "neutral",
  disabled,
  onClick,
  children,
}: {
  label: string;
  tooltipAlign?: "center" | "right";
  tooltipSide?: "top" | "bottom";
  tone?: ActionButtonTone;
  disabled?: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
}) {
  const verticalClass = tooltipSide === "bottom" ? "top-full mt-2" : "bottom-full mb-2";
  const horizontalClass = tooltipAlign === "right" ? "right-0" : "left-1/2 -translate-x-1/2";

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        title={label}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-60 ${actionButtonToneClasses[tone]}`}
      >
        {children}
      </button>
      <span
        className={`pointer-events-none absolute z-20 hidden whitespace-nowrap rounded-lg border border-[var(--line-soft)] bg-[rgb(15,23,42)] px-2.5 py-1.5 text-xs font-medium text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] group-hover:block group-focus-within:block ${verticalClass} ${horizontalClass}`}
      >
        {label}
      </span>
    </span>
  );
}

export function IconTooltip({
  label,
  tooltipAlign = "center",
  tooltipSide = "top",
  children,
}: {
  label: string;
  tooltipAlign?: "center" | "left" | "right";
  tooltipSide?: "top" | "bottom";
  children: ReactNode;
}) {
  const verticalClass = tooltipSide === "bottom" ? "top-full mt-2" : "bottom-full mb-2";
  const horizontalClass =
    tooltipAlign === "right"
      ? "right-0"
      : tooltipAlign === "left"
        ? "left-0"
        : "left-1/2 -translate-x-1/2";

  return (
    <span className="group relative inline-flex">
      {children}
      <span
        className={`pointer-events-none absolute z-30 hidden whitespace-nowrap rounded-lg border border-[var(--line-soft)] bg-[rgb(15,23,42)] px-2.5 py-1.5 text-xs font-medium text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] group-hover:block group-focus-within:block ${verticalClass} ${horizontalClass}`}
      >
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

function OpenIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M6.25 4.25H4.2a1.45 1.45 0 0 0-1.45 1.45v6.1a1.45 1.45 0 0 0 1.45 1.45h6.1a1.45 1.45 0 0 0 1.45-1.45V9.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 2.75h4.75V7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m7.25 8.75 5.8-5.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 3.5v9M3.5 8h9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RestoreIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12.5 5.25A5 5 0 0 0 3.7 4.1L2.5 5.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 2.6v2.65h2.65" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 10.75a5 5 0 0 0 8.8 1.15l1.2-1.15" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.5 13.4v-2.65h-2.65" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3 5.75h10" strokeLinecap="round" />
      <path d="M4.25 5.75v6.1A1.4 1.4 0 0 0 5.65 13.25h4.7a1.4 1.4 0 0 0 1.4-1.4v-6.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 2.75h6l1 3H4l1-3Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.75 8.5h2.5" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M6.25 7.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" />
      <path d="M2.5 13.25c.35-2.15 1.65-3.5 3.75-3.5s3.4 1.35 3.75 3.5" strokeLinecap="round" />
      <path d="M10.8 7.05a1.8 1.8 0 1 0 0-3.35" strokeLinecap="round" />
      <path d="M11.75 9.85c1.05.35 1.75 1.45 1.95 3.1" strokeLinecap="round" />
    </svg>
  );
}

function getStatusTone(status: string): "neutral" | "green" | "amber" | "red" | "blue" | "black" {
  switch (status) {
    case "Backlog":
      return "neutral";
    case "Todo":
      return "blue";
    case "In Progress":
    case "In progress":
      return "red";
    case "Completed":
      return "green";
    case "Canceled":
      return "black";
    default:
      return "neutral";
  }
}

function getPriorityTone(
  priority: string,
): "priorityGray" | "priorityBlue" | "priorityOrange" | "priorityRed" {
  switch (priority) {
    case "Urgent":
      return "priorityRed";
    case "High":
      return "priorityOrange";
    case "Medium":
      return "priorityBlue";
    case "Low":
    default:
      return "priorityGray";
  }
}

function InlineTooltip({
  label,
  align = "center",
  children,
}: {
  label: string;
  align?: "center" | "right";
  children: ReactNode;
}) {
  const alignmentClass =
    align === "right" ? "right-0" : "left-1/2 -translate-x-1/2";

  return (
    <span className="group relative inline-flex">
      {children}
      <span
        className={`pointer-events-none absolute bottom-full z-20 mb-2 hidden whitespace-nowrap rounded-lg border border-[var(--line-soft)] bg-[rgb(15,23,42)] px-2.5 py-1.5 text-xs font-medium text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] group-hover:block group-focus-within:block ${alignmentClass}`}
      >
        {label}
      </span>
    </span>
  );
}

function RepeatBadge({ task }: { task: Pick<TaskListItem, "repeatRuleId" | "repeatCarryCount"> }) {
  if (!task.repeatRuleId) {
    return null;
  }

  const carryCount = task.repeatCarryCount ?? 0;
  const label =
    carryCount > 0
      ? `Carried forward ${carryCount} time${carryCount === 1 ? "" : "s"} from a previous recurrence.`
      : "Repeats from a recurrence rule.";

  return (
    <InlineTooltip label={label}>
      <span className="inline-flex h-6 min-w-6 items-center justify-center gap-1 rounded-lg border border-[rgba(34,122,89,0.18)] bg-[rgba(34,122,89,0.08)] px-1.5 text-[10px] font-semibold text-[var(--accent-strong)]">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M12.5 5.25A5 5 0 0 0 3.7 4.1L2.5 5.25" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2.5 2.6v2.65h2.65" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3.5 10.75a5 5 0 0 0 8.8 1.15l1.2-1.15" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.5 13.4v-2.65h-2.65" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {carryCount > 0 ? <span>{carryCount}</span> : null}
      </span>
    </InlineTooltip>
  );
}

function getOverdueDaysFromLabel(due: string) {
  const match = due.match(/^(\d+) days? overdue$/);
  return match ? match[1] : null;
}

function DueDisplay({ due }: { due: string }) {
  const overdueDays = getOverdueDaysFromLabel(due);

  if (due === "No due date") {
    return (
      <InlineTooltip label="No due date" align="right">
        <span className="text-[var(--ink-subtle)]">-</span>
      </InlineTooltip>
    );
  }

  if (!overdueDays) {
    return <>{due}</>;
  }

  return (
    <InlineTooltip label={due} align="right">
      <span className="inline-flex items-center justify-end gap-1 text-[var(--accent-red)]">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="8" cy="8" r="5.5" />
          <path d="M8 4.75V8l2.2 1.45" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>{overdueDays}</span>
      </span>
    </InlineTooltip>
  );
}

const taskTableHeaderClass =
  "border-b border-[var(--line-soft)] bg-[var(--surface-subtle)]/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]";
const taskTableCellClass = "border-b border-[var(--line-soft)] px-4 py-3 align-middle";

export function TaskTableHeader({ showProject = true }: { showProject?: boolean }) {
  return (
    <thead>
      <tr>
        <th scope="col" className={`${taskTableHeaderClass} w-px text-left`}>
          <span className="sr-only">Complete</span>
        </th>
        <th scope="col" className={`${taskTableHeaderClass} w-px text-left`}>
          Task
        </th>
        <th scope="col" className={`${taskTableHeaderClass} text-left`}>
          Title
        </th>
        {showProject ? (
          <th scope="col" className={`${taskTableHeaderClass} w-px text-center`}>
            Project
          </th>
        ) : null}
        <th scope="col" className={`${taskTableHeaderClass} w-px text-center`}>
          Status
        </th>
        <th scope="col" className={`${taskTableHeaderClass} w-px text-center`}>
          Priority
        </th>
        <th scope="col" className={`${taskTableHeaderClass} w-px text-right`}>
          Due
        </th>
      </tr>
    </thead>
  );
}

function TaskCompleteButton({
  task,
  isCompleting,
  onComplete,
}: {
  task: Pick<TaskListItem, "id" | "statusValue">;
  isCompleting?: boolean;
  onComplete?: (task: Pick<TaskListItem, "id" | "statusValue">) => void;
}) {
  const isDone = task.statusValue === "done";

  return (
    <button
      type="button"
      disabled={isCompleting || !onComplete}
      onClick={(event) => {
        event.stopPropagation();
        onComplete?.(task);
      }}
      aria-label={isDone ? "Mark task incomplete" : "Mark task complete"}
      title={isDone ? "Mark task incomplete" : "Mark task complete"}
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition ${
        isDone
          ? "border-[rgba(34,122,89,0.22)] bg-[var(--accent-strong)] text-white hover:bg-[rgb(43,107,79)] focus-visible:bg-[rgb(43,107,79)]"
          : "border-[var(--line-strong)] bg-white text-transparent hover:border-[rgba(34,122,89,0.24)] hover:bg-[rgba(34,122,89,0.08)] hover:text-[var(--accent-strong)] focus-visible:border-[rgba(34,122,89,0.24)] focus-visible:text-[var(--accent-strong)]"
      } ${isCompleting ? "cursor-wait opacity-70" : ""}`}
    >
      {isCompleting ? (
        <span
          className={`h-2.5 w-2.5 animate-spin rounded-full border-2 ${
            isDone
              ? "border-white/30 border-t-white"
              : "border-[rgba(34,122,89,0.24)] border-t-[var(--accent-strong)]"
          }`}
        />
      ) : (
        <svg
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m3.75 8.25 2.75 2.75 5.75-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

type TaskSubscriptionTarget = Pick<TaskListItem, "id" | "isSubscribedToNotifications">;
type TaskSubscriptionToggle = (
  task: TaskSubscriptionTarget,
  nextSubscribed: boolean,
) => void | Promise<void>;

function SubscribeIcon({
  subscribed,
  className = "h-3.5 w-3.5",
}: {
  subscribed: boolean;
  className?: string;
}) {
  if (subscribed) {
    return (
      <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M4.4 7.15c0-2.3 1.25-3.85 3.6-3.85s3.6 1.55 3.6 3.85v1.65l1.15 1.55H3.25L4.4 8.8V7.15Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.65 12.2a1.55 1.55 0 0 0 2.7 0" strokeLinecap="round" />
        <path d="M2.8 2.8 13.2 13.2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M4.4 7.15c0-2.3 1.25-3.85 3.6-3.85s3.6 1.55 3.6 3.85v1.65l1.15 1.55H3.25L4.4 8.8V7.15Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.65 12.2a1.55 1.55 0 0 0 2.7 0" strokeLinecap="round" />
      <path d="M12.15 2.65v3" strokeLinecap="round" />
      <path d="M10.65 4.15h3" strokeLinecap="round" />
    </svg>
  );
}

export function TaskSubscriptionButton({
  task,
  isPending,
  size = "compact",
  tooltipAlign = "center",
  tooltipSide = "top",
  onToggleSubscription,
}: {
  task: TaskSubscriptionTarget;
  isPending?: boolean;
  size?: "compact" | "toolbar";
  tooltipAlign?: "center" | "left" | "right";
  tooltipSide?: "top" | "bottom";
  onToggleSubscription?: TaskSubscriptionToggle;
}) {
  if (!onToggleSubscription) {
    return null;
  }

  const subscribed = Boolean(task.isSubscribedToNotifications);
  const label = subscribed
    ? "Unsubscribe from this task"
    : "Subscribe to this task";
  const sizeClass =
    size === "toolbar"
      ? "h-8 w-8 rounded-lg"
      : "h-6 w-6 rounded-lg";
  const spinnerClass =
    size === "toolbar"
      ? "h-3 w-3"
      : "h-2.5 w-2.5";
  const iconClass =
    size === "toolbar"
      ? "h-4 w-4"
      : "h-3.5 w-3.5";

  return (
    <IconTooltip label={label} tooltipAlign={tooltipAlign} tooltipSide={tooltipSide}>
      <button
        type="button"
        disabled={isPending}
        aria-label={label}
        aria-pressed={subscribed}
        title={label}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          void onToggleSubscription(task, !subscribed);
          event.currentTarget.blur();
        }}
        className={`inline-flex shrink-0 items-center justify-center border transition disabled:cursor-wait disabled:opacity-60 ${sizeClass} ${
          subscribed
            ? "border-[rgba(34,122,89,0.2)] bg-[rgba(34,122,89,0.08)] text-[var(--accent-strong)] hover:bg-[rgba(34,122,89,0.12)]"
            : "border-[var(--line-strong)] bg-white text-[var(--ink-subtle)] hover:border-[rgba(34,122,89,0.22)] hover:bg-[rgba(34,122,89,0.06)] hover:text-[var(--accent-strong)]"
        }`}
      >
        {isPending ? (
          <span className={`${spinnerClass} animate-spin rounded-full border-2 border-[rgba(34,122,89,0.22)] border-t-[var(--accent-strong)]`} />
        ) : (
          <SubscribeIcon subscribed={subscribed} className={iconClass} />
        )}
      </button>
    </IconTooltip>
  );
}

export function CountPill({
  tone,
  children,
}: {
  tone: "green" | "red" | "blue";
  children: ReactNode;
}) {
  const tones = {
    green:
      "border-[rgba(34,122,89,0.18)] bg-[rgba(34,122,89,0.08)] text-[var(--accent-strong)]",
    red: "border-[rgba(193,62,62,0.18)] bg-[rgba(193,62,62,0.08)] text-[var(--accent-red)]",
    blue: "border-[rgba(37,99,235,0.18)] bg-[rgba(37,99,235,0.08)] text-[rgb(37,99,235)]",
  };

  return (
    <span
      className={`inline-flex h-7 min-w-7 items-center justify-center rounded-lg border px-2 text-center text-xs font-medium leading-none whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function FilterChip({
  active,
  compact = false,
  onClick,
  children,
}: {
  active: boolean;
  compact?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-lg border font-medium transition ${
        compact ? "h-7 px-3 text-[12px]" : "h-6 px-2.5 text-[12px]"
      } ${
        active
          ? "border-[rgba(34,122,89,0.18)] bg-[rgba(34,122,89,0.08)] text-[var(--accent-strong)]"
          : "border-[var(--line-strong)] bg-[var(--surface-card)] text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink-strong)]"
      }`}
    >
      {children}
    </button>
  );
}

export function MetricCard({
  label,
  value,
  tone,
  detail,
}: {
  label: string;
  value: string;
  tone: "green" | "red" | "neutral" | "amber";
  detail: string;
}) {
  const toneMap = {
    green: "text-[var(--accent-strong)]",
    red: "text-[var(--accent-red)]",
    amber: "text-[var(--accent-amber)]",
    neutral: "text-[var(--ink-strong)]",
  };

  return (
    <article className="rounded-2xl border border-[var(--line-soft)] bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-subtle)]">
        {label}
      </p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className={`text-3xl font-semibold tracking-[-0.05em] ${toneMap[tone]}`}>
          {value}
        </p>
        <p className="pb-1 text-xs text-[var(--ink-subtle)]">{detail}</p>
      </div>
    </article>
  );
}

export function FocusItem({
  id,
  title,
  project,
  status,
  statusValue,
  due,
  priority,
  onEdit,
  onComplete,
  isCompleting,
  repeatRuleId,
  repeatCarryCount,
  isSubscribedToNotifications,
  isSubscriptionPending,
  onToggleSubscription,
  showProject = true,
}: {
  id: string;
  title: string;
  project: string;
  status: string;
  statusValue: TaskListItem["statusValue"];
  due: string;
  priority: string;
  onEdit: (taskId: string) => void;
  onComplete?: (task: Pick<TaskListItem, "id" | "statusValue">) => void;
  isCompleting?: boolean;
  repeatRuleId?: string | null;
  repeatCarryCount?: number;
  isSubscribedToNotifications?: boolean;
  isSubscriptionPending?: boolean;
  onToggleSubscription?: TaskSubscriptionToggle;
  showProject?: boolean;
}) {
  const statusTone = getStatusTone(status);
  const priorityTone = getPriorityTone(priority);

  return (
    <tr className="text-sm transition-colors hover:bg-[var(--surface-subtle)]">
      <td className={`${taskTableCellClass} w-px`}>
        <TaskCompleteButton
          task={{ id, statusValue }}
          isCompleting={isCompleting}
          onComplete={onComplete}
        />
      </td>
      <td
        className={`${taskTableCellClass} w-px whitespace-nowrap font-mono text-xs tracking-[0.04em] text-[var(--ink-subtle)]`}
      >
        {id}
      </td>
      <td className={`${taskTableCellClass} min-w-0`}>
        <span className="flex min-w-0 items-center gap-2">
          <TaskSubscriptionButton
            task={{ id, isSubscribedToNotifications }}
            isPending={isSubscriptionPending}
            onToggleSubscription={onToggleSubscription}
          />
          <button
            type="button"
            onClick={() => onEdit(id)}
            className="min-w-0 truncate text-left font-medium text-[var(--ink-strong)] transition hover:text-[var(--accent-strong)]"
          >
            {title}
          </button>
          <RepeatBadge task={{ repeatRuleId, repeatCarryCount }} />
        </span>
      </td>
      {showProject ? (
        <td
          className={`${taskTableCellClass} w-px text-center text-xs whitespace-nowrap text-[var(--ink-subtle)]`}
        >
          {project}
        </td>
      ) : null}
      <td className={`${taskTableCellClass} w-px text-center whitespace-nowrap`}>
        <StatusPill tone={statusTone}>{status}</StatusPill>
      </td>
      <td className={`${taskTableCellClass} w-px text-center whitespace-nowrap`}>
        <StatusPill tone={priorityTone}>{priority}</StatusPill>
      </td>
      <td
        className={`${taskTableCellClass} w-px text-right text-xs whitespace-nowrap text-[var(--ink-subtle)]`}
      >
        <DueDisplay due={due} />
      </td>
    </tr>
  );
}

export function HorizontalListRow({
  id,
  title,
  project,
  due,
  status,
  statusValue = "todo",
  priority,
  onEdit,
  onComplete,
  isCompleting,
  repeatRuleId,
  repeatCarryCount,
  isSubscribedToNotifications,
  isSubscriptionPending,
  onToggleSubscription,
  showProject = true,
}: {
  id: string;
  title: string;
  project: string;
  due: string;
  status?: string;
  statusValue?: TaskListItem["statusValue"];
  priority?: string;
  onEdit: (taskId: string) => void;
  onComplete?: (task: Pick<TaskListItem, "id" | "statusValue">) => void;
  isCompleting?: boolean;
  repeatRuleId?: string | null;
  repeatCarryCount?: number;
  isSubscribedToNotifications?: boolean;
  isSubscriptionPending?: boolean;
  onToggleSubscription?: TaskSubscriptionToggle;
  showProject?: boolean;
}) {
  const statusTone = getStatusTone(status ?? "Todo");
  const priorityTone = getPriorityTone(priority ?? "Low");

  return (
    <tr className="text-sm transition-colors hover:bg-[var(--surface-subtle)]">
      <td className={`${taskTableCellClass} w-px`}>
        <TaskCompleteButton
          task={{ id, statusValue }}
          isCompleting={isCompleting}
          onComplete={onComplete}
        />
      </td>
      <td
        className={`${taskTableCellClass} w-px whitespace-nowrap font-mono text-xs tracking-[0.04em] text-[var(--ink-subtle)]`}
      >
        {id}
      </td>
      <td className={`${taskTableCellClass} min-w-0`}>
        <span className="flex min-w-0 items-center gap-2">
          <TaskSubscriptionButton
            task={{ id, isSubscribedToNotifications }}
            isPending={isSubscriptionPending}
            onToggleSubscription={onToggleSubscription}
          />
          <button
            type="button"
            onClick={() => onEdit(id)}
            className="min-w-0 truncate text-left font-medium text-[var(--ink-strong)] transition hover:text-[var(--accent-strong)]"
          >
            {title}
          </button>
          <RepeatBadge task={{ repeatRuleId, repeatCarryCount }} />
        </span>
      </td>
      {showProject ? (
        <td
          className={`${taskTableCellClass} w-px text-center text-xs whitespace-nowrap text-[var(--ink-subtle)]`}
        >
          {project}
        </td>
      ) : null}
      <td className={`${taskTableCellClass} w-px text-center whitespace-nowrap`}>
        <StatusPill tone={statusTone}>{status ?? "Todo"}</StatusPill>
      </td>
      <td className={`${taskTableCellClass} w-px text-center whitespace-nowrap`}>
        <StatusPill tone={priorityTone}>{priority ?? "Low"}</StatusPill>
      </td>
      <td
        className={`${taskTableCellClass} w-px text-right text-xs whitespace-nowrap text-[var(--ink-subtle)]`}
      >
        <DueDisplay due={due} />
      </td>
    </tr>
  );
}

export function DashboardCompactTaskRow({
  id,
  title,
  project,
  due,
  status,
  statusValue = "todo",
  priority,
  onEdit,
  onComplete,
  isCompleting,
  repeatRuleId,
  repeatCarryCount,
  isSubscribedToNotifications,
  isSubscriptionPending,
  onToggleSubscription,
}: {
  id: string;
  title: string;
  project: string;
  due: string;
  status?: string;
  statusValue?: TaskListItem["statusValue"];
  priority?: string;
  onEdit: (taskId: string) => void;
  onComplete?: (task: Pick<TaskListItem, "id" | "statusValue">) => void;
  isCompleting?: boolean;
  repeatRuleId?: string | null;
  repeatCarryCount?: number;
  isSubscribedToNotifications?: boolean;
  isSubscriptionPending?: boolean;
  onToggleSubscription?: TaskSubscriptionToggle;
}) {
  const statusLabel = status ?? "Todo";
  const priorityLabel = priority ?? "Low";
  const statusTone = getStatusTone(statusLabel);
  const priorityTone = getPriorityTone(priorityLabel);
  const isRecurring = Boolean(repeatRuleId);

  return (
    <div className="border-b border-[var(--line-soft)] px-4 py-3 transition-colors last:border-b-0 hover:bg-[var(--surface-subtle)]">
      <div className="flex min-w-0 gap-3">
        <div className="pt-0.5">
          <TaskCompleteButton
            task={{ id, statusValue }}
            isCompleting={isCompleting}
            onComplete={onComplete}
          />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex min-w-0 items-start gap-2">
            <span className="shrink-0 pt-1 font-mono text-xs tracking-[0.04em] text-[var(--ink-subtle)]">
              {id}
            </span>
            <TaskSubscriptionButton
              task={{ id, isSubscribedToNotifications }}
              isPending={isSubscriptionPending}
              onToggleSubscription={onToggleSubscription}
            />
            <button
              type="button"
              onClick={() => onEdit(id)}
              className="min-w-0 flex-1 text-left text-sm font-medium leading-snug text-[var(--ink-strong)] transition hover:text-[var(--accent-strong)]"
            >
              {title}
            </button>
            <span className="shrink-0 pt-1 text-xs whitespace-nowrap text-[var(--ink-subtle)]">
              <DueDisplay due={due} />
            </span>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="min-w-0 max-w-full truncate text-[12px] text-[var(--ink-subtle)]">
              {project}
            </span>
            {isRecurring ? <RepeatBadge task={{ repeatRuleId, repeatCarryCount }} /> : null}
            <StatusPill tone={statusTone} compact>{statusLabel}</StatusPill>
            <StatusPill tone={priorityTone} compact>{priorityLabel}</StatusPill>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProjectSection({
  id,
  name,
  items,
  onEdit,
  onComplete,
  completingTaskId,
  subscriptionPendingTaskId,
  onToggleSubscription,
  onNewTask,
  onOpenProject,
}: {
  id: string;
  name: string;
  items: {
    project: string;
    id: string;
    title: string;
    status: string;
    priority: string;
    due: string;
    statusValue: TaskListItem["statusValue"];
    repeatRuleId?: string | null;
    repeatCarryCount?: number;
    isSubscribedToNotifications?: boolean;
  }[];
  onEdit: (taskId: string) => void;
  onComplete?: (task: Pick<TaskListItem, "id" | "statusValue">) => void;
  completingTaskId?: string | null;
  subscriptionPendingTaskId?: string | null;
  onToggleSubscription?: TaskSubscriptionToggle;
  onNewTask: (projectId: string) => void;
  onOpenProject: (projectId: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-white">
      <header className="flex items-center justify-between border-b border-[var(--line-soft)] bg-[var(--surface-subtle)] px-5 py-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
            {name}
          </h2>
          <span className="text-sm text-[var(--ink-subtle)]">{items.length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <IconActionButton
            label="New task"
            tooltipAlign="right"
            tooltipSide="bottom"
            tone="accent"
            onClick={() => onNewTask(id)}
          >
            <PlusIcon />
          </IconActionButton>
          <IconActionButton
            label="Open project"
            tooltipAlign="right"
            tooltipSide="bottom"
            tone="blue"
            onClick={() => onOpenProject(id)}
          >
            <OpenIcon />
          </IconActionButton>
        </div>
      </header>
      <div className="overflow-x-auto">
        {items.length > 0 ? (
          <table className="min-w-full table-auto border-collapse">
            <TaskTableHeader showProject={false} />
            <tbody>
              {items.map((item) => {
                const statusTone = getStatusTone(item.status);
                const priorityTone = getPriorityTone(item.priority);

                return (
                  <tr key={item.id} className="text-sm transition-colors hover:bg-[var(--surface-subtle)]">
                    <td className={`${taskTableCellClass} w-px pl-5`}>
                      <TaskCompleteButton
                        task={item}
                        isCompleting={completingTaskId === item.id}
                        onComplete={onComplete}
                      />
                    </td>
                    <td
                      className={`${taskTableCellClass} w-px whitespace-nowrap font-mono text-xs tracking-[0.04em] text-[var(--ink-subtle)]`}
                    >
                      {item.id}
                    </td>
                    <td className={`${taskTableCellClass} min-w-0`}>
                      <span className="flex min-w-0 items-center gap-2">
                        <TaskSubscriptionButton
                          task={item}
                          isPending={subscriptionPendingTaskId === item.id}
                          onToggleSubscription={onToggleSubscription}
                        />
                        <button
                          type="button"
                          onClick={() => onEdit(item.id)}
                          className="min-w-0 truncate text-left font-medium text-[var(--ink-strong)] transition hover:text-[var(--accent-strong)]"
                        >
                          {item.title}
                        </button>
                        <RepeatBadge task={item} />
                      </span>
                    </td>
                    <td className={`${taskTableCellClass} w-px text-center whitespace-nowrap`}>
                      <StatusPill tone={statusTone}>{item.status}</StatusPill>
                    </td>
                    <td className={`${taskTableCellClass} w-px text-center whitespace-nowrap`}>
                      <StatusPill tone={priorityTone}>{item.priority}</StatusPill>
                    </td>
                    <td
                      className={`${taskTableCellClass} w-px pr-5 text-right text-xs whitespace-nowrap text-[var(--ink-subtle)]`}
                    >
                      <DueDisplay due={item.due} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="px-5 py-5 text-sm text-[var(--ink-subtle)]">
            No tasks in this project match the current filters.
          </div>
        )}
      </div>
    </section>
  );
}

export function ProjectStatusBadge({ archived }: { archived?: boolean }) {
  return archived ? (
    <span className="inline-flex h-6 items-center rounded-lg border border-[var(--line-strong)] bg-[var(--surface-subtle)] px-2.5 text-xs font-medium text-[var(--ink-muted)]">
      Archived
    </span>
  ) : (
    <span className="inline-flex h-6 items-center rounded-lg border border-[rgba(34,122,89,0.18)] bg-[rgba(34,122,89,0.08)] px-2.5 text-xs font-medium text-[var(--accent-strong)]">
      Active
    </span>
  );
}

function pluralize(value: number, singular: string, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function projectActivityValue(project: AppProject) {
  const prefix = project.isArchived ? "Archived " : "Updated ";

  if (project.updatedLabel.startsWith(prefix)) {
    return project.updatedLabel.slice(prefix.length);
  }

  return project.updatedLabel;
}

function ProjectMetaItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-fit items-center gap-2 rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
        {label}
      </dt>
      <dd className="text-xs font-medium text-[var(--ink-muted)]">{value}</dd>
    </div>
  );
}

function ProjectMetaRail({ project }: { project: AppProject }) {
	  return (
	    <dl className="flex max-w-full flex-wrap gap-1.5">
	      <ProjectMetaItem label="ID" value={`PRJ-${project.id}`} />
	      <ProjectMetaItem label="Workspace" value={project.workspaceName} />
	      <ProjectMetaItem label="Project Members" value={pluralize(project.memberCount, "member")} />
	      <ProjectMetaItem label="Tasks" value={pluralize(project.taskCount, "task")} />
	      <ProjectMetaItem
        label={project.isArchived ? "Archived" : "Updated"}
        value={projectActivityValue(project)}
      />
    </dl>
  );
}

export function ProjectRow({
  project,
  onEdit,
  onManageUsers,
  onOpen,
  onMove,
  onArchive,
  onUnarchive,
  isReordering,
}: {
  project: AppProject;
  onEdit: (projectId: string) => void;
  onManageUsers: (projectId: string) => void;
  onOpen: (projectId: string) => void;
  onMove: (projectId: string, direction: "up" | "down") => void;
  onArchive: (projectId: string) => void;
  onUnarchive: (projectId: string) => void;
  isReordering: boolean;
}) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(project.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(project.id);
        }
      }}
      className={`rounded-2xl border bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)] transition hover:border-[var(--line-strong)] hover:bg-[var(--surface-card)] ${
        project.isArchived
          ? "border-[var(--line-soft)] opacity-80"
          : "border-[var(--line-soft)]"
      } cursor-pointer`}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
              Project
            </p>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--ink-strong)]">
              {project.name}
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-[var(--ink-muted)]">
              {project.description}
            </p>
          </div>
          <ProjectMetaRail project={project} />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1.5 xl:max-w-[24rem]">
          <IconActionButton
            label="Edit project"
            disabled={isReordering}
            onClick={(event) => {
              event.stopPropagation();
              onEdit(project.id);
            }}
          >
            <EditIcon />
          </IconActionButton>
          <IconActionButton
            label="Manage project users"
            disabled={isReordering}
            onClick={(event) => {
              event.stopPropagation();
              onManageUsers(project.id);
            }}
          >
            <UsersIcon />
          </IconActionButton>
          {project.isArchived ? (
            <IconActionButton
              label="Unarchive project"
              disabled={isReordering}
              tone="accent"
              onClick={(event) => {
                event.stopPropagation();
                onUnarchive(project.id);
              }}
            >
              <RestoreIcon />
            </IconActionButton>
          ) : (
            <IconActionButton
              label="Archive project"
              disabled={isReordering}
              tone="danger"
              onClick={(event) => {
                event.stopPropagation();
                onArchive(project.id);
              }}
          >
            <ArchiveIcon />
          </IconActionButton>
          )}
          <IconActionButton
            label="Open project"
            tooltipAlign="right"
            disabled={isReordering}
            tone="blue"
            onClick={(event) => {
              event.stopPropagation();
              onOpen(project.id);
            }}
          >
            <OpenIcon />
          </IconActionButton>
          {!project.isArchived ? (
            <div className="flex h-8 items-center gap-0.5 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-subtle)] px-0.5">
              <IconTooltip label="Move project up">
                <button
                  type="button"
                  disabled={isReordering}
                  onClick={(event) => {
                    event.stopPropagation();
                    onMove(project.id, "up");
                  }}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[var(--ink-subtle)] transition hover:bg-white hover:text-[var(--ink-strong)] disabled:cursor-wait disabled:opacity-60"
                  aria-label="Move project up"
                  title="Move project up"
                >
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M8 12.5v-9M4.5 7 8 3.5 11.5 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </IconTooltip>
              <IconTooltip label="Move project down">
                <button
                  type="button"
                  disabled={isReordering}
                  onClick={(event) => {
                    event.stopPropagation();
                    onMove(project.id, "down");
                  }}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[var(--ink-subtle)] transition hover:bg-white hover:text-[var(--ink-strong)] disabled:cursor-wait disabled:opacity-60"
                  aria-label="Move project down"
                  title="Move project down"
                >
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M8 3.5v9M4.5 9 8 12.5 11.5 9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </IconTooltip>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function ProjectBoardLane({
  title,
  laneStatus,
  items,
  onEdit,
  onComplete,
  completingTaskId,
  subscriptionPendingTaskId,
  onToggleSubscription,
  onMoveTask,
  draggingTaskId,
  onDragTaskStart,
  onDragTaskEnd,
}: {
  title: string;
  laneStatus: TaskStatus;
  items: TaskListItem[];
  onEdit: (taskId: string) => void;
  onComplete?: (task: Pick<TaskListItem, "id" | "statusValue">) => void;
  completingTaskId?: string | null;
  subscriptionPendingTaskId?: string | null;
  onToggleSubscription?: TaskSubscriptionToggle;
  onMoveTask: (taskId: string, nextStatus: TaskStatus) => void;
  draggingTaskId: string | null;
  onDragTaskStart: (taskId: string) => void;
  onDragTaskEnd: () => void;
}) {
  const isDropActive = draggingTaskId !== null;

  return (
    <section
      className={`rounded-2xl border bg-white transition ${
        isDropActive
          ? "border-[rgba(34,122,89,0.18)] shadow-[0_0_0_1px_rgba(34,122,89,0.08)]"
          : "border-[var(--line-soft)]"
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={(event) => {
        event.preventDefault();

        if (draggingTaskId) {
          onMoveTask(draggingTaskId, laneStatus);
        }

        onDragTaskEnd();
      }}
    >
      <header className="flex items-center justify-between border-b border-[var(--line-soft)] px-4 py-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink-strong)]">
            {title}
          </h3>
          <span className="text-xs text-[var(--ink-subtle)]">{items.length}</span>
        </div>
      </header>
      <div className="min-h-[10rem] space-y-3 p-3">
        {items.length > 0 ? items.map((item) => {
          const statusTone = getStatusTone(item.status);
          const priorityTone = getPriorityTone(item.priority);

          return (
            <article
              key={item.id}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                onDragTaskStart(item.id);
              }}
              onDragEnd={onDragTaskEnd}
              className={`rounded-lg border border-[var(--line-soft)] bg-[var(--surface-card)] p-3 transition-colors hover:bg-[var(--surface-subtle)] ${
                draggingTaskId === item.id ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <TaskCompleteButton
                    task={item}
                    isCompleting={completingTaskId === item.id}
                    onComplete={onComplete}
                  />
                  <span className="font-mono text-xs tracking-[0.04em] text-[var(--ink-subtle)]">
                    {item.id}
                  </span>
                </div>
                <span className="text-xs text-[var(--ink-subtle)]">
                  <DueDisplay due={item.due} />
                </span>
              </div>
              <div className="mt-2 flex min-w-0 items-start gap-2">
                <TaskSubscriptionButton
                  task={item}
                  isPending={subscriptionPendingTaskId === item.id}
                  onToggleSubscription={onToggleSubscription}
                />
                <button
                  type="button"
                  onClick={() => onEdit(item.id)}
                  className="min-w-0 flex-1 text-left text-sm font-medium leading-6 text-[var(--ink-strong)] transition hover:text-[var(--accent-strong)]"
                >
                  {item.title}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusPill tone={statusTone}>{item.status}</StatusPill>
                <StatusPill tone={priorityTone}>{item.priority}</StatusPill>
                <RepeatBadge task={item} />
              </div>
            </article>
          );
        }) : (
          <div className="flex min-h-[8rem] items-center justify-center rounded-lg border border-dashed border-[var(--line-soft)] bg-[var(--surface-subtle)]/45 px-4 text-center text-sm text-[var(--ink-subtle)]">
            No tasks in this stage.
          </div>
        )}
      </div>
    </section>
  );
}
