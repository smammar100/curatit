import { optimizedImage } from "@/lib/posts";
import { cx } from "@/lib/cx";
import DeferredImages from "@/components/global/DeferredImages";

// Behind the sign-in and sign-up card: a masonry of the library's covers whose columns drift
// up and down and loop, dissolving into the page at the top and bottom. Decorative, so the
// covers carry no alt text. Each column holds its covers twice, so the drift has no seam.
//
// Loading (2026-10-16, Lighthouse mobile): in the three columns every screen shows, the three
// covers nearest the top that sit below the fade are in the HTML as eager, high-priority images,
// because they are the largest thing painted on the page and so what Lighthouse times as its
// largest paint. The other eighty-seven start only after the page has loaded (DeferredImages),
// and lazily, so the card's text never waits on the wallpaper. Mounting the whole wall before any cover loaded was tried first: the
// largest paint then waited on the page's scripts (LCP 3.9s).
const COLUMNS = 6;
const PER_COLUMN = 8;
const WIDTHS = [256, 384];
// Columns on every width, and which covers of each lead the HTML: the second to fourth, which
// are the first to sit below the fade at the wall's top edge on a phone (the first is mostly
// above the window or inside the fade, and Lighthouse's largest paint is the first cover shown
// whole). A column that drifts up starts shifted up by half its height (wall-up begins at
// -50%), so at the top of such a column at first is its second copy, and that is what loads
// eagerly there.
const ALWAYS_SHOWN = 3;
const EAGER_FROM = 1;
const EAGER_TO = 4;

// An eased ramp rather than a linear one, so there is no visible band where the fade starts
const EDGE_FADE =
  "linear-gradient(to bottom, transparent 0%, rgb(0 0 0 / 0.2) 5%, rgb(0 0 0 / 0.55) 10%, rgb(0 0 0 / 0.85) 15%, black 22%, black 78%, rgb(0 0 0 / 0.85) 85%, rgb(0 0 0 / 0.55) 90%, rgb(0 0 0 / 0.2) 95%, transparent 100%)";

export default function PostWall({ covers }: { covers: string[] }) {
  const columns = Array.from({ length: COLUMNS }, (_, c) =>
    covers.filter((_, i) => i % COLUMNS === c).slice(0, PER_COLUMN),
  );

  return (
    <div
      aria-hidden="true"
      className="post-wall absolute inset-0 grid grid-cols-3 gap-3 px-3 opacity-80 lg:grid-cols-6"
      style={{ maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE }}
    >
      {columns.map((column, c) => (
        <div
          key={c}
          className={cx(
            "flex flex-col gap-3 motion-reduce:animate-none",
            // Under reduced motion an up-drifting column rests where its drift would start
            // (half its height up), so its eager covers are on screen in both modes
            c % 2
              ? "animate-wall-up motion-reduce:-translate-y-1/2"
              : "animate-wall-down",
            c >= ALWAYS_SHOWN && "hidden lg:flex",
          )}
          // Neighbouring columns run at different speeds and start at different offsets, so
          // the wall never reads as one sheet sliding
          style={{
            animationDuration: `${70 + (c % 3) * 12}s`,
            marginTop: c % 2 ? -120 : -40,
          }}
        >
          {[...column, ...column].map((cover, i) => {
            const first = c % 2 ? column.length : 0;
            const eager =
              c < ALWAYS_SHOWN &&
              i >= first + EAGER_FROM &&
              i < first + EAGER_TO;
            const src = optimizedImage(cover, 256, 60);
            const srcSet = WIDTHS.map(
              (width) => `${optimizedImage(cover, width, 60)} ${width}w`,
            ).join(", ");
            return (
              <div
                key={i}
                className="relative aspect-4/5 overflow-hidden rounded bg-base-100"
              >
                {eager ? (
                  <img
                    src={src}
                    srcSet={srcSet}
                    sizes="(max-width: 1024px) 33vw, 16vw"
                    alt=""
                    fetchPriority="high"
                    decoding="async"
                    draggable={false}
                    className="absolute inset-0 size-full object-cover"
                  />
                ) : (
                  <img
                    data-src={src}
                    data-srcset={srcSet}
                    suppressHydrationWarning
                    sizes="(max-width: 1024px) 33vw, 16vw"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="absolute inset-0 size-full object-cover"
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}
      <DeferredImages selector=".post-wall img" />
    </div>
  );
}
