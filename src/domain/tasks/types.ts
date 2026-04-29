import type {
  TaskPriority,
  TaskSortDirection,
  TaskSortOption,
  TaskStatus,
} from "./constants";
import type { RepeatSettingsInput } from "./repeat-schemas";

export type TaskFilters = {
  sort: TaskSortOption;
  direction: TaskSortDirection;
  status: TaskStatus[];
  priority: TaskPriority[];
  startDate: string | null;
  endDate: string | null;
};

export type TaskListItem = {
  id: string;
  projectId?: string;
  workspaceId?: string | null;
  workspaceName?: string;
  title: string;
  project: string;
  status: string;
  statusValue: TaskStatus;
  due: string;
  dueDate: string | null;
  priority: string;
  priorityValue: TaskPriority;
  startDate: string | null;
  repeatRuleId?: string | null;
  repeatScheduledFor?: string | null;
  repeatCarryCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type TaskDetails = {
  projectId?: string;
  description: string;
  parentTaskId?: string;
  parentTask: string;
  labels: string[];
  repeat?: RepeatSettingsInput;
  startDateValue: string;
  dueDateValue: string;
  projectOptions?: { id: string; name: string }[];
  parentTaskOptions?: { id: string; title: string }[];
};
