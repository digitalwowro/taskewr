import type { TaskDetails, TaskListItem } from "@/domain/tasks/types";

export type AppWorkspace = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

export type AppCurrentUser = {
  id: number;
  appRole: string;
};

export type ProjectGroup = {
  id: string;
  name: string;
  workspaceId: string | null;
  workspaceName: string;
  count: number;
  items: TaskListItem[];
};

export type AppProject = {
  id: string;
  workspaceId: string | null;
  workspaceName: string;
  name: string;
  description: string;
  taskCount: number;
  isArchived?: boolean;
  updatedLabel: string;
};

export type AppData = {
  currentUser: AppCurrentUser;
  workspaces: AppWorkspace[];
  recurringOverdueItems: TaskListItem[];
  recurringTodayItems: TaskListItem[];
  todayItems: TaskListItem[];
  overdueItems: TaskListItem[];
  groupedProjects: ProjectGroup[];
  projectTasksByProjectId: Record<string, TaskListItem[]>;
  activeProjects: AppProject[];
  archivedProjects: AppProject[];
  taskDetails: Record<string, TaskDetails>;
};
