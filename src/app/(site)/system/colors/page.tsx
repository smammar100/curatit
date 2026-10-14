// Fundations
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";

// Full class names so Tailwind can detect them
const palettes = [
  {
    name: "Accent",
    swatches: [
      { label: "Accent 50", className: "bg-accent-50" },
      { label: "Accent 100", className: "bg-accent-100" },
      { label: "Accent 200", className: "bg-accent-200" },
      { label: "Accent 300", className: "bg-accent-300" },
      { label: "Accent 400", className: "bg-accent-400" },
      { label: "Accent 500", className: "bg-accent-500" },
      { label: "Accent 600", className: "bg-accent-600" },
      { label: "Accent 700", className: "bg-accent-700" },
      { label: "Accent 800", className: "bg-accent-800" },
      { label: "Accent 900", className: "bg-accent-900" },
      { label: "Accent 950", className: "bg-accent-950" },
    ],
  },
  {
    name: "Base",
    swatches: [
      { label: "Base 50", className: "bg-base-50" },
      { label: "Base 100", className: "bg-base-100" },
      { label: "Base 200", className: "bg-base-200" },
      { label: "Base 300", className: "bg-base-300" },
      { label: "Base 400", className: "bg-base-400" },
      { label: "Base 500", className: "bg-base-500" },
      { label: "Base 600", className: "bg-base-600" },
      { label: "Base 700", className: "bg-base-700" },
      { label: "Base 800", className: "bg-base-800" },
      { label: "Base 900", className: "bg-base-900" },
      { label: "Base 950", className: "bg-base-950" },
    ],
  },
];

export default function ColorsPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <Wrapper variant="standard" className="page-start">
          <Text tag="h1" variant="displayLG" className="font-display font-light text-base-900 lg:w-1/3">
            Colors
          </Text>
        </Wrapper>
      </section>
      <section>
        <Wrapper variant="standard" className="pb-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {palettes.map((palette) => (
              <div key={palette.name}>
                <Text tag="p" variant="textBase" className="mt-4 text-base-900 text-balance">
                  {palette.name}
                </Text>
                <div className="mt-6 flex flex-col gap-2">
                  {palette.swatches.map((swatch) => (
                    <div key={swatch.label} className="inline-flex items-center gap-2">
                      <div className={`p-6 rounded-lg ${swatch.className}`}></div>
                      <span className="text-sm ext-base-600"> {swatch.label} </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Wrapper>
      </section>
    </>
  );
}
