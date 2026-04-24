const LABEL_COLOR_PALETTE = [
  "#0f766e",
  "#227a59",
  "#b27a1a",
  "#7c8b84",
  "#0c6b74",
  "#8c6d1f",
] as const;

export function normalizeLabelNames(names: string[]) {
  return [...new Set(names.map((name) => name.trim()).filter(Boolean))];
}

export function generateLabelColor(name: string) {
  let hash = 0;

  for (const char of name.trim().toLowerCase()) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return LABEL_COLOR_PALETTE[hash % LABEL_COLOR_PALETTE.length];
}
