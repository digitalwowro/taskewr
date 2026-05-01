import { randomBytes, scryptSync } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { getDatabaseUrl } from "../src/lib/env";

const pool = new Pool({ connectionString: getDatabaseUrl() });
const prisma = new PrismaClient({
  adapter: new PrismaPg(pool, { disposeExternalPool: true }),
});

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function syncAutoincrementSequences() {
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX("id"), 1), COUNT(*) > 0) FROM "users"`;
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('workspaces', 'id'), COALESCE(MAX("id"), 1), COUNT(*) > 0) FROM "workspaces"`;
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('workspace_members', 'id'), COALESCE(MAX("id"), 1), COUNT(*) > 0) FROM "workspace_members"`;
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('project_members', 'id'), COALESCE(MAX("id"), 1), COUNT(*) > 0) FROM "project_members"`;
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('auth_accounts', 'id'), COALESCE(MAX("id"), 1), COUNT(*) > 0) FROM "auth_accounts"`;
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('password_reset_tokens', 'id'), COALESCE(MAX("id"), 1), COUNT(*) > 0) FROM "password_reset_tokens"`;
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('task_notification_subscriptions', 'id'), COALESCE(MAX("id"), 1), COUNT(*) > 0) FROM "task_notification_subscriptions"`;
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('task_notification_deliveries', 'id'), COALESCE(MAX("id"), 1), COUNT(*) > 0) FROM "task_notification_deliveries"`;
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('projects', 'id'), COALESCE(MAX("id"), 1), COUNT(*) > 0) FROM "projects"`;
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('tasks', 'id'), COALESCE(MAX("id"), 1), COUNT(*) > 0) FROM "tasks"`;
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('task_repeat_rules', 'id'), COALESCE(MAX("id"), 1), COUNT(*) > 0) FROM "task_repeat_rules"`;
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('cycles', 'id'), COALESCE(MAX("id"), 1), COUNT(*) > 0) FROM "cycles"`;
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('labels', 'id'), COALESCE(MAX("id"), 1), COUNT(*) > 0) FROM "labels"`;
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('label_task', 'id'), COALESCE(MAX("id"), 1), COUNT(*) > 0) FROM "label_task"`;
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('audit_logs', 'id'), COALESCE(MAX("id"), 1), COUNT(*) > 0) FROM "audit_logs"`;
}

async function main() {
  await prisma.taskLabel.deleteMany();
  await prisma.taskNotificationDelivery.deleteMany();
  await prisma.taskNotificationSubscription.deleteMany();
  await prisma.task.deleteMany();
  await prisma.taskRepeatRule.deleteMany();
  await prisma.label.deleteMany();
  await prisma.cycle.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.authAccount.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  const adminUser = await prisma.user.create({
    data: {
      name: "Taskewr Admin",
      email: "admin@taskewr.com",
      passwordHash: hashPassword("admin"),
      timezone: "Europe/Bucharest",
      appRole: "admin",
    },
  });

  const regularUser = await prisma.user.create({
    data: {
      name: "Taskewr User",
      email: "user@taskewr.com",
      passwordHash: hashPassword("user"),
      timezone: "Europe/Bucharest",
      appRole: "user",
    },
  });

  const workWorkspace = await prisma.workspace.create({
    data: {
      ownerUserId: adminUser.id,
      name: "Work",
      description: "Customer, partner, service, and operations work.",
      slug: "work",
      sortOrder: 1,
    },
  });

  const personalWorkspace = await prisma.workspace.create({
    data: {
      ownerUserId: adminUser.id,
      name: "Personal",
      description: "Personal routines and private tasks.",
      slug: "personal",
      sortOrder: 2,
    },
  });

  await prisma.workspaceMember.createMany({
    data: [
      {
        workspaceId: workWorkspace.id,
        userId: adminUser.id,
        role: "owner",
      },
      {
        workspaceId: personalWorkspace.id,
        userId: adminUser.id,
        role: "owner",
      },
      {
        workspaceId: workWorkspace.id,
        userId: regularUser.id,
        role: "member",
      },
    ],
  });

  const projects = await Promise.all([
    prisma.project.create({
      data: {
        id: 1,
        workspaceId: workWorkspace.id,
        ownerUserId: adminUser.id,
        name: "Channel Sales",
        description: "Partner-facing onboarding, quoting, and documentation work for the sales channel.",
        sortOrder: 1,
      },
    }),
    prisma.project.create({
      data: {
        id: 2,
        workspaceId: workWorkspace.id,
        ownerUserId: adminUser.id,
        name: "Partner Portal",
        description: "Packaging, migration guidance, and partner communication assets for the portal refresh.",
        sortOrder: 2,
      },
    }),
    prisma.project.create({
      data: {
        id: 3,
        workspaceId: personalWorkspace.id,
        ownerUserId: adminUser.id,
        name: "Internal Ops",
        description: "Internal workflow cleanup, status updates, and coordination tasks across operations.",
        sortOrder: 3,
      },
    }),
    prisma.project.create({
      data: {
        id: 4,
        workspaceId: workWorkspace.id,
        ownerUserId: adminUser.id,
        name: "Service Management",
        description: "Customer rollout stabilization, service handoff notes, and migration coordination.",
        sortOrder: 4,
      },
    }),
    prisma.project.create({
      data: {
        id: 5,
        workspaceId: workWorkspace.id,
        ownerUserId: adminUser.id,
        name: "Partner Training",
        description: "Archived enablement project preserved for historical reference and task lookup.",
        sortOrder: 5,
        archivedAt: new Date("2026-02-01T00:00:00.000Z"),
      },
    }),
    prisma.project.create({
      data: {
        id: 6,
        workspaceId: personalWorkspace.id,
        ownerUserId: adminUser.id,
        name: "Legacy Rollout Notes",
        description: "Older rollout planning work no longer active on the current dashboard.",
        sortOrder: 6,
        archivedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    }),
  ]);

  const byProject = Object.fromEntries(projects.map((project) => [project.name, project]));

  await prisma.projectMember.createMany({
    data: [
      ...projects.map((project) => ({
        projectId: project.id,
        userId: adminUser.id,
        role: "owner",
      })),
      ...projects
        .filter((project) => project.workspaceId === workWorkspace.id)
        .map((project) => ({
          projectId: project.id,
          userId: regularUser.id,
          role: "member",
        })),
    ],
  });

  const labels = await Promise.all([
    prisma.label.create({ data: { name: "migration", color: "#0f766e" } }),
    prisma.label.create({ data: { name: "rollout", color: "#b27a1a" } }),
    prisma.label.create({ data: { name: "customer", color: "#7c8b84" } }),
    prisma.label.create({ data: { name: "documentation", color: "#0f766e" } }),
    prisma.label.create({ data: { name: "onboarding", color: "#227a59" } }),
    prisma.label.create({ data: { name: "operations", color: "#7c8b84" } }),
  ]);

  const labelByName = Object.fromEntries(labels.map((label) => [label.name, label]));

  const createdTasks = new Map<string, number>();

  async function createTask(input: {
    code: number;
    project: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    startDate?: string;
    dueDate?: string;
    parentCode?: number;
    sortOrder: number;
    labels?: string[];
  }) {
    const project = byProject[input.project];
    const task = await prisma.task.create({
      data: {
        id: input.code,
        projectId: project.id,
        createdByUserId: adminUser.id,
        updatedByUserId: adminUser.id,
        parentTaskId: input.parentCode ? createdTasks.get(String(input.parentCode)) ?? null : null,
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        startDate: input.startDate ? new Date(input.startDate) : null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        sortOrder: input.sortOrder,
      },
    });

    createdTasks.set(String(input.code), task.id);

    for (const labelName of input.labels ?? []) {
      const label = labelByName[labelName];

      if (!label) {
        continue;
      }

      await prisma.taskLabel.create({
        data: {
          taskId: task.id,
          labelId: label.id,
        },
      });
    }
  }

  await createTask({
    code: 214,
    project: "Channel Sales",
    title: "Finalize pricing notes for Q2 partner review",
    description: "Prepare the pricing narrative and final partner-facing notes for the Q2 review.",
    status: "in_progress",
    priority: "high",
    startDate: "2026-03-31",
    dueDate: "2026-04-01",
    sortOrder: 1,
    labels: ["documentation", "onboarding"],
  });
  await createTask({
    code: 152,
    project: "Channel Sales",
    title: "Documentation for onboarding customer journey",
    description: "Document the onboarding customer journey clearly enough that both sales and delivery can follow the same path.",
    status: "backlog",
    priority: "medium",
    startDate: "2026-04-05",
    dueDate: "2026-04-12",
    sortOrder: 2,
    labels: ["documentation", "customer"],
  });
  await createTask({
    code: 111,
    project: "Channel Sales",
    title: "Quoting process audit and terminology cleanup",
    description: "Audit the quoting process wording and standardize terminology used across channel-facing materials.",
    status: "backlog",
    priority: "low",
    startDate: "2026-04-08",
    dueDate: "2026-04-14",
    sortOrder: 3,
    labels: ["documentation"],
  });
  await createTask({
    code: 107,
    project: "Channel Sales",
    title: "Onboarding process checklist and decision notes",
    description: "Capture the final onboarding decisions and turn them into a practical checklist ready for team review.",
    status: "in_progress",
    priority: "high",
    startDate: "2026-04-01",
    dueDate: "2026-04-18",
    sortOrder: 4,
    labels: ["onboarding"],
  });
  await createTask({
    code: 154,
    project: "Channel Sales",
    title: "Partner enablement FAQ alignment",
    description: "Align the enablement FAQ with the current partner-facing workflow.",
    status: "todo",
    priority: "urgent",
    startDate: "2026-04-01",
    dueDate: "2026-03-31",
    sortOrder: 5,
    labels: ["customer"],
  });
  await createTask({
    code: 160,
    project: "Channel Sales",
    title: "Restructure onboarding objection handling notes",
    description: "Rework objection handling notes into a cleaner internal reference.",
    status: "todo",
    priority: "medium",
    startDate: "2026-04-03",
    dueDate: "2026-04-06",
    sortOrder: 6,
    labels: ["onboarding"],
  });
  await createTask({
    code: 103,
    project: "Channel Sales",
    title: "Resolve open questions on payment handoff document",
    description: "Resolve the remaining open questions in the payment handoff document.",
    status: "in_progress",
    priority: "high",
    startDate: "2026-03-30",
    dueDate: "2026-03-31",
    sortOrder: 7,
    labels: ["customer"],
  });
  await createTask({
    code: 198,
    project: "Partner Portal",
    title: "Confirm onboarding checklist ownership",
    description: "Confirm ownership of the onboarding checklist and document the final responsibilities before rollout.",
    status: "todo",
    priority: "medium",
    startDate: "2026-04-01",
    dueDate: "2026-04-01",
    sortOrder: 1,
    labels: ["onboarding"],
  });
  await createTask({
    code: 209,
    project: "Partner Portal",
    title: "Convert XenServer customers to the new packaging model",
    description: "Define how XenServer customers move to the new packaging model and note exceptions.",
    status: "todo",
    priority: "high",
    startDate: "2026-04-02",
    dueDate: "2026-04-07",
    sortOrder: 2,
    labels: ["customer"],
  });
  await createTask({
    code: 217,
    project: "Partner Portal",
    title: "Cloud template guide for pay-as-you-go questions",
    description: "Write the pay-as-you-go guidance for the cloud template.",
    status: "todo",
    priority: "medium",
    startDate: "2026-04-03",
    dueDate: "2026-04-07",
    sortOrder: 3,
    labels: ["documentation"],
  });
  await createTask({
    code: 176,
    project: "Internal Ops",
    title: "Prepare status update for service management sync",
    description: "Draft the internal status update for the service management sync.",
    status: "todo",
    priority: "low",
    startDate: "2026-04-01",
    dueDate: "2026-04-01",
    sortOrder: 1,
    labels: ["operations"],
  });
  await createTask({
    code: 188,
    project: "Internal Ops",
    title: "Consolidate weekly operations review inputs",
    description: "Collect and normalize inputs for the weekly operations review.",
    status: "in_progress",
    priority: "high",
    startDate: "2026-04-01",
    dueDate: "2026-04-02",
    sortOrder: 2,
    labels: ["operations"],
  });
  await createTask({
    code: 194,
    project: "Internal Ops",
    title: "Rework service desk handoff template",
    description: "Rework the service desk handoff template and rollout notes.",
    status: "todo",
    priority: "urgent",
    startDate: "2026-04-01",
    dueDate: "2026-03-30",
    sortOrder: 3,
    labels: ["operations", "rollout"],
  });
  await createTask({
    code: 145,
    project: "Service Management",
    title: "Review delayed migration notes for customer rollout",
    description: "Review migration notes, fix rollout sequencing issues, and align customer instructions.",
    status: "in_progress",
    priority: "urgent",
    startDate: "2026-03-26",
    dueDate: "2026-03-30",
    sortOrder: 1,
    labels: ["migration", "rollout", "customer"],
  });
  await createTask({
    code: 171,
    project: "Service Management",
    title: "Validate rollback notes for managed customers",
    description: "Validate rollback notes for the managed customer cohort.",
    status: "todo",
    priority: "high",
    startDate: "2026-04-01",
    dueDate: "2026-04-02",
    sortOrder: 2,
    labels: ["migration"],
  });
  await createTask({
    code: 182,
    project: "Service Management",
    title: "Capture final customer rollout sequence",
    description: "Capture the final rollout sequence for the current customer wave.",
    status: "backlog",
    priority: "medium",
    startDate: "2026-04-07",
    dueDate: "2026-04-11",
    sortOrder: 3,
    labels: ["rollout", "customer"],
  });

  await syncAutoincrementSequences();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
