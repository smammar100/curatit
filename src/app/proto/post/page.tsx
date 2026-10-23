// Prototype (2026-10-23): the post view as a page rather than a dialog, after a reference the
// owner shared (lafys.com's detail page: the work large on the left, one ruled card on the right
// with the title, the author, a full-width primary action and chip sections). Real post, real
// published analysis; `?post=<shortCode>` picks another, `?theme=dark` renders it dark for
// captures, `?direction=studio` is the three-column layout after a reference app's detail page
// (a left column of the author, folds and details, the work in the middle, discussion on the
// right). Outside the site shell so it reads as a page of its own. Deleted once a direction
// is chosen.
import "@/app/(site)/system/theme-scopes.css";
import PostProto from "@/components/proto/PostProto";
import { DIRECTIONS, type Direction } from "@/components/proto/postDirections";
import { getBreakdownSummaries, getPublishedAnalysis } from "@/lib/creative/display";
import { getPostDetail, getPublishedPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function PostProtoPage({ searchParams }: { searchParams: Promise<{ post?: string; theme?: string; direction?: string }> }) {
  const params = await searchParams;
  const posts = await getPublishedPosts();
  let shortCode = params.post;
  if (!shortCode) {
    const analysed = await getBreakdownSummaries(new Map(posts.map((p) => [p.id, p.images.length])));
    shortCode = (posts.find((p) => p.format === "carousel" && p.images.length >= 5 && analysed.has(p.id)) ?? posts[0]).shortCode;
  }
  const post = await getPostDetail(shortCode);
  if (!post) return <p className="p-8">No such post.</p>;
  const analysis = await getPublishedAnalysis(post.id, post.images.length);
  // More posts: the brand's own first, then the category's, for the "More from" and "More like
  // this" sections
  const others = posts.filter((p) => p.shortCode !== post.shortCode);
  const related = [...others.filter((p) => p.brand.slug === post.brand.slug), ...others.filter((p) => p.brand.slug !== post.brand.slug && p.category.slug === post.category.slug), ...others]
    .filter((p, i, all) => all.findIndex((q) => q.shortCode === p.shortCode) === i)
    .slice(0, 12)
    .map((p) => ({ shortCode: p.shortCode, hook: p.hook, cover: p.images[0], brand: p.brand.name, width: p.width, height: p.height }));
  const direction = DIRECTIONS.includes(params.direction as Direction) ? (params.direction as Direction) : "card";
  return <PostProto post={post} analysis={analysis} related={related} direction={direction} theme={params.theme === "dark" ? "dark" : "light"} />;
}
