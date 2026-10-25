import type {
  LifelineEvent,
  LifelineEventEffect,
  LifelineEventImage,
  LifelineEventSegment,
} from "./types"

function getEventContent(
  event: LifelineEvent,
): string | LifelineEventSegment[] {
  if (typeof event === "object" && !Array.isArray(event) && "text" in event) {
    return event.text
  }

  return event
}

export function getLifelineEventImage(
  event: LifelineEvent,
): LifelineEventImage | undefined {
  if (typeof event === "object" && !Array.isArray(event) && "image" in event) {
    return event.image
  }

  return undefined
}

export function getLifelineEventEffect(
  event: LifelineEvent,
): LifelineEventEffect | undefined {
  if (typeof event === "object" && !Array.isArray(event) && "effect" in event) {
    return event.effect
  }

  return undefined
}

// Curatit: the event's gallery, if it has one
export function getLifelineEventGallery(event: LifelineEvent) {
  if (typeof event === "object" && !Array.isArray(event) && "gallery" in event) {
    return event.gallery
  }

  return undefined
}

// Curatit: round images that wrap onto as many lines as the column needs, each with a hairline so
// a white mark keeps its edge (inside .lifeline-typeset, white is the light ink on the dark theme).
// One label names them for screen readers; the images themselves are decorative
export function LifelineEventGallery({ gallery }: { gallery: NonNullable<ReturnType<typeof getLifelineEventGallery>> }) {
  return (
    <div role="img" aria-label={gallery.label} className="mt-3 flex max-w-[18rem] flex-wrap gap-1">
      {gallery.images.map((image) => (
        // Each mark names itself in a small tooltip on hover, lifted over its neighbours (the label
        // already names them all for screen readers, so the tooltip is hidden from them)
        <span key={image.src} className="group/mark relative hover:z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.src}
            alt=""
            width={24}
            height={24}
            loading="lazy"
            draggable={false}
            className="block size-6 rounded-full bg-zinc-100 object-cover ring-1 ring-black/10 dark:bg-zinc-800 dark:ring-white/10"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-[11px] font-medium leading-none text-zinc-50 opacity-0 transition-opacity duration-150 group-hover/mark:opacity-100 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {image.alt}
          </span>
        </span>
      ))}
    </div>
  )
}

export function LifelineEventText({
  event,
  className,
}: {
  event: LifelineEvent
  className?: string
}) {
  const content = getEventContent(event)

  if (typeof content === "string") {
    return <span className={className}>{content}</span>
  }

  return (
    <span className={className}>
      {content.map((segment, index) =>
        segment.type === "link" ? (
          <a
            key={index}
            href={segment.href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-zinc-400 underline-offset-2 transition-colors duration-300 group-hover:text-black group-hover:decoration-zinc-600 dark:decoration-zinc-700 dark:group-hover:text-white dark:group-hover:decoration-zinc-400"
          >
            {segment.value}
          </a>
        ) : (
          <span key={index}>{segment.value}</span>
        ),
      )}
    </span>
  )
}

/** Always-visible media embedded in the timeline (image.inline). */
export function LifelineEventMedia({
  media,
  className,
}: {
  media: LifelineEventImage
  className?: string
}) {
  if (media.video) {
    return (
      <video
        src={media.video}
        poster={media.src}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={media.alt}
        className={className}
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={media.src} alt={media.alt} loading="lazy" className={className} />
  )
}

export function getLifelineEventKey(event: LifelineEvent, index: number) {
  const content = getEventContent(event)

  if (typeof content === "string") return `${index}-${content}`

  return `${index}-${content.map((segment) => segment.value).join("")}`
}
