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
  dueReminderTime?: string | null;
  isSubscribedToNotifications?: boolean;
  priority: string;
  priorityValue: TaskPriority;
  startDate: string | null;
  repeatRuleId?: string | null;
  repeatScheduledFor?: string | null;
  repeatCarryCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type TaskUserOption = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
};

export type TaskSubtaskSummary = {
  id: string;
  title: string;
  status: string;
  statusValue: TaskStatus;
};

export type TaskLinkSummary = {
  id: string;
  title: string;
  url: string;
  host: string;
  createdAt: string;
  createdBy?: TaskUserOption;
};

export type TaskAttachmentSummary = {
  id: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number;
  createdAt: string;
  uploadedBy?: TaskUserOption;
};

export type TaskTimeEntrySummary = {
  id: string;
  minutes: number;
  createdAt: string;
  user: TaskUserOption;
  createdBy?: TaskUserOption;
};

export type TaskDetails = {
  projectId?: string;
  description: string;
  currentUserId?: string;
  actorProjectRole?: string;
  createdBy?: TaskUserOption;
  assigneeId?: string;
  assigneeOptions?: TaskUserOption[];
  assigneeOptionsByProjectId?: Record<string, TaskUserOption[]>;
  parentTaskId?: string;
  parentTask: string;
  labels: string[];
  repeat?: RepeatSettingsInput;
  startDateValue: string;
  dueDateValue: string;
  dueReminderTime?: string;
  projectOptions?: { id: string; name: string; workspaceName?: string }[];
  parentTaskOptions?: { id: string; title: string }[];
  subtasks?: TaskSubtaskSummary[];
  links?: TaskLinkSummary[];
  attachments?: TaskAttachmentSummary[];
  timeEntries?: TaskTimeEntrySummary[];
};
