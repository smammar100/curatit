// /system/brand: the mark, the wordmark and the lockup (src/components/assets), in both themes. All
// three are SVG that draw in the text colour, so each theme gets its own ink with no extra classes
import Lockup from "@/components/assets/Lockup";
import Logo from "@/components/assets/Logo";
import Symbol from "@/components/assets/Symbol";
import { Matrix, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection } from "../SheetParts";

const USES = [
  { label: <Mono>{"<Lockup />"}</Mono>, sub: "Top of a page", specimen: <Lockup />, size: "102 × 20", where: "Both navigations, the auth card, the share page" },
  {
    label: <Mono>Symbol size-8</Mono>,
    sub: "Dashboard header",
    specimen: <Symbol className="size-8" aria-hidden="true" />,
    size: "32",
    where: "Where the name would crowd the tabs and search",
  },
  {
    label: <Mono>Symbol size-7</Mono>,
    sub: "Welcome flow",
    specimen: <Symbol className="size-7" aria-hidden="true" />,
    size: "28",
    where: "Centred over the questions",
  },
  {
    label: <Mono>Symbol size-6</Mono>,
    sub: "Beside another app",
    specimen: <Symbol className="size-6" aria-hidden="true" />,
    size: "24",
    where: "Paired with a client's mark: the OAuth consent screen, the MCP install card",
  },
  {
    label: <Mono>Symbol size-5</Mono>,
    sub: "Smallest",
    specimen: <Symbol className="size-5" aria-hidden="true" />,
    size: "20",
    where: "The homepage's small dashboard; never smaller as the logo",
  },
];

export default function Brand() {
  return (
    <SheetBody>
      <SheetHeader title="Brand">
        The mark, the &ldquo;Curatit&rdquo; wordmark in Hedvig, and the lockup that sets them side by side. They draw in
        the text colour of wherever they sit, so they take no colour class.
      </SheetHeader>

      <SheetSection title="The three parts">
        <Sheet split>
          {() => (
            <div className="flex flex-wrap items-end gap-10 text-text-1">
              <figure className="flex flex-col gap-2">
                <Symbol className="size-10" aria-hidden="true" />
                <figcaption className="type-caption text-text-2">Symbol</figcaption>
              </figure>
              <figure className="flex flex-col gap-2">
                <Logo className="h-8 w-auto" aria-hidden="true" />
                <figcaption className="type-caption text-text-2">Logo, never alone</figcaption>
              </figure>
              <figure className="flex flex-col gap-2">
                <Lockup />
                <figcaption className="type-caption text-text-2">Lockup</figcaption>
              </figure>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Where each appears">
        <Sheet>
          {() => (
            <Matrix
              columns={["Specimen", "Size in px", "Where"]}
              rows={USES.map((u) => ({
                label: u.label,
                sub: u.sub,
                cells: [
                  <span key="s" className="flex text-text-1">
                    {u.specimen}
                  </span>,
                  <span key="p" className="type-caption text-text-2">
                    {u.size}
                  </span>,
                  <span key="w" className="type-body-sm text-text-2">
                    {u.where}
                  </span>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Use the lockup once, at the top of a page that isn't the dashboard; it has one size and takes no class." },
            { kind: "do", text: "Leave at least the wordmark's height, 16px, clear on every side." },
            { kind: "dont", text: "Set the wordmark without the mark; in Hedvig it reads as one more heading." },
            { kind: "dont", text: "Colour, outline or recolour the mark, or draw it under 20px as the logo." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
