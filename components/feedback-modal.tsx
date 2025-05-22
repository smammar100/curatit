"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import gsap from "gsap"
import { useMobile } from "@/hooks/use-mobile"

interface FeedbackModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const [experience, setExperience] = useState<string>("")
  const [improvement, setImprovement] = useState<string>("")
  const [rating, setRating] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false)
  const isMobile = useMobile()

  const modalRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const emojiRefs = useRef<(HTMLButtonElement | null)[]>([])

  const emojis = ["😕", "🙁", "😐", "🙂", "😀"]

  // Handle modal animations
  useEffect(() => {
    if (!modalRef.current || !overlayRef.current) return

    if (open) {
      // Animate modal opening
      const tl = gsap.timeline()
      tl.set(modalRef.current, { opacity: 0, y: 20, scale: 0.95 })
      tl.set(overlayRef.current, { opacity: 0 })
      tl.to(overlayRef.current, { opacity: 1, duration: 0.2, ease: "power1.out" })
      tl.to(modalRef.current, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.4)" })

      // Animate form elements if form exists
      if (formRef.current && !isSubmitted) {
        const formElements = formRef.current.querySelectorAll("div > *")
        gsap.fromTo(
          formElements,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, stagger: 0.05, duration: 0.4, delay: 0.2, ease: "power2.out" },
        )
      }
    }
  }, [open, isSubmitted])

  // Animate emoji selection
  const handleEmojiHover = (index: number, isEnter: boolean) => {
    if (!emojiRefs.current[index]) return

    if (isEnter && rating !== index + 1) {
      gsap.to(emojiRefs.current[index], { scale: 1.15, duration: 0.2, ease: "power1.out" })
    } else if (!isEnter && rating !== index + 1) {
      gsap.to(emojiRefs.current[index], { scale: 1, duration: 0.2, ease: "power1.in" })
    }
  }

  const handleEmojiSelect = (index: number) => {
    // Reset all emojis first
    emojiRefs.current.forEach((ref, i) => {
      if (ref) gsap.to(ref, { scale: 1, opacity: 0.7, duration: 0.2 })
    })

    // Animate the selected emoji
    if (emojiRefs.current[index]) {
      gsap.to(emojiRefs.current[index], {
        scale: 1.25,
        opacity: 1,
        duration: 0.3,
        ease: "back.out(1.7)",
      })
    }

    setRating(index + 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Animate form submission
    if (formRef.current) {
      gsap.to(formRef.current, { opacity: 0.5, duration: 0.3 })
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Show success state with animation
    setIsSubmitted(true)
    setIsSubmitting(false)

    // Reset form after delay and close
    setTimeout(() => {
      setExperience("")
      setImprovement("")
      setRating(null)
      setIsSubmitted(false)
      onOpenChange(false)
    }, 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay ref={overlayRef} className="bg-black/40" />
      <DialogContent ref={modalRef} className="sm:max-w-[500px] w-[calc(100%-32px)] p-4 sm:p-6">
        {isSubmitted ? (
          // Success state with animation
          <div className="py-8 sm:py-12 text-center">
            <div
              className="mx-auto mb-4 h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-green-100 flex items-center justify-center"
              ref={(el) => {
                if (el) {
                  gsap.fromTo(
                    el,
                    { scale: 0, rotation: -30 },
                    { scale: 1, rotation: 0, duration: 0.5, ease: "back.out(1.7)" },
                  )
                }
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 sm:h-8 sm:w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                ref={(el) => {
                  if (el) {
                    gsap.fromTo(
                      el,
                      { strokeDasharray: 100, strokeDashoffset: 100, opacity: 0 },
                      { strokeDashoffset: 0, opacity: 1, duration: 0.6, delay: 0.3, ease: "power2.out" },
                    )
                  }
                }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <DialogTitle
              className="mb-2 text-lg sm:text-xl"
              ref={(el) => {
                if (el) {
                  gsap.fromTo(
                    el,
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.4, delay: 0.4, ease: "power2.out" },
                  )
                }
              }}
            >
              Thank you for your feedback!
            </DialogTitle>
            <DialogDescription
              ref={(el) => {
                if (el) {
                  gsap.fromTo(
                    el,
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.4, delay: 0.5, ease: "power2.out" },
                  )
                }
              }}
            >
              We appreciate your input and will use it to improve our platform.
            </DialogDescription>
          </div>
        ) : (
          // Form state
          <>
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Help us improve 🙌</DialogTitle>
              <DialogDescription>Your feedback helps us make our platform better for everyone.</DialogDescription>
            </DialogHeader>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 py-2 sm:py-4">
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <Label htmlFor="experience" className="text-sm sm:text-base">
                    How was your experience?
                  </Label>
                  <Input
                    id="experience"
                    placeholder="It was smooth, but…"
                    className="mt-1 sm:mt-2"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="improvement" className="text-sm sm:text-base">
                    What can we do better?
                  </Label>
                  <Textarea
                    id="improvement"
                    placeholder="Fewer steps, more clarity, etc."
                    className="mt-1 sm:mt-2"
                    rows={isMobile ? 2 : 3}
                    value={improvement}
                    onChange={(e) => setImprovement(e.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-sm sm:text-base">How likely are you to recommend us?</Label>
                  <div className="flex justify-between items-center mt-2 sm:mt-3">
                    <span className="text-xs sm:text-sm text-muted-foreground">Not at all</span>
                    <div className="flex gap-2 sm:gap-3">
                      {emojis.map((emoji, index) => (
                        <button
                          key={index}
                          type="button"
                          ref={(el) => (emojiRefs.current[index] = el)}
                          onClick={() => handleEmojiSelect(index)}
                          onMouseEnter={() => handleEmojiHover(index, true)}
                          onMouseLeave={() => handleEmojiHover(index, false)}
                          className={`text-xl sm:text-2xl transition-transform ${
                            rating === index + 1 ? "opacity-100" : "opacity-70"
                          }`}
                          aria-label={`Rating ${index + 1}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <span className="text-xs sm:text-sm text-muted-foreground">Definitely</span>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="gsap-button w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !experience || rating === null}
                  className="gsap-button w-full sm:w-auto"
                >
                  {isSubmitting ? "Submitting..." : "Submit feedback"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
