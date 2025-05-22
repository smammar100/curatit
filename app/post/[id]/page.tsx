"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Heart, MessageCircle, ArrowLeft, Download } from "lucide-react"
import { formatNumber } from "@/lib/utils"
import { dummyPosts } from "@/lib/data"
import type { MasonryPost } from "@/lib/types"
import Link from "next/link"
import Image from "next/image"
import { LayoutContainer } from "@/components/layout-container"
import { useMobile } from "@/hooks/use-mobile"

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [post, setPost] = useState<MasonryPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [relatedPosts, setRelatedPosts] = useState<MasonryPost[]>([])
  const isMobile = useMobile()

  useEffect(() => {
    // Simulate fetching post data
    const timer = setTimeout(() => {
      const foundPost = dummyPosts.find((p) => p.id === params.id)

      if (foundPost) {
        setPost(foundPost)

        // Get related posts from the same category
        const related = dummyPosts.filter((p) => p.category === foundPost.category && p.id !== foundPost.id).slice(0, 3)
        setRelatedPosts(related)
      }

      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [params.id])

  // Handle post not found
  if (!loading && !post) {
    return (
      <LayoutContainer className="py-8 sm:py-12">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold mb-4">Post not found</h1>
          <p className="mb-6">The post you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push("/")} className="mx-auto">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        </div>
      </LayoutContainer>
    )
  }

  return (
    <LayoutContainer className="py-4 sm:py-8">
      {/* Back button */}
      <div className="mb-4 sm:mb-6">
        <Button variant="ghost" onClick={() => router.push("/")} className="group -ml-3 h-8 sm:h-10 px-3">
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to Grid
        </Button>
      </div>

      {loading ? (
        // Loading skeleton
        <PostDetailSkeleton isMobile={isMobile} />
      ) : (
        post && (
          <>
            <Card className="overflow-hidden rounded-xl shadow-md mb-6 sm:mb-8">
              <CardContent className="p-0">
                {/* Responsive layout: stacked on mobile, side-by-side on desktop */}
                <div className="flex flex-col lg:flex-row">
                  {/* Image container - full width on mobile, 60% width on desktop */}
                  <div className="relative w-full lg:w-[60%] aspect-square">
                    <Image
                      src={post.imageUrl || "/placeholder.svg"}
                      alt={post.title}
                      fill
                      className="object-cover"
                      priority
                      sizes="(max-width: 1024px) 100vw, 60vw"
                    />
                  </div>

                  {/* Metadata container - full width on mobile, 40% width on desktop */}
                  <div className="w-full lg:w-[40%] p-4 sm:p-6 lg:p-8 flex flex-col">
                    {/* Platform and date */}
                    <div className="flex justify-between items-center mb-4 sm:mb-6">
                      <Badge variant="secondary" className="px-2 sm:px-3 py-1 text-xs sm:text-sm">
                        {post.platform || "Instagram"}
                      </Badge>
                      <span className="text-xs sm:text-sm text-gray-500">{post.date}</span>
                    </div>

                    {/* Title */}
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4">{post.title}</h1>

                    {/* Company/Author info */}
                    <div className="flex items-center mb-4 sm:mb-6">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                        <AvatarImage src={post.author.avatar || "/placeholder.svg"} alt={post.author.name} />
                        <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="ml-2 sm:ml-3">
                        <p className="font-medium text-sm sm:text-base">{post.company?.name || post.author.name}</p>
                        <p className="text-xs sm:text-sm text-gray-500">{post.category}</p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">{post.excerpt}</p>

                    {/* Engagement metrics */}
                    <div className="flex items-center justify-between py-3 sm:py-4 mb-4 sm:mb-6 border-t border-b">
                      <div className="flex space-x-4 sm:space-x-6">
                        <div className="flex items-center">
                          <Heart className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-gray-600" />
                          <span className="text-sm sm:text-base">{formatNumber(post.likes)}</span>
                        </div>
                        <div className="flex items-center">
                          <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-gray-600" />
                          <span className="text-sm sm:text-base">{formatNumber(post.comments)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex mt-auto">
                      <Button className="flex-1 h-9 sm:h-10 text-sm sm:text-base">
                        <Download className="mr-2 h-4 w-4" /> Download
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related posts */}
            {relatedPosts.length > 0 && (
              <div className="mt-8 sm:mt-12">
                <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Related Posts</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  {relatedPosts.map((relatedPost) => (
                    <Link key={relatedPost.id} href={`/post/${relatedPost.id}`} className="block">
                      <Card className="overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                        <div className="relative aspect-square">
                          <Image
                            src={relatedPost.imageUrl || "/placeholder.svg"}
                            alt={relatedPost.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-0 left-0 p-3 sm:p-4">
                            <Badge variant="secondary" className="mb-1 sm:mb-2 bg-white/80 text-black text-xs">
                              {relatedPost.platform || "Instagram"}
                            </Badge>
                            <h3 className="text-white font-bold text-sm sm:text-base">{relatedPost.title}</h3>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )
      )}
    </LayoutContainer>
  )
}

// Loading skeleton component
function PostDetailSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <Card className="overflow-hidden rounded-xl shadow-md mb-6 sm:mb-8">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* Image skeleton - full width on mobile, 60% width on desktop */}
          <Skeleton className="w-full lg:w-[60%] aspect-square" />

          {/* Content skeleton - full width on mobile, 40% width on desktop */}
          <div className="w-full lg:w-[40%] p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <Skeleton className="h-5 sm:h-6 w-20 sm:w-24" />
              <Skeleton className="h-4 w-24 sm:w-32" />
            </div>

            <Skeleton className="h-6 sm:h-8 w-3/4 mb-3 sm:mb-4" />

            <div className="flex items-center mb-4 sm:mb-6">
              <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" />
              <div className="ml-2 sm:ml-3">
                <Skeleton className="h-4 sm:h-5 w-24 sm:w-32 mb-1" />
                <Skeleton className="h-3 sm:h-4 w-16 sm:w-24" />
              </div>
            </div>

            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3 mb-4 sm:mb-6" />

            <div className="py-3 sm:py-4 mb-4 sm:mb-6 border-t border-b">
              <div className="flex justify-between">
                <div className="flex space-x-4 sm:space-x-6">
                  <Skeleton className="h-5 sm:h-6 w-16 sm:w-20" />
                  <Skeleton className="h-5 sm:h-6 w-20 sm:w-28" />
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Skeleton className="h-9 sm:h-10 flex-1" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
