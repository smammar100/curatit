// Assets
import Logo from "./Logo";
import Symbol from "./Symbol";
import { cx } from "@/lib/cx";

// The full logo: the mark beside the "Curatit" wordmark. Sized by the wordmark's height
// (h-4 by default); the mark is a little taller so it reads at the same optical weight.
export default function Lockup({ className }: { className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-2.5 text-base-900", className)}>
      <Symbol className="size-5 shrink-0" aria-hidden="true" />
      <Logo className="h-4" aria-hidden="true" />
    </span>
  );
}
