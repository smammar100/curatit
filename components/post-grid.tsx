"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookmarkIcon } from "lucide-react"
import Image from "next/image"
import type { MasonryPost } from "@/lib/types"
import { useRouter } from "next/navigation"

interface PostGridProps {
  posts: MasonryPost[]
}

export default function PostGrid({ posts }: PostGridProps) {
  const router = useRouter()

  const handleCardClick = (postId: string) => {
    router.push(`/post/${postId}`)
  }

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Save functionality would go here
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {posts.map((post) => (
        <Card
          key={post.id}
          className="overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-md cursor-pointer"
          onClick={() => handleCardClick(post.id)}
        >
          <CardContent className="p-0">
            <div className="relative">
              <div className="relative aspect-[4/5] w-full">
                <Image
                  src={post.imageUrl || "/placeholder.svg"}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>
              <div className="absolute right-2 top-2">
                <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                  {post.category}
                </Badge>
              </div>
              <button
                className="absolute bottom-2 right-2 rounded-full bg-background/80 p-2 backdrop-blur-sm"
                onClick={handleBookmarkClick}
              >
                <BookmarkIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              <h3 className="font-medium">{post.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{post.category}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
