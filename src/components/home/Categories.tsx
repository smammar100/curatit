import type { ComponentType } from "react";
// Fundation
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Icons
import type { IconProps } from "@/components/fundations/icons/Icon";
import AirplaneTilt from "@/components/fundations/icons/AirplaneTilt";
import Basketball from "@/components/fundations/icons/Basketball";
import CoatHanger from "@/components/fundations/icons/CoatHanger";
import Cpu from "@/components/fundations/icons/Cpu";
import CreditCard from "@/components/fundations/icons/CreditCard";
import ForkKnife from "@/components/fundations/icons/ForkKnife";
// Components
import { InteractiveFolderGallery } from "@/components/ui/interactive-folder-gallery";
import type { LibraryPost } from "@/lib/posts";
import PostCover from "./PostCover";
import { categories } from "./demo";

const icons: Record<string, ComponentType<IconProps>> = {
  "Food & Drink": ForkKnife,
  Sports: Basketball,
  Technology: Cpu,
  Fashion: CoatHanger,
  Finance: CreditCard,
  "Travel & Transportation": AirplaneTilt,
};

// Same lightness and chroma for every folder; only the hue changes, so the six read as one set
function folderTone(hue: number) {
  return {
    front: `oklch(0.88 0.055 ${hue})`,
    back: `oklch(0.8 0.075 ${hue})`,
    pocket: `oklch(0.71 0.085 ${hue})`,
    ink: `oklch(0.45 0.1 ${hue})`,
  };
}

// The newest posts in a category, taking one brand at a time so a folder isn't all one brand
function folderPosts(posts: LibraryPost[], category: string, count = 5) {
  const queues = Map.groupBy(
    posts.filter((post) => post.category.slug === category),
    (post) => post.brand.slug
  );
  const picked: LibraryPost[] = [];
  while (picked.length < count && [...queues.values()].some((queue) => queue.length)) {
    for (const queue of queues.values()) {
      const next = queue.shift();
      if (next && picked.length < count) picked.push(next);
    }
  }
  return picked;
}

export default function Categories({ posts }: { posts: LibraryPost[] }) {
  return (
    <section>
      <Wrapper variant="standard" className="py-20">
        <div className="text-balance max-w-3xl mx-auto text-center">
          <Text tag="h2" variant="displaySM" className="text-base-900 font-display font-thin">
            Six categories, studied closely
          </Text>
          <Text tag="p" variant="textBase" className="text-base-600 mt-4">
            Every post is tagged from one vocabulary of 36 terms for objective, format, structure and
            visual style, so “listicle” means the same thing in every category. Open a folder to look
            inside.
          </Text>
        </div>
        <ul className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
          {categories.map((category) => {
            const examples = folderPosts(posts, category.category);
            const Icon = icons[category.name];
            return (
              <li key={category.name}>
                <InteractiveFolderGallery
                  folderName={category.name}
                  dragHintText="Drag a post down to close"
                  tone={folderTone(category.hue)}
                  icon={<Icon className="size-6" />}
                  photos={examples.map((post) => ({
                    id: post.shortCode,
                    content: <PostCover post={post} sizes="320px" className="size-full" />,
                  }))}
                />
              </li>
            );
          })}
        </ul>
      </Wrapper>
    </section>
  );
}
