import SlideArt from "@/components/product/SlideArt";
import type { SlideArt as Art } from "@/lib/art";

/**
 * The art behind product windows, painted from the library's own covers:
 * enlarged and blurred. The palette comes from the content rather than an
 * arbitrary gradient, so each panel feels like Curatit's material.
 */
export default function Backdrop({ covers, offset = 0 }: { covers: { art: Art }[]; offset?: number }) {
  const tiles = Array.from({ length: 6 }, (_, index) => covers[(index + offset) % Math.max(covers.length, 1)]).filter(
    Boolean
  );

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none overflow-hidden bg-muted">
      <div className="absolute -inset-[15%] grid grid-cols-3 grid-rows-2 blur-2xl saturate-[0.85]">
        {tiles.map((tile, index) => (
          <div key={index} className="overflow-hidden">
            <div className="h-[140%] w-full -translate-y-[15%] scale-125">
              <SlideArt art={tile.art} alt="" className="h-full w-full" />
            </div>
          </div>
        ))}
      </div>
      {/* A veil in the page colour keeps the backdrop behind the window. */}
      <div className="absolute inset-0 bg-background/40" />
    </div>
  );
}
