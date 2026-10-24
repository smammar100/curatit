// /system/avatar: Glaze's Avatar and AvatarGroup (src/components/glaze/ui/avatar). Rules from
// glaze-docs/avatar.md
import { Avatar, AvatarGroup } from "@/components/glaze/ui/avatar";
import { Example, Matrix, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection, Specimen } from "../SheetParts";

const SIZES = ["xs", "sm", "default", "lg"] as const;
const TYPES = [
  { type: "person", name: "Syed Ammar", sub: "Round, initials until the picture loads" },
  { type: "agent", name: "Creative analysis", sub: "Square, the bot glyph" },
  { type: "source", name: "Instagram", sub: "Square, the globe glyph" },
] as const;
const PEOPLE = ["Syed Ammar", "Maya Chen", "Jonas Berg", "Ana Ruiz", "Lee Park", "Sam Ode"];

export default function AvatarSheet() {
  return (
    <SheetBody>
      <SheetHeader title="Avatar" importLine={`import {Avatar, AvatarGroup} from '@/components/glaze/ui/avatar'`}>
        Shows who or what acted: a person round, with their picture or initials; an agent or a source square, with its
        glyph. The fallback is grey for everyone, never a colour picked from the name.
      </SheetHeader>

      <SheetSection title="Types and sizes" description="16, 20, 24 and 32px.">
        <Sheet>
          {() => (
            <Matrix
              columns={SIZES}
              rows={[
                ...TYPES.map((t) => ({
                  label: <Mono>{t.type}</Mono>,
                  sub: t.sub,
                  cells: SIZES.map((size) => <Avatar key={size} type={t.type} name={t.name} size={size} />),
                })),
                {
                  label: <Mono>src</Mono>,
                  sub: "A picture from our own origin",
                  cells: SIZES.map((size) => <Avatar key={size} name="Syed Ammar" src="/images/avatar.jpeg" size={size} />),
                },
              ]}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="A group" description="More than three in a group with a label and a max; the rest are a count that names them.">
        <Sheet split>
          {() => (
            <div className="flex flex-wrap gap-8">
              <Specimen label="max 4">
                <AvatarGroup label="Editors" max={4}>
                  {PEOPLE.map((p) => (
                    <Avatar key={p} name={p} />
                  ))}
                </AvatarGroup>
              </Specimen>
              <Specimen label="lg">
                <AvatarGroup label="Editors" max={3} size="lg">
                  {PEOPLE.slice(0, 3).map((p) => (
                    <Avatar key={p} name={p} size="lg" />
                  ))}
                </AvatarGroup>
              </Specimen>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Example">
        <Example
          code={`<Avatar name={user.name} src={user.avatarUrl}/>
<Avatar type="agent" name="Creative analysis" size="sm"/>
<AvatarGroup label="Editors" max={4}>{editors.map(e => <Avatar key={e.id} name={e.name}/>)}</AvatarGroup>`}
        />
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Pass name on every Avatar, and decorative when the name is written beside it." },
            { kind: "do", text: "Set type agent for an agent and source for a page or a tool." },
            { kind: "do", text: "Use sm in a line of text, the default in a row, lg in a header." },
            { kind: "dont", text: "Colour a fallback by a hash of the name, or load a source's icon from a favicon service." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
