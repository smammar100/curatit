import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { ThemeProvider } from "@/components/theme-provider"
import { AnimatedLayout } from "@/components/animated-layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Social Media Inspiration Platform",
  description: "Discover and save the best social media posts from top brands and creators",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <AnimatedLayout>
              <div className="flex-1">{children}</div>
            </AnimatedLayout>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
