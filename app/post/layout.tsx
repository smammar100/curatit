import type React from "react"
export default function PostLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <main className="min-h-screen py-6 sm:py-8 md:py-10">{children}</main>
}
