// /system/text-link: the site's one link component (fundations/elements/TextLink), kept through the move
// to Glaze and set on its tokens. Glaze has no link of its own; its links inherit
import TextLink from "@/components/fundations/elements/TextLink";
import { Example, Matrix, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection } from "../SheetParts";

export default function TextLinkSheet() {
  return (
    <SheetBody>
      <SheetHeader title="Text link" importLine={`import TextLink from '@/components/fundations/elements/TextLink'`}>
        A link that is words: somewhere to go, read as part of the text. Built on next/link, so an internal link is a
        client-side navigation. For an action use a Button; for a next step drawn as a button, a Button rendered as the
        link.
      </SheetHeader>

      <SheetSection title="Variants" description="Hover a link to see it darken. Focus draws Glaze's ink ring.">
        <Sheet>
          {() => (
            <Matrix
              align="start"
              columns={["Specimen", "External"]}
              rows={[
                {
                  label: <Mono>inline</Mono>,
                  sub: "Inside running text, the default",
                  cells: [
                    <p key="i" className="max-w-xs type-body text-text-2">
                      Read the <TextLink href="/vision">Vision</TextLink> for why the library is built this way.
                    </p>,
                    <p key="e" className="max-w-xs type-body text-text-2">
                      Supabase&rsquo;s{" "}
                      <TextLink href="https://supabase.com/docs" external>
                        documentation
                      </TextLink>{" "}
                      covers the rest.
                    </p>,
                  ],
                },
                {
                  label: <Mono>quiet</Mono>,
                  sub: "On its own or in a list",
                  cells: [
                    <TextLink key="q" href="/forgot-password" variant="quiet" className="type-body-sm">
                      Forgot password?
                    </TextLink>,
                    <TextLink key="qe" href="https://www.linkedin.com" variant="quiet" external className="type-body-sm">
                      LinkedIn
                    </TextLink>,
                  ],
                },
              ]}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Example">
        <Example
          code={`<TextLink href="/vision">Vision</TextLink>
<TextLink href="/forgot-password" variant="quiet">Forgot password?</TextLink>
<TextLink href="https://supabase.com/docs" external>documentation</TextLink>`}
        />
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Keep the underline on an inline link; it is what tells the link apart from the text." },
            { kind: "do", text: "Pass external for another site: it opens a new tab, adds the arrow and says so to screen readers." },
            { kind: "dont", text: "Colour a link with a brand accent or bold it; it takes the colour of the text around it." },
            { kind: "dont", text: "Use a link for an action that stays on the page." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
