import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...a: any[]) {
  return twMerge(clsx(a));
}
