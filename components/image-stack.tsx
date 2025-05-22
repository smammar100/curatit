import Image from "next/image"

export default function ImageStack() {
  // Define the heights for each image in the stack
  const imageHeights = {
    first: 180, // 1st and 7th (shortest)
    second: 220, // 2nd and 6th
    third: 260, // 3rd and 5th
    fourth: 300, // 4th (tallest/center)
  }

  // Sample images (replace with your actual images)
  const images = [
    { src: "/placeholder.svg?height=400&width=300&text=Image+1", height: imageHeights.first },
    { src: "/placeholder.svg?height=400&width=300&text=Image+2", height: imageHeights.second },
    { src: "/placeholder.svg?height=400&width=300&text=Image+3", height: imageHeights.third },
    { src: "/placeholder.svg?height=400&width=300&text=Image+4", height: imageHeights.fourth },
    { src: "/placeholder.svg?height=400&width=300&text=Image+5", height: imageHeights.third },
    { src: "/placeholder.svg?height=400&width=300&text=Image+6", height: imageHeights.second },
    { src: "/placeholder.svg?height=400&width=300&text=Image+7", height: imageHeights.first },
  ]

  return (
    <div className="relative w-full flex justify-center items-end">
      <div className="relative h-full flex items-end justify-center">
        {images.map((image, index) => {
          // Calculate z-index: center has highest, decreases toward edges
          const zIndex = 7 - Math.abs(3 - index)

          // Calculate horizontal position
          // Center image (index 3) is at 0, others are positioned relative to it
          const offsetX = (index - 3) * 80 // 80px spacing between images

          return (
            <div
              key={index}
              className="absolute rounded-t-lg overflow-hidden shadow-md"
              style={{
                height: `${image.height}px`,
                width: "160px",
                transform: `translateX(${offsetX}px)`,
                zIndex,
                bottom: 0,
              }}
            >
              <Image
                src={image.src || "/placeholder.svg"}
                alt={`Subscription image ${index + 1}`}
                fill
                className="object-cover"
                sizes="160px"
                priority={index === 3} // Prioritize loading the center image
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
