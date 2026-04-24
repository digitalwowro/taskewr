import type { TaskDetails, TaskListItem } from "@/domain/tasks/types";

export type ProjectGroup = {
  name: string;
  count: number;
  items: TaskListItem[];
};

export type MockProject = {
  id: string;
  name: string;
  description: string;
  taskCount: number;
  isArchived?: boolean;
  updatedLabel: string;
};

export type MockAppData = {
  todayItems: TaskListItem[];
  overdueItems: TaskListItem[];
  groupedProjects: ProjectGroup[];
  projectTasksByProjectId: Record<string, TaskListItem[]>;
  activeProjects: MockProject[];
  archivedProjects: MockProject[];
  taskDetails: Record<string, TaskDetails>;
};
