import assert from "node:assert/strict";
import test from "node:test";

import {
  formatArchivedLabel,
  formatUpdatedLabel,
  toActiveProjectCard,
  toArchivedProjectCard,
  toTaskDetails,
  toTaskListItem,
} from "@/server/services/app-data-formatters";

function buildTask(overrides: Record<string, unknown> = {}) {
  return {
    id: 12,
    projectId: 4,
    title: "Review rollout",
    description: "Check the migration notes",
    parentTaskId: 9,
    assigneeUserId: 8,
    parentTask: {
      title: "Parent item",
    },
    creator: {
      id: 7,
      name: "Taskewr Admin",
      email: "admin@taskewr.com",
      avatarUrl: null,
    },
    assignee: {
      id: 8,
      name: "Taskewr User",
      email: "user@taskewr.com",
      avatarUrl: null,
    },
    status: "in_progress",
    priority: "urgent",
    startDate: new Date("2026-04-01T00:00:00.000Z"),
    dueDate: null,
    dueReminderTime: "09:30",
    repeatRuleId: 3,
    repeatScheduledFor: new Date("2026-04-02T00:00:00.000Z"),
    repeatCarryCount: 2,
    createdAt: new Date("2026-03-30T10:00:00.000Z"),
    updatedAt: new Date("2026-03-31T10:00:00.000Z"),
    project: {
      workspaceId: 1,
      name: "Service Management",
      workspace: {
        name: "Work",
      },
    },
    repeatRule: {
      isActive: true,
      scheduleType: "weekly",
      interval: 2,
      weekdays: [1, "bad", 5],
      monthDay: null,
      specificDates: ["2026-05-01", 7],
      incompleteBehavior: "create_separate",
    },
    taskLabels: [
      {
        label: {
          name: "Customer",
        },
      },
    ],
    links: [
      {
        id: 5,
        title: "Migration notes",
        url: "https://www.example.com/migration",
        createdAt: new Date("2026-03-31T09:00:00.000Z"),
        createdBy: {
          id: 7,
          name: "Taskewr Admin",
          email: "admin@taskewr.com",
          avatarUrl: null,
        },
      },
    ],
    attachments: [
      {
        id: 6,
        originalFileName: "rollout.pdf",
        mimeType: "application/pdf",
        sizeBytes: 2048,
        createdAt: new Date("2026-03-31T09:30:00.000Z"),
        uploadedBy: {
          id: 8,
          name: "Taskewr User",
          email: "user@taskewr.com",
          avatarUrl: null,
        },
      },
    ],
    timeEntries: [
      {
        id: 7,
        minutes: 90,
        createdAt: new Date("2026-03-31T09:45:00.000Z"),
        user: {
          id: 8,
          name: "Taskewr User",
          email: "user@taskewr.com",
          avatarUrl: null,
        },
        createdBy: {
          id: 7,
          name: "Taskewr Admin",
          email: "admin@taskewr.com",
          avatarUrl: null,
        },
      },
    ],
    notificationSubscriptions: [{ userId: 7 }],
    ...overrides,
  };
}

test("toTaskListItem maps task records into app task rows", () => {
  assert.deepEqual(toTaskListItem(buildTask() as never, "UTC", 7), {
    id: "TSK-12",
    projectId: "4",
    workspaceId: "1",
    workspaceName: "Work",
    title: "Review rollout",
    project: "Service Management",
    status: "In Progress",
    statusValue: "in_progress",
    due: "No due date",
    dueDate: null,
    dueReminderTime: "09:30",
    isSubscribedToNotifications: true,
    priority: "Urgent",
    priorityValue: "urgent",
    startDate: "2026-04-01T00:00:00.000Z",
    repeatRuleId: "3",
    repeatScheduledFor: "2026-04-02T00:00:00.000Z",
    repeatCarryCount: 2,
    createdAt: "2026-03-30T10:00:00.000Z",
    updatedAt: "2026-03-31T10:00:00.000Z",
  });
});

test("toTaskDetails maps repeat settings and filters invalid json values", () => {
  const projects = [
    {
      id: 4,
      name: "Service Management",
      archivedAt: null,
      members: [
        {
          role: "member",
          user: {
            id: 8,
            name: "Taskewr User",
            email: "user@taskewr.com",
            avatarUrl: null,
            deactivatedAt: null,
          },
        },
        {
          role: "member",
          user: {
            id: 9,
            name: "Inactive User",
            email: "inactive@taskewr.com",
            avatarUrl: null,
            deactivatedAt: new Date("2026-04-01T00:00:00.000Z"),
          },
        },
      ],
    },
    {
      id: 5,
      name: "Archived",
      archivedAt: new Date("2026-04-01T00:00:00.000Z"),
      members: [],
    },
  ];
  const siblingTasks = [
    buildTask(),
    buildTask({ id: 14, title: "Sibling task" }),
    buildTask({ id: 15, parentTaskId: 12, title: "Done child", status: "done" }),
    buildTask({ id: 16, parentTaskId: 12, title: "Canceled child", status: "canceled" }),
  ];

  assert.deepEqual(toTaskDetails(buildTask() as never, projects, siblingTasks as never, 7), {
    projectId: "4",
    description: "Check the migration notes",
    currentUserId: "7",
    actorProjectRole: undefined,
    createdBy: {
      id: "7",
      name: "Taskewr Admin",
      email: "admin@taskewr.com",
      avatarUrl: null,
    },
    assigneeId: "8",
    assigneeOptions: [
      {
        id: "8",
        name: "Taskewr User",
        email: "user@taskewr.com",
        avatarUrl: null,
      },
    ],
    assigneeOptionsByProjectId: {
      "4": [
        {
          id: "8",
          name: "Taskewr User",
          email: "user@taskewr.com",
          avatarUrl: null,
        },
      ],
      "5": [],
    },
    parentTaskId: "9",
    parentTask: "Parent item",
    labels: ["Customer"],
    repeat: {
      enabled: true,
      scheduleType: "weekly",
      interval: 2,
      weekdays: [1, 5],
      monthDay: null,
      specificDates: ["2026-05-01"],
      incompleteBehavior: "create_separate",
    },
    startDateValue: "2026-04-01",
    dueDateValue: "",
    dueReminderTime: "09:30",
    projectOptions: [{ id: "4", name: "Service Management", workspaceName: "No workspace" }],
    parentTaskOptions: [
      { id: "14", title: "Sibling task" },
      { id: "15", title: "Done child" },
      { id: "16", title: "Canceled child" },
    ],
    subtasks: [
      {
        id: "TSK-15",
        title: "Done child",
        status: "Completed",
        statusValue: "done",
      },
      {
        id: "TSK-16",
        title: "Canceled child",
        status: "Canceled",
        statusValue: "canceled",
      },
    ],
    links: [
      {
        id: "5",
        title: "Migration notes",
        url: "https://www.example.com/migration",
        host: "example.com",
        createdAt: "2026-03-31T09:00:00.000Z",
        createdBy: {
          id: "7",
          name: "Taskewr Admin",
          email: "admin@taskewr.com",
          avatarUrl: null,
        },
      },
    ],
    attachments: [
      {
        id: "6",
        fileName: "rollout.pdf",
        mimeType: "application/pdf",
        sizeBytes: 2048,
        createdAt: "2026-03-31T09:30:00.000Z",
        uploadedBy: {
          id: "8",
          name: "Taskewr User",
          email: "user@taskewr.com",
          avatarUrl: null,
        },
      },
    ],
    timeEntries: [
      {
        id: "7",
        minutes: 90,
        createdAt: "2026-03-31T09:45:00.000Z",
        user: {
          id: "8",
          name: "Taskewr User",
          email: "user@taskewr.com",
          avatarUrl: null,
        },
        createdBy: {
          id: "7",
          name: "Taskewr Admin",
          email: "admin@taskewr.com",
          avatarUrl: null,
        },
      },
    ],
  });
});

test("project card helpers preserve display labels", () => {
  const referenceDate = new Date("2026-04-28T12:00:00.000Z");

  assert.equal(formatUpdatedLabel(new Date("2026-04-28T11:30:00.000Z"), referenceDate), "Updated just now");
  assert.equal(formatUpdatedLabel(new Date("2026-04-27T11:30:00.000Z"), referenceDate), "Updated yesterday");
  assert.equal(formatArchivedLabel(new Date("2026-03-01T00:00:00.000Z"), referenceDate), "Archived 1 month ago");

  assert.deepEqual(
    toActiveProjectCard({
      id: 1,
      name: "Active",
      description: null,
      workspaceId: 1,
      workspace: {
        name: "Work",
      },
      archivedAt: null,
      updatedAt: referenceDate,
      _count: { tasks: 3, members: 2 },
    }, referenceDate),
    {
      id: "1",
      workspaceId: "1",
      workspaceName: "Work",
      name: "Active",
      description: "",
      taskCount: 3,
      memberCount: 2,
      updatedLabel: "Updated just now",
    },
  );

  assert.deepEqual(
    toArchivedProjectCard({
      id: 2,
      name: "Archived",
      description: "Done",
      workspaceId: 2,
      workspace: {
        name: "Personal",
      },
      archivedAt: new Date("2026-04-01T00:00:00.000Z"),
      updatedAt: referenceDate,
      _count: { tasks: 1, members: 1 },
    }, referenceDate),
    {
      id: "2",
      workspaceId: "2",
      workspaceName: "Personal",
      name: "Archived",
      description: "Done",
      taskCount: 1,
      memberCount: 1,
      isArchived: true,
      updatedLabel: "Archived this month",
    },
  );
});
