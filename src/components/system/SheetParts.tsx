// The building blocks of the design system page's sheets (/system/<topic>). Hook-free, so a
// sheet stays a server component: the only scripts on these pages are the theme switch, the
// tab row and the live demos that need one.
//
// A sheet shows its specimens in both themes. <Sheet> renders them twice, once per theme, in a
// panel that carries that theme's tokens whatever the site's theme is (theme-scopes.css,
// generated from global.css); the Light / Dark / Both switch hides one of the two with CSS
// (system.css), so switching costs no render.
import type { ReactNode } from "react";
import Text from "@/components/fundations/elements/Text";
import CopyBlock from "@/components/mcp/CopyBlock";
import { cx } from "@/lib/cx";

export type Theme = "light" | "dark";
const THEMES: Theme[] = ["light", "dark"];

/** A specimen in both themes. `children` is called once per theme, so ids stay unique.
 *  `split` puts the two side by side (for narrow specimens); otherwise they stack. */
export function Sheet({
  children,
  split = false,
  className,
}: {
  children: (theme: Theme) => ReactNode;
  split?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "grid gap-4",
        split && "xl:grid-cols-[repeat(auto-fit,minmax(min(100%,28rem),1fr))]",
        className,
      )}
    >
      {THEMES.map((theme) => (
        <ThemePanel key={theme} theme={theme} className="min-w-0 p-5 sm:p-8">
          <p
            data-sheet-label
            className="mb-5 text-caption-lg tracking-wider text-secondary-foreground uppercase"
          >
            {theme}
          </p>
          {children(theme)}
        </ThemePanel>
      ))}
    </div>
  );
}

/** One panel in one theme, whatever the site's theme is */
export function ThemePanel({
  theme,
  className,
  children,
}: {
  theme: Theme;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-theme-scope={theme}
      data-theme={theme}
      data-sheet-panel={theme}
      className={cx("rounded-2xl shadow-xs", className)}
    >
      {children}
    </div>
  );
}

/** A spec matrix: one row per variant, one column per size or state. Scrolls sideways inside
 *  its panel when it's wider than the screen. */
export function Matrix({
  columns,
  rows,
  first = "9rem",
  template,
  align = "center",
}: {
  columns: ReactNode[];
  rows: { label: ReactNode; sub?: ReactNode; cells: ReactNode[] }[];
  /** Width of the label column */
  first?: string;
  /** The other columns' grid template, when equal shares don't fit (e.g. "auto auto minmax(16rem,1fr)") */
  template?: string;
  align?: "center" | "start";
}) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 sm:-mx-8 sm:px-8">
      <div
        role="table"
        className="grid w-full min-w-min"
        style={{ gridTemplateColumns: `${first} ${template ?? `repeat(${columns.length}, minmax(max-content, 1fr))`}` }}
      >
        <div role="row" className="contents">
          <span role="columnheader" className="border-b border-border-default pb-3" />
          {columns.map((c, i) => (
            <span
              key={i}
              role="columnheader"
              className="border-b border-border-default px-3 pb-3 font-mono text-caption-lg text-secondary-foreground"
            >
              {c}
            </span>
          ))}
        </div>
        {rows.map((r, i) => (
          <div key={i} role="row" className="contents">
            <div
              role="rowheader"
              className={cx(
                "flex flex-col self-stretch border-b border-border-subtle py-3 pr-3",
                align === "center" && "justify-center",
              )}
            >
              <span className="block font-mono text-caption-lg text-primary-foreground">{r.label}</span>
              {r.sub && <span className="mt-0.5 block text-caption-lg text-secondary-foreground">{r.sub}</span>}
            </div>
            {r.cells.map((cell, j) => (
              <div
                key={j}
                role="cell"
                className={cx(
                  "flex self-stretch border-b border-border-subtle px-3 py-3",
                  align === "center" ? "items-center" : "items-start",
                )}
              >
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** A heading and a line for one part of a sheet */
export function SheetSection({
  title,
  description,
  children,
  id,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="scroll-mt-40">
      <Text tag="h3" variant="h5" className="text-primary-foreground">
        {title}
      </Text>
      {description && (
        <Text variant="bodySM" className="mt-1.5 max-w-[65ch] text-secondary-foreground">
          {description}
        </Text>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** The rules for a component, in the order an agent or a new designer needs them: when to use
 *  it, what to use instead, the closed set of variants with its default, and what never to do */
export function Rules({ items }: { items: { term: string; text: ReactNode }[] }) {
  return (
    <dl className="grid max-w-4xl gap-x-8 gap-y-3 text-body-sm sm:grid-cols-[8rem_minmax(0,1fr)]">
      {items.map((item) => (
        <div key={item.term} className="contents">
          <dt className="font-medium text-primary-foreground">{item.term}</dt>
          <dd className="text-secondary-foreground">{item.text}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A correct example beside an incorrect one, both copyable */
export function Code({ correct, incorrect }: { correct: string; incorrect?: { code: string; why: string } }) {
  return (
    <div className={cx("grid gap-4", incorrect && "lg:grid-cols-2")}>
      <div className="min-w-0">
        <p className="mb-2 text-caption-lg font-medium tracking-wider text-positive-foreground uppercase">Correct</p>
        <CopyBlock tone="light" label="the correct example" code={correct} />
      </div>
      {incorrect && (
        <div className="min-w-0">
          <p className="mb-2 text-caption-lg font-medium tracking-wider text-danger-foreground uppercase">
            Incorrect: {incorrect.why}
          </p>
          <CopyBlock tone="light" label="the incorrect example" code={incorrect.code} />
        </div>
      )}
    </div>
  );
}

/** A decision tree, walked top to bottom (for choices with three or more answers) */
export function Flow({ tree }: { tree: string }) {
  return (
    <pre className="overflow-x-auto rounded-2xl bg-card px-5 py-4 font-mono text-caption-lg leading-relaxed text-primary-foreground">
      {tree}
    </pre>
  );
}

/** Monospace token or class name. `tone` sets its colour (never a text-* class in className:
 *  cx doesn't merge, so two colours would both land) */
export function Mono({
  children,
  className,
  tone = "secondary",
}: {
  children: ReactNode;
  className?: string;
  tone?: "primary" | "secondary";
}) {
  return (
    <code
      className={cx(
        "font-mono text-caption-lg",
        tone === "primary" ? "text-primary-foreground" : "text-secondary-foreground",
        className,
      )}
    >
      {children}
    </code>
  );
}

/** A colour sample with a hairline, so white on white still shows */
export function Swatch({ className }: { className: string }) {
  return <span aria-hidden className={cx("block rounded-lg shadow-xs", className)} />;
}

/** The sheet's own title block */
export function SheetHeader({ title, children }: { title: string; children: ReactNode }) {
  return (
    <header className="max-w-3xl">
      <Text tag="h2" variant="h3" className="text-primary-foreground">
        {title}
      </Text>
      <Text className="mt-3 text-secondary-foreground">{children}</Text>
    </header>
  );
}
