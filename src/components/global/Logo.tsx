import Text from "@/components/fundations/elements/Text";

export default function Logo() {
  return (
    <Text
      tag="a"
      href="/"
      variant="body"
      className="inline-flex items-center font-bold text-primary-foreground uppercase tracking-wider gap-3 group-hover:opacity-80"
    >
      trendspotter
    </Text>
  );
}
