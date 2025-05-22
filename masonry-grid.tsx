"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"

interface MasonryItem {
  id: number
  imageUrl: string
  height: number
}

export default function MasonryGrid() {
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
    <div className="bg-gray-50 px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12">
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 auto-rows-auto max-w-7xl mx-auto">
        {items.map((item) => (
          <Card
            key={item.id}
            className="overflow-hidden rounded-2xl shadow-md transition-transform duration-300 ease-in-out hover:scale-105"
          >
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
        ))}
      </div>
    </div>
  )
}
