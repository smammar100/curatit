"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import gsap from "gsap"

interface AnimatedLayoutProps {
  children: React.ReactNode
}

export function AnimatedLayout({ children }: AnimatedLayoutProps) {
  const pathname = usePathname()
  const containerRef = useRef<HTMLDivElement>(null)
  const [displayChildren, setDisplayChildren] = useState(children)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Handle page transitions when pathname changes
  useEffect(() => {
    if (!containerRef.current) return

    // If this is the first render, just fade in
    if (!isTransitioning) {
      const tl = gsap.timeline()
      tl.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" })
      return
    }

    // Otherwise, handle page transition
    setIsTransitioning(true)

    const tl = gsap.timeline({
      onComplete: () => {
        setDisplayChildren(children)
        setIsTransitioning(false)

        // Fade in new content
        gsap.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" })
      },
    })

    // Fade out current content
    tl.to(containerRef.current, {
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
    })
  }, [children, pathname, isTransitioning])

  return (
    <div ref={containerRef} className="page-transition-container">
      {displayChildren}
    </div>
  )
}
