import type { MasonryPost, Collection } from "./types"

// Categories for Unsplash images
const categories = [
  "nature",
  "travel",
  "architecture",
  "food",
  "fashion",
  "technology",
  "business",
  "art",
  "animals",
  "interiors",
  "people",
  "health",
]

// Generate a random number between min and max
const randomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

// Generate a random date within the last 30 days
const randomDate = () => {
  const today = new Date()
  const pastDate = new Date(today)
  pastDate.setDate(today.getDate() - randomNumber(1, 30))

  return pastDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Generate dummy post data with placeholder images
export const generateDummyPosts = (count: number): MasonryPost[] => {
  return Array.from({ length: count }).map((_, index) => {
    // Get random category for the image
    const category = categories[Math.floor(Math.random() * categories.length)]

    // Random dimensions for variety
    const width = 800
    const height = randomNumber(350, 550)

    // Placeholder image URL (will be replaced with Unsplash in the component)
    const imageUrl = `/placeholder.svg?height=${height}&width=${width}`

    // Random author avatar
    const avatarId = randomNumber(1, 70)
    const avatarUrl = `https://i.pravatar.cc/150?img=${avatarId}`

    return {
      id: `post-${index + 1}`,
      title: getTitles()[index % getTitles().length],
      excerpt: getExcerpts()[index % getExcerpts().length],
      imageUrl,
      author: {
        name: getAuthorNames()[index % getAuthorNames().length],
        avatar: avatarUrl,
      },
      category: getCategoryNames()[index % getCategoryNames().length],
      likes: randomNumber(5, 2500),
      comments: randomNumber(0, 100),
      date: randomDate(),
      height,
    }
  })
}

// Sample titles for posts
const getTitles = () => [
  "The Art of Minimalism",
  "Exploring Hidden Gems",
  "Future of Technology",
  "Sustainable Living Guide",
  "Creative Workspace Ideas",
  "Morning Routine Essentials",
  "Travel Photography Tips",
  "Healthy Meal Prep Ideas",
  "Design Trends for 2023",
  "Productivity Hacks",
  "Urban Gardening Guide",
  "Mindfulness Practices",
  "Remote Work Setup",
  "Fitness Journey Milestones",
  "Culinary Adventures",
  "Architectural Wonders",
  "Fashion Forward Thinking",
  "Digital Nomad Lifestyle",
  "Artistic Expressions",
  "Eco-Friendly Solutions",
  "Weekend Getaway Spots",
  "Home Renovation Projects",
  "Innovative Startups",
  "Seasonal Wardrobe Essentials",
]

// Sample excerpts for posts
const getExcerpts = () => [
  "Discover how simplifying your life can lead to greater happiness and fulfillment.",
  "Venture off the beaten path to discover these lesser-known destinations.",
  "Exploring the latest innovations that are shaping our digital landscape.",
  "Simple changes you can make today for a more eco-friendly lifestyle.",
  "Transform your workspace into a hub of creativity and productivity.",
  "Start your day right with these essential morning habits for success.",
  "Capture stunning travel moments with these professional photography tips.",
  "Save time and eat healthy with these simple meal preparation strategies.",
  "Stay ahead of the curve with these emerging design trends for the year.",
  "Maximize your efficiency with these proven productivity techniques.",
  "Bring nature into your urban space with these gardening solutions.",
  "Incorporate these mindfulness practices into your daily routine.",
  "Create the perfect home office setup for maximum productivity.",
  "Track your progress and celebrate achievements in your fitness journey.",
  "Embark on a gastronomic journey with these unique culinary experiences.",
  "Explore remarkable structures that push the boundaries of design.",
  "Embrace the latest fashion trends while maintaining your personal style.",
  "Navigate the challenges and rewards of location-independent work.",
  "Express yourself through various artistic mediums and techniques.",
  "Implement these sustainable solutions for a greener lifestyle.",
  "Perfect destinations for a quick escape from the hustle and bustle.",
  "Transform your living space with these inspiring renovation ideas.",
  "Learn about groundbreaking startups revolutionizing various industries.",
  "Update your wardrobe with these must-have seasonal pieces.",
]

// Sample author names
const getAuthorNames = () => [
  "Alex Morgan",
  "Jamie Chen",
  "Taylor Swift",
  "Jordan Smith",
  "Casey Johnson",
  "Riley Brown",
  "Quinn Williams",
  "Morgan Lee",
  "Avery Davis",
  "Cameron Wilson",
  "Dakota Miller",
  "Skyler Thompson",
  "Reese Martinez",
  "Harper Garcia",
  "Emerson Rodriguez",
]

// Sample category names
const getCategoryNames = () => [
  "Travel",
  "Design",
  "Technology",
  "Lifestyle",
  "Food",
  "Fitness",
  "Fashion",
  "Business",
  "Art",
  "Photography",
  "Health",
  "Home",
  "Nature",
  "Architecture",
]

// Generate 24 dummy posts
export const dummyPosts = generateDummyPosts(24)

// Export allPosts as an alias of dummyPosts to maintain compatibility
export const allPosts = dummyPosts

// Sample collections
export const collections: Collection[] = [
  {
    id: "1",
    name: "Design Inspiration",
    posts: dummyPosts.slice(0, 4),
    updatedAt: "2 days ago",
  },
  {
    id: "2",
    name: "Content Strategy Ideas",
    posts: dummyPosts.slice(4, 8),
    updatedAt: "1 week ago",
  },
  {
    id: "3",
    name: "Campaign References",
    posts: dummyPosts.slice(8, 12),
    updatedAt: "2 weeks ago",
  },
]
