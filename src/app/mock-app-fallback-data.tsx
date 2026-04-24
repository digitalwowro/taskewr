"use client";

import type { ReactNode } from "react";
import type { MockProject, ProjectGroup } from "@/app/mock-app-data";
import type { TaskDetails, TaskListItem } from "@/domain/tasks/types";

export type NavItem = {
  id: string;
  label: string;
  icon: ReactNode;
};

export const DEFAULT_TODAY_ITEMS: TaskListItem[] = [
  {
    id: "TSK-214",
    title: "Finalize pricing notes for Q2 partner review",
    project: "Channel Sales",
    status: "In progress",
    statusValue: "in_progress",
    due: "Today, 14:00",
    dueDate: "2026-04-01T14:00:00",
    priority: "High",
    priorityValue: "high",
    startDate: "2026-03-31T09:00:00",
    createdAt: "2026-03-28T09:00:00",
    updatedAt: "2026-04-01T10:15:00",
  },
  {
    id: "TSK-198",
    title: "Confirm onboarding checklist ownership",
    project: "Partner Portal",
    status: "Todo",
    statusValue: "todo",
    due: "Today, 16:30",
    dueDate: "2026-04-01T16:30:00",
    priority: "Medium",
    priorityValue: "medium",
    startDate: "2026-04-01T11:00:00",
    createdAt: "2026-03-29T14:10:00",
    updatedAt: "2026-04-01T09:40:00",
  },
  {
    id: "TSK-176",
    title: "Prepare status update for service management sync",
    project: "Internal Ops",
    status: "Todo",
    statusValue: "todo",
    due: "Today, 18:00",
    dueDate: "2026-04-01T18:00:00",
    priority: "Low",
    priorityValue: "low",
    startDate: "2026-04-01T13:00:00",
    createdAt: "2026-03-27T16:30:00",
    updatedAt: "2026-03-31T17:45:00",
  },
];

export const DEFAULT_OVERDUE_ITEMS: TaskListItem[] = [
  {
    id: "TSK-145",
    title: "Review delayed migration notes for customer rollout",
    project: "Service Management",
    status: "In progress",
    statusValue: "in_progress",
    due: "2 days overdue",
    dueDate: "2026-03-30T12:00:00",
    priority: "Urgent",
    priorityValue: "urgent",
    startDate: "2026-03-26T10:00:00",
    createdAt: "2026-03-20T10:00:00",
    updatedAt: "2026-04-01T08:15:00",
  },
  {
    id: "TSK-103",
    title: "Resolve open questions on payment handoff document",
    project: "Channel Sales",
    status: "In progress",
    statusValue: "in_progress",
    due: "1 day overdue",
    dueDate: "2026-03-31T15:00:00",
    priority: "High",
    priorityValue: "high",
    startDate: "2026-03-30T09:00:00",
    createdAt: "2026-03-24T13:00:00",
    updatedAt: "2026-03-31T18:10:00",
  },
];

export const DEFAULT_GROUPED_PROJECTS: ProjectGroup[] = [
  {
    name: "Channel Sales",
    count: 8,
    items: [
      {
        id: "TSK-152",
        title: "Documentation for onboarding customer journey",
        project: "Channel Sales",
        status: "Backlog",
        statusValue: "backlog",
        priority: "Medium",
        priorityValue: "medium",
        due: "Apr 12",
        dueDate: "2026-04-12T12:00:00",
        startDate: "2026-04-05T10:00:00",
        createdAt: "2026-03-25T08:10:00",
        updatedAt: "2026-03-30T17:20:00",
      },
      {
        id: "TSK-111",
        title: "Quoting process audit and terminology cleanup",
        project: "Channel Sales",
        status: "Backlog",
        statusValue: "backlog",
        priority: "Low",
        priorityValue: "low",
        due: "Apr 14",
        dueDate: "2026-04-14T16:00:00",
        startDate: "2026-04-08T11:00:00",
        createdAt: "2026-03-23T09:45:00",
        updatedAt: "2026-03-28T11:40:00",
      },
      {
        id: "TSK-107",
        title: "Onboarding process checklist and decision notes",
        project: "Channel Sales",
        status: "In progress",
        statusValue: "in_progress",
        priority: "High",
        priorityValue: "high",
        due: "Apr 18",
        dueDate: "2026-04-18T17:00:00",
        startDate: "2026-04-01T08:30:00",
        createdAt: "2026-03-21T15:20:00",
        updatedAt: "2026-04-01T09:30:00",
      },
      {
        id: "TSK-154",
        title: "Partner enablement FAQ alignment",
        project: "Channel Sales",
        status: "Todo",
        statusValue: "todo",
        priority: "Urgent",
        priorityValue: "urgent",
        due: "1 day overdue",
        dueDate: "2026-03-31T13:00:00",
        startDate: "2026-04-02T09:30:00",
        createdAt: "2026-03-30T08:10:00",
        updatedAt: "2026-04-01T11:10:00",
      },
      {
        id: "TSK-160",
        title: "Restructure onboarding objection handling notes",
        project: "Channel Sales",
        status: "Todo",
        statusValue: "todo",
        priority: "Medium",
        priorityValue: "medium",
        due: "Apr 6",
        dueDate: "2026-04-06T16:30:00",
        startDate: "2026-04-03T10:30:00",
        createdAt: "2026-03-29T15:25:00",
        updatedAt: "2026-04-01T07:40:00",
      },
      {
        id: "TSK-168",
        title: "Review draft of partner deal registration copy",
        project: "Channel Sales",
        status: "Backlog",
        statusValue: "backlog",
        priority: "Low",
        priorityValue: "low",
        due: "Apr 10",
        dueDate: "2026-04-10T12:00:00",
        startDate: "2026-04-07T09:00:00",
        createdAt: "2026-03-27T11:10:00",
        updatedAt: "2026-03-31T14:20:00",
      },
    ],
  },
  {
    name: "Partner Portal",
    count: 5,
    items: [
      {
        id: "TSK-209",
        title: "Convert XenServer customers to the new packaging model",
        project: "Partner Portal",
        status: "Todo",
        statusValue: "todo",
        priority: "High",
        priorityValue: "high",
        due: "Week 1",
        dueDate: "2026-04-07T12:00:00",
        startDate: "2026-04-02T09:00:00",
        createdAt: "2026-03-31T10:00:00",
        updatedAt: "2026-04-01T08:05:00",
      },
      {
        id: "TSK-217",
        title: "Cloud template guide for pay-as-you-go questions",
        project: "Partner Portal",
        status: "Todo",
        statusValue: "todo",
        priority: "Medium",
        priorityValue: "medium",
        due: "Week 1",
        dueDate: "2026-04-07T18:00:00",
        startDate: "2026-04-03T13:00:00",
        createdAt: "2026-03-29T12:40:00",
        updatedAt: "2026-03-31T16:50:00",
      },
      {
        id: "TSK-224",
        title: "Draft partner communications note",
        project: "Partner Portal",
        status: "In progress",
        statusValue: "in_progress",
        priority: "Medium",
        priorityValue: "medium",
        due: "Apr 3",
        dueDate: "2026-04-03T15:00:00",
        startDate: "2026-04-01T10:00:00",
        createdAt: "2026-03-30T12:10:00",
        updatedAt: "2026-04-01T12:05:00",
      },
      {
        id: "TSK-229",
        title: "Review task hierarchy edge cases",
        project: "Partner Portal",
        status: "Backlog",
        statusValue: "backlog",
        priority: "Low",
        priorityValue: "low",
        due: "Apr 8",
        dueDate: "2026-04-08T11:00:00",
        startDate: "2026-04-04T09:00:00",
        createdAt: "2026-03-28T13:45:00",
        updatedAt: "2026-03-31T09:20:00",
      },
      {
        id: "TSK-231",
        title: "Prepare rollout note for reseller support",
        project: "Partner Portal",
        status: "Todo",
        statusValue: "todo",
        priority: "High",
        priorityValue: "high",
        due: "1 day overdue",
        dueDate: "2026-03-31T17:00:00",
        startDate: "2026-04-02T14:00:00",
        createdAt: "2026-03-31T09:10:00",
        updatedAt: "2026-04-01T10:55:00",
      },
    ],
  },
  {
    name: "Internal Ops",
    count: 5,
    items: [
      {
        id: "TSK-176",
        title: "Prepare status update for service management sync",
        project: "Internal Ops",
        status: "Todo",
        statusValue: "todo",
        priority: "Low",
        priorityValue: "low",
        due: "Today, 18:00",
        dueDate: "2026-04-01T18:00:00",
        startDate: "2026-04-01T13:00:00",
        createdAt: "2026-03-27T16:30:00",
        updatedAt: "2026-03-31T17:45:00",
      },
      {
        id: "TSK-188",
        title: "Consolidate weekly operations review inputs",
        project: "Internal Ops",
        status: "In progress",
        statusValue: "in_progress",
        priority: "High",
        priorityValue: "high",
        due: "Apr 2",
        dueDate: "2026-04-02T12:00:00",
        startDate: "2026-04-01T09:00:00",
        createdAt: "2026-03-29T10:20:00",
        updatedAt: "2026-04-01T11:00:00",
      },
      {
        id: "TSK-191",
        title: "Document incident follow-up checklist",
        project: "Internal Ops",
        status: "Backlog",
        statusValue: "backlog",
        priority: "Medium",
        priorityValue: "medium",
        due: "Apr 9",
        dueDate: "2026-04-09T15:00:00",
        startDate: "2026-04-05T09:30:00",
        createdAt: "2026-03-26T12:30:00",
        updatedAt: "2026-03-30T17:25:00",
      },
      {
        id: "TSK-194",
        title: "Rework service desk handoff template",
        project: "Internal Ops",
        status: "Todo",
        statusValue: "todo",
        priority: "Urgent",
        priorityValue: "urgent",
        due: "2 days overdue",
        dueDate: "2026-03-30T10:30:00",
        startDate: "2026-04-01T08:00:00",
        createdAt: "2026-03-31T08:45:00",
        updatedAt: "2026-04-01T09:50:00",
      },
    ],
  },
  {
    name: "Service Management",
    count: 3,
    items: [
      {
        id: "TSK-145",
        title: "Review delayed migration notes for customer rollout",
        project: "Service Management",
        status: "In progress",
        statusValue: "in_progress",
        priority: "Urgent",
        priorityValue: "urgent",
        due: "2 days overdue",
        dueDate: "2026-03-30T12:00:00",
        startDate: "2026-03-26T10:00:00",
        createdAt: "2026-03-20T10:00:00",
        updatedAt: "2026-04-01T08:15:00",
      },
      {
        id: "TSK-171",
        title: "Validate rollback notes for managed customers",
        project: "Service Management",
        status: "Todo",
        statusValue: "todo",
        priority: "High",
        priorityValue: "high",
        due: "Apr 2",
        dueDate: "2026-04-02T14:30:00",
        startDate: "2026-04-01T09:15:00",
        createdAt: "2026-03-30T14:00:00",
        updatedAt: "2026-04-01T10:25:00",
      },
      {
        id: "TSK-182",
        title: "Capture final customer rollout sequence",
        project: "Service Management",
        status: "Backlog",
        statusValue: "backlog",
        priority: "Medium",
        priorityValue: "medium",
        due: "Apr 11",
        dueDate: "2026-04-11T11:30:00",
        startDate: "2026-04-07T11:00:00",
        createdAt: "2026-03-28T10:10:00",
        updatedAt: "2026-03-31T13:40:00",
      },
    ],
  },
];

export const DEFAULT_ACTIVE_PROJECTS: MockProject[] = [
  {
    id: "1",
    name: "Channel Sales",
    description: "Partner-facing onboarding, quoting, and documentation work for the sales channel.",
    taskCount: 8,
    updatedLabel: "Updated 2h ago",
  },
  {
    id: "2",
    name: "Partner Portal",
    description: "Packaging, migration guidance, and partner communication assets for the portal refresh.",
    taskCount: 5,
    updatedLabel: "Updated today",
  },
  {
    id: "3",
    name: "Internal Ops",
    description: "Internal workflow cleanup, status updates, and coordination tasks across operations.",
    taskCount: 5,
    updatedLabel: "Updated yesterday",
  },
  {
    id: "4",
    name: "Service Management",
    description: "Customer rollout stabilization, service handoff notes, and migration coordination.",
    taskCount: 3,
    updatedLabel: "Updated 3h ago",
  },
];

export const DEFAULT_ARCHIVED_PROJECTS: MockProject[] = [
  {
    id: "5",
    name: "Partner Training",
    description: "Archived enablement project preserved for historical reference and task lookup.",
    taskCount: 4,
    isArchived: true,
    updatedLabel: "Archived last month",
  },
  {
    id: "6",
    name: "Legacy Rollout Notes",
    description: "Older rollout planning work no longer active on the current dashboard.",
    taskCount: 7,
    isArchived: true,
    updatedLabel: "Archived 2 months ago",
  },
];

export const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="3.5" y="3.5" width="5.5" height="5.5" rx="1.2" />
        <rect x="11" y="3.5" width="5.5" height="8.5" rx="1.2" />
        <rect x="3.5" y="11" width="5.5" height="5.5" rx="1.2" />
        <rect x="11" y="14" width="5.5" height="2.5" rx="1" />
      </svg>
    ),
  },
  {
    id: "projects",
    label: "Projects",
    icon: (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M3.5 6.5h5l1.6-2h6.4v9.8a1.7 1.7 0 0 1-1.7 1.7H5.2a1.7 1.7 0 0 1-1.7-1.7z" />
        <path d="M3.5 6.5v-1.3a1.7 1.7 0 0 1 1.7-1.7h3" />
      </svg>
    ),
  },
  {
    id: "search",
    label: "Search",
    icon: (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="8.5" cy="8.5" r="4.5" />
        <path d="m12 12 4 4" />
      </svg>
    ),
  },
];

export const DEFAULT_TASK_DETAILS: Record<string, TaskDetails> = {
  "TSK-214": {
    description:
      "Prepare the pricing narrative and final partner-facing notes for the Q2 review. Include approval constraints, timeline implications, and the partner handoff summary.",
    parentTask: "Channel Sales roadmap refresh",
    labels: ["pricing", "partner", "q2-review"],
    startDateValue: "2026-03-31",
    dueDateValue: "2026-04-01",
  },
  "TSK-198": {
    description:
      "Confirm ownership of the onboarding checklist and document the final responsibilities before rollout.",
    parentTask: "Partner Portal launch prep",
    labels: ["onboarding", "ownership"],
    startDateValue: "2026-04-01",
    dueDateValue: "2026-04-01",
  },
  "TSK-176": {
    description:
      "Draft the internal status update for the service management sync, including blockers and next actions.",
    parentTask: "Internal Ops weekly sync",
    labels: ["internal-ops", "status-update"],
    startDateValue: "2026-04-01",
    dueDateValue: "2026-04-01",
  },
  "TSK-145": {
    description:
      "Review migration notes, fix rollout sequencing issues, and align customer instructions before the next deployment window.",
    parentTask: "Customer rollout stabilization",
    labels: ["migration", "rollout", "customer"],
    startDateValue: "2026-03-26",
    dueDateValue: "2026-03-30",
  },
  "TSK-103": {
    description:
      "Resolve the remaining open questions in the payment handoff document so finance and delivery can move without follow-up clarification.",
    parentTask: "Payment handoff review",
    labels: ["payments", "handoff"],
    startDateValue: "2026-03-30",
    dueDateValue: "2026-03-31",
  },
  "TSK-152": {
    description:
      "Document the onboarding customer journey clearly enough that both sales and delivery can follow the same path.",
    parentTask: "Channel Sales onboarding initiative",
    labels: ["documentation", "journey"],
    startDateValue: "2026-04-05",
    dueDateValue: "2026-04-12",
  },
  "TSK-111": {
    description:
      "Audit the quoting process wording and standardize terminology used across the channel-facing materials.",
    parentTask: "Channel Sales onboarding initiative",
    labels: ["quoting", "terminology"],
    startDateValue: "2026-04-08",
    dueDateValue: "2026-04-14",
  },
  "TSK-107": {
    description:
      "Capture the final onboarding decisions and turn them into a practical checklist ready for team review.",
    parentTask: "Channel Sales onboarding initiative",
    labels: ["onboarding", "checklist"],
    startDateValue: "2026-04-01",
    dueDateValue: "2026-04-18",
  },
  "TSK-209": {
    description:
      "Define how XenServer customers move to the new packaging model and note any exceptions that require account-specific handling.",
    parentTask: "Partner Portal packaging revision",
    labels: ["xenserver", "packaging"],
    startDateValue: "2026-04-02",
    dueDateValue: "2026-04-07",
  },
  "TSK-217": {
    description:
      "Write the pay-as-you-go guidance for the cloud template so implementation teams can answer partner questions consistently.",
    parentTask: "Partner Portal cloud pricing docs",
    labels: ["cloud", "guide", "partners"],
    startDateValue: "2026-04-03",
    dueDateValue: "2026-04-07",
  },
};
