import { cx } from "@/lib/cx";
import { brands, type Brand, type BrandId, type Slide } from "./demo";

// Bigger type for shorter headlines, the way a designer would set them
function headlineSize(text: string) {
  if (text.length <= 6) return "text-[24cqw]";
  if (text.length <= 14) return "text-[15cqw]";
  if (text.length <= 24) return "text-[11cqw]";
  return "text-[9cqw]";
}

// Draws one slide of a demo post in its brand's colours. Sizes use container units,
// so a cover reads the same as a thumbnail and at full size.
export default function PostCover({
  brand: brandId,
  slide,
  className,
}: {
  brand: BrandId;
  slide: Slide;
  className?: string;
}) {
  const brand: Brand = brands[brandId];
  const background = slide.invert ? brand.fg : brand.bg;
  const color = slide.invert ? brand.bg : brand.fg;
  const accent = slide.invert ? undefined : brand.accent;
  const display = brand.serif
    ? "font-display font-normal tracking-[-0.01em]"
    : "font-sans font-extrabold tracking-[-0.04em]";

  return (
    <div
      aria-hidden="true"
      className={cx("@container relative aspect-4/5 overflow-hidden select-none", className)}
      style={{ backgroundColor: background, color }}
    >
      <div className="absolute inset-0 flex flex-col p-[8cqw]">
        <p className="text-[4cqw] font-medium uppercase tracking-[0.08em] opacity-70">{brand.name}</p>

        {slide.layout === "headline" && (
          <div className="mt-auto">
            {slide.eyebrow && (
              <p className="text-[4.5cqw] font-semibold uppercase tracking-[0.06em]" style={{ color: accent }}>
                {slide.eyebrow}
              </p>
            )}
            <p className={cx(display, headlineSize(slide.headline), "mt-[3cqw] leading-[0.95] text-balance")}>
              {slide.headline}
            </p>
            {slide.body && <p className="mt-[4cqw] text-[4.5cqw] opacity-80">{slide.body}</p>}
          </div>
        )}

        {slide.layout === "stat" && (
          <>
            {slide.eyebrow && (
              <p className="mt-[6cqw] text-[4.5cqw] font-semibold uppercase tracking-[0.06em]">{slide.eyebrow}</p>
            )}
            <div className="mt-auto">
              <p className={cx(display, "text-[30cqw] leading-[0.85]")} style={{ color: accent }}>
                {slide.stat}
              </p>
              <p className="mt-[4cqw] text-[6cqw] font-medium leading-tight">{slide.headline}</p>
            </div>
          </>
        )}

        {slide.layout === "quote" && (
          <div className="mt-auto">
            <p className="font-display text-[22cqw] leading-[0.6]" style={{ color: accent }}>
              “
            </p>
            <p className="mt-[2cqw] font-display text-[10cqw] leading-[1.05] text-balance">{slide.headline}</p>
            {slide.body && (
              <p className="mt-[5cqw] text-[4cqw] uppercase tracking-[0.08em] opacity-70">{slide.body}</p>
            )}
          </div>
        )}

        {slide.layout === "list" && (
          <>
            <p className={cx(display, headlineSize(slide.headline), "mt-[6cqw] leading-[0.95] text-balance")}>
              {slide.headline}
            </p>
            <ul className="mt-auto space-y-[2.5cqw]">
              {slide.items?.map((item) => (
                <li key={item} className="flex gap-[3cqw] text-[5cqw] leading-snug">
                  <span className="mt-[1.8cqw] size-[2.5cqw] shrink-0" style={{ backgroundColor: accent ?? color }} />
                  {item}
                </li>
              ))}
            </ul>
          </>
        )}

        {slide.layout === "product" && (
          <>
            <div
              className="mx-auto mt-[6cqw] h-[42cqw] w-[23cqw] rounded-[5cqw]"
              style={{ backgroundColor: accent ?? color }}
            />
            <div className="mt-auto">
              <p className={cx(display, "text-[9cqw] leading-none")}>{slide.headline}</p>
              {slide.body && <p className="mt-[3cqw] text-[4.5cqw] opacity-80">{slide.body}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
