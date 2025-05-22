"use client"

import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useEffect, useRef } from "react"

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

// Animation presets
export const animations = {
  fadeIn: (element: Element, duration = 0.6, delay = 0) => {
    return gsap.fromTo(element, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration, delay, ease: "power2.out" })
  },

  fadeOut: (element: Element, duration = 0.4) => {
    return gsap.to(element, { opacity: 0, y: -20, duration, ease: "power2.in" })
  },

  scaleIn: (element: Element, duration = 0.5, delay = 0) => {
    return gsap.fromTo(
      element,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration, delay, ease: "back.out(1.7)" },
    )
  },

  slideInRight: (element: Element, duration = 0.6, delay = 0) => {
    return gsap.fromTo(element, { opacity: 0, x: 50 }, { opacity: 1, x: 0, duration, delay, ease: "power2.out" })
  },

  slideInLeft: (element: Element, duration = 0.6, delay = 0) => {
    return gsap.fromTo(element, { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration, delay, ease: "power2.out" })
  },

  staggeredFadeIn: (elements: Element[], stagger = 0.1, duration = 0.6) => {
    return gsap.fromTo(elements, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration, stagger, ease: "power2.out" })
  },

  buttonHover: {
    enter: (element: Element) => {
      return gsap.to(element, { scale: 1.05, duration: 0.2, ease: "power1.out" })
    },
    leave: (element: Element) => {
      return gsap.to(element, { scale: 1, duration: 0.2, ease: "power1.in" })
    },
  },

  modalOpen: (element: Element, backdrop: Element, duration = 0.4) => {
    const tl = gsap.timeline()
    tl.to(backdrop, { opacity: 1, duration: duration * 0.5, ease: "power1.out" })
    tl.fromTo(
      element,
      { opacity: 0, y: 20, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration, ease: "back.out(1.4)" },
      "-=0.2",
    )
    return tl
  },

  modalClose: (element: Element, backdrop: Element, duration = 0.3) => {
    const tl = gsap.timeline()
    tl.to(element, { opacity: 0, y: -20, scale: 0.95, duration, ease: "power1.in" })
    tl.to(backdrop, { opacity: 0, duration: duration * 0.5, ease: "power1.in" }, "-=0.1")
    return tl
  },
}

// Custom hooks
export function useGsapPageTransition() {
  const pageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = pageRef.current
    if (!element) return

    // Create enter animation
    const enterAnimation = gsap.timeline()
    enterAnimation.fromTo(element, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" })

    // Create exit animation (to be used with router events)
    const exitAnimation = () => {
      gsap.to(element, { opacity: 0, duration: 0.4, ease: "power2.in" })
    }

    return () => {
      // Cleanup animations
      enterAnimation.kill()
    }
  }, [])

  return { pageRef }
}

export function useGsapScrollAnimation(options = { threshold: 0.1 }) {
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Create scroll-triggered animation
    const animation = gsap.fromTo(
      element,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: element,
          start: `top bottom-=${options.threshold * 100}%`,
          toggleActions: "play none none none",
        },
      },
    )

    return () => {
      // Cleanup animation
      animation.kill()
      if (animation.scrollTrigger) {
        animation.scrollTrigger.kill()
      }
    }
  }, [options.threshold])

  return { elementRef }
}
