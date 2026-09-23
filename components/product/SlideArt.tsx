import type { SlideArt as Art } from "@/lib/art";

const W = 400;
const H = 500;
const PAD = 32;

/** Greedy word wrap by an approximate glyph width. */
function wrap(text: string, fontSize: number, maxWidth: number, glyph = 0.56) {
  const maxChars = Math.max(4, Math.floor(maxWidth / (fontSize * glyph)));
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Pick the largest size (within bounds) that fits `text` in `maxLines`. */
function fit(text: string, max: number, min: number, maxLines: number, width = W - PAD * 2, glyph?: number) {
  for (let size = max; size >= min; size -= 2) {
    const lines = wrap(text, size, width, glyph);
    if (lines.length <= maxLines) return { size, lines };
  }
  return { size: min, lines: wrap(text, min, width, glyph).slice(0, maxLines) };
}

function Lines({
  lines,
  x,
  y,
  size,
  fill,
  family,
  weight,
  anchor = "start",
  leading = 1.05,
  italic,
}: {
  lines: string[];
  x: number;
  y: number;
  size: number;
  fill: string;
  family: string;
  weight: number;
  anchor?: "start" | "middle";
  leading?: number;
  italic?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      fill={fill}
      fontFamily={family}
      fontWeight={weight}
      fontSize={size}
      textAnchor={anchor}
      fontStyle={italic ? "italic" : undefined}
      letterSpacing={weight >= 700 ? -size * 0.02 : 0}
    >
      {lines.map((line, index) => (
        <tspan key={index} x={x} dy={index === 0 ? 0 : size * leading}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

/**
 * Renders a generated demo slide. Decorative: the accessible description
 * lives on the wrapper (`alt`), because the slide's words are repeated there.
 */
export default function SlideArt({
  art,
  alt,
  className = "",
  crop = "contain",
}: {
  art: Art;
  alt: string;
  className?: string;
  /** "cover" fills a fixed-size frame and crops the edges, for mosaics. */
  crop?: "contain" | "cover";
}) {
  const display = art.serif ? "'Hedvig Letters Serif', Georgia, serif" : "InterVariable, Inter, system-ui, sans-serif";
  const displayWeight = art.serif ? 400 : 800;
  const sans = "InterVariable, Inter, system-ui, sans-serif";
  const glyph = art.serif ? 0.5 : 0.56;

  const eyebrow = art.eyebrow ? (
    <text x={PAD} y={PAD + 12} fill={art.accent} fontFamily={sans} fontSize={13} fontWeight={600} letterSpacing={1.2}>
      {art.eyebrow.toUpperCase()}
    </text>
  ) : null;

  const brand = (
    <text x={W - PAD} y={H - PAD + 4} fill={art.fg} opacity={0.7} fontFamily={sans} fontSize={12} fontWeight={600} textAnchor="end">
      {art.brand}
    </text>
  );

  let body: React.ReactNode = null;

  switch (art.layout) {
    case "stat": {
      const stat = fit(art.stat ?? "", 150, 60, 1, W - PAD * 2, 0.6);
      const headline = fit(art.headline, 30, 18, 3, W - PAD * 2, glyph);
      body = (
        <>
          <Lines lines={stat.lines} x={PAD} y={250} size={stat.size} fill={art.accent} family={display} weight={displayWeight} />
          <Lines lines={headline.lines} x={PAD} y={250 + headline.size * 1.6} size={headline.size} fill={art.fg} family={display} weight={displayWeight} leading={1.15} />
        </>
      );
      break;
    }
    case "list": {
      const headline = fit(art.headline, 36, 22, 2, W - PAD * 2, glyph);
      const startY = PAD + 40 + headline.size;
      body = (
        <>
          <Lines lines={headline.lines} x={PAD} y={startY} size={headline.size} fill={art.fg} family={display} weight={displayWeight} />
          {(art.items ?? []).slice(0, 5).map((item, index) => {
            const y = startY + headline.lines.length * headline.size * 1.05 + 40 + index * 52;
            return (
              <g key={index}>
                <rect x={PAD} y={y - 18} width={W - PAD * 2} height={1} fill={art.fg} opacity={0.25} />
                <circle cx={PAD + 6} cy={y + 10} r={5} fill={art.accent} />
                <text x={PAD + 22} y={y + 16} fill={art.fg} fontFamily={sans} fontSize={18} fontWeight={500}>
                  {item}
                </text>
              </g>
            );
          })}
        </>
      );
      break;
    }
    case "quote": {
      const headline = fit(art.headline, 40, 22, 5, W - PAD * 2, glyph);
      body = (
        <>
          <text x={PAD - 4} y={PAD + 90} fill={art.accent} fontFamily="Georgia, serif" fontSize={130} fontWeight={700}>
            “
          </text>
          <Lines lines={headline.lines} x={PAD} y={200} size={headline.size} fill={art.fg} family={display} weight={art.serif ? 400 : 700} italic={art.serif} leading={1.15} />
          {art.body ? (
            <text x={PAD} y={200 + headline.lines.length * headline.size * 1.15 + 28} fill={art.accent} fontFamily={sans} fontSize={14} fontWeight={600} letterSpacing={0.8}>
              — {art.body.toUpperCase()}
            </text>
          ) : null}
        </>
      );
      break;
    }
    case "product": {
      const headline = fit(art.headline, 36, 20, 2, W - PAD * 2, glyph);
      body = (
        <>
          <rect x={120} y={70} width={160} height={250} rx={28} fill={art.accent} />
          <rect x={140} y={100} width={120} height={60} rx={10} fill={art.bg} opacity={0.35} />
          <rect x={160} y={300} width={80} height={10} rx={5} fill={art.bg} opacity={0.3} />
          <Lines lines={headline.lines} x={PAD} y={380} size={headline.size} fill={art.fg} family={display} weight={displayWeight} />
          {art.body ? (
            <text x={PAD} y={380 + headline.lines.length * headline.size * 1.05 + 10} fill={art.fg} opacity={0.75} fontFamily={sans} fontSize={15}>
              {art.body}
            </text>
          ) : null}
        </>
      );
      break;
    }
    case "photo": {
      const headline = fit(art.headline, 36, 20, 3, W - PAD * 2, glyph);
      const id = `g-${art.bg.slice(1)}-${art.accent.slice(1)}`;
      body = (
        <>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={art.accent} stopOpacity={0.9} />
              <stop offset="100%" stopColor={art.bg} stopOpacity={1} />
            </linearGradient>
            <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="45%" stopColor="#000" stopOpacity={0} />
              <stop offset="100%" stopColor="#000" stopOpacity={0.55} />
            </linearGradient>
          </defs>
          <rect width={W} height={H} fill={`url(#${id})`} />
          <circle cx={290} cy={150} r={70} fill={art.fg} opacity={0.18} />
          <path d={`M0 ${H * 0.62} L130 ${H * 0.42} L230 ${H * 0.56} L320 ${H * 0.46} L${W} ${H * 0.6} L${W} ${H} L0 ${H} Z`} fill={art.bg} opacity={0.55} />
          <rect width={W} height={H} fill={`url(#${id}-shade)`} />
          <Lines lines={headline.lines} x={PAD} y={H - PAD - 34 - (headline.lines.length - 1) * headline.size} size={headline.size} fill="#FFFFFF" family={display} weight={displayWeight} />
        </>
      );
      break;
    }
    case "split": {
      const headline = fit(art.headline, 44, 22, 3, W / 2 + 40, glyph);
      body = (
        <>
          <rect x={W * 0.58} y={0} width={W * 0.42} height={H} fill={art.accent} />
          <Lines lines={headline.lines} x={PAD} y={230} size={headline.size} fill={art.fg} family={display} weight={displayWeight} />
          {art.body ? (
            <text x={PAD} y={230 + headline.lines.length * headline.size * 1.05 + 14} fill={art.fg} opacity={0.75} fontFamily={sans} fontSize={16}>
              {art.body}
            </text>
          ) : null}
        </>
      );
      break;
    }
    default: {
      // headline
      const headline = fit(art.headline, art.serif ? 52 : 64, 24, 5, W - PAD * 2, glyph);
      const blockHeight = headline.lines.length * headline.size * 1.05;
      const y = H - PAD - 60 - blockHeight + headline.size;
      body = (
        <>
          <Lines lines={headline.lines} x={PAD} y={y} size={headline.size} fill={art.fg} family={display} weight={displayWeight} />
          {art.body ? (
            <text x={PAD} y={y + blockHeight + 6} fill={art.fg} opacity={0.75} fontFamily={sans} fontSize={16}>
              {art.body}
            </text>
          ) : null}
        </>
      );
    }
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      preserveAspectRatio={crop === "cover" ? "xMidYMid slice" : undefined}
      className={`block w-full ${crop === "cover" ? "h-full" : "h-auto"} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width={W} height={H} fill={art.bg} />
      {body}
      {art.layout !== "photo" && eyebrow}
      {art.layout === "photo" && art.eyebrow ? (
        <text x={PAD} y={PAD + 12} fill="#FFFFFF" fontFamily={sans} fontSize={13} fontWeight={600} letterSpacing={1.2}>
          {art.eyebrow.toUpperCase()}
        </text>
      ) : null}
      {brand}
    </svg>
  );
}
