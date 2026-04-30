export function slugifyWorkspaceName(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "workspace";
}

export function personalWorkspaceName(input: { name: string; email: string }) {
  const displayName = input.name.trim();

  if (displayName) {
    return displayName;
  }

  return input.email.split("@")[0]?.trim() || "Personal workspace";
}
