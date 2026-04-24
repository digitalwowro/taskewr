import { ValidationError } from "@/domain/common/errors";

export type TaskHierarchyNode = {
  id: number;
  projectId: number;
  parentTaskId: number | null;
  status: string;
};

const BLOCKING_STATUSES = new Set(["backlog", "todo", "in_progress"]);

export function assertTaskNotSelfParent(taskId: number | null, parentTaskId: number | null) {
  if (taskId !== null && parentTaskId !== null && taskId === parentTaskId) {
    throw new ValidationError("A task cannot be its own parent.", "task_self_parent");
  }
}

export function assertSameProjectParent(taskProjectId: number, parentProjectId: number | null) {
  if (parentProjectId !== null && taskProjectId !== parentProjectId) {
    throw new ValidationError(
      "Parent task must belong to the same project.",
      "task_parent_cross_project",
    );
  }
}

export function assertNoHierarchyCycle(
  taskId: number | null,
  parentTaskId: number | null,
  tasks: TaskHierarchyNode[],
) {
  if (taskId === null || parentTaskId === null) {
    return;
  }

  const byId = new Map(tasks.map((task) => [task.id, task]));
  let currentParentId: number | null = parentTaskId;

  while (currentParentId !== null) {
    if (currentParentId === taskId) {
      throw new ValidationError(
        "That parent relationship would create a cycle.",
        "task_parent_cycle",
      );
    }

    currentParentId = byId.get(currentParentId)?.parentTaskId ?? null;
  }
}

export function assertCanMarkTaskDone(taskId: number, tasks: TaskHierarchyNode[]) {
  const childMap = new Map<number, TaskHierarchyNode[]>();

  for (const task of tasks) {
    if (task.parentTaskId === null) {
      continue;
    }

    const siblings = childMap.get(task.parentTaskId) ?? [];
    siblings.push(task);
    childMap.set(task.parentTaskId, siblings);
  }

  const queue = [...(childMap.get(taskId) ?? [])];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current) {
      continue;
    }

    if (BLOCKING_STATUSES.has(current.status)) {
      throw new ValidationError(
        "A parent task cannot be marked done while descendants are still active.",
        "task_descendants_incomplete",
      );
    }

    queue.push(...(childMap.get(current.id) ?? []));
  }
}

export function assertTaskProjectChangeAllowed(input: {
  currentProjectId: number;
  nextProjectId: number;
  parentTaskId: number | null;
  childTaskCount: number;
}) {
  if (input.currentProjectId === input.nextProjectId) {
    return;
  }

  if (input.parentTaskId !== null || input.childTaskCount > 0) {
    throw new ValidationError(
      "A task with parent or child relationships cannot be moved to another project.",
      "task_project_change_breaks_hierarchy",
    );
  }
}
