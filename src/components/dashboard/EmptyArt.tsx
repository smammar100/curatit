// Empty-state illustrations for the API tokens page and the analysis review queue (2026-10-18,
// at the owner's request), drawn like the empty board's (BoardView's EmptyBoardArt): flat cards in
// the palette's tokens, so they follow dark mode, fanned out once by .board-art-card in
// global.css (static under reduced motion). Decorative: the words beside them say the same.
import { cx } from "@/lib/cx";

// Phosphor's Key (bold), the icon the tokens page already uses
const KEY =
  "M196,76a16,16,0,1,1-16-16A16,16,0,0,1,196,76Zm48,22.74A84.3,84.3,0,0,1,160.11,180H160a83.52,83.52,0,0,1-23.65-3.38l-7.86,7.87A12,12,0,0,1,120,188H108v12a12,12,0,0,1-12,12H84v12a12,12,0,0,1-12,12H40a20,20,0,0,1-20-20V187.31a19.86,19.86,0,0,1,5.86-14.14l53.52-53.52A84,84,0,1,1,244,98.74ZM202.43,53.57A59.48,59.48,0,0,0,158,36c-32,1-58,27.89-58,59.89a59.69,59.69,0,0,0,4.2,22.19,12,12,0,0,1-2.55,13.21L44,189v23H60V200a12,12,0,0,1,12-12H84V176a12,12,0,0,1,12-12h19l9.65-9.65a12,12,0,0,1,13.22-2.55A59.58,59.58,0,0,0,160,156h.08c32,0,58.87-26.07,59.89-58A59.55,59.55,0,0,0,202.43,53.57Z";

type Side = "left" | "right" | "front";

// Three tokens, one per connected app, the front one dashed: the token you haven't made yet
export function TokensArt({ className }: { className?: string }) {
  const card = (side: Side, x: number, y: number, angle: number) => {
    const front = side === "front";
    return (
      <g transform={`translate(${x} ${y}) rotate(${angle} 75 42)`}>
        <g className="board-art-card" data-side={side}>
          <rect
            x="0.75"
            y="0.75"
            width="148.5"
            height="82.5"
            rx="12"
            fill="var(--color-white)"
            stroke={front ? "var(--color-base-400)" : "var(--color-base-300)"}
            strokeWidth="1.5"
            strokeDasharray={front ? "5 5" : undefined}
          />
          <rect x="12" y="14" width="28" height="28" rx="8" fill="var(--color-base-100)" />
          <svg x="18" y="20" width="16" height="16" viewBox="0 0 256 256">
            <path d={KEY} fill={front ? "var(--color-base-600)" : "var(--color-base-400)"} />
          </svg>
          <rect x="50" y="18" width="70" height="6" rx="3" fill="var(--color-base-200)" />
          <rect x="50" y="31" width="42" height="5" rx="2.5" fill="var(--color-base-200)" />
          {Array.from({ length: 10 }, (_, i) => (
            <circle key={i} cx={19 + i * 11} cy="62" r="3" fill={front ? "var(--color-base-400)" : "var(--color-base-300)"} />
          ))}
        </g>
      </g>
    );
  };
  return (
    <svg viewBox="0 0 280 176" aria-hidden="true" className={cx("pointer-events-none select-none", className)}>
      <ellipse cx="140" cy="164" rx="100" ry="5" fill="var(--color-base-100)" />
      {card("left", 34, 30, -9)}
      {card("right", 96, 30, 9)}
      {card("front", 65, 66, 0)}
    </svg>
  );
}

// A queue cleared: two reviewed rows behind, the front one ticked off
export function ReviewArt({ className }: { className?: string }) {
  const row = (side: Side, x: number, y: number, angle: number) => {
    const front = side === "front";
    return (
      <g transform={`translate(${x} ${y}) rotate(${angle} 90 24)`}>
        <g className="board-art-card" data-side={side}>
          <rect x="0.75" y="0.75" width="178.5" height="46.5" rx="12" fill="var(--color-white)" stroke="var(--color-base-300)" strokeWidth="1.5" />
          <rect x="8" y="8" width="25" height="31" rx="5" fill="var(--color-base-200)" />
          <rect x="43" y="14" width="74" height="6" rx="3" fill="var(--color-base-200)" />
          <rect x="43" y="27" width="46" height="5" rx="2.5" fill="var(--color-base-200)" />
          <circle cx="155" cy="24" r="11" fill={front ? "var(--color-positive-solid)" : "var(--color-base-100)"} />
          <path
            d="M150 24.5l3.4 3.4 6.6-7"
            fill="none"
            stroke={front ? "var(--color-white)" : "var(--color-base-400)"}
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </g>
    );
  };
  return (
    <svg viewBox="0 0 280 176" aria-hidden="true" className={cx("pointer-events-none select-none", className)}>
      <ellipse cx="140" cy="164" rx="100" ry="5" fill="var(--color-base-100)" />
      {row("left", 40, 30, -6)}
      {row("right", 60, 62, 5)}
      {row("front", 50, 104, 0)}
    </svg>
  );
}
