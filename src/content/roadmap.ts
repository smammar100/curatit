// The Roadmap page's content (src/app/(site)/roadmap): what is coming, and a changelog of every
// day something shipped, newest first. Written from this repo's history in plain words for
// visitors, each entry citing the commits behind it (linked on GitHub); the first version was
// drafted day by day from the commits and checked against them on 2026-10-12. Only finished work
// goes in: something a visitor or member can use today, as described. On 2026-10-12 an audit of
// every entry against the live site, the code and the database (each verdict checked twice) took
// out what wasn't: the homepage folders and first demos (since replaced), the homepage speed
// scores (not what production measures), and the creative breakdown entries (published on 11 of
// 162 posts, none yet with the 3.0 changes; they're under Now until they're out). To add a day, run
// npm run changelog:draft for the commits since the newest entry, then write it up here. The page
// shows the days up to EARLIER.through as one short summary and the days after it in full, so when
// a new day is added, fold the previous one into the summary and move `through` on.

export type RoadmapStage = "Now" | "Next" | "Later";
export type RoadmapItem = { stage: RoadmapStage; area: string; title: string; detail: string };
export type ChangelogEntry = { area: string; title: string; detail: string; commits: string[] };
export type ChangelogDay = { date: string; headline: string; entries: ChangelogEntry[] };
export type SummaryItem = { title: string; commit: string };

export const ROADMAP: RoadmapItem[] = [
  { stage: "Now", area: "AI agents", title: "Curatit MCP in development", detail: "Connect Curatit to Claude, Cursor, VS Code and other AI tools, so they can search the library and pull a post's breakdown from inside the tool. The server is built; the connection isn't released yet." },
  { stage: "Now", area: "Creative Intelligence", title: "Breakdowns across the whole library", detail: "Breakdowns are drafted by AI and appear only once an editor approves them. Every post in the library has one now, and new posts get theirs as they join." },
  { stage: "Now", area: "Library", title: "More brands", detail: "New brands join a few at a time, each with a handful of recent posts. Bolt and Public are the latest, and newly added posts now show near the top of your feed." },
  { stage: "Next", area: "AI agents", title: "Testing Curatit MCP", detail: "Trying the connection in Claude, Cursor, VS Code, Gemini and ChatGPT before it's released, and fixing what breaks." },
  { stage: "Later", area: "Updates", title: "Drafting email templates", detail: "The emails Curatit sends, from confirming your address to telling you when new posts land." },
  { stage: "Later", area: "Library", title: "More and more posts", detail: "More brands and more of their recent posts, added a few at a time." },
  { stage: "Later", area: "Search", title: "Improving search", detail: "Better matching for briefs, categories and creative labels, so the right references come up first." },
  { stage: "Later", area: "Site", title: "Design system updates", detail: "Tidying the components and styles the site and the dashboard share, so every page looks and behaves the same." },
];

// Everything up to and including `through`, in a few lines (the full entries are in CHANGELOG)
export const EARLIER: { through: string; items: SummaryItem[] } = {
  through: "2026-10-11",
  items: [
    { title: "Curatit got its name and a homepage of its own", commit: "371e7c6" },
    { title: "Real posts from thirty brands across seven categories", commit: "500469c" },
    { title: "A signed-in dashboard, with posts that open over the feed", commit: "504ad08" },
    { title: "Boards you can keep and share with a link", commit: "321ecfe" },
    { title: "Accounts, a welcome flow that tunes For you, and dark mode", commit: "41e5f81" },
  ],
};

export const CHANGELOG: ChangelogDay[] = [
  {
    date: "2026-10-12",
    headline: "Sharper breakdowns, brand search, Vision and a roadmap",
    entries: [
      { area: "Search", title: "Search finds brands however you type them", detail: "In the dashboard, punctuation, accents and spaces in brand names no longer matter, so \"hm\", \"coca cola\" and \"ubereats\" find H&M, Coca-Cola and Uber Eats. Typing a brand's exact name shows only its posts, and the search panel lists brands with their logos, narrowing as you type.", commits: ["3181f04"] },
      { area: "Dashboard", title: "New additions lead the feed", detail: "The feed now puts the posts most recently added to the library first, with brands mixed within each day. In For you, the latest additions count as much as an industry you picked.", commits: ["3181f04"] },
      { area: "Library", title: "Bolt and Public join the library", detail: "Bolt joins Travel and Public joins Fintech, along with DoorDash's three newest posts: 13 new posts in all.", commits: ["279603e"] },
      { area: "Site", title: "A Vision page in place of About", detail: "Vision replaces About, and old About links land there. It has a note from the founder, a signature drawn stroke by stroke, a moving graph of five real posts with a Pause button, and how many posts and brands the library holds.", commits: ["279603e","3181f04"] },
      { area: "Site", title: "A shorter top navigation", detail: "The top navigation is now How it works, Pricing, Vision and Roadmap. Library and Blog left the menu, but their pages are still there, and the footer links to Vision in place of About.", commits: ["279603e"] },
      { area: "Site", title: "A public roadmap and changelog", detail: "This page: what is being built now, what comes next and later, and what has shipped so far, each update linked to the change behind it.", commits: [] },
    ],
  },
  {
    date: "2026-10-11",
    headline: "Creative breakdowns, a welcome flow and Discover",
    entries: [
      { area: "Creative Intelligence", title: "Drafted by AI, approved by editors", detail: "AI drafts each analysis after looking at every slide and copying any on-slide text word for word. Nothing appears on a post until an editor approves it, and the breakdown says who wrote it.", commits: ["352bdfe","bbedd61"] },
      { area: "Dashboard", title: "Likes and comments, as collected", detail: "Each post shows its likes and comments under its title, as collected, and says Not available when a count is hidden rather than showing zero. The brand-average comparison and category ranking are gone: a few posts per brand is too few to judge fairly.", commits: ["ba4af66","4bb50a7","833d084"] },
      { area: "Dashboard", title: "A welcome flow that tunes For you", detail: "After sign-up, a short welcome asks your name, the industries you work in, brands you keep an eye on and three posts that stop your thumb, with the library re-sorting as you pick. For you ranks on your answers, and Personalise your feed opens it again.", commits: ["41e5f81","352bdfe"] },
      { area: "Dashboard", title: "Discover by category, Saved as a bookmark", detail: "A Discover tab browses the library by category, each with its own icon. Saved moves to a bookmark button with your saved count, the avatar opens your account menu, and the search bar gets a travelling glow.", commits: ["5e34e66"] },
      { area: "Boards", title: "A friendlier empty Saved view", detail: "With nothing saved yet, the Saved view shows real posts dropping into a big bookmark pocket and the count badge popping on, with a short line on how saving works.", commits: ["5e34e66"] },
      { area: "Accounts", title: "Clearer sign-up and password help", detail: "Sign-up and password reset list the password rules and tick them off as you type, with a strength meter from red to green. Problems show in red under their field, including an email that already has an account.", commits: ["03e7f5b","712605b"] },
      { area: "Site", title: "A new footer with the newest covers", detail: "The site's pages now end on an inset panel, dark in the light theme and light in the dark one, with the newest covers fanned in.", commits: ["352bdfe","04bbe12"] },
      { area: "Site", title: "A 404 page built from posts", detail: "A missing page now shows a 404 made of real library covers that lift towards the cursor and flip to show another post, with links home and to the library.", commits: ["352bdfe"] },
    ],
  },
  {
    date: "2026-10-10",
    headline: "Real brands, a dashboard, boards and accounts",
    entries: [
      { area: "Library", title: "Real brand posts replace the demo", detail: "The homepage now shows real posts from real brands, with their own images, in place of made-up examples.", commits: ["dbe7c65"] },
      { area: "Library", title: "Thirty brands across seven categories", detail: "Fourteen brands joined, including Shopify, Coca-Cola, McDonald's, Robinhood, Uber and Amazon, taking the library to 149 posts. E-commerce is a new category, Food delivery is now Food & drink, and brand names now show the brand's logo.", commits: ["500469c","fcef685"] },
      { area: "Dashboard", title: "Your signed-in dashboard", detail: "Signed-in members get a feed of the whole library in a grid that fits your screen, a search that suggests recent searches and categories, and settings for theme and tile size.", commits: ["500469c","504ad08","3cf4257"] },
      { area: "Dashboard", title: "Posts open over the feed", detail: "Open a post and it appears over the feed you were browsing, with every slide, the brand, the full caption with mentions and hashtags linked, the boards it's on and Save. Placeholders show while it loads.", commits: ["504ad08"] },
      { area: "Boards", title: "Boards you can keep and share", detail: "Save posts to named boards that stay with your account. Each board has its own page with notes on the images. Share makes a read-only link, which stops working as soon as you turn sharing off.", commits: ["321ecfe","7a76e7d","3cf4257"] },
      { area: "Accounts", title: "Sign up and sign in", detail: "Create an account with your email and a password, and reset a forgotten password by email. The sign-in pages are one simple card over a drifting wall of library covers.", commits: ["7e20178","321ecfe","7a76e7d"] },
      { area: "Site", title: "Dark mode", detail: "Switch between light and dark from the navigation, or let Curatit follow your system setting. Your choice is remembered, and colours, code blocks and category tabs all adapt.", commits: ["7e20178","500469c"] },
      { area: "Homepage", title: "How it works and categories, reworked", detail: "The How it works illustrations now show search results with matched tags, a carousel slide by slide and a board as a client sees it, looping until you click. Category tabs swap covers in place, and the 'One library. One search.' scene now draws a small version of the real dashboard.", commits: ["fcef685","3cf4257"] },
    ],
  },
  {
    date: "2026-10-09",
    headline: "Curatit begins: a new name and homepage",
    entries: [
      { area: "Site", title: "Curatit gets its name and wordmark", detail: "Curatit got its name, with a wordmark set in Hedvig Letters Serif and a new browser icon.", commits: ["346d450"] },
      { area: "Accounts", title: "Sign-in and sign-up, without distractions", detail: "The sign-in and sign-up pages drop the menu and footer, so the form has the page to itself.", commits: ["346d450"] },
      { area: "Homepage", title: "A homepage made for Curatit", detail: "The homepage opens on cards of images flying towards you, under ‘Find the brand posts worth studying.’, with a FAQ further down. The website directory moved to a page of its own.", commits: ["371e7c6"] },
      { area: "Homepage", title: "From scattered saves to one library", detail: "A section that holds still as you scroll: references saved everywhere fade into a single Curatit library window, and scrolling back reverses it.", commits: ["186ded0"] },
      { area: "Homepage", title: "Curatit for AI agents, announced", detail: "A coming-soon section announces a Curatit MCP server, so your AI agent can search by brief, pull a post's analysis and open a board. A looping chat shows it, and Get notified leads to sign-up.", commits: ["186ded0"] },
      { area: "Homepage", title: "A closing call with brand reels", detail: "The page ends on ‘Building for a brand? Start with your next brief.’ between two reels of placeholder brand tiles turning along an arc, which run sideways on phones.", commits: ["186ded0","cd4c293"] },
    ],
  },
];
