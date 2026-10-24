// The building blocks of the design system page's sheets (/system/<topic>). Hook-free, so a
// foundation sheet stays a server component; a component sheet that needs state is a client file.
//
// A sheet shows its specimens in both themes. <Sheet> renders them twice, once per theme, each in a
// panel that is its own .glaze scope carrying that theme's tokens whatever the site's theme is
// (theme-scopes.css, generated from global.css, Glaze's tokens.css and the bridge); the Light / Dark /
// Both switch hides one of the two with CSS (system.css), so switching costs no render. Each panel
// holds a stage portal, so a menu, popover or dialog opened inside it stays in the panel's theme.
import type { ReactNode } from "react";
import { GlazePortalProvider } from "@/lib/glaze/portal";
import { Check, Close, Icon } from "@/components/glaze/icon";
import { CodeBlock } from "@/components/glaze/ui/code-block";
import Text from "@/components/fundations/elements/Text";
import { cn } from "@/lib/glaze/utils";

export type Theme = "light" | "dark";
const THEMES: Theme[] = ["light", "dark"];

/** A specimen in both themes. `children` is called once per theme, so ids stay unique.
 *  `split` puts the two side by side from xl (for narrow specimens); otherwise they stack. */
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
    <div className={cn("grid gap-4", split && "xl:grid-cols-2", className)}>
      {THEMES.map((theme) => (
        <ThemePanel key={theme} theme={theme} className="min-w-0 p-5 sm:p-6">
          <p data-sheet-label className="mb-4 type-caption text-text-2">
            {theme === "light" ? "Light" : "Dark"}
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
      className={cn("glaze rounded-shell border border-line-faint bg-page text-text-1", className)}
    >
      <GlazePortalProvider>{children}</GlazePortalProvider>
    </div>
  );
}

/** A spec matrix: one row per variant, one column per size or state. Scrolls sideways inside its
 *  panel when it's wider than the screen. */
export function Matrix({
  columns,
  rows,
  align = "center",
}: {
  columns: readonly ReactNode[];
  rows: { label: ReactNode; sub?: ReactNode; cells: ReactNode[] }[];
  align?: "center" | "start";
}) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
      <table className="w-full min-w-max border-collapse text-start">
        <thead>
          <tr>
            <td className="border-b border-line-faint pb-2" />
            {columns.map((c, i) => (
              <th key={i} scope="col" className="border-b border-line-faint px-3 pb-2 text-start type-caption text-text-2">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <th
                scope="row"
                className={cn(
                  "w-36 border-b border-line-faint py-3 pe-3 text-start font-normal",
                  align === "center" ? "align-middle" : "align-top",
                )}
              >
                <span className="block type-label text-text-1">{r.label}</span>
                {r.sub && <span className="mt-0.5 block type-caption text-text-2">{r.sub}</span>}
              </th>
              {r.cells.map((cell, j) => (
                <td
                  key={j}
                  className={cn(
                    "border-b border-line-faint px-3 py-3",
                    align === "center" ? "align-middle" : "align-top",
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A labelled specimen inside a panel: the thing, then a caption under it. `stretch` lets the thing
 *  take the full width (a code block, a list) instead of sitting in a row */
export function Specimen({
  label,
  children,
  className,
  stretch = false,
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
  stretch?: boolean;
}) {
  return (
    <figure className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div className={stretch ? "grid min-w-0" : "flex min-h-8 flex-wrap items-center gap-2"}>{children}</div>
      <figcaption className="type-caption text-text-2">{label}</figcaption>
    </figure>
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
    <section id={id} className="scroll-mt-32">
      <h3 className="type-heading text-text-1">{title}</h3>
      {description && <p className="mt-1 max-w-measure type-body-sm text-text-2">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Do and don't, from the component's rules in .design-system/glaze-docs/<name>.md. Each line is a
 *  glyph and a word, never a colour alone */
export function Rules({ items }: { items: { kind: "do" | "dont"; text: ReactNode }[] }) {
  return (
    <ul className="grid max-w-measure gap-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 type-body-sm text-text-2">
          <span
            className={cn(
              "mt-0.5 inline-flex w-16 shrink-0 items-center gap-1 type-label-sm",
              item.kind === "do" ? "text-ok-text" : "text-fail-text",
            )}
          >
            <Icon icon={item.kind === "do" ? Check : Close} size={12} />
            {item.kind === "do" ? "Do" : "Don't"}
          </span>
          <span className="min-w-0">{item.text}</span>
        </li>
      ))}
    </ul>
  );
}

/** A block of code to copy: an import, an example */
export function Example({ code, filename }: { code: string; filename?: string }) {
  return <CodeBlock code={code} language="tsx" filename={filename} />;
}

/** A token, class or prop name inside a sentence */
export function Mono({ children }: { children: ReactNode }) {
  return <code className="text-text-1">{children}</code>;
}

/** The sheet's own title block, with the import line when it documents a component */
export function SheetHeader({
  title,
  children,
  importLine,
}: {
  title: string;
  children: ReactNode;
  importLine?: string;
}) {
  return (
    <header className="max-w-3xl">
      <Text tag="h2" variant="h4" className="text-text-1">
        {title}
      </Text>
      <p className="mt-2 type-body text-text-2">{children}</p>
      {importLine && (
        <div className="mt-4">
          <CodeBlock code={importLine} language="tsx" header={false} defaultWrap />
        </div>
      )}
    </header>
  );
}

/** A sheet's column of sections */
export function SheetBody({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-12">{children}</div>;
}
