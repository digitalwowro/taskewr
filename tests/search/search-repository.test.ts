import test from "node:test";
import assert from "node:assert/strict";

import { SearchRepository } from "@/data/prisma/repositories/search-repository";
import type { PrismaClient } from "@/generated/prisma/client";
import type { TaskSearchInput } from "@/domain/search/schemas";

function createRepository(findManyImpl: (args: unknown) => Promise<unknown>) {
  return new SearchRepository({
    task: {
      findMany: findManyImpl,
    },
  } as unknown as PrismaClient);
}

const baseInput: TaskSearchInput = {
  query: "rollout",
  sort: "priority",
  direction: "desc",
  status: ["todo", "in_progress"],
  priority: [],
  includeArchivedProjects: false,
  limit: 50,
};

test("SearchRepository excludes archived projects by default and applies filters", async () => {
  let capturedArgs: unknown = null;

  const repository = createRepository(async (args) => {
    capturedArgs = args;

    return [
      {
        id: 145,
        title: "Review delayed migration notes for customer rollout",
        status: "in_progress",
        priority: "urgent",
        dueDate: new Date("2026-03-30T00:00:00.000Z"),
        project: {
          id: 4,
          name: "Service Management",
        },
      },
    ];
  });

  const results = await repository.searchTasks(baseInput);

  assert.deepEqual(results, [
    {
      id: 145,
      title: "Review delayed migration notes for customer rollout",
      projectId: 4,
      projectName: "Service Management",
      status: "in_progress",
      priority: "urgent",
      dueDate: new Date("2026-03-30T00:00:00.000Z"),
    },
  ]);

  assert.deepEqual(capturedArgs, {
    where: {
      project: {
        archivedAt: null,
      },
      OR: [
        { title: { contains: "rollout", mode: "insensitive" } },
        { description: { contains: "rollout", mode: "insensitive" } },
      ],
      status: {
        in: ["todo", "in_progress"],
      },
    },
    take: 50,
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
});

test("SearchRepository sorts priority results in descending rank order", async () => {
  const repository = createRepository(async () => [
    {
      id: 111,
      title: "Low priority task",
      status: "todo",
      priority: "low",
      dueDate: null,
      project: { id: 1, name: "Channel Sales" },
    },
    {
      id: 145,
      title: "Urgent task",
      status: "in_progress",
      priority: "urgent",
      dueDate: null,
      project: { id: 4, name: "Service Management" },
    },
    {
      id: 214,
      title: "High task",
      status: "todo",
      priority: "high",
      dueDate: null,
      project: { id: 1, name: "Channel Sales" },
    },
  ]);

  const results = await repository.searchTasks(baseInput);

  assert.deepEqual(
    results.map((task) => ({ id: task.id, priority: task.priority })),
    [
      { id: 145, priority: "urgent" },
      { id: 214, priority: "high" },
      { id: 111, priority: "low" },
    ],
  );
});

test("SearchRepository respects explicit non-priority sorts and archived inclusion", async () => {
  let capturedArgs: unknown = null;

  const repository = createRepository(async (args) => {
    capturedArgs = args;
    return [];
  });

  await repository.searchTasks({
    ...baseInput,
    query: "",
    sort: "due_date",
    direction: "asc",
    status: [],
    priority: ["urgent", "high"],
    includeArchivedProjects: true,
    limit: 10,
  });

  assert.deepEqual(capturedArgs, {
    where: {
      priority: {
        in: ["urgent", "high"],
      },
    },
    take: 10,
    orderBy: {
      dueDate: "asc",
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
});
