import type React from "react"

interface LayoutContainerProps {
  children: React.ReactNode
  className?: string
}

export function LayoutContainer({ children, className = "" }: LayoutContainerProps) {
  return <div className={`w-full max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 ${className}`}>{children}</div>
}
