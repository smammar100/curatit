import type { Metadata } from "next";
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";

export const metadata: Metadata = {
  title: "Colors",
  description: "The accent and base palettes.",
};

// Class names are written out in full so Tailwind's scanner can see them.
const accent = [
  { className: "bg-accent-50", label: "Accent 50" },
  { className: "bg-accent-100", label: "Accent 100" },
  { className: "bg-accent-200", label: "Accent 200" },
  { className: "bg-accent-300", label: "Accent 300" },
  { className: "bg-accent-400", label: "Accent 400" },
  { className: "bg-accent-500", label: "Accent 500" },
  { className: "bg-accent-600", label: "Accent 600" },
  { className: "bg-accent-700", label: "Accent 700" },
  { className: "bg-accent-800", label: "Accent 800" },
  { className: "bg-accent-900", label: "Accent 900" },
  { className: "bg-accent-950", label: "Accent 950" },
];

const base = [
  { className: "bg-base-50", label: "Base 50" },
  { className: "bg-base-100", label: "Base 100" },
  { className: "bg-base-200", label: "Base 200" },
  { className: "bg-base-300", label: "Base 300" },
  { className: "bg-base-400", label: "Base 400" },
  { className: "bg-base-500", label: "Base 500" },
  { className: "bg-base-600", label: "Base 600" },
  { className: "bg-base-700", label: "Base 700" },
  { className: "bg-base-800", label: "Base 800" },
  { className: "bg-base-900", label: "Base 900" },
  { className: "bg-base-950", label: "Base 950" },
];

function Swatches({ title, swatches }: { title: string; swatches: typeof accent }) {
  return (
    <div>
      <Text tag="p" variant="textBase" className="mt-4 text-base-900 text-balance">
        {title}
      </Text>
      <div className="mt-6 flex flex-col gap-2">
        {swatches.map((swatch) => (
          <div key={swatch.label} className="inline-flex items-center gap-2">
            <div className={`p-6 rounded-lg ${swatch.className}`} />
            <span className="text-sm text-base-600">{swatch.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ColorsPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <Wrapper variant="standard" className="pb-32 lg:pb-48 pt-24 lg:pt-48">
          <Text tag="h1" variant="displayLG" className="text-base-900 font-medium lg:w-1/3">
            Colors
          </Text>
        </Wrapper>
      </section>
      <section>
        <Wrapper variant="standard" className="pb-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Swatches title="Accent" swatches={accent} />
            <Swatches title="Base" swatches={base} />
          </div>
        </Wrapper>
      </section>
    </>
  );
}
