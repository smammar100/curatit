import type { Metadata } from "next";
import PageHeader from "@/components/fundations/containers/PageHeader";
import Wrapper from "@/components/fundations/containers/Wrapper";
import { fontWeights } from "@/lib/font-weight";

export const metadata: Metadata = {
  title: "Typography",
  description: "Hedvig Letters Serif for headings, Inter for everything else.",
};

// Class names are written out in full so Tailwind's scanner generates them.
const serifRoles = [
  {
    className: "heading-hero",
    size: "48px, 34px on mobile",
    use: "The landing hero only.",
    sample: "Research campaigns that already worked",
  },
  {
    className: "heading-display",
    size: "28px, 22px on mobile",
    use: "Page titles, through PageHeader. EmptyState titles.",
    sample: "Library",
  },
  {
    className: "heading-section",
    size: "22px",
    use: "Section headings inside a page.",
    sample: "Category coverage",
  },
];

const interRoles = [
  {
    size: "16px",
    className: "text-[16px] leading-6",
    role: "Title",
    use: "Component titles: cards, dialogs. Semibold.",
    sample: "Maison Vire",
  },
  {
    size: "14px",
    className: "text-[14px] leading-6",
    role: "Subtitle",
    use: "Reading copy and page leads.",
    sample: "Pick up your research where you left it.",
  },
  {
    size: "13px",
    className: "text-[13px] leading-5",
    role: "Body",
    use: "The default for controls, rows and app copy.",
    sample: "24 posts saved to 2 boards",
  },
  {
    size: "12px",
    className: "text-[12px] leading-4",
    role: "Caption",
    use: "Metadata, compact controls, captions.",
    sample: "Posted 22 Sept 2026",
  },
];

const weights = [
  { name: "normal", value: fontWeights.normal },
  { name: "medium", value: fontWeights.medium },
  { name: "semibold", value: fontWeights.semibold },
  { name: "bold", value: fontWeights.bold },
] as const;

export default function TypographyPage() {
  return (
    <Wrapper variant="standard" className="pb-24">
      <PageHeader
        title="Typography"
        description="Hedvig Letters Serif sets headings. Inter sets everything you read or press."
      />

      <section aria-labelledby="serif-heading">
        <h2 id="serif-heading" className="heading-section text-foreground">
          Serif headings
        </h2>
        <p className="mt-1 max-w-2xl text-[13px] leading-5 text-muted-foreground">
          3 roles at weight 400. Never bold them, and never use the serif on buttons, labels, card titles or body copy.
        </p>
        <ul className="mt-6 flex flex-col">
          {serifRoles.map((role) => (
            <li
              key={role.className}
              className="grid grid-cols-1 gap-3 border-t border-border py-6 md:grid-cols-[14rem_1fr] md:gap-8"
            >
              <div>
                <p className="text-[13px] leading-5 text-foreground">
                  <code>{role.className}</code>
                </p>
                <p className="mt-1 text-[12px] leading-4 text-muted-foreground tabular-nums">{role.size}</p>
                <p className="mt-1 text-[12px] leading-4 text-muted-foreground">{role.use}</p>
              </div>
              <p className={`${role.className} min-w-0 text-foreground`}>{role.sample}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="inter-heading" className="mt-12">
        <h2 id="inter-heading" className="heading-section text-foreground">
          Inter roles
        </h2>
        <p className="mt-1 max-w-2xl text-[13px] leading-5 text-muted-foreground">
          4 sizes, each shown at the 4 weights from <code>fontWeights</code>. Set weight with{" "}
          <code>fontVariationSettings</code>, never <code>font-semibold</code> or <code>font-bold</code>.
        </p>
        <ul className="mt-6 flex flex-col">
          {interRoles.map((role) => (
            <li
              key={role.size}
              className="grid grid-cols-1 gap-3 border-t border-border py-6 md:grid-cols-[14rem_1fr] md:gap-8"
            >
              <div>
                <p className="text-[13px] leading-5 text-foreground" style={{ fontVariationSettings: fontWeights.medium }}>
                  {role.role} <span className="text-muted-foreground tabular-nums">{role.size}</span>
                </p>
                <p className="mt-1 text-[12px] leading-4 text-muted-foreground">
                  <code>{role.className}</code>
                </p>
                <p className="mt-1 text-[12px] leading-4 text-muted-foreground">{role.use}</p>
              </div>
              <dl className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[6rem_1fr] sm:gap-x-4">
                {weights.map((weight) => (
                  <div key={weight.name} className="contents">
                    <dt className="text-[12px] leading-4 text-muted-foreground sm:self-center">
                      <code>{weight.name}</code>
                    </dt>
                    <dd className={`${role.className} min-w-0 truncate text-foreground`} style={{ fontVariationSettings: weight.value }}>
                      {role.sample}
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="weights-heading" className="mt-12">
        <h2 id="weights-heading" className="heading-section text-foreground">
          Weights
        </h2>
        <p className="mt-1 max-w-2xl text-[13px] leading-5 text-muted-foreground">
          Each weight pairs <code>wght</code> with an optical size, so a label gets heavier without getting wider.
        </p>
        <ul className="mt-6 grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-4">
          {weights.map((weight) => (
            <li key={weight.name} className="border-t border-border pt-4">
              <p className="text-[16px] leading-6 text-foreground" style={{ fontVariationSettings: weight.value }}>
                Saved to 2 boards
              </p>
              <p className="mt-2 text-[12px] leading-4 text-muted-foreground">
                <code>fontWeights.{weight.name}</code>
              </p>
              <p className="mt-1 text-[12px] leading-4 text-muted-foreground tabular-nums">{weight.value}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="details-heading" className="mt-12">
        <h2 id="details-heading" className="heading-section text-foreground">
          Details
        </h2>
        <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
          <div className="border-t border-border pt-4">
            <dt className="text-[13px] leading-5 text-foreground" style={{ fontVariationSettings: fontWeights.medium }}>
              Numbers that line up
            </dt>
            <dd className="mt-2 text-[13px] leading-5 text-muted-foreground">
              Add <code>tabular-nums</code> to counts, prices and dates.
            </dd>
            <dd className="mt-3 flex gap-6 text-[13px] leading-5 text-foreground">
              <span className="flex flex-col">
                <span className="text-[12px] leading-4 text-muted-foreground">Tabular</span>
                <span className="tabular-nums">1,111</span>
                <span className="tabular-nums">8,088</span>
              </span>
              <span className="flex flex-col">
                <span className="text-[12px] leading-4 text-muted-foreground">Proportional</span>
                <span>1,111</span>
                <span>8,088</span>
              </span>
            </dd>
          </div>
          <div className="border-t border-border pt-4">
            <dt className="text-[13px] leading-5 text-foreground" style={{ fontVariationSettings: fontWeights.medium }}>
              Balanced headings
            </dt>
            <dd className="mt-2 text-[13px] leading-5 text-muted-foreground">
              <code>h1</code>, <code>h2</code> and <code>h3</code> wrap with <code>text-wrap: balance</code>, and paragraphs
              with <code>pretty</code>.
            </dd>
          </div>
          <div className="border-t border-border pt-4">
            <dt className="text-[13px] leading-5 text-foreground" style={{ fontVariationSettings: fontWeights.medium }}>
              Sentence case
            </dt>
            <dd className="mt-2 text-[13px] leading-5 text-muted-foreground">
              Every heading, label and button. Count first, plain words, no em dashes.
            </dd>
          </div>
        </dl>
      </section>
    </Wrapper>
  );
}
