"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"

interface MasonryItem {
  id: number
  imageUrl: string
  height: number
}

export default function ResponsiveMasonryGrid() {
  // Sample data with varying heights to demonstrate masonry effect
  const [items] = useState<MasonryItem[]>([
    { id: 1, imageUrl: "/placeholder.svg?height=300&width=400", height: 300 },
    { id: 2, imageUrl: "/placeholder.svg?height=400&width=400", height: 400 },
    { id: 3, imageUrl: "/placeholder.svg?height=250&width=400", height: 250 },
    { id: 4, imageUrl: "/placeholder.svg?height=350&width=400", height: 350 },
    { id: 5, imageUrl: "/placeholder.svg?height=280&width=400", height: 280 },
    { id: 6, imageUrl: "/placeholder.svg?height=320&width=400", height: 320 },
    { id: 7, imageUrl: "/placeholder.svg?height=270&width=400", height: 270 },
    { id: 8, imageUrl: "/placeholder.svg?height=380&width=400", height: 380 },
    { id: 9, imageUrl: "/placeholder.svg?height=330&width=400", height: 330 },
    { id: 10, imageUrl: "/placeholder.svg?height=290&width=400", height: 290 },
    { id: 11, imageUrl: "/placeholder.svg?height=310&width=400", height: 310 },
    { id: 12, imageUrl: "/placeholder.svg?height=360&width=400", height: 360 },
  ])

  return (
    <div className="bg-gray-50 px-3 sm:px-5 md:px-7 lg:px-9 xl:px-12 py-6 rounded-xl">
      <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-3 space-y-3 max-w-[1400px] mx-auto">
        {items.map((item) => (
          <div key={item.id} className="mb-3 break-inside-avoid">
            <Card className="overflow-hidden rounded-2xl shadow-md transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `url(${item.imageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  height: `${item.height}px`,
                }}
              />
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
