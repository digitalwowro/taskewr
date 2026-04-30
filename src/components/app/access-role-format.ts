export const APP_ROLE_OPTIONS = [
  { value: "admin", label: "App Admin" },
  { value: "user", label: "App User" },
] as const;

export const WORKSPACE_ROLE_OPTIONS = [
  { value: "owner", label: "Workspace Owner" },
  { value: "admin", label: "Workspace Admin" },
  { value: "member", label: "Workspace Member" },
] as const;

export const PROJECT_ROLE_OPTIONS = [
  { value: "owner", label: "Project Owner" },
  { value: "admin", label: "Project Admin" },
  { value: "member", label: "Project Member" },
] as const;

export function workspaceRoleLabel(role: string) {
  return WORKSPACE_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}

export function projectRoleLabel(role: string) {
  return PROJECT_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}

export function appRoleLabel(role: string) {
  return APP_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}

export function appRoleTone(role: string) {
  return role === "admin" ? "green" : "neutral";
}

export function accessRoleTone(role: string) {
  if (role === "owner") {
    return "green" as const;
  }

  if (role === "admin") {
    return "blue" as const;
  }

  return "neutral" as const;
}
