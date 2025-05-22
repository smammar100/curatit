import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import CollectionGrid from "@/components/collection-grid"
import { collections } from "@/lib/data"
import { LayoutContainer } from "@/components/layout-container"

export default function CollectionsPage() {
  return (
    <main className="py-8">
      <LayoutContainer>
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your Collections</h1>
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" /> New Collection
          </Button>
        </div>

        <CollectionGrid collections={collections} />
      </LayoutContainer>
    </main>
  )
}
