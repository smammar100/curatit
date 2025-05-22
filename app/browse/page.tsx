"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SearchIcon, FilterIcon } from "lucide-react"
import PostGrid from "@/components/post-grid"
import FilterSidebar from "@/components/filter-sidebar"
import { allPosts } from "@/lib/data"
import { LayoutContainer } from "@/components/layout-container"

export default function BrowsePage() {
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Simple filtering based on search query
  const filteredPosts = searchQuery
    ? allPosts.filter(
        (post) =>
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.platform?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.category.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : allPosts

  return (
    <main className="min-h-screen py-8">
      <LayoutContainer className="flex">
        {/* Filter Sidebar - Hidden on mobile unless toggled */}
        <div
          className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-background p-4 shadow-lg transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${
            showFilters ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <FilterSidebar onClose={() => setShowFilters(false)} />
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-6">
          <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <h1 className="text-2xl font-bold">Browse Inspirations</h1>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setShowFilters(!showFilters)}>
                <FilterIcon className="h-4 w-4" />
              </Button>
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Results Count */}
          <p className="mb-6 text-sm text-muted-foreground">Showing {filteredPosts.length} inspirations</p>

          {/* Posts Grid */}
          <PostGrid posts={filteredPosts} />
        </div>
      </LayoutContainer>
    </main>
  )
}
