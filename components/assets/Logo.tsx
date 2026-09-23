import Symbol from "./Symbol";

/**
 * Curatit lockup: the asterisk symbol beside the name in the serif. Single
 * ink, follows currentColor.
 */
export default function Logo({ className = "", as: Tag = "span" }: { className?: string; as?: "span" | "div" }) {
  return (
    <Tag className={`inline-flex items-center gap-2 leading-none ${className}`}>
      <Symbol className="size-[18px] shrink-0" aria-hidden="true" />
      <span className="font-serif text-[22px] tracking-[-0.01em]">Curatit</span>
    </Tag>
  );
}
