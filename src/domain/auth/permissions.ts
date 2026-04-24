export const PERMISSIONS = {
  workspaceView: "workspace:view",
  projectView: "project:view",
  projectEdit: "project:edit",
  taskView: "task:view",
  taskEdit: "task:edit",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
