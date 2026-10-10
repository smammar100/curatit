"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import { m } from "framer-motion";
import { cx } from "@/lib/cx";
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
 * view, once per session. Reduced motion shows the finished scene.
 */

const SCENE = { w: 1400, h: 1000 };

function Cover({ id, className }: { id: string; className?: string }) {
  const post = usePost(id);
  return post ? <PostCover post={post} sizes="120px" className={className} /> : null;
}

function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-md bg-white shadow ring-1 ring-base-200", className)}>{children}</div>;
}

function Phone({ id, name }: { id: string; name: string }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex h-5 items-center justify-between px-2.5 text-[9px] font-medium text-base-900">
        <span>9:41</span>
        <span className="flex gap-0.5">
          <span className="h-2 w-1 bg-base-900" />
          <span className="h-2 w-1 bg-base-900" />
          <span className="h-2 w-1 bg-base-300" />
        </span>
      </div>
      <Cover id={id} />
      <p className="px-2.5 py-1.5 text-[11px] text-base-500">{name}</p>
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

type Scrap = { key: string; x: number; y: number; w: number; rotate?: number; delay: number; node: ReactNode };

const scraps: Scrap[] = [
  {
    key: "saved",
    x: 70,
    y: 150,
    w: 230,
    delay: 0.05,
    node: (
      <Card className="p-3">
        <div className="flex items-center justify-between text-[12px]">
          <span className="font-medium text-base-900">Saved</span>
          <span className="text-base-500">All posts</span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1">
          {scattered.saved.map((id) => (
            <Cover key={id} id={id} className="rounded-sm" />
          ))}
        </div>
        <p className="mt-2 text-[11px] text-base-500">2,318 posts · no folders</p>
      </Card>
    ),
  },
  { key: "shot-a", x: 350, y: 70, w: 150, rotate: -5, delay: 0.2, node: <Phone id={scattered.screenshots[0]} name="IMG_4821.PNG" /> },
  { key: "shot-b", x: 440, y: 125, w: 150, rotate: 4, delay: 0.3, node: <Phone id={scattered.screenshots[1]} name="IMG_4830.PNG" /> },
  {
    key: "chat",
    x: 640,
    y: 150,
    w: 380,
    delay: 0.4,
    node: (
      <Card className="flex gap-3 p-3">
        <Image src="/images/avatar.jpeg" alt="" width={36} height={36} className="size-9 shrink-0 rounded-full object-cover" />
        <div className="min-w-0">
          <p className="text-[12px] text-base-500">
            <span className="font-medium text-base-900">Priya</span> · 10:42
          </p>
          <p className="mt-0.5 text-[14px] leading-snug text-base-900">
            do you have that carousel from the money app? the one with the phone on every slide
          </p>
        </div>
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-600 text-[11px] font-semibold text-paper">
          3
        </span>
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
        <p className="border-b border-base-100 px-3 py-1.5 text-[12px] font-medium text-base-900">links_FINAL_v3.xlsx</p>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-base-50 text-left text-base-500">
              <th className="px-3 py-1 font-medium">Brand</th>
              <th className="px-3 py-1 font-medium">Link</th>
              <th className="px-3 py-1 font-medium">Why it&apos;s good</th>
            </tr>
          </thead>
          <tbody>
            {sheetRows.map((row, i) => (
              <tr key={i} className="border-t border-base-100">
                {row.map((cell, j) => (
                  <td key={j} className={cx("px-3 py-1", j === 0 ? "text-base-900" : "text-base-600", j === 2 && "italic")}>
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
        <p className="text-[15px] font-semibold text-base-900">References — Payments launch</p>
        <ul className="mt-2 space-y-1 text-[12px] text-base-600">
          <li>• instagram.com/p/DeJsl6… (green one?)</li>
          <li>• the Coinbase card-pack post → ask Jo</li>
          <li>• pinterest board → link dead</li>
          <li>• see slack thread from March</li>
          <li className="text-base-400">• TODO: find the carousel with the phone</li>
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
        <p className="border-b border-base-100 px-3 py-1.5 text-[12px] text-base-600">
          <span className="font-medium text-base-900">moodboard-spring-v2</span> · Design file
        </p>
        <div className="relative h-48 bg-base-50">
          <Cover id={scattered.canvas[0]} className="absolute top-4 left-5 w-16 rotate-[-6deg] rounded-sm shadow-sm" />
          <Cover id={scattered.canvas[1]} className="absolute top-10 left-28 w-20 rotate-[3deg] rounded-sm shadow-sm" />
          <Cover id={scattered.canvas[2]} className="absolute top-3 right-6 w-16 rotate-[8deg] rounded-sm shadow-sm" />
          <span className="absolute top-28 left-44 rounded-sm bg-base-900 px-1.5 py-0.5 text-[10px] text-white">Sam</span>
          <span className="absolute top-36 right-14 rounded-sm bg-accent-600 px-1.5 py-0.5 text-[10px] text-paper">Jo</span>
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
          <div className="absolute top-0 left-0 h-5 w-14 rounded-t-md bg-base-200" />
          <div className="absolute inset-x-0 top-4 bottom-0 rounded-tr-md rounded-b-md bg-base-200" />
          <div className="absolute inset-x-1 top-6 bottom-1 rounded-md bg-base-300" />
        </div>
        <p className="mt-2 text-[12px] font-medium text-base-900">Inspo_final_v3</p>
        <p className="text-[11px] text-base-500">47 items · modified 3 months ago</p>
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
        <p className="text-[13px] font-medium text-base-900">Re: Re: Re: refs for the deck</p>
        <p className="mt-0.5 text-[12px] text-base-600">
          <span className="text-base-900">Marcus</span> · Attached 12 screenshots. Not sure which brand the second one was.
        </p>
        <div className="mt-2 flex gap-1 text-[10px] text-base-600">
          <span className="rounded-sm bg-base-50 px-1.5 py-0.5">IMG_4821.PNG</span>
          <span className="rounded-sm bg-base-50 px-1.5 py-0.5">IMG_4830.PNG</span>
          <span className="rounded-sm bg-base-50 px-1.5 py-0.5">+10</span>
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
          <span key={i} className={cx("h-6 flex-1 rounded-sm", i % 3 === 0 ? "bg-base-200" : "bg-base-100")} />
        ))}
        <span className="shrink-0 px-1 text-[11px] text-base-500">+38 tabs</span>
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
        <p className="text-[11px] font-medium text-base-900">moodboard_v7.pdf</p>
        <div className="mt-2 grid grid-cols-3 gap-1">
          {scattered.pdf.map((id) => (
            <Cover key={id} id={id} className="rounded-sm" />
          ))}
        </div>
        <p className="mt-2 text-[10px] text-base-500">14 MB · page 3 of 22</p>
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
      <div className="rounded-2xl rounded-bl-sm bg-base-100 px-4 py-2.5 text-[13px] leading-snug text-base-900">
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

const variants = {
  hidden: { opacity: 0, scale: 0.86, y: 12 },
  shown: { opacity: 1, scale: 1, y: 0 },
};

export default function Scattered({ className }: { className?: string }) {
  const { ref, intro } = useIntroOnce<HTMLDivElement>("curatit:scattered-intro");

  // Scale the scene to cover its container
  const [scale, setScale] = useState(0.6);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setScale(Math.max(width / SCENE.w, height / SCENE.h));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const hidden = intro === "armed";

  return (
    <div
      ref={ref}
      role="img"
      aria-label="References for one brief scattered across saved posts, phone screenshots, chat messages, a spreadsheet of links, a notes page, a design file, a folder, an email thread, open browser tabs and a PDF"
      className={cx("pointer-events-none select-none overflow-hidden", className)}
    >
      <div
        className="absolute top-[42%] left-1/2"
        style={{ width: SCENE.w, height: SCENE.h, transform: `translate(-50%, -42%) scale(${scale})` }}
      >
        <svg className="absolute inset-0 size-full" viewBox={`0 0 ${SCENE.w} ${SCENE.h}`} fill="none" aria-hidden="true">
          {connectors.map((d) => (
            <path key={d} d={d} className="stroke-base-300" strokeWidth="1.5" strokeDasharray="6 6" />
          ))}
        </svg>
        {scraps.map((scrap) => (
          <m.div
            key={scrap.key}
            className="absolute"
            style={{ left: scrap.x, top: scrap.y, width: scrap.w, rotate: scrap.rotate ?? 0 }}
            variants={variants}
            initial={false}
            animate={hidden ? "hidden" : "shown"}
            transition={
              hidden
                ? { duration: 0 }
                : { type: "spring", stiffness: 320, damping: 26, delay: intro === "play" ? scrap.delay : 0 }
            }
          >
            {scrap.node}
          </m.div>
        ))}
      </div>
    </div>
  );
}
