"use client";

import { TaskEditorModal } from "@/components/app/task-editor-modal";
import type { TaskDetails, TaskListItem } from "@/domain/tasks/types";
import type { TaskPriority, TaskStatus } from "@/domain/tasks/constants";
import type { RepeatSettingsInput } from "@/domain/tasks/repeat-schemas";

type TaskSaveInput = {
  projectId: number;
  title: string;
  description: string;
  parentTaskId: number | null;
  assigneeUserId: number | null;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string | null;
  dueDate: string | null;
  dueReminderTime: string | null;
  labels: string[];
  repeat: RepeatSettingsInput;
};

type TaskModalSwitcherProps = {
  initialSection: "dashboard" | "projects" | "project_detail" | "task_detail" | "users" | "workspaces";
  selectedTask: TaskListItem | null;
  taskEditorTask: TaskListItem | null;
  taskDetails: Record<string, TaskDetails>;
  currentUserId: string;
  projectOptions: Array<{ id: string; name: string; workspaceName?: string }>;
  availableLabels: string[];
  parentTaskOptionsByProject: Record<string, { id: string; title: string }[]>;
  draftDefaults?: { projectId?: string; parentTaskId?: string };
  taskMutationPending: boolean;
  taskMutationError: string | null;
  onCloseTaskRoute: () => void;
  onCloseInlineTaskEditor: () => void;
  onOpenTask: (taskId: string) => void;
  onCreateSubtask: (input: { projectId: string; parentTaskId: string }) => void;
  onRefreshTaskData: () => void;
  onSaveTask: (targetTask: TaskListItem, input: TaskSaveInput) => Promise<void>;
  onToggleTaskSubscription: (targetTask: TaskListItem, nextSubscribed: boolean) => Promise<void>;
};

export function TaskModalSwitcher({
  initialSection,
  selectedTask,
  taskEditorTask,
  taskDetails,
  currentUserId,
  projectOptions,
  availableLabels,
  parentTaskOptionsByProject,
  draftDefaults,
  taskMutationPending,
  taskMutationError,
  onCloseTaskRoute,
  onCloseInlineTaskEditor,
  onOpenTask,
  onCreateSubtask,
  onRefreshTaskData,
  onSaveTask,
  onToggleTaskSubscription,
}: TaskModalSwitcherProps) {
  const activeTask =
    taskEditorTask ?? (initialSection === "task_detail" ? selectedTask : null);

  if (!activeTask) {
    return null;
  }

  const closeModal = taskEditorTask ? onCloseInlineTaskEditor : onCloseTaskRoute;

  if (taskEditorTask || initialSection === "task_detail") {
    return (
      <TaskEditorModal
        key={activeTask.id}
        task={activeTask}
        taskDetails={taskDetails}
        currentUserId={currentUserId}
        projectOptions={projectOptions}
        availableLabels={availableLabels}
        parentTaskOptionsByProject={parentTaskOptionsByProject}
        draftDefaults={draftDefaults}
        onClose={closeModal}
        onOpenTask={onOpenTask}
        onCreateSubtask={onCreateSubtask}
        onRefreshTaskData={onRefreshTaskData}
        onSave={(input) => onSaveTask(activeTask, input)}
        onToggleSubscription={(nextSubscribed) =>
          onToggleTaskSubscription(activeTask, nextSubscribed)
        }
        isSaving={taskMutationPending}
        error={taskMutationError}
      />
    );
  }

  return null;
}
