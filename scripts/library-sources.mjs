// The Apify exports that make up the library, and where their images live in
// the `library` storage bucket. Shared by build-library-seed.mjs and
// download-library-images.mjs.

// One entry per brand export. `folder` is the top-level folder of the brand's files in the bucket
// (brands.storage_folder): the category it was first filed under, kept when categories changed on
// 2026-10-13 so no file had to move; a new brand uses its main category's slug. `categories` are
// slugs from src/lib/categories.ts (the `categories` table): the brand's main category first, then
// any extra ones, which go on each of its posts as post_categories rows.
export const sources = [
  {
    file: "data/instagram/nike.json",
    folder: "sportswear",
    categories: ["sports", "shopping"],
    brand: { name: "Nike", slug: "nike", websiteUrl: "https://www.nike.com" },
    // Accounts filed under the brand (collabs from @nsw belong to Nike too)
    brandAccounts: ["nike", "nsw", "nikerunning", "nikebasketball"],
  },
  {
    file: "data/instagram/ubereats.json",
    folder: "food-delivery",
    categories: ["food-drink"],
    brand: { name: "Uber Eats", slug: "uber-eats", websiteUrl: "https://www.ubereats.com" },
    // @uber1 co-posts on @ubereats, but it's Uber's account, so it isn't filed here
    brandAccounts: ["ubereats"],
  },
  {
    file: "data/instagram/zara.json",
    folder: "fashion",
    categories: ["shopping", "lifestyle"],
    brand: { name: "Zara", slug: "zara", websiteUrl: "https://www.zara.com" },
    // @zaraman is Zara's menswear account and co-posts on @zara
    brandAccounts: ["zara", "zaraman"],
  },
  {
    file: "data/instagram/revolut.json",
    folder: "fintech",
    categories: ["finance"],
    brand: { name: "Revolut", slug: "revolut", websiteUrl: "https://www.revolut.com" },
    // Revolut's own accounts; partners like @audif1 are not filed here
    brandAccounts: ["revolut", "revolutbusiness", "revolutinsider", "revolut_br"],
  },
  {
    file: "data/instagram/airbnb.json",
    folder: "travel",
    categories: ["travel-transportation", "lifestyle"],
    brand: { name: "Airbnb", slug: "airbnb", websiteUrl: "https://www.airbnb.com" },
    brandAccounts: ["airbnb", "airbnbexperiences"],
  },
  {
    file: "data/instagram/claudeai.json",
    folder: "technology",
    categories: ["ai", "productivity"],
    brand: { name: "Claude", slug: "claude", websiteUrl: "https://claude.ai" },
    brandAccounts: ["claudeai"],
  },
  {
    file: "data/instagram/chatgpt.json",
    folder: "technology",
    categories: ["ai", "productivity"],
    brand: { name: "ChatGPT", slug: "chatgpt", websiteUrl: "https://chatgpt.com" },
    // @openai co-posts most of these, but it's the parent company, so it isn't filed here
    brandAccounts: ["chatgpt"],
  },
  {
    file: "data/instagram/perplexity.json",
    folder: "technology",
    categories: ["ai", "productivity"],
    brand: { name: "Perplexity", slug: "perplexity", websiteUrl: "https://www.perplexity.ai" },
    brandAccounts: ["perplexity"],
  },
  {
    file: "data/instagram/coinbase.json",
    folder: "fintech",
    categories: ["crypto-web3", "finance"],
    brand: { name: "Coinbase", slug: "coinbase", websiteUrl: "https://www.coinbase.com" },
    brandAccounts: ["coinbase"],
  },
  {
    file: "data/instagram/publicapp.json",
    folder: "fintech",
    categories: ["finance"],
    brand: { name: "Public", slug: "public", websiteUrl: "https://public.com" },
    brandAccounts: ["publicapp"],
  },
  {
    file: "data/instagram/wiseaccount.json",
    folder: "fintech",
    categories: ["finance"],
    brand: { name: "Wise", slug: "wise", websiteUrl: "https://wise.com" },
    brandAccounts: ["wiseaccount"],
  },
  {
    file: "data/instagram/adidas.json",
    folder: "sportswear",
    categories: ["sports", "shopping"],
    brand: { name: "adidas", slug: "adidas", websiteUrl: "https://www.adidas.com" },
    // Regional and sport accounts post to @adidas as co-authors
    brandAccounts: ["adidas", "adidasus", "adidasrunning", "adidasfootball", "adidasar"],
  },
  {
    file: "data/instagram/hm.json",
    folder: "fashion",
    categories: ["shopping", "lifestyle"],
    brand: { name: "H&M", slug: "hm", websiteUrl: "https://www.hm.com" },
    brandAccounts: ["hm"],
  },
  {
    file: "data/instagram/uniqlo.json",
    folder: "fashion",
    categories: ["shopping", "lifestyle"],
    brand: { name: "Uniqlo", slug: "uniqlo", websiteUrl: "https://www.uniqlo.com" },
    brandAccounts: ["uniqlo", "uniqlousa", "uniqloeurope", "uniqlo.ut"],
  },
  {
    file: "data/instagram/tripadvisor.json",
    folder: "travel",
    categories: ["travel-transportation"],
    brand: { name: "Tripadvisor", slug: "tripadvisor", websiteUrl: "https://www.tripadvisor.com" },
    brandAccounts: ["tripadvisor"],
  },
  {
    file: "data/instagram/deliveroo.json",
    folder: "food-delivery",
    categories: ["food-drink"],
    brand: { name: "Deliveroo", slug: "deliveroo", websiteUrl: "https://deliveroo.co.uk" },
    brandAccounts: ["deliveroo"],
  },
  {
    file: "data/instagram/instacart.json",
    folder: "food-delivery",
    categories: ["food-drink", "shopping"],
    brand: { name: "Instacart", slug: "instacart", websiteUrl: "https://www.instacart.com" },
    brandAccounts: ["instacart"],
  },
  {
    file: "data/instagram/shopify.json",
    folder: "ecommerce",
    categories: ["business", "shopping"],
    brand: { name: "Shopify", slug: "shopify", websiteUrl: "https://www.shopify.com" },
    brandAccounts: ["shopify"],
  },
  {
    file: "data/instagram/kfc.json",
    folder: "food-delivery",
    categories: ["food-drink"],
    brand: { name: "KFC", slug: "kfc", websiteUrl: "https://www.kfc.com" },
    brandAccounts: ["kfc"],
  },
  {
    file: "data/instagram/cocacola.json",
    folder: "food-delivery",
    categories: ["food-drink"],
    brand: { name: "Coca-Cola", slug: "coca-cola", websiteUrl: "https://www.coca-cola.com" },
    brandAccounts: ["cocacola"],
  },
  {
    file: "data/instagram/mcdonalds.json",
    folder: "food-delivery",
    categories: ["food-drink"],
    brand: { name: "McDonald's", slug: "mcdonalds", websiteUrl: "https://www.mcdonalds.com" },
    // Licensed partners like @spongebob co-post on @mcdonalds; @officialhappymeal is McDonald's own
    brandAccounts: ["mcdonalds", "officialhappymeal"],
  },
  {
    file: "data/instagram/burgerking.json",
    folder: "food-delivery",
    categories: ["food-drink"],
    brand: { name: "Burger King", slug: "burger-king", websiteUrl: "https://www.bk.com" },
    brandAccounts: ["burgerking"],
  },
  {
    file: "data/instagram/underarmour.json",
    folder: "sportswear",
    categories: ["sports", "shopping"],
    brand: { name: "Under Armour", slug: "under-armour", websiteUrl: "https://www.underarmour.com" },
    // Sport accounts publish with @underarmour as co-author; athletes like @mikelarteta are not filed here
    brandAccounts: ["underarmour", "uafootball", "uadugout"],
  },
  {
    file: "data/instagram/robinhoodapp.json",
    folder: "fintech",
    categories: ["finance"],
    brand: { name: "Robinhood", slug: "robinhood", websiteUrl: "https://robinhood.com" },
    brandAccounts: ["robinhoodapp"],
  },
  {
    file: "data/instagram/wealthsimple.json",
    folder: "fintech",
    categories: ["finance"],
    brand: { name: "Wealthsimple", slug: "wealthsimple", websiteUrl: "https://www.wealthsimple.com" },
    brandAccounts: ["wealthsimple"],
  },
  {
    file: "data/instagram/wealthfront.json",
    folder: "fintech",
    categories: ["finance"],
    brand: { name: "Wealthfront", slug: "wealthfront", websiteUrl: "https://www.wealthfront.com" },
    brandAccounts: ["wealthfront"],
  },
  {
    file: "data/instagram/expedia.json",
    folder: "travel",
    categories: ["travel-transportation"],
    brand: { name: "Expedia", slug: "expedia", websiteUrl: "https://www.expedia.com" },
    // @expediagroup is the parent company, so it isn't filed here
    brandAccounts: ["expedia"],
  },
  {
    file: "data/instagram/uber.json",
    folder: "travel",
    categories: ["travel-transportation"],
    brand: { name: "Uber", slug: "uber", websiteUrl: "https://www.uber.com" },
    brandAccounts: ["uber"],
  },
  {
    file: "data/instagram/bolt.json",
    folder: "travel",
    categories: ["travel-transportation"],
    brand: { name: "Bolt", slug: "bolt", websiteUrl: "https://bolt.eu" },
    brandAccounts: ["bolt"],
  },
  {
    file: "data/instagram/amazon.json",
    folder: "ecommerce",
    categories: ["shopping"],
    brand: { name: "Amazon", slug: "amazon", websiteUrl: "https://www.amazon.com" },
    // @amazonkindle is Amazon's own; film partners that co-post are not filed here
    brandAccounts: ["amazon", "amazonkindle"],
  },
  {
    file: "data/instagram/binance.json",
    folder: "fintech",
    categories: ["crypto-web3", "finance"],
    brand: { name: "Binance", slug: "binance", websiteUrl: "https://www.binance.com" },
    brandAccounts: ["binance"],
  },
  {
    file: "data/instagram/doordash.json",
    folder: "food-delivery",
    categories: ["food-drink"],
    brand: { name: "DoorDash", slug: "doordash", websiteUrl: "https://www.doordash.com" },
    brandAccounts: ["doordash"],
  },
  {
    // A second Deliveroo export (2026-10-15): only the posts the first one didn't have
    file: "data/instagram/deliveroo-2026-10-15.json",
    folder: "food-delivery",
    categories: ["food-drink"],
    brand: { name: "Deliveroo", slug: "deliveroo", websiteUrl: "https://deliveroo.co.uk" },
    brandAccounts: ["deliveroo"],
  },
  {
    file: "data/instagram/duolingo.json",
    folder: "education",
    categories: ["education", "entertainment"],
    brand: { name: "Duolingo", slug: "duolingo", websiteUrl: "https://www.duolingo.com" },
    brandAccounts: ["duolingo", "duolingoespanol"],
  },
  {
    file: "data/instagram/headspace.json",
    folder: "health-fitness",
    categories: ["health-fitness", "lifestyle"],
    brand: { name: "Headspace", slug: "headspace", websiteUrl: "https://www.headspace.com" },
    brandAccounts: ["headspace"],
  },
  {
    file: "data/instagram/puma.json",
    folder: "sportswear",
    categories: ["sports", "shopping"],
    brand: { name: "PUMA", slug: "puma", websiteUrl: "https://www.puma.com" },
    // Sport and regional accounts post with @puma as co-author; athletes are not filed here
    brandAccounts: ["puma", "pumarunning", "pumafootball", "pumatraining", "pumamotorsport", "puma.uk", "puma.usa", "pumaspain"],
  },
  {
    file: "data/instagram/on.json",
    folder: "sportswear",
    categories: ["sports", "shopping"],
    brand: { name: "On", slug: "on", websiteUrl: "https://www.on.com" },
    // @loewe posts the LOEWE x On collection with @on as co-author; Loewe is a partner, so it isn't filed here
    brandAccounts: ["on", "on.football"],
  },
  {
    file: "data/instagram/canva.json",
    folder: "graphics-design",
    categories: ["graphics-design", "productivity"],
    brand: { name: "Canva", slug: "canva", websiteUrl: "https://www.canva.com" },
    // Affinity belongs to Canva and co-posts with it
    brandAccounts: ["canva", "affinity"],
  },
];

// Mirrors the generated instagram_posts.format column
const formats = { Image: "static", Sidecar: "carousel", Video: "video" };

// <folder>/<brand>/<format>/<short_code>/<nn>.webp, nn = slide position + 1.
// Files are WebP (see download-library-images.mjs); pass "jpg" for the original.
export const imagePath = (source, item, position = 0, extension = "webp") =>
  [
    source.folder,
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
