"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { useMobile } from "@/hooks/use-mobile"
import gsap from "gsap"

export default function Footer() {
  const [email, setEmail] = useState("")
  const isMobile = useMobile()
  const [mounted, setMounted] = useState(false)
  const stackRef = useRef<HTMLDivElement>(null)
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]) // Fixed type definition

  // Ensure component is mounted before using isMobile
  useEffect(() => {
    setMounted(true)
  }, [])

  // Define the images for the stepped stack
  const images = [
    {
      src: "/placeholder.svg?height=180&width=220&text=ZAP/STUDIO",
      alt: "ZAP/STUDIO website",
      height: 180,
    },
    {
      src: "/placeholder.svg?height=220&width=220&text=WEB",
      alt: "Web design example",
      height: 220,
    },
    {
      src: "/placeholder.svg?height=260&width=220&text=DESIGN",
      alt: "Design showcase",
      height: 260,
    },
    {
      src: "/placeholder.svg?height=300&width=300&text=VIVIEN'S",
      alt: "Vivien's Creative",
      height: 300,
    },
    {
      src: "/placeholder.svg?height=260&width=220&text=TWYG",
      alt: "TWYG website",
      height: 260,
    },
    {
      src: "/placeholder.svg?height=220&width=220&text=UM",
      alt: "UM website",
      height: 220,
    },
    {
      src: "/placeholder.svg?height=180&width=220&text=MINIMAL",
      alt: "Minimal design",
      height: 180,
    },
  ]

  // Always render all images to prevent hydration mismatch
  // Use CSS to control visibility on mobile
  const visibleImages = images

  // Animation effect
  useEffect(() => {
    if (!stackRef.current) return

    // Reset refs array
    imageRefs.current = imageRefs.current.slice(0, visibleImages.length)

    // Create floating animation
    const imagesArray = imageRefs.current.filter(Boolean)

    // Subtle floating animation
    imagesArray.forEach((img, i) => {
      if (!img) return

      // Create random slight movement
      const yAmount = 3 + Math.random() * 5 // 3-8px movement
      const duration = 2 + Math.random() * 1.5 // 2-3.5s duration
      const delay = i * 0.15 // Staggered start

      gsap.set(img, { y: 0 })
      gsap.to(img, {
        y: yAmount,
        duration,
        delay,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      })
    })

    // Initial entrance animation
    gsap.fromTo(
      imagesArray,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out",
        delay: 0.3,
      },
    )

    return () => {
      // Clean up animations
      imagesArray.forEach((img) => {
        if (img) gsap.killTweensOf(img)
      })
    }
  }, [visibleImages.length, isMobile])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle subscription logic here
    console.log("Subscribing email:", email)
    setEmail("")
    // Show success message or notification
  }

  return (
    <footer className="w-full bg-gray-50 pt-8 sm:pt-16 pb-0 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 flex flex-col items-center">
        {/* Subscription text */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-medium text-gray-900 mb-2 max-w-3xl mx-auto">
            Get trending social media posts delivered to your inbox, every monday. No spam, only inspiration.
          </h2>
          <p className="text-gray-400 text-base sm:text-lg">Unsubscribe anytime.</p>
        </div>

        {/* Subscription form */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-xl mb-8 sm:mb-16 flex flex-col sm:flex-row gap-3 sm:gap-0"
        >
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 sm:rounded-r-none h-12 border-gray-200"
          />
          <Button type="submit" className="sm:rounded-l-none h-12 px-6 bg-black hover:bg-gray-800 text-white">
            Subscribe now
          </Button>
        </form>
      </div>

      {/* Image stack - responsive for different screen sizes */}
      <div className="w-full h-[200px] sm:h-[250px] md:h-[300px] flex justify-center items-end overflow-hidden">
        <div
          className="relative w-[422px] sm:w-[970px]" // Use responsive classes instead of inline styles
          ref={stackRef} // Add ref for animations
        >
          {visibleImages.map((image, index) => {
            // Use index directly to prevent hydration mismatch
            const adjustedIndex = index

            // Calculate z-index: center has highest, decreases toward edges
            const zIndex = 7 - Math.abs(3 - adjustedIndex)

            // Calculate horizontal position - use CSS variables for responsive spacing
            const offsetX = (adjustedIndex - 3) * spacing

            // For the center image
            const isCenterImage = adjustedIndex === 3

            // Use consistent sizing to prevent hydration mismatch
            const imageWidth = isCenterImage ? 396 : 290
            const spacing = 126

            return (
              <div
                key={index}
                className={`absolute rounded-t-lg overflow-hidden shadow-md transition-all duration-500 hover:shadow-lg ${
                  // Hide outer images on mobile using CSS classes
                  index < 2 || index > 4 ? 'hidden sm:block' : ''
                }`}
                style={{
                  height: `${image.height * 0.7}px`, // Consistent height scaling
                  width: `${imageWidth}px`,
                  left: "50%",
                  marginLeft: offsetX - imageWidth / 2, // Center each image
                  zIndex,
                  bottom: 0,
                }}
                ref={(el) => (imageRefs.current[index] = el)}
              >
                <div className="relative w-full h-full">
                  <Image
                    src={image.src || "/placeholder.svg"}
                    alt={image.alt}
                    fill
                    className="object-cover"
                    sizes={`${imageWidth}px`}
                    priority={isCenterImage}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </footer>
  )
}
