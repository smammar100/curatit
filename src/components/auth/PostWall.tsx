import { optimizedImage } from "@/lib/posts";
import { cx } from "@/lib/cx";

// Behind the sign-in and sign-up card: a masonry of the library's covers whose columns drift
// up and down and loop, dissolving into the page at the top and bottom. Decorative, so the
// covers carry no alt text. Each column holds its covers twice, so the drift has no seam.
const COLUMNS = 6;
const PER_COLUMN = 8;
const WIDTHS = [256, 384];

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
      className="absolute inset-0 grid grid-cols-3 gap-3 px-3 opacity-80 lg:grid-cols-6"
      style={{ maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE }}
    >
      {columns.map((column, c) => (
        <div
          key={c}
          className={cx(
            "flex flex-col gap-3 motion-reduce:animate-none",
            c % 2 ? "animate-wall-up" : "animate-wall-down",
            c >= 3 && "hidden lg:flex",
          )}
          // Neighbouring columns run at different speeds and start at different offsets, so
          // the wall never reads as one sheet sliding
          style={{ animationDuration: `${70 + (c % 3) * 12}s`, marginTop: c % 2 ? -120 : -40 }}
        >
          {[...column, ...column].map((cover, i) => (
            <div key={i} className="relative aspect-4/5 overflow-hidden rounded bg-base-100">
              <img
                src={optimizedImage(cover, 256, 60)}
                srcSet={WIDTHS.map((width) => `${optimizedImage(cover, width, 60)} ${width}w`).join(", ")}
                sizes="(max-width: 1024px) 33vw, 16vw"
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
                className="absolute inset-0 size-full object-cover"
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
