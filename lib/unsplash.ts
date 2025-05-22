import type { UnsplashImage } from "./types"

// Cache for Unsplash images to avoid duplicate API calls
let imageCache: UnsplashImage[] = []
let lastFetchTime = 0
const CACHE_DURATION = 1000 * 60 * 15 // 15 minutes

/**
 * Fetches random images from Unsplash
 * @param query Search query for images
 * @param count Number of images to fetch
 * @returns Array of Unsplash images
 */
export async function fetchUnsplashImages(query = "minimal", count = 20): Promise<UnsplashImage[]> {
  // If we have cached images and the cache hasn't expired, return them
  const now = Date.now()
  if (imageCache.length >= count && now - lastFetchTime < CACHE_DURATION) {
    return imageCache.slice(0, count)
  }

  try {
    // Fetch images from our API route
    const response = await fetch(`/api/unsplash?query=${query}&count=${count}`, {
      // Add a timeout to prevent hanging requests
      signal: AbortSignal.timeout(8000), // 8 second timeout
    })

    const data = await response.json()

    // Check if the response contains an error flag
    if (data.error) {
      console.warn(`Unsplash API service issue: ${data.status}`, data.errors)
      throw new Error(`Unsplash service unavailable: ${data.errors?.[0] || "Unknown error"}`)
    }

    // Update cache and timestamp
    imageCache = data
    lastFetchTime = now

    return data
  } catch (error) {
    console.error("Error fetching Unsplash images:", error)

    // If we have any cached images, return those even if expired
    if (imageCache.length > 0) {
      console.log("Using expired cache as fallback")
      return imageCache.slice(0, count)
    }

    // Return fallback images if fetch fails and no cache is available
    return generateFallbackImages(count)
  }
}

// Enhance fallback image generation
function generateFallbackImages(count: number): UnsplashImage[] {
  console.log("Generating fallback images due to Unsplash API unavailability")

  // Generate a variety of colors for the fallback images
  const colors = [
    "#f3f4f6",
    "#fee2e2",
    "#e0e7ff",
    "#d1fae5",
    "#fef3c7",
    "#dbeafe",
    "#ede9fe",
    "#fce7f3",
    "#e5e7eb",
    "#f8fafc",
  ]

  // Add some variety to the fallback images
  const themes = ["Design", "Social", "Creative", "Minimal", "Modern", "Brand"]

  return Array.from({ length: count }).map((_, index) => {
    const colorIndex = index % colors.length
    const themeIndex = index % themes.length
    const height = 400 + (index % 3) * 50

    return {
      id: `fallback-${index}`,
      url: `/placeholder.svg?height=${height}&width=400&text=${themes[themeIndex]}+${index + 1}`,
      thumb: `/placeholder.svg?height=200&width=200&text=${themes[themeIndex]}+${index + 1}`,
      description: `${themes[themeIndex]} design inspiration`,
      user: {
        name: "Design Inspiration",
        username: "designinspiration",
        link: "#",
      },
      color: colors[colorIndex],
      height,
      width: 400,
    }
  })
}
