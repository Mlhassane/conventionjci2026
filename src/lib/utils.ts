import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Utility class combiner used by the shadcn/ui components. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
