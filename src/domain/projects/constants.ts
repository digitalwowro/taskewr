export const PROJECT_VIEWS = ["list", "board"] as const;

export type ProjectView = (typeof PROJECT_VIEWS)[number];
