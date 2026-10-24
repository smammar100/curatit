"use client";

// The top of Discover (on For you from 2026-10-20, moved to Discover on 2026-10-24 at the owner's
// request): the library's playbooks, then the categories and the wall of posts underneath (Feed). The breakdowns file every post under a type of post (Relatable humour, Community
// prompt, Collaboration…); this shows the types as a sideways row of collection cards (three
// covers in one strip, the name, how many posts from how many brands). Picking one searches for
// it (typeNamed in search.ts), and the grid shows the result. Laid out after Cosmos's Explore (its
// curated collections) at the owner's request, after a first build where every type was a full
// row of posts. A row of hook chips under the cards was built and taken out at the owner's request.
// Since 2026-10-24 on Glaze: the strip a panel-cornered tile on the shell's grey with a faint line
// inside its edge, the words in Glaze's type roles, the arrows small secondary icon Buttons, and
// each card's press a ghost Button (its name) whose hit area covers the whole card.
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { Button } from "@/components/glaze/ui/button";
import { ChevronLeft, ChevronRight, Icon } from "@/components/glaze/icon";
import { spread } from "./forYou";
import type { DashPost } from "./types";

// What a type of post needs to get a card: enough posts from enough brands to be a pattern
// rather than one brand's habit
const MIN_POSTS = 4;
const MIN_BRANDS = 2;

type Group = { name: string; posts: DashPost[]; brands: number };

function groupsOf(posts: DashPost[], key: (post: DashPost) => string | null | undefined): Group[] {
  return [...Map.groupBy(posts.filter((post) => key(post)), (post) => key(post)!).entries()]
    .map(([name, list]) => ({ name, posts: list, brands: new Set(list.map((post) => post.brand.slug)).size }))
    .filter((group) => group.posts.length >= MIN_POSTS && group.brands >= MIN_BRANDS)
    .sort((a, b) => b.posts.length - a.posts.length || a.name.localeCompare(b.name));
}

export default function Playbooks({ posts, onPick }: { posts: DashPost[]; onPick: (query: string) => void }) {
  const types = useMemo(() => groupsOf(posts, (post) => post.breakdown?.type), [posts]);
  if (!types.length) return null;

  return (
    <div className="mb-12 lg:mb-14">
      <section aria-labelledby="playbooks-types">
        <Scroller
          heading={
            <>
              <h2 id="playbooks-types" className="type-title text-text-1">
                Playbooks
              </h2>
              <p className="mt-1 type-body-sm text-text-2">The kinds of post the breakdowns keep finding, across brands</p>
            </>
          }
          label="playbooks"
        >
          {types.map((group, i) => (
            <li key={group.name} className="w-64 shrink-0 snap-start lg:w-72">
              <TypeCard group={group} priority={i < 4} onPick={() => onPick(group.name)} />
            </li>
          ))}
        </Scroller>
      </section>
    </div>
  );
}

// A type of post as a collection: three of its covers from different brands in one strip, its
// name, and how many posts from how many brands. One press, which searches for the type: the name
// is a ghost Button whose ::after stretches over the card (it is static, so the card is what the
// after is placed in), and the count describes it
function TypeCard({ group, priority, onPick }: { group: Group; priority: boolean; onPick: () => void }) {
  const covers = spread(group.posts, 3).slice(0, 3);
  const countId = useId();
  return (
    <div className="group relative">
      <span className="relative grid grid-cols-3 gap-0.5 overflow-hidden rounded-panel bg-shell after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:border after:border-line-faint">
        {covers.map((post) => (
          <span key={post.shortCode} className="relative aspect-4/5 overflow-hidden bg-field">
            <Image
              src={post.cover}
              alt=""
              fill
              sizes="6rem"
              priority={priority}
              className="object-cover transition-transform duration-(--dur-overlay) ease-out motion-safe:group-hover:scale-103"
            />
          </span>
        ))}
      </span>
      <Button variant="ghost" onClick={onPick} aria-describedby={countId} className="static mt-1.5 -ms-3 after:absolute after:inset-0">
        {group.name}
      </Button>
      <span id={countId} className="block truncate type-caption text-text-2 tabular-nums">
        {group.posts.length} posts from {group.brands} brands
      </span>
    </div>
  );
}

// A row that scrolls sideways, with arrows from sm and its edges fading while there's more
function Scroller({ heading, label, children }: { heading: ReactNode; label: string; children: ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);
  const [more, setMore] = useState({ left: false, right: false });

  useEffect(() => {
    const row = ref.current;
    if (!row) return;
    const measure = () => setMore({ left: row.scrollLeft > 1, right: row.scrollLeft + row.clientWidth < row.scrollWidth - 1 });
    measure();
    row.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => {
      row.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, []);

  const page = (direction: 1 | -1) => {
    const row = ref.current;
    if (!row) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.scrollBy({ left: direction * row.clientWidth * 0.8, behavior: still ? "auto" : "smooth" });
  };
  // The fades: an edge with more beyond it runs from transparent to opaque over 48px
  const fades = { "--fade-l": more.left ? "transparent" : "black", "--fade-r": more.right ? "transparent" : "black" } as CSSProperties;

  return (
    <>
      <div className="mb-4 flex items-end gap-4">
        <div className="min-w-0 flex-1">{heading}</div>
        {(more.left || more.right) && (
          <div className="hidden shrink-0 gap-1 sm:flex">
            <Button size="icon-sm" variant="secondary" aria-label={`Back through the ${label}`} disabled={!more.left} onClick={() => page(-1)}>
              <Icon icon={ChevronLeft} />
            </Button>
            <Button size="icon-sm" variant="secondary" aria-label={`More ${label}`} disabled={!more.right} onClick={() => page(1)}>
              <Icon icon={ChevronRight} />
            </Button>
          </div>
        )}
      </div>
      <ul
        ref={ref}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 py-1 scrollbar-none [mask-image:linear-gradient(to_right,var(--fade-l),black_48px,black_calc(100%-48px),var(--fade-r))] sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:gap-5"
        style={fades}
      >
        {children}
      </ul>
    </>
  );
}
