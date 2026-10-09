// The Apify exports that make up the library, and where their images live in
// the `library` storage bucket. Shared by build-library-seed.mjs and
// download-library-images.mjs.

// One entry per brand export
export const sources = [
  {
    file: "data/instagram/nike.json",
    // The brand's industry: the top-level folder in the bucket
    category: { name: "Sportswear", slug: "sportswear" },
    brand: { name: "Nike", slug: "nike", websiteUrl: "https://www.nike.com" },
    // Accounts filed under the brand (collabs from @nsw belong to Nike too)
    brandAccounts: ["nike", "nsw", "nikerunning", "nikebasketball"],
  },
  {
    file: "data/instagram/ubereats.json",
    category: { name: "Food delivery", slug: "food-delivery" },
    brand: { name: "Uber Eats", slug: "uber-eats", websiteUrl: "https://www.ubereats.com" },
    // @uber1 co-posts on @ubereats, but it's Uber's account, so it isn't filed here
    brandAccounts: ["ubereats"],
  },
  {
    file: "data/instagram/zara.json",
    category: { name: "Fashion", slug: "fashion" },
    brand: { name: "Zara", slug: "zara", websiteUrl: "https://www.zara.com" },
    // @zaraman is Zara's menswear account and co-posts on @zara
    brandAccounts: ["zara", "zaraman"],
  },
  {
    file: "data/instagram/revolut.json",
    category: { name: "Fintech", slug: "fintech" },
    brand: { name: "Revolut", slug: "revolut", websiteUrl: "https://www.revolut.com" },
    // Revolut's own accounts; partners like @audif1 are not filed here
    brandAccounts: ["revolut", "revolutbusiness", "revolutinsider", "revolut_br"],
  },
  {
    file: "data/instagram/airbnb.json",
    category: { name: "Travel", slug: "travel" },
    brand: { name: "Airbnb", slug: "airbnb", websiteUrl: "https://www.airbnb.com" },
    brandAccounts: ["airbnb", "airbnbexperiences"],
  },
  {
    file: "data/instagram/claudeai.json",
    category: { name: "Technology", slug: "technology" },
    brand: { name: "Claude", slug: "claude", websiteUrl: "https://claude.ai" },
    brandAccounts: ["claudeai"],
  },
  {
    file: "data/instagram/chatgpt.json",
    category: { name: "Technology", slug: "technology" },
    brand: { name: "ChatGPT", slug: "chatgpt", websiteUrl: "https://chatgpt.com" },
    // @openai co-posts most of these, but it's the parent company, so it isn't filed here
    brandAccounts: ["chatgpt"],
  },
  {
    file: "data/instagram/perplexity.json",
    category: { name: "Technology", slug: "technology" },
    brand: { name: "Perplexity", slug: "perplexity", websiteUrl: "https://www.perplexity.ai" },
    brandAccounts: ["perplexity"],
  },
  {
    file: "data/instagram/coinbase.json",
    category: { name: "Fintech", slug: "fintech" },
    brand: { name: "Coinbase", slug: "coinbase", websiteUrl: "https://www.coinbase.com" },
    brandAccounts: ["coinbase"],
  },
  {
    file: "data/instagram/wiseaccount.json",
    category: { name: "Fintech", slug: "fintech" },
    brand: { name: "Wise", slug: "wise", websiteUrl: "https://wise.com" },
    brandAccounts: ["wiseaccount"],
  },
  {
    file: "data/instagram/adidas.json",
    category: { name: "Sportswear", slug: "sportswear" },
    brand: { name: "adidas", slug: "adidas", websiteUrl: "https://www.adidas.com" },
    // Regional and sport accounts post to @adidas as co-authors
    brandAccounts: ["adidas", "adidasus", "adidasrunning", "adidasfootball", "adidasar"],
  },
  {
    file: "data/instagram/hm.json",
    category: { name: "Fashion", slug: "fashion" },
    brand: { name: "H&M", slug: "hm", websiteUrl: "https://www.hm.com" },
    brandAccounts: ["hm"],
  },
  {
    file: "data/instagram/uniqlo.json",
    category: { name: "Fashion", slug: "fashion" },
    brand: { name: "Uniqlo", slug: "uniqlo", websiteUrl: "https://www.uniqlo.com" },
    brandAccounts: ["uniqlo", "uniqlousa", "uniqloeurope", "uniqlo.ut"],
  },
  {
    file: "data/instagram/tripadvisor.json",
    category: { name: "Travel", slug: "travel" },
    brand: { name: "Tripadvisor", slug: "tripadvisor", websiteUrl: "https://www.tripadvisor.com" },
    brandAccounts: ["tripadvisor"],
  },
  {
    file: "data/instagram/deliveroo.json",
    category: { name: "Food delivery", slug: "food-delivery" },
    brand: { name: "Deliveroo", slug: "deliveroo", websiteUrl: "https://deliveroo.co.uk" },
    brandAccounts: ["deliveroo"],
  },
  {
    file: "data/instagram/instacart.json",
    category: { name: "Food delivery", slug: "food-delivery" },
    brand: { name: "Instacart", slug: "instacart", websiteUrl: "https://www.instacart.com" },
    brandAccounts: ["instacart"],
  },
];

// Mirrors the generated instagram_posts.format column
const formats = { Image: "static", Sidecar: "carousel", Video: "video" };

// <category>/<brand>/<format>/<short_code>/<nn>.webp, nn = slide position + 1.
// Files are WebP (see download-library-images.mjs); pass "jpg" for the original.
export const imagePath = (source, item, position = 0, extension = "webp") =>
  [
    source.category.slug,
    source.brand.slug,
    formats[item.type],
    item.shortCode,
    `${String(position + 1).padStart(2, "0")}.${extension}`,
  ].join("/");

// The images a post keeps, in post_images order: every carousel slide (a video
// slide keeps its cover frame), or the single image / video cover of any other post
export const postImages = (source, item) =>
  item.type === "Sidecar" && item.childPosts?.length
    ? item.childPosts.map((child, position) => ({
        url: child.displayUrl,
        path: imagePath(source, item, position),
        original: imagePath(source, item, position, "jpg"),
      }))
    : [{ url: item.displayUrl, path: imagePath(source, item), original: imagePath(source, item, 0, "jpg") }];
