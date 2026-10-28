"use client";

// The dashboard's search, after Cosmos: a pill in the header that, when focused, opens a panel
// under it over a dimmed page, with your recent searches, the library's brands (newest to the
// library first, narrowed to the ones that match as you type, each with its mark; picking one
// shows that brand alone), its categories and what you saved last. Anything picked there becomes the query. Press / anywhere to focus it. A
// BorderBeam (border-beam, from Libraries.dev) runs a colourful glow around the pill's edge, which
// moves to the panel while it's open; it holds still under reduced motion. Escape, a click
// outside or tabbing out of it closes the panel (Escape keeps you in the field), and the panel
// and the dim fade out a little faster than they came in.
//
// Since 2026-10-24 on Glaze's tokens and controls, the pill's look kept at the owner's request
// (Fluid Functionalism's raised surface, the BorderBeam): the text is Glaze's bare text control
// (InputControl). Since 2026-10-28, at the owner's request, it's the header's 44px (the large
// control, like the For you / Discover switch and Create beside it, where it was 52px) and has the
// switch's faint hairline at rest (without one it disappeared into the page); the line darkens to
// Glaze's focus line while it has the cursor,
// Clear is a ghost icon Button, the / hint a Kbd, and the panel's picks are secondary Buttons. The
// beam is the deliberate exception to Glaze's no-glow rule, as it was to the palette before.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { BorderBeam } from "border-beam";
import { Button } from "@/components/glaze/ui/button";
import { InputControl } from "@/components/glaze/ui/input";
import { Kbd } from "@/components/glaze/ui/kbd";
import { Close, Icon, Search } from "@/components/glaze/icon";
import { useDarkTheme } from "@/components/global/theme";
import { categoriesWithPosts } from "@/lib/categories";
import { cx } from "@/lib/cx";
import { usePresence, useReducedMotion } from "@/lib/motion";
import { useBoards } from "./boards";
import { CATEGORY_ICONS } from "./categoryIcons";
import { compact } from "./search";

const RECENT_KEY = "curatit-recent-searches";
const RECENT_MAX = 8;

function readRecent(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export default function SearchBox({
  query,
  onQuery,
  onSearch,
  className,
}: {
  query: string;
  onQuery: (query: string) => void;
  // A search was committed (Enter, or a pick from the panel)
  onSearch?: (query: string) => void;
  className?: string;
}) {
  const { boards, list, posts } = useBoards();
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Set while Escape puts focus back in the field, so that focus doesn't open the panel again
  const quiet = useRef(false);
  // The panel and the dim stay for their exit (gone at once under reduced motion)
  const panel = usePresence(open, 120);
  const dark = useDarkTheme();
  // The beam's travelling types don't stop for reduced motion on their own
  const reducedMotion = useReducedMotion();
  // The glow animates a dozen custom properties through blur and hue-rotate filters, which the
  // browser restyles and repaints every frame; measured on the feed (2026-10-20) it was the
  // biggest single cost while scrolling, so it rests while the page scrolls and comes back after
  const scrolling = useScrolling();
  // The glow round the pill and, while it's open, the panel
  const beam = { size: "md", colorVariant: "colorful", strength: 0.7, theme: dark ? "dark" : "light", active: !reducedMotion && !scrolling } as const;

  useEffect(() => setRecent(readRecent()), []);

  const remember = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const next = [trimmed, ...recent.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, RECENT_MAX);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {}
  };
  const clearRecent = () => {
    setRecent([]);
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {}
  };
  const pick = (text: string) => {
    onQuery(text);
    remember(text);
    onSearch?.(text.trim());
    setOpen(false);
    inputRef.current?.blur();
  };

  // Close on a click outside or Escape; "/" focuses the field from anywhere
  useEffect(() => {
    const onDown = (event: PointerEvent) => {
      if (open && !rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable;
      if (event.key === "Escape" && open) {
        // Closes the panel only: a search field would also clear itself on Escape, which a second
        // Escape (with the panel shut) still does. Focus comes back to the field from a chip
        event.preventDefault();
        setOpen(false);
        quiet.current = true;
        inputRef.current?.focus();
        quiet.current = false;
      } else if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // The categories that have posts, by the names the search matches against (lib/categories)
  const chips = categoriesWithPosts(list);

  // Every brand once, in the feed's order (newest to the library first); while typing, the ones
  // whose name or slug holds what's typed
  const allBrands = [...new Map(list.map((post) => [post.brand.slug, post.brand])).values()];
  const typed = compact(query);
  const brands = typed ? allBrands.filter((brand) => compact(brand.name).includes(typed) || compact(brand.slug).includes(typed)) : allBrands;

  // The posts saved most recently, on any board, without repeats
  const saved = [...new Set(boards.flatMap((board) => board.items).toSorted((a, b) => b.addedAt.localeCompare(a.addedAt)).map((item) => item.post))]
    .slice(0, 6)
    .flatMap((code) => posts.get(code) ?? []);

  return (
    <>
      {/* Dims the page while the panel is open (Glaze's scrim); inside the header's stacking
          context, so the field and panel stay above it */}
      {panel.mounted && (
        <div
          aria-hidden="true"
          data-closing={panel.closing || undefined}
          className="fixed inset-0 z-(--z-raised) bg-scrim transition-opacity duration-(--dur-overlay) ease-out starting:opacity-0 data-closing:pointer-events-none data-closing:opacity-0 data-closing:duration-(--dur-state) data-closing:ease-in"
        />
      )}
      <div
        ref={rootRef}
        // Focus moving out of the search (Tab past the last chip, or back before the field) closes
        // the panel. A blur to nowhere (a click on the panel's own background, the window losing
        // focus, Safari not focusing a clicked button) leaves it to the click-outside check
        onBlur={(event) => {
          const next = event.relatedTarget as Node | null;
          if (next && !event.currentTarget.contains(next)) setOpen(false);
        }}
        className={cx("relative z-(--z-sticky)", className)}
      >
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            pick(query);
          }}
        >
          {/* The radius is given rather than read from the pill: rounded-pill computes to an
              effectively infinite radius, which the beam can't draw. The pill is raised on Fluid
              Functionalism's second surface, and its line darkens to Glaze's focus line while the
              text has the cursor (not the Clear button, which draws its own ring).
              The beam's wrapper clips everything outside the pill (overflow: hidden), so only the
              shadow's inner part shows, and the line is drawn inside */}
          <BorderBeam {...beam} active={beam.active && !open} borderRadius={22}>
            <label className="relative flex h-(--control-lg) items-center rounded-pill border border-line-faint bg-surface-2 shadow-surface-2 transition-[border-color] duration-(--dur-state) ease-out has-[[data-control]:focus]:border-line-focus">
              <Icon icon={Search} size={16} className="pointer-events-none absolute left-5 text-text-3" />
              <span className="sr-only">Search the library</span>
              <InputControl
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => {
                  onQuery(event.target.value);
                  // Typing opens it again after Escape (a second Escape's clear doesn't)
                  if (event.target.value) setOpen(true);
                }}
                onFocus={() => !quiet.current && setOpen(true)}
                // After Escape the field keeps focus, so a click is the other way back in
                onClick={() => setOpen(true)}
                placeholder="Describe the posts you’re looking for"
                maxLength={300}
                autoComplete="off"
                className="pr-12 pl-12 text-text-1 placeholder:text-text-3"
              />
              {query ? (
                // Placed by a plain span: Button is relative itself
                <span className="absolute right-3 flex">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Clear search"
                    onClick={() => {
                      onQuery("");
                      inputRef.current?.focus();
                    }}
                  >
                    <Icon icon={Close} />
                  </Button>
                </span>
              ) : (
                <Kbd className="pointer-events-none absolute right-4 hidden md:inline-flex">/</Kbd>
              )}
            </label>
          </BorderBeam>
        </form>

        {panel.mounted && (
          // The beam's wrapper sets position: relative, so the panel is placed by a plain div
          // outside it. While it leaves it can't be clicked or tabbed into. On phones it spans the
          // screen under the header, 16px in, since the pill there is a third of the width
          // (2026-10-28, from a QA run: the panel was 147px wide at 375)
          <div
            inert={panel.closing || undefined}
            data-closing={panel.closing || undefined}
            className="absolute inset-x-0 top-full mt-3 max-sm:fixed max-sm:inset-x-4 max-sm:top-23 origin-top transition-[opacity,translate] duration-(--dur-overlay) ease-out starting:-translate-y-1 starting:opacity-0 data-closing:-translate-y-1 data-closing:opacity-0 data-closing:duration-(--dur-state) data-closing:ease-in"
          >
            <BorderBeam {...beam} borderRadius={24}>
              {/* A large floating panel on Fluid Functionalism's sixth surface (the beam's wrapper
                  rounds it to 28px and clips its drop, so what shows is the dark theme's inner
                  highlight) */}
              {/* On phones the panel is fixed under the header, so it stops at the screen's foot
                  and scrolls inside (.search-panel in global.css; a short phone, or the keyboard,
                  hid its lower part) */}
              <div className="search-panel rounded-(--radius-float) bg-surface-6 p-6 shadow-surface-6">
                {!query.trim() && (
                  <Section title="Try a description">
                    <div className="flex flex-wrap gap-2">
                      {["Fintech feature launches", "Food posts with product photography", "Carousels with app screenshots"].map((example) => (
                        <Button key={example} size="sm" variant="secondary" onClick={() => pick(example)}>{example}</Button>
                      ))}
                    </div>
                  </Section>
                )}
                {recent.length > 0 && (
                  <Section title="Recent" onClear={clearRecent}>
                    <Row>
                      {recent.map((item) => (
                        <Button key={item} variant="secondary" onClick={() => pick(item)}>
                          <Icon icon={Search} />
                          {item}
                        </Button>
                      ))}
                    </Row>
                  </Section>
                )}
                {brands.length > 0 && (
                  <Section title="Brands">
                    <Row>
                      {brands.map((brand) => (
                        <Button key={brand.slug} variant="secondary" onClick={() => pick(brand.name)}>
                          <span className="relative size-5 shrink-0 overflow-hidden rounded-pill border border-line-faint bg-field">
                            {brand.logo && <Image src={brand.logo} alt="" fill sizes="20px" className="object-cover" />}
                          </span>
                          {brand.name}
                        </Button>
                      ))}
                    </Row>
                  </Section>
                )}
                <Section title="Categories">
                  <Row>
                    {chips.map((category) => (
                      <Button key={category.slug} variant="secondary" onClick={() => pick(category.name)}>
                        {/* The category's swatch, as a tile with its icon (Discover's icons) */}
                        <CategorySwatch slug={category.slug} hue={category.hue} />
                        {category.name}
                      </Button>
                    ))}
                  </Row>
                </Section>
                {saved.length > 0 && (
                  <Section title="Recently saved">
                    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {saved.map((post) => (
                        // The cover, with its brand under it as a ghost Button whose hit area covers
                        // the cover too
                        <li key={post.shortCode} className="group/saved relative">
                          <span className="relative block aspect-4/5 w-full overflow-hidden rounded-panel border border-line-faint bg-field">
                            <Image
                              src={post.cover}
                              alt=""
                              fill
                              sizes="120px"
                              className="object-cover transition-[filter] duration-(--dur-state) ease-out group-hover/saved:brightness-95"
                            />
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label={`Posts from ${post.brand.name}`}
                            onClick={() => pick(post.brand.name)}
                            className="static mt-1 w-full after:absolute after:inset-0"
                          >
                            {post.brand.name}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}
              </div>
            </BorderBeam>
          </div>
        )}
      </div>
    </>
  );
}

function Section({ title, onClear, children }: { title: string; onClear?: () => void; children: ReactNode }) {
  return (
    <section className="mt-6 first:mt-0">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="type-heading-sm text-text-1">{title}</h2>
        {onClear && (
          <Button size="sm" variant="ghost" onClick={onClear}>
            Clear
          </Button>
        )}
      </div>
      {children}
    </section>
  );
}

// One row that scrolls sideways when it runs out of room
function Row({ children }: { children: ReactNode }) {
  return <div className="-mx-6 flex gap-2 overflow-x-auto px-6 scrollbar-none">{children}</div>;
}

// The category's hue as a small tile with its glyph: the swatch the homepage and Discover use,
// through custom properties the tile's classes read
function CategorySwatch({ slug, hue }: { slug: string; hue: number }) {
  const glyph = CATEGORY_ICONS[slug];
  return (
    <span
      aria-hidden="true"
      className="flex size-5 shrink-0 items-center justify-center rounded-tag bg-(--swatch) text-(--swatch-ink)"
      style={{ "--swatch": `oklch(0.7 0.12 ${hue})`, "--swatch-ink": `oklch(0.28 0.07 ${hue})` } as CSSProperties}
    >
      {glyph && <Icon icon={glyph} size={12} className="text-(--swatch-ink)" />}
    </span>
  );
}

// True while the page is scrolling and for a moment after it stops. State changes only when it
// starts and when it settles, never per scroll event
function useScrolling(settle = 700) {
  const [scrolling, setScrolling] = useState(false);
  useEffect(() => {
    let timer = 0;
    let on = false;
    const onScroll = () => {
      if (!on) {
        on = true;
        setScrolling(true);
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        on = false;
        setScrolling(false);
      }, settle);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
    };
  }, [settle]);
  return scrolling;
}
