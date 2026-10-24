// /system/card: Glaze's Card (src/components/glaze/ui/card) and Panel (src/components/glaze/ui/panel).
// Rules from glaze-docs/card.md and panel.md
import { Button } from "@/components/glaze/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardLink,
  CardMeta,
  CardTitle,
} from "@/components/glaze/ui/card";
import { Panel } from "@/components/glaze/ui/panel";
import { Icon, More } from "@/components/glaze/icon";
import { Example, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection, Specimen } from "../SheetParts";

const BOARDS = ["Spring launch", "Fintech onboarding", "Price slides"];

export default function CardSheet() {
  return (
    <SheetBody>
      <SheetHeader
        title="Card and panel"
        importLine={`import {Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardMeta} from '@/components/glaze/ui/card'
import {Panel} from '@/components/glaze/ui/panel'`}
      >
        A card groups content about one thing a person acts on: a grey shell with a paper panel 3px inside it, and an
        optional footer row on the shell. Panel is the paper box on its own, for a few rows.
      </SheetHeader>

      <SheetSection title="Shapes" description="The footer holds meta first, then size sm actions: flat secondaries, at most one primary.">
        <Sheet>
          {() => (
            <div className="grid gap-6 lg:grid-cols-2">
              <Specimen label="Header and content">
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle>Spring launch</CardTitle>
                    <CardDescription>Launch posts that open on the product and end on the price.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="type-body-sm text-text-2">12 posts from 7 brands</p>
                  </CardContent>
                </Card>
              </Specimen>
              <Specimen label="With a footer and a header action">
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle>New token</CardTitle>
                    <CardDescription>Read access for 90 days.</CardDescription>
                    <CardAction>
                      <Button size="icon-sm" variant="ghost" aria-label="More for this token">
                        <Icon icon={More} />
                      </Button>
                    </CardAction>
                  </CardHeader>
                  <CardFooter>
                    <CardMeta>Created just now</CardMeta>
                    <Button size="sm" variant="secondary">
                      Not now
                    </Button>
                    <Button size="sm">Create token</Button>
                  </CardFooter>
                </Card>
              </Specimen>
              <Specimen label="Rows run flush to the panel's edge">
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle>Your boards</CardTitle>
                  </CardHeader>
                  <CardContent flush>
                    <ul>
                      {BOARDS.map((b) => (
                        <li key={b} className="rule-row flex h-(--row) items-center px-3 type-body-sm">
                          {b}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </Specimen>
              <Specimen label="A card that opens a page: one tab stop, the ring round the shell">
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle>
                      <CardLink href="/system/card">Fintech onboarding</CardLink>
                    </CardTitle>
                    <CardDescription>9 posts, last saved yesterday.</CardDescription>
                  </CardHeader>
                </Card>
              </Specimen>
              <Specimen label="Two panels in one shell">
                <Card className="w-full">
                  <Panel>
                    <p className="type-label">Observed engagement</p>
                    <p className="type-body-sm text-text-2">4,218 likes, 63 comments</p>
                  </Panel>
                  <Panel>
                    <p className="type-label">Category</p>
                    <p className="type-body-sm text-text-2">Finance</p>
                  </Panel>
                </Card>
              </Specimen>
              <Specimen label="Panel on its own, with rows">
                <Panel padding="none" role="list" className="w-full">
                  {BOARDS.map((b) => (
                    <div key={b} role="listitem" className="rule-row flex h-(--row) items-center px-3 type-body-sm">
                      {b}
                    </div>
                  ))}
                </Panel>
              </Specimen>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Example">
        <Example
          code={`<Card>
  <CardHeader><CardTitle>New token</CardTitle><CardDescription>Read access for 90 days.</CardDescription></CardHeader>
  <CardFooter>
    <CardMeta>Created just now</CardMeta>
    <Button size="sm" variant="secondary">Not now</Button><Button size="sm">Create token</Button>
  </CardFooter>
</Card>`}
        />
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Group with space first; a card goes around one thing a person acts on." },
            { kind: "do", text: <>Use size sm on every Button in a CardFooter, after the <Mono>CardMeta</Mono>, and at most one primary.</> },
            { kind: "do", text: "Open a page from a card with CardLink in CardTitle, and put no Button in that card." },
            { kind: "do", text: "Give a Panel of rows padding none, role list and rule-row on each row." },
            { kind: "dont", text: "Put a card or a panel in a card's panel, or draw the shell or panel by hand." },
            { kind: "dont", text: "Add a border, a shadow, glass or a status tint to a card." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
