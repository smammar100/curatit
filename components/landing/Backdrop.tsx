import SlideArt from "@/components/product/SlideArt";
import type { SlideArt as Art } from "@/lib/art";

/**
 * The art behind product windows, painted from the library's own covers:
 * enlarged, blurred, and grained. The palette comes from the content rather
 * than an arbitrary gradient, so each panel feels like Curatit's material.
 */
export default function Backdrop({ covers, offset = 0 }: { covers: { art: Art }[]; offset?: number }) {
  const tiles = Array.from({ length: 6 }, (_, index) => covers[(index + offset) % Math.max(covers.length, 1)]).filter(
    Boolean
  );

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none overflow-hidden bg-base-200">
      <div className="absolute -inset-[15%] grid grid-cols-3 grid-rows-2 blur-2xl saturate-[0.85]">
        {tiles.map((tile, index) => (
          <div key={index} className="overflow-hidden">
            <div className="h-[140%] w-full -translate-y-[15%] scale-125">
              <SlideArt art={tile.art} alt="" className="h-full w-full" />
            </div>
          </div>
        ))}
      </div>
      {/* Warm veil keeps the backdrop behind the window, not competing with it. */}
      <div className="absolute inset-0 bg-surface/35" />
      {/* Paper grain (self-contained data URI, so repeated backdrops don't clash on ids). */}
      <div className="absolute inset-0 opacity-[0.22] mix-blend-multiply" style={{ backgroundImage: GRAIN }} />
    </div>
  );
}

const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>"
)}")`;
