import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// shadcn's class helper: joins class values and lets later Tailwind classes override earlier ones.
// Components in src/components/ui import it from "@/lib/utils".
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
