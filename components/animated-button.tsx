"use client"

import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import gsap from "gsap"
import type { ButtonProps } from "@/components/ui/button"

interface AnimatedButtonProps extends ButtonProps {
  animationType?: "scale" | "pulse" | "shine" | "bounce"
}

export function AnimatedButton({ children, animationType = "scale", className = "", ...props }: AnimatedButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const button = buttonRef.current
    if (!button) return

    // Setup hover animations
    const enterAnimation = () => {
      switch (animationType) {
        case "scale":
          gsap.to(button, { scale: 1.05, duration: 0.2, ease: "power1.out" })
          break
        case "pulse":
          gsap.to(button, { boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.3)", duration: 0.3 })
          break
        case "shine":
          gsap.fromTo(
            button,
            { backgroundPosition: "0% 50%" },
            { backgroundPosition: "100% 50%", duration: 0.6, ease: "power1.out" },
          )
          break
        case "bounce":
          gsap.to(button, { y: -4, duration: 0.2, ease: "power1.out" })
          break
      }
    }

    const leaveAnimation = () => {
      switch (animationType) {
        case "scale":
          gsap.to(button, { scale: 1, duration: 0.2, ease: "power1.in" })
          break
        case "pulse":
          gsap.to(button, { boxShadow: "none", duration: 0.3 })
          break
        case "shine":
          gsap.set(button, { backgroundPosition: "0% 50%" })
          break
        case "bounce":
          gsap.to(button, { y: 0, duration: 0.2, ease: "power1.in" })
          break
      }
    }

    // Add event listeners
    button.addEventListener("mouseenter", enterAnimation)
    button.addEventListener("mouseleave", leaveAnimation)

    // Cleanup
    return () => {
      button.removeEventListener("mouseenter", enterAnimation)
      button.removeEventListener("mouseleave", leaveAnimation)
    }
  }, [animationType])

  // Add special classes for certain animation types
  let animationClass = ""
  if (animationType === "shine") {
    animationClass = "bg-gradient-to-r from-primary to-primary via-primary-foreground bg-size-200"
  }

  return (
    <Button ref={buttonRef} className={`${className} ${animationClass}`} {...props}>
      {children}
    </Button>
  )
}
