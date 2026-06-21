import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function appendIdToStorage(key: string, id: string | undefined) {
  if (!id) return;
  try {
    const raw = localStorage.getItem(key);
    const existing: string[] = raw ? JSON.parse(raw) : [];
    if (!existing.includes(id)) {
      existing.push(id);
      localStorage.setItem(key, JSON.stringify(existing));
    }
  } catch {
    // localStorage can throw in private-browsing/quota-exceeded cases.
    // Non-critical — tracking is best-effort, so we swallow silently.
  }
}