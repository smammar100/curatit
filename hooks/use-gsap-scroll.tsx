"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

// Register ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

type AnimationOptions = {
  type?: "fadeIn" | "slideInLeft" | "slideInRight" | "scaleIn" | "custom"
  threshold?: number
  duration?: number
  delay?: number
  stagger?: number
  customFrom?: gsap.TweenVars
  customTo?: gsap.TweenVars
}

export function useGsapScroll<T extends HTMLElement = HTMLDivElement>(options: AnimationOptions = {}) {
  const { type = "fadeIn", threshold = 0.1, duration = 0.8, delay = 0, stagger = 0.1, customFrom, customTo } = options

  const elementRef = useRef<T>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Define animation properties based on type
    let fromVars: gsap.TweenVars = {}
    let toVars: gsap.TweenVars = {}

    switch (type) {
      case "fadeIn":
        fromVars = { opacity: 0, y: 30 }
        toVars = { opacity: 1, y: 0 }
        break
      case "slideInLeft":
        fromVars = { opacity: 0, x: -50 }
        toVars = { opacity: 1, x: 0 }
        break
      case "slideInRight":
        fromVars = { opacity: 0, x: 50 }
        toVars = { opacity: 1, x: 0 }
        break
      case "scaleIn":
        fromVars = { opacity: 0, scale: 0.8 }
        toVars = { opacity: 1, scale: 1 }
        break
      case "custom":
        fromVars = customFrom || {}
        toVars = customTo || {}
        break
    }

    // Add common properties to toVars
    toVars = {
      ...toVars,
      duration,
      delay,
      ease: "power2.out",
      stagger: stagger,
      scrollTrigger: {
        trigger: element,
        start: `top bottom-=${threshold * 100}%`,
        toggleActions: "play none none none",
      },
    }

    // Check if we're animating a list of elements
    const childElements = element.children.length > 0 ? element.children : [element]

    // Create the animation
    const animation = gsap.fromTo(childElements, fromVars, toVars)

    return () => {
      // Cleanup animation
      animation.kill()
      if (animation.scrollTrigger) {
        animation.scrollTrigger.kill()
      }
    }
  }, [type, threshold, duration, delay, stagger, customFrom, customTo])

  return elementRef
}
