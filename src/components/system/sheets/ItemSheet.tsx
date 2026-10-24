"use client";

// /system/item: Glaze's Item and ItemGroup (src/components/glaze/ui/item). Rules from glaze-docs/item.md
import { Avatar } from "@/components/glaze/ui/avatar";
import { Button } from "@/components/glaze/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemLink,
  ItemMedia,
  ItemMeta,
  ItemTitle,
} from "@/components/glaze/ui/item";
import { Bookmark, Icon, Key, More } from "@/components/glaze/icon";
import { Example, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection, Specimen } from "../SheetParts";

const BOARDS = [
  { name: "Spring launch", meta: "12 posts", selected: false },
  { name: "Fintech onboarding", meta: "9 posts", selected: true },
  { name: "Price slides", meta: "4 posts", selected: false, disabled: true },
];

export default function ItemSheet() {
  return (
    <SheetBody>
      <SheetHeader
        title="Item"
        importLine={`import {ItemGroup, Item, ItemMedia, ItemContent, ItemTitle, ItemDescription, ItemMeta, ItemLink, ItemActions} from '@/components/glaze/ui/item'`}
      >
        One thing as a row in a list: media, a title and a description, then meta and actions. 36px with one line,
        growing with a description; under 28rem the meta goes first and the title truncates last.
      </SheetHeader>

      <SheetSection title="Sizes and states" description="Hover a row that opens something to see its wash. The second row is selected, the third disabled.">
        <Sheet>
          {(theme) => (
            <div className="grid gap-6 lg:grid-cols-2">
              <Specimen label="default, 36px, with links and actions">
                <ItemGroup aria-label={`Boards, ${theme}`} className="w-full">
                  {BOARDS.map((b) => (
                    <Item key={b.name} selected={b.selected} disabled={b.disabled}>
                      <ItemMedia variant="icon">
                        <Icon icon={Bookmark} />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>
                          <ItemLink href="/system/item" aria-current={b.selected ? "page" : undefined}>
                            {b.name}
                          </ItemLink>
                        </ItemTitle>
                      </ItemContent>
                      <ItemMeta>{b.meta}</ItemMeta>
                      <ItemActions>
                        <Button size="icon-sm" variant="ghost" aria-label={`More for ${b.name}`}>
                          <Icon icon={More} />
                        </Button>
                      </ItemActions>
                    </Item>
                  ))}
                </ItemGroup>
              </Specimen>
              <Specimen label="sm, 32px, with descriptions and avatars">
                <ItemGroup aria-label={`Tokens, ${theme}`} className="w-full">
                  <Item size="sm">
                    <ItemMedia>
                      <Avatar name="Syed Ammar" size="default" decorative />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>Syed Ammar</ItemTitle>
                      <ItemDescription>Editor, approved 162 analyses</ItemDescription>
                    </ItemContent>
                    <ItemMeta>Today</ItemMeta>
                  </Item>
                  <Item size="sm">
                    <ItemMedia variant="icon">
                      <Icon icon={Key} />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>
                        Claude Code <span className="type-code-sm text-text-2">curatit_pat_8f2a</span>
                      </ItemTitle>
                      <ItemDescription>Read access, expires in 90 days</ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Button size="sm" variant="secondary">
                        Revoke
                      </Button>
                    </ItemActions>
                  </Item>
                </ItemGroup>
              </Specimen>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Example">
        <Example
          code={`<ItemGroup aria-label="Boards">
  <Item selected={current}>
    <ItemContent><ItemTitle><ItemLink href={href} aria-current={current ? 'page' : undefined}>Spring launch</ItemLink></ItemTitle></ItemContent>
    <ItemMeta>12 posts</ItemMeta>
    <ItemActions><Button size="icon-sm" variant="ghost" aria-label="More for Spring launch"><Icon icon={More}/></Button></ItemActions>
  </Item>
</ItemGroup>`}
        />
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: <>Put Items in an ItemGroup with an aria-label; inside a card use <Mono>variant=&quot;plain&quot;</Mono> in CardContent flush.</> },
            { kind: "do", text: "Open something from a row with ItemLink in ItemTitle; make actions ghost icon-sm buttons named for the row." },
            { kind: "do", text: "Put an ID after the name in type-code-sm, and what can be lived without in ItemMeta." },
            { kind: "dont", text: "Wrap a row in a link, or mark the chosen row with a colour, a bold title or a bar; pass selected." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
