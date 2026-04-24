"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ProjectView } from "@/domain/projects/constants";
import {
  DEFAULT_TASK_DIRECTION,
  DEFAULT_TASK_PRIORITIES,
  DEFAULT_TASK_SORT,
  DEFAULT_TASK_STATUSES,
  PRIORITY_OPTIONS,
  SORT_OPTIONS,
  STATUS_OPTIONS,
  type TaskPriority,
  type TaskSortDirection,
  type TaskSortOption,
  type TaskStatus,
} from "@/domain/tasks/constants";
import type { TaskFilters } from "@/domain/tasks/types";

export function useTaskFilterToolbarState(
  initialFilters?: TaskFilters,
  initialProjectView: ProjectView = "list",
) {
  const [projectSortMenuOpen, setProjectSortMenuOpen] = useState(false);
  const [projectStatusMenuOpen, setProjectStatusMenuOpen] = useState(false);
  const [projectPriorityMenuOpen, setProjectPriorityMenuOpen] = useState(false);
  const [projectDateMenuOpen, setProjectDateMenuOpen] = useState(false);
  const projectSortMenuRef = useRef<HTMLDivElement | null>(null);
  const projectStatusMenuRef = useRef<HTMLDivElement | null>(null);
  const projectPriorityMenuRef = useRef<HTMLDivElement | null>(null);
  const projectDateMenuRef = useRef<HTMLDivElement | null>(null);
  const [projectView, setProjectView] = useState<ProjectView>(initialProjectView);
  const [sort, setSort] = useState<TaskSortOption>(initialFilters?.sort ?? DEFAULT_TASK_SORT);
  const [direction, setDirection] = useState<TaskSortDirection>(
    initialFilters?.direction ?? DEFAULT_TASK_DIRECTION,
  );
  const [selectedStatuses, setSelectedStatuses] = useState<TaskStatus[]>(
    initialFilters?.status ?? DEFAULT_TASK_STATUSES,
  );
  const [selectedPriorities, setSelectedPriorities] = useState<TaskPriority[]>(
    initialFilters?.priority ?? DEFAULT_TASK_PRIORITIES,
  );
  const [startDate, setStartDate] = useState<string | null>(initialFilters?.startDate ?? null);
  const [endDate, setEndDate] = useState<string | null>(initialFilters?.endDate ?? null);

  useEffect(() => {
    setProjectView(initialProjectView);
  }, [initialProjectView]);

  useEffect(() => {
    setSort(initialFilters?.sort ?? DEFAULT_TASK_SORT);
    setDirection(initialFilters?.direction ?? DEFAULT_TASK_DIRECTION);
    setSelectedStatuses(initialFilters?.status ?? DEFAULT_TASK_STATUSES);
    setSelectedPriorities(initialFilters?.priority ?? DEFAULT_TASK_PRIORITIES);
    setStartDate(initialFilters?.startDate ?? null);
    setEndDate(initialFilters?.endDate ?? null);
  }, [initialFilters]);

  const toggleStatus = useCallback((status: TaskStatus) => {
    setSelectedStatuses((current) =>
      current.includes(status)
        ? current.filter((value) => value !== status)
        : [...current, status],
    );
  }, []);

  const togglePriority = useCallback((priority: TaskPriority) => {
    setSelectedPriorities((current) =>
      current.includes(priority)
        ? current.filter((value) => value !== priority)
        : [...current, priority],
    );
  }, []);

  const closeMenus = useCallback(() => {
    setProjectSortMenuOpen(false);
    setProjectStatusMenuOpen(false);
    setProjectPriorityMenuOpen(false);
    setProjectDateMenuOpen(false);
  }, []);

  const resetProjectFilters = useCallback(() => {
    setProjectView("list");
    setSort("priority");
    setDirection("desc");
    setSelectedStatuses(DEFAULT_TASK_STATUSES);
    setSelectedPriorities([]);
    setStartDate(null);
    setEndDate(null);
    closeMenus();
  }, [closeMenus]);

  const projectSortLabel = useMemo(() => {
    const sortOption = SORT_OPTIONS.find((option) => option.value === sort);
    const directionSuffix = direction === "desc" ? "↓" : "↑";

    return `${sortOption?.label ?? "Priority"} ${directionSuffix}`;
  }, [direction, sort]);

  const activeStatusLabels = useMemo(
    () =>
      STATUS_OPTIONS.filter((status) => selectedStatuses.includes(status.value)).map(
        (status) => status.label,
      ),
    [selectedStatuses],
  );
  const activePriorityLabels = useMemo(
    () =>
      PRIORITY_OPTIONS.filter((priority) => selectedPriorities.includes(priority.value)).map(
        (priority) => priority.label,
      ),
    [selectedPriorities],
  );

  return {
    projectSortMenuOpen,
    setProjectSortMenuOpen,
    projectStatusMenuOpen,
    setProjectStatusMenuOpen,
    projectPriorityMenuOpen,
    setProjectPriorityMenuOpen,
    projectDateMenuOpen,
    setProjectDateMenuOpen,
    projectSortMenuRef,
    projectStatusMenuRef,
    projectPriorityMenuRef,
    projectDateMenuRef,
    projectView,
    setProjectView,
    sort,
    setSort,
    direction,
    setDirection,
    selectedStatuses,
    setSelectedStatuses,
    selectedPriorities,
    setSelectedPriorities,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    toggleStatus,
    togglePriority,
    closeMenus,
    resetProjectFilters,
    projectSortLabel,
    activeStatusLabels,
    activePriorityLabels,
  };
}
