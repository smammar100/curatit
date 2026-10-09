// Fundations
import Text, { type TextVariant } from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";

const samples: { label: string; variant: TextVariant; display?: boolean; tag?: "p" | "h1" }[] = [
  { label: "Text XS", variant: "textXS" },
  { label: "Text SM", variant: "textSM" },
  { label: "Text MD", variant: "textBase" },
  { label: "Text Base", variant: "textBase" },
  { label: "Text LG", variant: "textLG" },
  { label: "Text XL", variant: "textXL" },
  { label: "Display XS", variant: "displayXS", display: true },
  { label: "Display SM", variant: "displaySM", display: true },
  { label: "Display MD", variant: "displayMD", display: true },
  { label: "Display LG", variant: "displayLG", display: true },
  { label: "Display XL", variant: "displayXL", display: true, tag: "h1" },
  { label: "Display 2XL", variant: "display2XL", display: true },
  { label: "Display 3XL", variant: "display3XL", display: true },
  { label: "Display 4XL", variant: "display4XL", display: true },
  { label: "Display 5XL", variant: "display5XL", display: true },
  { label: "Display 6XL", variant: "display6XL", display: true },
];

export default function TypographyPage() {
  return (
    <section>
      <Wrapper variant="standard" className="py-24 lg:pt-48">
        <Text tag="h1" variant="displayLG" className="text-base-900 font-display font-thin">
          Typography: Inter &amp; Hedvig Letters Serif
        </Text>

        <div className="flex flex-col divide-y divide-base-200 text-base-900 font-medium mt-12">
          {samples.map((sample) => (
            <div key={sample.label} className="py-4">
              <Text
                tag={sample.tag ?? "p"}
                variant={sample.variant}
                className={sample.display ? "font-display font-light" : undefined}
              >
                {sample.label}
              </Text>
            </div>
          ))}
        </div>
      </Wrapper>
    </section>
  );
}
