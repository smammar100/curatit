export interface MasonryPost {
  id: string
  title: string
  excerpt: string
  imageUrl: string
  author: {
    name: string
    avatar: string
  }
  category: string
  likes: number
  comments: number
  date: string
  height?: number
  // Add Unsplash attribution data
  unsplashUser?: {
    name: string
    username: string
    link: string
  }
}

export interface UnsplashImage {
  id: string
  url: string
  thumb: string
  description: string
  user: {
    name: string
    username: string
    link: string
  }
  color: string
  height: number
  width: number
}

export interface Collection {
  id: string
  name: string
  posts: MasonryPost[]
  updatedAt: string
}
