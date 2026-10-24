"use client";

// The design system's navigation: Overview, then the topics in their groups, each a page of its
// own (links between pages, not ARIA tabs). From lg it's a sticky sidebar beside the sheet; below
// lg the same links are one row that scrolls sideways, bleeding to the gutter, with a hairline
// between groups. The current page is the pressed wash, as a selected row is in Glaze.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { GROUPS, TOPICS } from "./topics";
import { cn } from "@/lib/glaze/utils";

const OVERVIEW = { slug: "", title: "Overview" };
const href = (slug: string) => (slug ? `/system/${slug}` : "/system");

export default function SystemNav({ layout }: { layout: "row" | "sidebar" }) {
  const pathname = usePathname();

  if (layout === "row") {
    return (
      <nav aria-label="Design system" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-8 sm:px-8">
        <ul className="flex min-w-max items-center gap-1 py-2">
          {[OVERVIEW, ...TOPICS].map((link, i, all) => {
            const current = pathname === href(link.slug);
            const previous = all[i - 1];
            const newGroup = i > 1 && "group" in link && "group" in previous && link.group !== previous.group;
            return (
              <Fragment key={link.slug || "overview"}>
                {(i === 1 || newGroup) && <li aria-hidden className="mx-2 h-4 border-s border-line" />}
                <li>
                  <Link
                    href={href(link.slug)}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "flex h-(--control) items-center rounded-pill px-3 type-label whitespace-nowrap transition-colors duration-(--dur-state) ease-out",
                      current ? "bg-pressed text-text-1" : "text-text-2 hover:bg-hover hover:text-text-1",
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
          className={cn(
            "-mx-2 flex h-(--menu-row-sm) items-center rounded-tag px-2 type-body-sm transition-colors duration-(--dur-state) ease-out",
            current ? "bg-pressed text-text-1" : "text-text-2 hover:bg-hover hover:text-text-1",
          )}
        >
          {title}
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label="Design system" className="flex flex-col gap-5">
      <ul>{item(OVERVIEW.slug, OVERVIEW.title)}</ul>
      {GROUPS.map((group) => (
        <div key={group}>
          <h2 className="type-label-sm text-text-1">{group}</h2>
          <ul className="mt-1">{TOPICS.filter((t) => t.group === group).map((t) => item(t.slug, t.title))}</ul>
        </div>
      ))}
    </nav>
  );
}
