"use client";
import React, { useEffect, useRef, useState } from "react";
import { MotionConfig, motion } from "framer-motion";
import { cn } from "@/lib/utils";

/*
 * Interactive folder gallery from 21st.dev, adapted for Curatit:
 * - Sized for a grid cell instead of a single 400×500 stage; the open row
 *   tightens to fit the folder's own width.
 * - Curatit's warm grays instead of the dark gradients and glows, recolourable
 *   with `tone`, and an optional `icon` on the folder front.
 * - An item can render `content` (any element) instead of an image.
 * - The folder front is a button, Escape closes an open folder, and an open
 *   folder stacks above its neighbours.
 * - Motion follows prefers-reduced-motion.
 * The interaction and springs are unchanged: hover to fan, click to open,
 * drag an item down to close.
 */

export interface GalleryPhoto {
  id: string | number;
  /** Image URL. Ignored when `content` is set. */
  image?: string;
  alt?: string;
  /** Card content rendered instead of an image. */
  content?: React.ReactNode;
}

const defaultPhotos: GalleryPhoto[] = [
  { id: 1, image: "https://cdn.21st.dev/assets/mirror/6c/6cb3aeada3fd347bf4641131fdb05a482044f0233b1b6da0ffb5e83593001e3f.jpg" },
  { id: 2, image: "https://cdn.21st.dev/assets/mirror/e7/e7138a367854517395ba458c0c7c6481cf28afdc227b7d0045973e03e5b1d1c0.jpg" },
  { id: 3, image: "https://cdn.21st.dev/assets/mirror/96/9626c87f656eaa15e08486db4e7ecc217c0243440a21d301a3af6c8092b22a9b.jpg" },
  { id: 4, image: "https://cdn.21st.dev/assets/mirror/da/dacbcb481226af6c6e6bf6426da535ce260db87270fb641953617ffe4a1145bf.jpg" },
  { id: 5, image: "https://cdn.21st.dev/assets/mirror/6e/6e5ed03abf45ab11ad4c94b60bb3cb60326807a1777b2a6e8888d3179f237cd9.jpg" },
];

export interface FolderTone {
  /** Front panel */
  front: string;
  /** Back panel and tab */
  back: string;
  /** Inside of the folder, behind the cards */
  pocket: string;
  /** Icon colour */
  ink: string;
}

// Curatit's warm grays
const defaultTone: FolderTone = {
  front: "var(--color-base-100)",
  back: "var(--color-base-200)",
  pocket: "var(--color-base-300)",
  ink: "var(--color-base-700)",
};

export interface InteractiveFolderGalleryProps {
  photos?: GalleryPhoto[];
  folderName?: string;
  dragHintText?: string;
  /** Folder colours. Any CSS colour. */
  tone?: FolderTone;
  /** Shown on the folder front, above the name */
  icon?: React.ReactNode;
  className?: string;
}

// Card width in px (w-36), and the widest gap between cards in the open row
const CARD_WIDTH = 144;
const OPEN_GAP = 92;

export function InteractiveFolderGallery({
  photos = defaultPhotos,
  folderName = "Photography.gallery",
  dragHintText = "Drag any photo down to close",
  tone = defaultTone,
  icon,
  className,
}: InteractiveFolderGalleryProps) {
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [hoverFolder, setHoverFolder] = useState(false);
  const [width, setWidth] = useState(320);
  const rootRef = useRef<HTMLDivElement>(null);
  const folderRef = useRef<HTMLButtonElement>(null);

  function close() {
    setIsFolderOpen(false);
    setHoverFolder(false);
  }

  // Track the folder's width so the open row fits inside it
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  // Escape closes an open folder and returns focus to it
  useEffect(() => {
    if (!isFolderOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsFolderOpen(false);
      setHoverFolder(false);
      folderRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFolderOpen]);

  const middle = (photos.length - 1) / 2;
  const openGap = Math.max(24, Math.min(OPEN_GAP, (width - CARD_WIDTH * 1.05) / Math.max(photos.length - 1, 1)));

  return (
    <MotionConfig reducedMotion="user">
      <div
        ref={rootRef}
        className={cn("relative w-full", isFolderOpen && "z-30", className)}
        style={
          {
            "--folder-front": tone.front,
            "--folder-back": tone.back,
            "--folder-pocket": tone.pocket,
            "--folder-ink": tone.ink,
          } as React.CSSProperties
        }
      >
        <div className="pointer-events-none relative flex h-72 w-full justify-center">
          {/* Back of the folder */}
          <motion.div
            className="absolute bottom-4 h-36 w-52"
            animate={{ opacity: isFolderOpen ? 0 : 1, scale: isFolderOpen ? 0.9 : 1 }}
          >
            <div className="absolute top-0 left-0 h-6 w-20 rounded-t-lg bg-(--folder-back)" />
            <div className="absolute top-5 right-0 bottom-0 left-0 rounded-tr-xl rounded-b-xl bg-(--folder-back)" />
            <div className="absolute top-6 right-1.5 bottom-1.5 left-1.5 rounded-lg bg-(--folder-pocket)" />
          </motion.div>

          <div className="absolute bottom-6 z-10 flex justify-center">
            {photos.map((photo, i) => {
              const offset = i - middle;

              const stackY = hoverFolder ? offset * -6.4 - 26 : offset * -3.2;
              const stackX = hoverFolder ? offset * 19 : offset * 2;
              const stackRotate = hoverFolder ? offset * 8 : offset * 3;
              const stackScale = 1 - Math.abs(offset) * 0.03;

              const openY = -70;
              const openX = offset * openGap;
              const openRotate = 0;
              const openScale = 1.05;

              return (
                <motion.div
                  key={photo.id}
                  drag={isFolderOpen}
                  dragSnapToOrigin={true}
                  onDragEnd={(_, info) => {
                    if (info.offset.y > 100 && isFolderOpen) close();
                  }}
                  className={cn(
                    "absolute bottom-0 h-45 w-36 origin-bottom overflow-hidden rounded-md bg-white shadow-md",
                    isFolderOpen ? "pointer-events-auto cursor-grab active:cursor-grabbing" : "pointer-events-none"
                  )}
                  animate={
                    !isFolderOpen
                      ? { y: stackY, x: stackX, rotate: stackRotate, scale: stackScale, zIndex: i + 10 }
                      : { y: openY, x: openX, rotate: openRotate, scale: openScale, zIndex: 50 }
                  }
                  whileHover={isFolderOpen ? { scale: openScale + 0.05, zIndex: 100 } : {}}
                  whileDrag={isFolderOpen ? { scale: openScale + 0.1, rotate: 5, zIndex: 150 } : {}}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                >
                  {photo.content ?? (
                    <img
                      src={photo.image}
                      alt={photo.alt ?? ""}
                      draggable={false}
                      className="pointer-events-none h-full w-full object-cover"
                    />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Front of the folder */}
          <motion.button
            ref={folderRef}
            type="button"
            aria-label={`Open ${folderName}`}
            aria-expanded={isFolderOpen}
            aria-hidden={isFolderOpen}
            tabIndex={isFolderOpen ? -1 : 0}
            className={cn(
              "absolute bottom-0 z-20 h-28 w-56 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500",
              isFolderOpen ? "pointer-events-none" : "pointer-events-auto cursor-pointer"
            )}
            style={{ transformOrigin: "bottom" }}
            animate={{ opacity: isFolderOpen ? 0 : 1, rotateX: hoverFolder ? -25 : 0, y: hoverFolder ? 6 : 0 }}
            onMouseEnter={() => setHoverFolder(true)}
            onMouseLeave={() => setHoverFolder(false)}
            onFocus={() => setHoverFolder(true)}
            onBlur={() => setHoverFolder(false)}
            onClick={() => setIsFolderOpen(true)}
          >
            <span className="flex h-full w-full flex-col items-center justify-end gap-2.5 rounded-xl bg-(--folder-front) pb-4 shadow-sm ring-1 ring-base-900/10">
              {icon && (
                <span aria-hidden="true" className="text-(--folder-ink)">
                  {icon}
                </span>
              )}
              <span className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-base-900 shadow-sm ring-1 ring-base-200">
                {folderName}
              </span>
            </span>
          </motion.button>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
          <motion.p
            aria-hidden={!isFolderOpen}
            animate={{ opacity: isFolderOpen ? 1 : 0, y: isFolderOpen ? 0 : 20 }}
            className="rounded-md bg-base-50 px-4 py-2 text-xs font-medium uppercase tracking-widest text-base-500"
          >
            {dragHintText}
          </motion.p>
        </div>
      </div>
    </MotionConfig>
  );
}

export { InteractiveFolderGallery as Component };
