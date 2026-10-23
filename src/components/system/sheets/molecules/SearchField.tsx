// /system/search-field: SearchField (src/components/fundations/molecules/SearchField.tsx): its two
// sizes in every state, the shortcut hint and a live filter. SearchField is a client component;
// the sheet renders it with plain props (uncontrolled), so the sheet itself stays a server one
import SearchField from "@/components/fundations/molecules/SearchField";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection, type Theme } from "../../SheetParts";
import { SearchDemo } from "../../demos/FormDemos";

// Focus forced on with what a focused field draws: the card surface (focus:bg-surface-3) and the
// page's 1px focus outline. A descendant selector outranks the field's rest fill and, with
// :hover, its hover tint
const FOCUS =
  "[&_input]:bg-surface-3 [&_input:hover]:bg-surface-3 [&_input]:outline-1 [&_input]:outline-offset-2 [&_input]:outline-[color:var(--focus-ring)]";

function states(theme: Theme, size: "md" | "lg") {
  const id = (state: string) => `${theme}-${size}-${state}`;
  const base = { size, className: "w-full", placeholder: "Search brands" } as const;
  return [
    <SearchField key="rest" id={id("rest")} aria-label="Search brands, empty" {...base} />,
    <SearchField key="hint" id={id("hint")} aria-label="Search brands, with its shortcut" shortcut="/" {...base} />,
    <SearchField key="filled" id={id("filled")} aria-label="Search brands, filled" defaultValue="uber eats" {...base} />,
    <div key="focus" className={`w-full ${FOCUS}`}>
      <SearchField id={id("focus")} aria-label="Search brands, focused" size={size} placeholder="Search brands" defaultValue="uber eats" />
    </div>,
    <SearchField key="disabled" id={id("disabled")} aria-label="Search brands, disabled" disabled {...base} />,
  ];
}

export default function SearchFieldSheet() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Search field">
        An Input with the Search icon inside, a clear button once there&rsquo;s text and, if you give it one, the key
        that jumps to it, drawn as a key cap. Since 2026-10-23 it sits on the Input&rsquo;s Fluid Functionalism recipe (a
        28px pill by default, the one stroke, no fill) and the Kbd&rsquo;s new cap. Escape clears it and keeps focus;
        with nothing to clear, Escape is left for the panel around it.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: <>Finding or filtering something on the page: brands in a list, boards, the posts in a view. The results update as people type.</>,
          },
          {
            term: "Instead",
            text: (
              <>
                Any other single line is <Mono>Input</Mono>. The dashboard&rsquo;s header search, with its suggestions
                panel and border beam, is <Mono>dashboard/SearchBox</Mono>, built for that one place: don&rsquo;t copy it
                elsewhere.
              </>
            ),
          },
          {
            term: "The set",
            text: (
              <>
                <Mono>size</Mono> <Mono>md</Mono> (28px, the compact step, the default) or <Mono>lg</Mono> (36px, the
                default step), the Input&rsquo;s two. <Mono>value</Mono> / <Mono>defaultValue</Mono> /{" "}
                <Mono>onValueChange</Mono> with a string. Nothing else: the icon, the clear button and its label are fixed.
              </>
            ),
          },
          {
            term: "Drawn",
            text: (
              <>
                The Input itself (<Mono>ring-1 ring-border bg-transparent hover:bg-hover focus:bg-surface-3</Mono>, the
                page&rsquo;s 1px outline on focus) with its two slots filled: the Search icon as the{" "}
                <Mono>leadingIcon</Mono>, 14px in the muted ink and the ink while focused; on the right an{" "}
                <Mono>xxs</Mono> transparent icon Button once there&rsquo;s text, else the shortcut as a Kbd: the
                CommandMenu&rsquo;s cap, <Mono>bg-hover text-muted-foreground rounded-[5px]</Mono> in the micro role, no
                stroke, <Mono>sm</Mono> (16px) in md and <Mono>md</Mono> (20px) in lg.
              </>
            ),
          },
          {
            term: "shortcut",
            text: (
              <>
                One key, like <Mono>/</Mono>: it focuses the field from anywhere on the page, except while typing in
                another field or with Cmd, Ctrl or Alt held, and the Kbd shows it while the field is empty and unfocused
                (never on touch screens). Screen readers get it as <Mono>aria-keyshortcuts</Mono>. One per page: of two
                fields with the same key, the first one drawn takes it.
              </>
            ),
          },
          {
            term: "Naming",
            text: (
              <>
                In a Field, its label; otherwise <Mono>aria-label</Mono> saying what it searches (&ldquo;Search
                brands&rdquo;). With neither it&rsquo;s called &ldquo;Search&rdquo;. The placeholder is an example of a
                query, not the name.
              </>
            ),
          },
          {
            term: "Results",
            text: (
              <>
                Say how many matched in a <Mono>role=&quot;status&quot;</Mono> line under it (&ldquo;3 of 12
                brands&rdquo;), and say so when nothing did, with the query in the words. Never clear the query because
                there were no results.
              </>
            ),
          },
          {
            term: "Never",
            text: (
              <>
                <Mono>{'<Input type="search">'}</Mono> for a search box (no clear button, no Escape, the browser&rsquo;s own
                clear hidden); a search icon that&rsquo;s a button doing nothing; a second shortcut on the same key.
              </>
            ),
          },
        ]}
      />

      <Flow
        tree={`Which search?
 ├── The dashboard header, with its suggestions → dashboard/SearchBox
 ├── Finding or filtering on this page → SearchField
 │     └── People use it often from the keyboard → shortcut="/"
 └── Not a search, just one line → Input`}
      />

      <SheetSection
        title="Filtering a list"
        description="Live. Press / from anywhere on the page, type, then Escape to clear and keep typing. The count under it is what a screen reader hears."
      >
        <Sheet split>{() => <SearchDemo />}</Sheet>
        <div className="mt-6">
          <Code
            correct={`<Field label="Brands">
  <SearchField shortcut="/" placeholder="Nike, Wise, Canva…" value={query} onValueChange={setQuery} />
</Field>
<p role="status">{found.length} of {brands.length} brands</p>

{/* No visible label: name what it searches */}
<SearchField size="lg" aria-label="Search boards" value={query} onValueChange={setQuery} />`}
            incorrect={{
              why: "a hand-built search: no clear button, no Escape, an icon that steals the click",
              code: `<div className="relative">
  <Search className="absolute left-3 top-3 size-4" />
  <input type="search" placeholder="Search" className="h-7 w-full rounded-[20px] pl-9 ring-1 ring-border …" />
</div>`,
            }}
          />
        </div>
      </SheetSection>
      <SheetSection
        title="Sizes and states"
        description="Both sizes in every state. The clear button appears once there's text; the key cap only while it's empty and unfocused (these hints' / goes to the live list above, the first one drawn). Focus is forced on with what a focused field draws: the card surface and the page's 1px outline."
      >
        <Sheet>
          {(theme) => (
            <Matrix
              first="minmax(9rem,max-content)"
              template="repeat(5, minmax(13rem,1fr))"
              columns={["empty", "shortcut", "filled", "focus", "disabled"]}
              rows={[
                { label: "md", sub: "28px · compact, the default", cells: states(theme, "md") },
                { label: "lg", sub: "36px · the default step", cells: states(theme, "lg") },
              ]}
            />
          )}
        </Sheet>
      </SheetSection>

    </div>
  );
}
