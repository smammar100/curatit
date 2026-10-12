"use client";

// The founder's photo on the Vision page (public/images/founder.jpg). Until that file exists the
// image fails to load, and the circle shows the initials instead of a broken image.
import Image from "next/image";
import { useState } from "react";

export default function FounderPhoto({ src, initials, className }: { src: string; initials: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={["relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-base-100 outline-1 -outline-offset-1 outline-edge", className].filter(Boolean).join(" ")}>
      {failed ? (
        <span aria-hidden="true" className="text-sm font-medium tracking-wide text-base-600">
          {initials}
        </span>
      ) : (
        <Image src={src} alt="" fill sizes="64px" className="object-cover" onError={() => setFailed(true)} />
      )}
    </div>
  );
}
