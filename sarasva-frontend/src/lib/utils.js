import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * shadcn/ui utility: merges Tailwind classes without conflicts.
 * Usage: cn("px-2", isActive && "bg-primary", className)
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
