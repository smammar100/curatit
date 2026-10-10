"use client";

import { useState } from "react";
import { motion } from "framer-motion";
// Components
import BrandName from "./BrandName";
import PostCover from "./PostCover";
import { BriefTabs, QueryField, Tag, easeOut, introItem, useIntro, useLoop, useTyped } from "./DemoParts";
import { briefs } from "./demo";
import { usePosts } from "./HomePosts";

// A brief and the posts it returns, as a list with the terms each one matched.
// While on screen it cycles through the briefs: the query types out, then the
// results arrive one by one. Clicking a brief takes over from the loop.
// Fills its box (HowItWorks gives every illustration the same one).
export default function SearchDemo() {
  const [active, setActive] = useState(0);
  const { ref, playing, stop } = useLoop<HTMLDivElement>(4500, () => setActive((i) => (i + 1) % briefs.length));
  const brief = briefs[active];
  const posts = usePosts(brief.results.map((result) => result.post));
  const { typed, done } = useTyped(brief.query, playing);
  const intro = useIntro();

  return (
    <motion.div ref={ref} {...intro} className="flex h-full flex-col pb-10">
      <motion.div variants={introItem}>
        <BriefTabs
          active={active}
          onChange={(i) => {
            stop();
            setActive(i);
          }}
        />
      </motion.div>
      <motion.div variants={introItem} className="mt-3">
        <QueryField query={typed} typing={!done} />
      </motion.div>
      <motion.ul
        variants={introItem}
        className="mt-4 min-h-0 flex-1 divide-y divide-base-200 overflow-hidden"
        aria-live={playing ? "off" : "polite"}
      >
        {posts.map((post, i) => {
          const { matched } = brief.results.find((result) => result.post === post.shortCode)!;
          return (
            <motion.li
              key={post.shortCode}
              className="flex items-center gap-3 py-3"
              initial={false}
              animate={done ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
              transition={done ? { duration: 0.3, ease: easeOut, delay: i * 0.08 } : { duration: 0 }}
            >
              <PostCover post={post} sizes="48px" className="w-12 shrink-0 rounded shadow-sm" />
              <div className="min-w-0">
                <BrandName brand={post.brand} />
                <div className="mt-1.5 flex gap-1 overflow-hidden">
                  {matched.slice(0, 2).map((term) => (
                    <Tag key={term} className="shrink-0">
                      {term}
                    </Tag>
                  ))}
                </div>
              </div>
            </motion.li>
          );
        })}
      </motion.ul>
    </motion.div>
  );
}
