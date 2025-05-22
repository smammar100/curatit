import { NextResponse } from "next/server"

// Unsplash API base URL
const UNSPLASH_API_URL = "https://api.unsplash.com"

// Function to fetch random photos from Unsplash
export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query") || "minimal"
    const count = Number.parseInt(searchParams.get("count") || "10")

    // Validate count to prevent abuse
    const safeCount = Math.min(Math.max(1, count), 30)

    // Check if API key is available
    if (!process.env.UNSPLASH_ACCESS_KEY) {
      console.error("Unsplash API key is missing")
      return NextResponse.json({ error: "Configuration error: Unsplash API key is missing" }, { status: 500 })
    }

    // Fetch random photos from Unsplash
    const response = await fetch(
      `${UNSPLASH_API_URL}/photos/random?query=${query}&count=${safeCount}&orientation=portrait`,
      {
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
          "Content-Type": "application/json",
        },
        // Cache the response for 1 hour to reduce API calls
        next: { revalidate: 3600 },
      },
    )

    // Improve error handling for 503 and other server errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        errors: [`Error ${response.status}: Unable to connect to Unsplash`],
      }))

      console.error(`Unsplash API error: ${response.status}`, errorData)

      // Return a more detailed error response with a 200 status to prevent cascading errors
      return NextResponse.json(
        {
          error: true,
          status: response.status,
          message: "Unable to fetch images from Unsplash at this time",
          fallback: true,
          errors: errorData.errors || ["Unknown error"],
        },
        { status: 200 }, // Return 200 with error flag instead of error status
      )
    }

    const photos = await response.json()

    // Transform the response to include only the data we need
    const transformedPhotos = photos.map((photo: any) => ({
      id: photo.id,
      url: photo.urls.regular,
      thumb: photo.urls.thumb,
      description: photo.alt_description || photo.description || "Unsplash image",
      user: {
        name: photo.user.name,
        username: photo.user.username,
        link: photo.user.links.html,
      },
      color: photo.color || "#cccccc",
      height: photo.height,
      width: photo.width,
    }))

    return NextResponse.json(transformedPhotos)
  } catch (error) {
    console.error("Error fetching from Unsplash:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch images from Unsplash",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
