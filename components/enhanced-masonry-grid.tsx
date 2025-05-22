"use client"

import { useState, useEffect } from "react"
import MasonryPostCard from "./masonry-post-card"
import { generateDummyPosts } from "@/lib/data"
import { fetchUnsplashImages } from "@/lib/unsplash"
import type { MasonryPost, UnsplashImage } from "@/lib/types"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useMobile } from "@/hooks/use-mobile"

export default function EnhancedMasonryGrid() {
  const [posts, setPosts] = useState<MasonryPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const isMobile = useMobile()

  useEffect(() => {
    async function loadPostsWithUnsplashImages() {
      setLoading(true)
      setError(null)

      try {
        // Fetch images from Unsplash
        const unsplashImages = await fetchUnsplashImages("minimal,design,creative", 24)

        // Generate posts with Unsplash images
        const postsWithImages = generatePostsWithUnsplashImages(unsplashImages)

        setPosts(postsWithImages)
        setError(null)
      } catch (err) {
        console.error("Error loading posts with Unsplash images:", err)

        // Set more specific error message
        const errorMessage =
          err instanceof Error
            ? err.message
            : "We couldn't load images from Unsplash. Using placeholder images instead."

        setError(
          errorMessage.includes("service unavailable")
            ? "Unsplash service is temporarily unavailable. Using placeholder images instead."
            : errorMessage,
        )

        // Fallback to dummy posts without Unsplash
        const fallbackPosts = generateDummyPosts(24)
        setPosts(fallbackPosts)
      } finally {
        setLoading(false)
      }
    }

    loadPostsWithUnsplashImages()
  }, [retryCount])

  // Generate posts with Unsplash images
  function generatePostsWithUnsplashImages(images: UnsplashImage[]): MasonryPost[] {
    // Generate base posts
    const basePosts = generateDummyPosts(images.length)

    // Map Unsplash images to posts
    return basePosts.map((post, index) => {
      const image = images[index % images.length]
      return {
        ...post,
        imageUrl: image.url,
        // Store attribution data
        unsplashUser: image.user,
      }
    })
  }

  // Function to retry loading images
  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  // Adjust the number of posts shown based on screen size
  const visiblePosts = isMobile ? posts.slice(0, 8) : posts

  return (
    <div className="bg-gray-50 p-2 sm:p-4 rounded-xl">
      {error && (
        <Alert variant="warning" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Image Loading Issue</AlertTitle>
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={handleRetry} className="sm:ml-auto mt-2 sm:mt-0">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        // Loading skeleton with responsive grid
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: isMobile ? 4 : 12 }).map((_, index) => (
            <div key={index} className="rounded-xl bg-gray-200 animate-pulse aspect-[3/4]" />
          ))}
        </div>
      ) : (
        // Actual content with responsive grid
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {visiblePosts.map((post) => (
            <MasonryPostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Load more button for mobile */}
      {isMobile && posts.length > 8 && (
        <div className="mt-6 text-center">
          <Button
            onClick={() => setPosts((prev) => [...prev, ...generateDummyPosts(4)])}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  )
}
