import type { TaskListItem } from "@/domain/tasks/types";
import { isOverdueDate } from "@/lib/time/dashboard-dates";

export type ProjectTaskSections = {
  overdue: TaskListItem[];
  active: TaskListItem[];
  completed: TaskListItem[];
};

export function splitProjectTaskSections(tasks: TaskListItem[]): ProjectTaskSections {
  const sections: ProjectTaskSections = {
    overdue: [],
    active: [],
    completed: [],
  };

  for (const task of tasks) {
    if (task.statusValue === "done") {
      sections.completed.push(task);
      continue;
    }

    if (isOverdueDate(task.dueDate ? new Date(task.dueDate) : null)) {
      sections.overdue.push(task);
      continue;
    }

    sections.active.push(task);
  }

  return sections;
}
