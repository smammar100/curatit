import type { ComponentType } from "react";
// Fundation
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Icons
import type { IconProps } from "@/components/fundations/icons/Icon";
import AirplaneTilt from "@/components/fundations/icons/AirplaneTilt";
import Basketball from "@/components/fundations/icons/Basketball";
import CreditCard from "@/components/fundations/icons/CreditCard";
import FilmSlate from "@/components/fundations/icons/FilmSlate";
import ForkKnife from "@/components/fundations/icons/ForkKnife";
import ShoppingBag from "@/components/fundations/icons/ShoppingBag";
// Components
import { InteractiveFolderGallery } from "@/components/ui/interactive-folder-gallery";
import PostCover from "./PostCover";
import { categories, posts, type Post } from "./demo";

const icons: Record<string, ComponentType<IconProps>> = {
  "Food & Drink": ForkKnife,
  Sports: Basketball,
  Entertainment: FilmSlate,
  Shopping: ShoppingBag,
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

export default function Categories() {
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
            const examples: Post[] = category.posts.map((id) => posts[id]);
            const Icon = icons[category.name];
            return (
              <li key={category.name}>
                <InteractiveFolderGallery
                  folderName={category.name}
                  dragHintText="Drag a post down to close"
                  tone={folderTone(category.hue)}
                  icon={<Icon className="size-6" />}
                  photos={examples.map((post) => ({
                    id: post.hook,
                    content: <PostCover brand={post.brand} slide={post.slides[0]} className="size-full" />,
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
