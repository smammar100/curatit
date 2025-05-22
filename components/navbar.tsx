"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { MenuIcon, X } from "lucide-react"
import { LayoutContainer } from "./layout-container"
import { FeedbackModal } from "./feedback-modal"
import { AnimatedButton } from "./animated-button"
import gsap from "gsap"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const logoRef = useRef<HTMLAnchorElement>(null)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY
      if (offset > 10) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Initial animation when component mounts
  useEffect(() => {
    if (!navRef.current) return

    const tl = gsap.timeline()
    tl.fromTo(navRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" })

    if (logoRef.current) {
      tl.fromTo(
        logoRef.current,
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, ease: "back.out(1.7)" },
        "-=0.3",
      )
    }

    // Animate other elements
    const buttons = navRef.current.querySelectorAll("button")
    gsap.fromTo(
      buttons,
      { y: -10, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.1, duration: 0.4, delay: 0.2, ease: "power2.out" },
    )
  }, [])

  return (
    <header
      ref={navRef}
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        scrolled ? "bg-white/70 backdrop-blur-md border-b border-gray-200/50 shadow-sm" : "bg-white/50 backdrop-blur-sm"
      }`}
    >
      <LayoutContainer className="flex h-14 sm:h-16 items-center justify-between">
        {/* Logo */}
        <Link ref={logoRef} href="/" className="flex items-center space-x-2">
          <span className="text-lg sm:text-xl font-bold">SocialInspo</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center">
          {/* Help us improve CTA button */}
          <AnimatedButton
            onClick={() => setFeedbackModalOpen(true)}
            animationType="pulse"
            className="bg-black hover:bg-gray-800 text-white"
          >
            Help us improve
          </AnimatedButton>
        </div>

        {/* Mobile Navigation */}
        <div className="flex items-center md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="backdrop-blur-md bg-white/10 h-9 w-9 p-0">
                <MenuIcon className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="backdrop-blur-xl bg-white/80 w-[85vw] sm:max-w-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-lg">Menu</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <nav className="flex flex-col space-y-4">
                <Link href="/" className="text-lg font-medium" onClick={() => setIsOpen(false)}>
                  Home
                </Link>
                {/* Help us improve button for mobile */}
                <AnimatedButton
                  onClick={() => {
                    setIsOpen(false)
                    setFeedbackModalOpen(true)
                  }}
                  className="justify-start bg-black hover:bg-gray-800 text-white mt-4"
                  animationType="scale"
                >
                  Help us improve
                </AnimatedButton>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </LayoutContainer>

      {/* Feedback Modal */}
      <FeedbackModal open={feedbackModalOpen} onOpenChange={setFeedbackModalOpen} />
    </header>
  )
}
