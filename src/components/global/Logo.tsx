import Text from "@/components/fundations/elements/Text";

export default function Logo() {
  return (
    <Text
      tag="a"
      href="/"
      variant="textBase"
      className="inline-flex items-center font-bold text-base-1300 uppercase gap-3 group-hover:opacity-80"
    >
      trendspotter
    </Text>
  );
}
