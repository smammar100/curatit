"use client"

import { LayoutContainer } from "@/components/layout-container"
import EnhancedMasonryGrid from "@/components/enhanced-masonry-grid"
import { useGsapScroll } from "@/hooks/use-gsap-scroll"
import { useEffect, useRef } from "react"
import gsap from "gsap"

export default function HomePage() {
  // Use our custom hook for scroll animations
  const headerRef = useGsapScroll<HTMLDivElement>({
    type: "fadeIn",
    duration: 0.8,
  })

  const gridRef = useRef<HTMLDivElement>(null)

  // Initial animation when component mounts
  useEffect(() => {
    if (!gridRef.current) return

    // Create a timeline for the grid animation
    const tl = gsap.timeline({ delay: 0.3 })

    tl.fromTo(gridRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" })

    // Animate grid items
    const gridItems = gridRef.current.querySelectorAll(".masonry-item")
    if (gridItems.length) {
      tl.fromTo(
        gridItems,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.05, duration: 0.6, ease: "power2.out" },
        "-=0.4",
      )
    }

    return () => {
      // Cleanup animations
      tl.kill()
    }
  }, [])

  return (
    <main className="py-6 sm:py-8 md:py-10">
      <LayoutContainer>
        <div ref={gridRef}>
          <EnhancedMasonryGrid />
        </div>
      </LayoutContainer>
    </main>
  )
}
