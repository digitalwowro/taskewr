import type { TaskDetails, TaskListItem } from "@/domain/tasks/types";

export type ProjectGroup = {
  name: string;
  count: number;
  items: TaskListItem[];
};

export type AppProject = {
  id: string;
  name: string;
  description: string;
  taskCount: number;
  isArchived?: boolean;
  updatedLabel: string;
};

export type AppData = {
  todayItems: TaskListItem[];
  overdueItems: TaskListItem[];
  groupedProjects: ProjectGroup[];
  projectTasksByProjectId: Record<string, TaskListItem[]>;
  activeProjects: AppProject[];
  archivedProjects: AppProject[];
  taskDetails: Record<string, TaskDetails>;
};
