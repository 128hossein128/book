import type { BookCategory } from "./types";

export function normalizeTitle(value: unknown) {
  if (typeof value !== "string") return null;
  const title = value.trim().replace(/\s+/g, " ");
  if (title.length < 1 || title.length > 160) return null;
  return title;
}

export function normalizeCategory(value: unknown): BookCategory | null {
  return value === "public" || value === "basij" ? value : null;
}
