import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const PLACEHOLDER_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='100%' height='100%'><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23f4f4f5'/><stop offset='100%' stop-color='%23e4e4e7'/></linearGradient></defs><rect width='100%' height='100%' fill='url(%23g)'/><g transform='translate(176, 176)' stroke='%23a1a1aa' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'><path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'/><polyline points='3.27 6.96 12 12.01 20.73 6.96'/><line x1='12' y1='22.08' x2='12' y2='12'/></g></svg>";

export function isValidRedirectPath(path: string | undefined | null): boolean {
  if (!path) return false;
  return (
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.startsWith("\\") &&
    !/^https?:\/\//i.test(path)
  );
}

