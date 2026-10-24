"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { Badge } from "@/components/glaze/ui/badge";
import { cx } from "@/lib/cx";
import { useMounted } from "@/lib/useMounted";
import PostCover from "./PostCover";
import { scattered } from "./demo";
import { usePost } from "./HomePosts";
import { useIntroOnce } from "./useIntroOnce";

/*
 * The problem: one brief's worth of references, scattered across saved folders,
 * screenshots, chats, a spreadsheet and a deck. Drawn in code on a fixed
 * 1400×1000 scene that scales to cover its container, so the composition holds
 * at any size and crops at the edges on phones.
 *
 * The scraps pop in one after another the first time the scene scrolls into
 * view, once per session. Reduced motion shows the finished scene, and so does
 * a scene already on screen when its section comes alive (see useIntroOnce).
 *
 * Drawn on Glaze's tokens since 2026-10-24: every scrap is a card lifted on Fluid
 * Functionalism's surface ladder (surfaces stay FF's) with the panel corner, its text in
 * Glaze's type roles in text-1 and text-2, its fills the grey well and its rules the faint
 * hairline; the chat's unread count is Glaze's Badge, and the design file's cursor tags are
 * the ink and the paper (Glaze has no brand accent).
 */

const SCENE = { w: 1400, h: 1000 };
// The scene covers its container through CSS, so the server HTML is already the right size
// (a ResizeObserver used to set it after mount, and the scene jumped from a guessed 0.6): the
// larger of the container's width over the scene's and its height over the scene's.
// tan(atan2(a, b)) is a / b as the plain number `scale` takes; cqw and cqh are the container's
const COVER = `max(tan(atan2(100cqw, ${SCENE.w}px)), tan(atan2(100cqh, ${SCENE.h}px)))`;

function Cover({ id, className }: { id: string; className?: string }) {
  const post = usePost(id);
  return post ? <PostCover post={post} sizes="120px" className={className} /> : null;
}

// The chat scrap's avatar, requested only after mount like the covers (PostCover): in the server
// HTML it's an empty circle of the same size, so it stays out of the bytes the first paint waits for
function Avatar() {
  const mounted = useMounted();
  const className = "size-9 shrink-0 rounded-pill object-cover";
  return mounted ? (
    <Image src="/images/avatar.jpeg" alt="" width={36} height={36} className={className} />
  ) : (
    <span aria-hidden="true" className={className} />
  );
}

function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-panel bg-surface-3 shadow-surface-2", className)}>{children}</div>;
}

function Phone({ id, name }: { id: string; name: string }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex h-5 items-center justify-between px-2.5 text-micro font-medium text-text-1">
        <span>9:41</span>
        <span className="flex gap-0.5">
          <span className="h-2 w-1 bg-ink" />
          <span className="h-2 w-1 bg-ink" />
          <span className="h-2 w-1 bg-line" />
        </span>
      </div>
      <Cover id={id} />
      <p className="px-2.5 py-1.5 text-micro text-text-2">{name}</p>
    </Card>
  );
}

const sheetRows = [
  ["Wise", "instagram.com/p/DeJsl6…", ""],
  ["??", "instagram.com/p/DdscgU…", "the 26 outfits one"],
  ["Airbnb", "instagram.com/p/Dd6t2U…", ""],
  ["", "pinterest.com/pin/3391…", "ask Sam"],
  ["Uber Eats", "instagram.com/p/Dd9aD_…", ""],
  ["Tripadvisor", "tiktok.com/@tripadvisor/vid…", "??"],
  ["", "drive.google.com/file/d…", ""],
];

type Scrap = {
  key: string;
  x: number;
  y: number;
  w: number;
  rotate?: number;
  delay: number;
  node: ReactNode;
};

const scraps: Scrap[] = [
  {
    key: "saved",
    x: 70,
    y: 150,
    w: 230,
    delay: 0.05,
    node: (
      <Card className="p-3">
        <div className="flex items-center justify-between type-caption">
          <span className="font-medium text-text-1">Saved</span>
          <span className="text-text-2">All posts</span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1">
          {scattered.saved.map((id) => (
            <Cover key={id} id={id} className="rounded-tag" />
          ))}
        </div>
        <p className="mt-2 text-micro text-text-2">2,318 posts · no folders</p>
      </Card>
    ),
  },
  {
    key: "shot-a",
    x: 350,
    y: 70,
    w: 150,
    rotate: -5,
    delay: 0.2,
    node: <Phone id={scattered.screenshots[0]} name="IMG_4821.PNG" />,
  },
  {
    key: "shot-b",
    x: 440,
    y: 125,
    w: 150,
    rotate: 4,
    delay: 0.3,
    node: <Phone id={scattered.screenshots[1]} name="IMG_4830.PNG" />,
  },
  {
    key: "chat",
    x: 640,
    y: 150,
    w: 380,
    delay: 0.4,
    node: (
      <Card className="flex gap-3 p-3">
        <Avatar />
        <div className="min-w-0">
          <p className="type-caption text-text-2">
            <span className="font-medium text-text-1">Priya</span> · 10:42
          </p>
          <p className="mt-0.5 type-body-sm text-text-1">
            do you have that carousel from the money app? the one with the phone on every slide
          </p>
        </div>
        <Badge count={3} className="shrink-0" />
      </Card>
    ),
  },
  {
    key: "sheet",
    x: 40,
    y: 470,
    w: 520,
    delay: 0.5,
    node: (
      <Card className="overflow-hidden">
        <p className="border-b border-line-faint px-3 py-1.5 type-label-sm text-text-1">links_FINAL_v3.xlsx</p>
        <table className="w-full text-micro">
          <thead>
            <tr className="bg-field text-left font-medium text-text-2">
              <th className="px-3 py-1 font-medium">Brand</th>
              <th className="px-3 py-1 font-medium">Link</th>
              <th className="px-3 py-1 font-medium">Why it&apos;s good</th>
            </tr>
          </thead>
          <tbody>
            {sheetRows.map((row, i) => (
              <tr key={i} className="border-t border-line-faint">
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={cx("px-3 py-1", j === 0 ? "text-text-1" : "text-text-2", j === 2 && "italic")}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    ),
  },
  {
    key: "notes",
    x: 610,
    y: 330,
    w: 300,
    delay: 0.65,
    node: (
      <Card className="p-4">
        <p className="type-label text-text-1">References: Payments launch</p>
        <ul className="mt-2 space-y-1 type-caption text-text-2">
          <li>• instagram.com/p/DeJsl6… (green one?)</li>
          <li>• the Coinbase card-pack post → ask Jo</li>
          <li>• pinterest board → link dead</li>
          <li>• see slack thread from March</li>
          <li>• TODO: find the carousel with the phone</li>
        </ul>
      </Card>
    ),
  },
  {
    key: "canvas",
    x: 980,
    y: 70,
    w: 380,
    delay: 0.3,
    node: (
      <Card className="overflow-hidden">
        <p className="border-b border-line-faint px-3 py-1.5 type-caption text-text-2">
          <span className="font-medium text-text-1">moodboard-spring-v2</span> · Design file
        </p>
        <div className="relative h-48 bg-field">
          <Cover id={scattered.canvas[0]} className="absolute top-4 left-5 w-16 -rotate-6 rounded-tag" />
          <Cover id={scattered.canvas[1]} className="absolute top-10 left-28 w-20 rotate-3 rounded-tag" />
          <Cover id={scattered.canvas[2]} className="absolute top-3 right-6 w-16 rotate-8 rounded-tag" />
          <span className="absolute top-28 left-44 rounded-tag bg-ink px-1.5 py-0.5 text-micro text-text-inverse">
            Sam
          </span>
          <span className="absolute top-36 right-14 rounded-tag border border-line bg-paper px-1.5 py-0.5 text-micro text-text-1">
            Jo
          </span>
        </div>
      </Card>
    ),
  },
  {
    key: "folder",
    x: 1180,
    y: 440,
    w: 180,
    delay: 0.8,
    node: (
      <div className="text-center">
        <div className="relative mx-auto h-24 w-32">
          <div className="absolute top-0 left-0 h-5 w-14 rounded-t-tag bg-field" />
          <div className="absolute inset-x-0 top-4 bottom-0 rounded-tr-tag rounded-b-tag bg-field" />
          <div className="absolute inset-x-1 top-6 bottom-1 rounded-tag bg-line" />
        </div>
        <p className="mt-2 type-label-sm text-text-1">Inspo_final_v3</p>
        <p className="text-micro text-text-2">47 items · modified 3 months ago</p>
      </div>
    ),
  },
  {
    key: "mail",
    x: 930,
    y: 590,
    w: 360,
    delay: 0.7,
    node: (
      <Card className="p-3">
        <p className="type-label text-text-1">Re: Re: Re: refs for the deck</p>
        <p className="mt-0.5 type-caption text-text-2">
          <span className="text-text-1">Marcus</span> · Attached 12 screenshots. Not sure which brand the second one was.
        </p>
        <div className="mt-2 flex gap-1 text-micro text-text-2">
          <span className="rounded-tag bg-field px-1.5 py-0.5">IMG_4821.PNG</span>
          <span className="rounded-tag bg-field px-1.5 py-0.5">IMG_4830.PNG</span>
          <span className="rounded-tag bg-field px-1.5 py-0.5">+10</span>
        </div>
      </Card>
    ),
  },
  {
    key: "tabs",
    x: 560,
    y: 790,
    w: 480,
    delay: 0.9,
    node: (
      <Card className="flex items-center gap-1 px-2 py-1.5">
        {Array.from({ length: 16 }, (_, i) => (
          <span key={i} className={cx("h-6 flex-1 rounded-tag", i % 3 === 0 ? "bg-line" : "bg-field")} />
        ))}
        <span className="shrink-0 px-1 text-micro text-text-2">+38 tabs</span>
      </Card>
    ),
  },
  {
    key: "pdf",
    x: 1110,
    y: 650,
    w: 200,
    rotate: 3,
    delay: 1,
    node: (
      <Card className="p-3">
        <p className="type-label-sm text-text-1">moodboard_v7.pdf</p>
        <div className="mt-2 grid grid-cols-3 gap-1">
          {scattered.pdf.map((id) => (
            <Cover key={id} id={id} className="rounded-tag" />
          ))}
        </div>
        <p className="mt-2 text-micro text-text-2">14 MB · page 3 of 22</p>
      </Card>
    ),
  },
  {
    key: "dm",
    x: 330,
    y: 810,
    w: 250,
    delay: 1.1,
    node: (
      <div className="rounded-shell rounded-bl-tag bg-field px-4 py-2.5 type-body-sm text-text-1">
        sending you a few screenshots, the green one is somewhere in there
      </div>
    ),
  },
];

// Dashed lines between scraps, like the connectors on a corkboard
const connectors = [
  "M300 260 C 450 260, 500 190, 640 190",
  "M500 340 C 480 420, 380 440, 300 470",
  "M760 330 C 820 280, 900 330, 980 260",
  "M560 620 C 650 680, 620 760, 700 790",
  "M1110 590 C 1180 610, 1160 640, 1210 650",
  "M1170 330 C 1250 340, 1240 410, 1270 440",
];

export default function Scattered({ className }: { className?: string }) {
  const { ref, intro } = useIntroOnce<HTMLDivElement>("curatit:scattered-intro");

  const hidden = intro === "armed";

  return (
    <div
      ref={ref}
      role="img"
      aria-label="References for one brief scattered across saved posts, phone screenshots, chat messages, a spreadsheet of links, a notes page, a design file, a folder, an email thread, open browser tabs and a PDF"
      className={cx("pointer-events-none select-none overflow-hidden [container-type:size]", className)}
    >
      {/* The 1400 × 1000 scene, centred a little above the middle and scaled to cover (--cover) */}
      <div
        className="absolute top-[42%] left-1/2 h-250 w-350 -translate-x-1/2 -translate-y-[42%] scale-(--cover)"
        style={{ "--cover": COVER } as CSSProperties}
      >
        <svg className="absolute inset-0 size-full" viewBox={`0 0 ${SCENE.w} ${SCENE.h}`} fill="none" aria-hidden="true">
          {connectors.map((d) => (
            <path key={d} d={d} className="stroke-line" strokeWidth="1.5" strokeDasharray="6 6" />
          ))}
        </svg>
        {scraps.map((scrap) => (
          // The pop-in is CSS (.scattered-hidden / .scattered-in in global.css): hidden while armed, then each
          // scrap springs in on its own delay once the intro plays. No motion components here,
          // so the first section below the hero hydrates without the animation engine.
          <div
            key={scrap.key}
            className={cx(
              "scattered-scrap absolute top-(--y) left-(--x) w-(--w) rotate-(--r)",
              hidden && "scattered-hidden",
              // The delay is marked important: .scattered-in (global.css, unlayered) sets the whole
              // animation shorthand, which would otherwise reset it
              intro === "play" && "scattered-in [animation-delay:var(--delay)]!",
            )}
            style={
              {
                "--x": `${scrap.x}px`,
                "--y": `${scrap.y}px`,
                "--w": `${scrap.w}px`,
                "--r": `${scrap.rotate ?? 0}deg`,
                "--delay": `${scrap.delay}s`,
              } as CSSProperties
            }
          >
            {scrap.node}
          </div>
        ))}
      </div>
    </div>
  );
}
