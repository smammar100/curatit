import type { Metadata } from "next";
import Text, { type TextVariant } from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";

export const metadata: Metadata = {
  title: "Typography",
  description: "The Inter + Hedvig Letters Serif type scale.",
};

const textScale: { variant: TextVariant; label: string }[] = [
  { variant: "textXS", label: "Text XS" },
  { variant: "textSM", label: "Text SM" },
  { variant: "textBase", label: "Text MD" },
  { variant: "textBase", label: "Text Base" },
  { variant: "textLG", label: "Text LG" },
  { variant: "textXL", label: "Text XL" },
];

const displayScale: { variant: TextVariant; label: string }[] = [
  { variant: "displayXS", label: "Display XS" },
  { variant: "displaySM", label: "Display SM" },
  { variant: "displayMD", label: "Display MD" },
  { variant: "displayLG", label: "Display LG" },
  { variant: "displayXL", label: "Display XL" },
  { variant: "display2XL", label: "Display 2XL" },
  { variant: "display3XL", label: "Display 3XL" },
  { variant: "display4XL", label: "Display 4XL" },
  { variant: "display5XL", label: "Display 5XL" },
  { variant: "display6XL", label: "Display 6XL" },
];

export default function TypographyPage() {
  return (
    <section>
      <Wrapper variant="standard" className="py-24 lg:pt-48">
        <Text tag="h1" variant="displayLG" className="text-base-900 font-display font-thin">
          Typography: Inter &amp; Hedvig Letters Serif
        </Text>
        <div className="flex flex-col divide-y divide-base-200 text-base-900 font-medium mt-12">
          {textScale.map((item) => (
            <div key={item.label} className="py-4">
              <Text tag="p" variant={item.variant}>
                {item.label}
              </Text>
            </div>
          ))}
          {displayScale.map((item) => (
            <div key={item.label} className="py-4">
              <Text tag="p" variant={item.variant} className="font-display font-light">
                {item.label}
              </Text>
            </div>
          ))}
        </div>
      </Wrapper>
    </section>
  );
}
