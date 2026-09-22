/**
 * Curatit wordmark, set in the theme's display serif. Replaces the inherited
 * Carbon vector mark until a drawn logo exists.
 */
export default function Logo({ className = "", as: Tag = "span" }: { className?: string; as?: "span" | "div" }) {
  return (
    <Tag className={`font-display leading-none tracking-tight ${className}`}>
      Curatit
    </Tag>
  );
}
