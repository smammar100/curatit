import type { Metadata } from "next";
import Text from "@/components/fundations/elements/Text";
import Button, { type ButtonSize, type ButtonVariant } from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
import { Plus } from "@/components/fundations/icons";
import type { IconSize } from "@/components/fundations/icons";

export const metadata: Metadata = {
  title: "Buttons",
  description: "Every button size and variant in the system.",
};

const sizes: { size: ButtonSize; label: string; icon: IconSize }[] = [
  { size: "xxs", label: "XXS", icon: "sm" },
  { size: "xs", label: "XS", icon: "sm" },
  { size: "sm", label: "SM", icon: "base" },
  { size: "base", label: "Base", icon: "base" },
  { size: "md", label: "MD", icon: "lg" },
  { size: "lg", label: "LG", icon: "xl" },
  { size: "xl", label: "XL", icon: "xl" },
];

const variants: { variant: ButtonVariant; label: string }[] = [
  { variant: "default", label: "Default" },
  { variant: "accent", label: "Accent" },
  { variant: "muted", label: "Muted" },
];

export default function ButtonsPage() {
  return (
    <section>
      <Wrapper variant="standard" className="py-24 lg:pt-48">
        <Text tag="h1" variant="displayLG" className="text-base-900 font-display font-thin">
          Buttons
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 text-base-600 mt-12">
          {variants.map(({ variant, label }) => (
            <div key={variant} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <Text tag="p" variant="textXS" className="font-medium uppercase text-base-600">
                  {label} text
                </Text>
                <div className="flex flex-col mt-2 gap-4">
                  {sizes.map(({ size, label: sizeLabel }) => (
                    <Button key={size} size={size} variant={variant}>
                      {label} {sizeLabel}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Text tag="p" variant="textXS" className="font-medium uppercase text-base-600">
                  Icon
                </Text>
                <div className="flex flex-col mt-2 gap-4">
                  {sizes.map(({ size, icon }) => (
                    <Button
                      key={size}
                      size={size}
                      variant={variant}
                      iconOnly
                      aria-label={`${label} ${size}`}
                      icon={<Plus size={icon} />}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Wrapper>
    </section>
  );
}
