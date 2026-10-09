// Fundations
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
// Icons
import Plus from "@/components/fundations/icons/Plus";

// Every Button size, in text and icon-only form, for each variant.
// Used by the /system/buttons and /system/links styleguide pages.

const sizes = [
  { size: "xxs", label: "XXS", icon: "sm" },
  { size: "xs", label: "XS", icon: "sm" },
  { size: "sm", label: "SM", icon: "base" },
  { size: "base", label: "Base", icon: "base" },
  { size: "md", label: "MD", icon: "lg" },
  { size: "lg", label: "LG", icon: "xl" },
  { size: "xl", label: "XL", icon: "xl" },
] as const;

const variants = [
  { variant: "default", label: "Default" },
  { variant: "accent", label: "Accent" },
  { variant: "muted", label: "Muted" },
] as const;

export default function ButtonShowcase({
  asLinks = false,
  labelClassName,
}: {
  asLinks?: boolean;
  labelClassName: string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 ext-base-600 mt-12">
      {variants.map(({ variant, label }) => (
        <div key={variant} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <Text tag="p" variant="textXS" className={labelClassName}>
              {label} text
            </Text>
            <div className="flex flex-col mt-2 gap-4">
              {sizes.map(({ size, label: sizeLabel }) =>
                asLinks ? (
                  <Button key={size} isLink href="#_" size={size} variant={variant}>
                    {label} {sizeLabel}
                  </Button>
                ) : (
                  <Button key={size} size={size} variant={variant}>
                    {label} {sizeLabel}
                  </Button>
                )
              )}
            </div>
          </div>
          <div>
            <Text tag="p" variant="textXS" className={labelClassName}>
              Icon
            </Text>
            <div className="flex flex-col mt-2 gap-4">
              {sizes.map(({ size, icon }) =>
                asLinks ? (
                  <Button key={size} isLink href="#_" size={size} variant={variant} iconOnly>
                    <Plus size={icon} />
                  </Button>
                ) : (
                  <Button key={size} size={size} variant={variant} iconOnly>
                    <Plus size={icon} />
                  </Button>
                )
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
