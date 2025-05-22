"use client"

import type React from "react"
import type { MasonryPost } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface MasonryPostCardProps {
  post: MasonryPost
}

export default function MasonryPostCard({ post }: MasonryPostCardProps) {
  const router = useRouter()

  // Handle card click to navigate to post detail
  const handleCardClick = () => {
    router.push(`/post/${post.id}`)
  }

  // Handle download click without propagating to parent
  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Download functionality would go here
    console.log("Download image:", post.imageUrl)
  }

  return (
    <Card
      className="overflow-hidden rounded-xl shadow-md transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg group cursor-pointer h-full"
      onClick={handleCardClick}
    >
      <div className="relative w-full aspect-[3/4] h-full flex flex-col">
        {/* Image container with fixed aspect ratio */}
        <div className="relative flex-1">
          <Image
            src={post.imageUrl || "/placeholder.svg"}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Platform badge */}
          <Badge
            className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-white/80 text-black backdrop-blur-sm text-xs sm:text-sm"
            variant="secondary"
          >
            {post.platform || "Instagram"}
          </Badge>

          {/* Gradient overlay for hover state */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Card footer with title, company logo and category tag */}
        <div className="p-3 sm:p-4 bg-white">
          {/* First line: Company logo and name */}
          <div className="flex items-center mb-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-200 mr-2 flex items-center justify-center overflow-hidden">
              {post.company?.logo ? (
                <Image
                  src={post.company.logo || "/placeholder.svg"}
                  alt={post.company?.name || "Company"}
                  width={32}
                  height={32}
                  className="object-cover"
                />
              ) : (
                <span className="text-xs sm:text-sm font-bold">{post.company?.name?.[0] || post.author.name[0]}</span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-medium line-clamp-1">{post.company?.name || post.author.name}</h3>
          </div>

          {/* Second line: Post category with download icon */}
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-muted-foreground">{post.category}</p>
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-1 hover:bg-gray-100 rounded-full"
              onClick={handleDownloadClick}
              aria-label="Download image"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}
