import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import type { Collection } from "@/lib/types"

interface CollectionGridProps {
  collections: Collection[]
}

export default function CollectionGrid({ collections }: CollectionGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {collections.map((collection) => (
        <Link key={collection.id} href={`/collections/${collection.id}`}>
          <Card className="overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-md">
            <CardContent className="p-0">
              <div className="grid grid-cols-2 grid-rows-2">
                {collection.posts.slice(0, 4).map((post, index) => (
                  <div key={index} className="relative aspect-square">
                    <Image src={post.imageUrl || "/placeholder.svg"} alt={post.title} fill className="object-cover" />
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start p-4">
              <h3 className="font-medium">{collection.name}</h3>
              <div className="mt-2 flex items-center space-x-2">
                <Badge variant="outline">{collection.posts.length} posts</Badge>
                <span className="text-xs text-muted-foreground">Updated {collection.updatedAt}</span>
              </div>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  )
}
