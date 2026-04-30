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
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string | null;
  dueDate: string | null;
  labels: string[];
  repeat: RepeatSettingsInput;
};

type TaskModalSwitcherProps = {
  initialSection: "dashboard" | "projects" | "project_detail" | "task_detail" | "users" | "workspaces";
  selectedTask: TaskListItem | null;
  taskEditorTask: TaskListItem | null;
  taskDetails: Record<string, TaskDetails>;
  projectOptions: Array<{ id: string; name: string; workspaceName?: string }>;
  parentTaskOptionsByProject: Record<string, { id: string; title: string }[]>;
  taskMutationPending: boolean;
  taskMutationError: string | null;
  onCloseTaskRoute: () => void;
  onCloseInlineTaskEditor: () => void;
  onSaveTask: (targetTask: TaskListItem, input: TaskSaveInput) => Promise<void>;
};

export function TaskModalSwitcher({
  initialSection,
  selectedTask,
  taskEditorTask,
  taskDetails,
  projectOptions,
  parentTaskOptionsByProject,
  taskMutationPending,
  taskMutationError,
  onCloseTaskRoute,
  onCloseInlineTaskEditor,
  onSaveTask,
}: TaskModalSwitcherProps) {
  if (initialSection === "task_detail") {
    return (
      <TaskEditorModal
        key={selectedTask?.id ?? "task-detail-empty"}
        task={selectedTask}
        taskDetails={taskDetails}
        projectOptions={projectOptions}
        parentTaskOptionsByProject={parentTaskOptionsByProject}
        onClose={onCloseTaskRoute}
        onSave={(input) =>
          selectedTask ? onSaveTask(selectedTask, input) : Promise.resolve()
        }
        isSaving={taskMutationPending}
        error={taskMutationError}
      />
    );
  }

  if (!taskEditorTask) {
    return null;
  }

  return (
    <TaskEditorModal
      key={taskEditorTask.id}
      task={taskEditorTask}
      taskDetails={taskDetails}
      projectOptions={projectOptions}
      parentTaskOptionsByProject={parentTaskOptionsByProject}
      onClose={onCloseInlineTaskEditor}
      onSave={(input) => onSaveTask(taskEditorTask, input)}
      isSaving={taskMutationPending}
      error={taskMutationError}
    />
  );
}
