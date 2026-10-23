"use client";

// The design system's navigation: Overview, then the topics grouped as Foundations, Atoms and
// Molecules, each a page of its own (links between pages, not ARIA tabs). From lg it's a sticky
// sidebar beside the sheet; below lg the same links are one row that scrolls sideways, bleeding
// to the gutter, with a hairline between groups.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { GROUPS, TOPICS } from "./topics";
import { cx } from "@/lib/cx";

const OVERVIEW = { slug: "", title: "Overview" };
const href = (slug: string) => (slug ? `/system/${slug}` : "/system");

export default function SystemNav({ layout }: { layout: "row" | "sidebar" }) {
  const pathname = usePathname();

  if (layout === "row") {
    return (
      <nav aria-label="Design system" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-8 sm:px-8">
        <ul className="flex min-w-max items-center gap-5">
          {[OVERVIEW, ...TOPICS].map((link, i, all) => {
            const current = pathname === href(link.slug);
            const newGroup = i > 1 && "group" in link && "group" in all[i - 1] && link.group !== (all[i - 1] as typeof link).group;
            return (
              <Fragment key={link.slug || "overview"}>
                {(i === 1 || newGroup) && <li aria-hidden className="h-4 w-px bg-border-strong" />}
                <li>
                  <Link
                    href={href(link.slug)}
                    aria-current={current ? "page" : undefined}
                    className={cx(
                      "relative flex h-11 items-center text-body-sm font-medium whitespace-nowrap transition-colors duration-150 ease-out-quint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus",
                      current
                        ? "text-primary-foreground shadow-[inset_0_-2px_0_currentColor]"
                        : "text-secondary-foreground hover:text-primary-foreground",
                    )}
                  >
                    {link.title}
                  </Link>
                </li>
              </Fragment>
            );
          })}
        </ul>
      </nav>
    );
  }

  const item = (slug: string, title: string) => {
    const current = pathname === href(slug);
    return (
      <li key={slug || "overview"}>
        <Link
          href={href(slug)}
          aria-current={current ? "page" : undefined}
          className={cx(
            "-mx-2 flex h-8 items-center rounded-md px-2 text-body-sm transition-colors duration-150 ease-out-quint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus",
            current
              ? "bg-component font-medium text-primary-foreground"
              : "text-secondary-foreground hover:text-primary-foreground",
          )}
        >
          {title}
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label="Design system" className="flex flex-col gap-6">
      <ul>{item(OVERVIEW.slug, OVERVIEW.title)}</ul>
      {GROUPS.map((group) => (
        <div key={group}>
          <p className="text-caption-lg tracking-wider text-secondary-foreground uppercase">{group}</p>
          <ul className="mt-2">{TOPICS.filter((t) => t.group === group).map((t) => item(t.slug, t.title))}</ul>
        </div>
      ))}
    </nav>
  );
}
