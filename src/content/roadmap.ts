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
// shows every day as its own column on the rail.

export type RoadmapStage = "Now" | "Next" | "Later";
export type RoadmapItem = { stage: RoadmapStage; area: string; title: string; detail: string };
// `brands` shows, under the entry on the rail, the marks of the brands whose first posts went live
// that day (read from the library, so they're always the real ones)
export type ChangelogEntry = { area: string; title: string; detail: string; commits: string[]; brands?: boolean };
export type ChangelogDay = { date: string; headline: string; entries: ChangelogEntry[] };

export const ROADMAP: RoadmapItem[] = [
  { stage: "Now", area: "AI agents", title: "Curatit MCP in beta", detail: "Claude, ChatGPT, Claude Code, Cursor and VS Code can search the library and pull a post's breakdown from inside the tool. Connect yours from the AI integration page, and tell us what breaks." },
  { stage: "Now", area: "Creative Intelligence", title: "Breakdowns for every new post", detail: "Breakdowns are drafted by AI and appear only once an editor approves them. Every post in the library has one, and new posts get theirs as they join." },
  { stage: "Now", area: "Library", title: "More brands", detail: "New brands join a few at a time. Betterment and Airtasker are the latest, with 19 more posts from Wealthsimple, and newly added posts show near the top of your feed." },
  { stage: "Next", area: "AI agents", title: "Testing Curatit MCP", detail: "Trying the connection in more AI tools and with more people before it leaves beta, and fixing what breaks." },
  { stage: "Later", area: "Library", title: "More and more posts", detail: "More brands and more of their recent posts, added a few at a time." },
  { stage: "Later", area: "Launch", title: "Launching closed beta", detail: "Opening Curatit to a first group of people to use it every day and tell us what to fix." },
];

export const CHANGELOG: ChangelogDay[] = [
  {
    date: "2026-10-24",
    headline: "A new look, Discover reworked and three brands' new posts",
    entries: [
      { area: "Site", title: "One design system for every page", detail: "Every page, from the homepage to the dashboard, is now built from one set of buttons, fields, menus, dialogs and cards. Controls are roomier, fields are softly filled, tab rows match the For you and Discover switch, and corners grow with the size of what they round.", commits: ["cf4fd75","a030d5f","258ebce","3d71c91","7ea285b"] },
      { area: "Dashboard", title: "Discover, laid out like an explore page", detail: "Discover opens on the categories, each in its own colour, then the playbooks: the kinds of post the breakdowns keep finding, as collections of covers. Opening one shows its posts under its name. The playbooks moved here from For you, which now opens straight on the posts.", commits: ["bd5a41b","b29c1b9","7fc7166"] },
      { area: "Dashboard", title: "A calmer post page", detail: "A post's page sits in the same frame as the feed, with the post filling the window and its slides as thumbnails under it. Likes and comments sit right under Save, a slide's notes read as bullets, colours show as a simple palette, and the slide-number tags are gone.", commits: ["4488342","72865a5","33125f3","bd5a41b"] },
      { area: "Dashboard", title: "A balanced header and account menu", detail: "Every control in the dashboard header is one height, with your avatar as tall as the buttons. The account menu is roomier, and theme and grid size are two small switches, so it no longer scrolls.", commits: ["ea268f1","7ea285b","258ebce"] },
      { area: "Library", title: "Betterment and Airtasker join the library", detail: "Betterment joins Finance and Airtasker joins Lifestyle, with 19 more posts from Wealthsimple: 54 new posts in all, each with an editor-approved breakdown, taking the library to 291 posts.", commits: ["0f7f8ed","e5e3cae"], brands: true },
    ],
  },
  {
    date: "2026-10-23",
    headline: "Posts open as a page, and a shorter welcome",
    entries: [
      { area: "Dashboard", title: "Posts open as a page of their own", detail: "Open a post and it fills the window: the post large on the left, its caption, brand and Save in a card on the right, and the creative breakdown as a card of its own below.", commits: ["882999b","56acd69"] },
      { area: "Dashboard", title: "A shorter welcome", detail: "The welcome after sign-up now asks three things: your name and what you do, the industries you work in and the brands you follow. Other lets you say what you do in your own words, and it ends on one clear way into your feed.", commits: ["ea5b9b4"] },
      { area: "Site", title: "A shorter top navigation", detail: "The top navigation is now Vision, Roadmap and AI integration. How it works is still on the homepage.", commits: ["bf7b33c"] },
    ],
  },
  {
    date: "2026-10-22",
    headline: "Copy brief for a new design in the same style",
    entries: [
      { area: "Creative Intelligence", title: "Copy brief asks for something new", detail: "Copy brief now writes a brief for a new design in the post's style rather than a copy of it. Pasted into an AI image tool, it matches the colours, type, layout and photo treatment slide by slide, with fresh words, a made-up logo and different photos. Every slide's image is linked for the tool to fetch, a public figure is always swapped for an unrelated stand-in, and assistants connected through Curatit MCP get the same brief.", commits: ["94f67f8","c90d7fa","68e4db5","fb8c541"] },
    ],
  },
  {
    date: "2026-10-21",
    headline: "Search in your own words",
    entries: [
      { area: "Search", title: "Describe the posts you want", detail: "The dashboard's search now understands plain descriptions such as ‘fintech carousels that launch a feature’ or ‘food posts with product photography’, and looks through captions, on-slide text and breakdowns, not just titles. Above the results it shows the filters it took from your words, and the search panel suggests a few descriptions to try. Brand and category names still filter at once.", commits: ["f83873a","43b38a7","55f9297","d77b31e"] },
      { area: "Search", title: "Typos and dead ends, handled in the open", detail: "A small typo like ‘carosuel’ is corrected and the search says so; put a phrase in quotes to search its exact wording. When nothing matches, buttons offer the same search with one detail taken out, or Search full library from Saved or a category. Nothing is loosened without asking.", commits: ["f83873a","8c879e5","55f9297"] },
      { area: "AI agents", title: "Assistants search the same way", detail: "Assistants connected through Curatit MCP read plain descriptions the same way, and are told which filters, corrections and keywords their search came down to.", commits: ["c82b247","442b6b7"] },
    ],
  },
  {
    date: "2026-10-20",
    headline: "Playbooks, a smoother feed and a new menu",
    entries: [
      { area: "Dashboard", title: "Playbooks by type of post", detail: "Playbooks gather the library by the type of post its breakdowns found, such as Relatable humour, Community prompt or Collaboration. Each card shows three covers from different brands and how many posts it holds, and picking one shows just those posts.", commits: ["ecd243a","967cb2b"] },
      { area: "Dashboard", title: "No one brand fills For you", detail: "For you now mixes brands: the same brand doesn't come back within six places while another can go there, so a fresh import or a brand you follow can't take over the top of your feed.", commits: ["ecd243a"] },
      { area: "Dashboard", title: "A feed that scrolls smoothly", detail: "Scrolling the feed no longer lags. The search bar's glow rests while the page moves and comes back after, and covers far off screen are left alone until you get near them.", commits: ["967cb2b"] },
      { area: "Site", title: "Vision and Roadmap in the menu", detail: "Vision and Roadmap are back in the top navigation, in place of Pricing. The Pricing page is still there.", commits: ["da495b5"] },
    ],
  },
  {
    date: "2026-10-18",
    headline: "Claude and ChatGPT by sign-in, and a breakdown on every post",
    entries: [
      { area: "AI agents", title: "Add Curatit to Claude or ChatGPT without a token", detail: "The AI integration page now starts with Claude and ChatGPT, in four plain steps: copy Curatit's link, add it in the app, sign in to Curatit and allow, then ask. Claude Code, Cursor and VS Code follow, marked for developers, still with a personal token.", commits: ["c032307"] },
      { area: "Creative Intelligence", title: "A breakdown on every post", detail: "Postmates' and GoFundMe's twenty posts got their breakdowns, so all 237 posts in the library had one, each approved by an editor. A stock ‘can't verify’ warning that had been repeated on post after post is gone: data checks now appear only where the post itself gives a reason.", commits: ["e39baf3"] },
      { area: "Accounts", title: "Sign-up protected from abuse", detail: "Sign-in, sign-up and password emails now limit repeated attempts from one visitor, and sign-up turns away common throwaway email addresses.", commits: ["69f36d9"] },
    ],
  },
  {
    date: "2026-10-17",
    headline: "Creative DNA on the homepage, Curatit's own emails and address",
    entries: [
      { area: "Site", title: "Curatit lives at www.curatit.app", detail: "Curatit has its own address, www.curatit.app. The bare curatit.app sends you there, and old curatit.vercel.app links keep working.", commits: ["6e840d7"] },
      { area: "Accounts", title: "A welcome note from the founder", detail: "Once you confirm your address, a short welcome note from Curatit's founder arrives from hello@curatit.app.", commits: ["24d85fd","7c8b085"] },
      { area: "Homepage", title: "Every post, taken apart", detail: "A new section shows what a breakdown gives you, on Wise's eSIM cover: its hook, layout, kicker and product pinned to the slide, the strategy line above it, four colours picked off into a palette, then Copy brief. The labels, strategy and colours are the post's own published breakdown.", commits: ["488e8e1"] },
      { area: "AI agents", title: "Assistants read the full breakdown", detail: "Through Curatit MCP, assistants now get a post's full breakdown: the strategy, key creative decisions, data checks and colour roles. Everyday names work too, so ‘food and drink’, ‘crypto’ or ‘Coca Cola’ find the right category or brand, and each result says which part of its breakdown matched.", commits: ["d89154a","b1fcdb8"] },
      { area: "Library", title: "Postmates and GoFundMe join the library", detail: "Postmates and GoFundMe join with ten posts each, taking the library to 237 posts from 39 brands.", commits: ["69af2d6"], brands: true },
      { area: "Site", title: "A mobile menu that unfolds like paper", detail: "On phones, the menu unfolds row by row like folded paper, with a soft rustle, and folds back up when it closes. With reduced motion it simply opens, silently.", commits: ["7f7893d"] },
    ],
  },
  {
    date: "2026-10-16",
    headline: "Pages that read sooner",
    entries: [
      { area: "Site", title: "Words first, covers after", detail: "Pages now show their headline and text before any decorative covers start downloading, so they can be read sooner on a slow connection. The homepage's sections below the first screen load as you reach them, and each cover fades in once it arrives.", commits: ["c347d29","8f9138f","98527b6"] },
    ],
  },
  {
    date: "2026-10-15",
    headline: "Curatit MCP in beta, five new brands and a clearer homepage",
    entries: [
      { area: "AI agents", title: "Curatit MCP is in beta", detail: "The AI integration is now labelled Beta across the site. Its page shows example searches typed out over the real posts they return, found by the same search an assistant uses rather than picked by hand.", commits: ["95ea72b","72c4f0d"] },
      { area: "AI agents", title: "Search results as a gallery", detail: "In ChatGPT and other apps that can show them, a Curatit search can come back as a gallery of covers with the brand and a line of caption, each opening the post on Instagram.", commits: ["07bafbe","d0a308b"] },
      { area: "Library", title: "Duolingo, Headspace, PUMA, On and Canva join", detail: "Five brands join with ten posts each, and Deliveroo gets five more: 55 new posts. Education, Health & Fitness and Graphics & Design now have tabs of their own on the homepage.", commits: ["7a89203"], brands: true },
      { area: "Homepage", title: "A first screen that says what Curatit is", detail: "The homepage opens on ‘Find ideas for your next social media post.’ above the corridor of covers, then two lines on what Curatit is and Create account. Every sign-up button on the site now reads Create account.", commits: ["b99b3db","0c93189"] },
      { area: "Homepage", title: "Drag to reveal the library", detail: "The scattered-saves section no longer holds the page while you scroll. Drag the divider across one grey stage, or use the arrow keys, to uncover the same brief in Curatit; the two labels above it slide it to either side.", commits: ["4ca604c","8391ade"] },
      { area: "Site", title: "A footer with a moving filmstrip", detail: "The footer is ruled into cells for the logo and links, with the five newest covers drifting past as a filmstrip. It holds still under reduced motion.", commits: ["4ca604c"] },
      { area: "Site", title: "Pricing says what's true", detail: "Pricing now shows the one plan there is: Curatit is free while it's in beta, with everything included, and team plans come later.", commits: ["b99b3db"] },
    ],
  },
  {
    date: "2026-10-13",
    headline: "Twenty-eight categories, published breakdowns and Copy brief",
    entries: [
      { area: "Library", title: "Twenty-eight categories in place of seven", detail: "The library's seven categories became 28, after Mobbin's app categories. Each brand has a main category and can carry more, so a post can sit in several: Shopify is Business and Shopping. Only categories with posts appear, and a post's categories open Discover on them.", commits: ["437b516"] },
      { area: "Creative Intelligence", title: "Breakdowns published across the library", detail: "Editors approved and published a breakdown for every post then in the library, all 162. Open a post to read its strategy, its key creative decisions and its Visual DNA.", commits: ["b430016"] },
      { area: "Creative Intelligence", title: "Copy brief beside the tabs", detail: "The Apply tab is gone. A Copy brief button beside the Breakdown and Visual DNA tabs puts a brief for the post on your clipboard, ready to paste into an AI tool.", commits: ["d28ea98","c032f9e"] },
      { area: "Dashboard", title: "The caption reads on under the title", detail: "A post's full caption now follows straight on from its title, with mentions and hashtags linked, instead of sitting in a section of its own further down.", commits: ["ee7f06c"] },
      { area: "AI agents", title: "A page for connecting AI assistants", detail: "A new AI integration page explains what connecting Curatit to an AI assistant gets you, with setup steps for each app, the read-only tools it can use and what a token can and can't do. The homepage's AI section links to it.", commits: ["9f468fa","ffec153"] },
      { area: "Dashboard", title: "Access tokens, in a ledger", detail: "The access tokens page for AI tools sits under the dashboard header. New token opens a short form in place, the token is shown once to copy, and each one is listed with what it can do, when it expires, when it was last used and Revoke.", commits: ["6a2d844"] },
    ],
  },
  {
    date: "2026-10-12",
    headline: "Sharper breakdowns, brand search, Vision and a roadmap",
    entries: [
      { area: "Search", title: "Search finds brands however you type them", detail: "In the dashboard, punctuation, accents and spaces in brand names no longer matter, so \"hm\", \"coca cola\" and \"ubereats\" find H&M, Coca-Cola and Uber Eats. Typing a brand's exact name shows only its posts, and the search panel lists brands with their logos, narrowing as you type.", commits: ["f863fcb"] },
      { area: "Dashboard", title: "New additions lead the feed", detail: "The feed now puts the posts most recently added to the library first, with brands mixed within each day. In For you, the latest additions count as much as an industry you picked.", commits: ["f863fcb"] },
      { area: "Library", title: "Bolt and Public join the library", detail: "Bolt joins Travel and Public joins Fintech, along with DoorDash's three newest posts: 13 new posts in all.", commits: ["0df6a74"], brands: true },
      { area: "Site", title: "A Vision page in place of About", detail: "Vision replaces About, and old About links land there. It has a note from the founder, a signature drawn stroke by stroke, a moving graph of five real posts with a Pause button, and how many posts and brands the library holds.", commits: ["0df6a74","f863fcb"] },
      { area: "Site", title: "A shorter top navigation", detail: "The top navigation is now How it works, Pricing, Vision and Roadmap. Library and Blog left the menu, but their pages are still there, and the footer links to Vision in place of About.", commits: ["0df6a74"] },
      { area: "Site", title: "A public roadmap and changelog", detail: "This page: what is being built now, what comes next and later, and what has shipped so far, each update linked to the change behind it.", commits: [] },
    ],
  },
  {
    date: "2026-10-11",
    headline: "Creative breakdowns, a welcome flow and Discover",
    entries: [
      { area: "Creative Intelligence", title: "Drafted by AI, approved by editors", detail: "AI drafts each analysis after looking at every slide and copying any on-slide text word for word. Nothing appears on a post until an editor approves it, and the breakdown says who wrote it.", commits: ["75cb0e9","2a54d61"] },
      { area: "Dashboard", title: "Likes and comments, as collected", detail: "Each post shows its likes and comments under its title, as collected, and says Not available when a count is hidden rather than showing zero. The brand-average comparison and category ranking are gone: a few posts per brand is too few to judge fairly.", commits: ["c6ff0be","6e792bd","0c84db3"] },
      { area: "Dashboard", title: "A welcome flow that tunes For you", detail: "After sign-up, a short welcome asks your name, the industries you work in, brands you keep an eye on and three posts that stop your thumb, with the library re-sorting as you pick. For you ranks on your answers, and Personalise your feed opens it again.", commits: ["e9f59a2","75cb0e9"] },
      { area: "Dashboard", title: "Discover by category, Saved as a bookmark", detail: "A Discover tab browses the library by category, each with its own icon. Saved moves to a bookmark button with your saved count, the avatar opens your account menu, and the search bar gets a travelling glow.", commits: ["d72e7e8"] },
      { area: "Boards", title: "A friendlier empty Saved view", detail: "With nothing saved yet, the Saved view shows real posts dropping into a big bookmark pocket and the count badge popping on, with a short line on how saving works.", commits: ["d72e7e8"] },
      { area: "Accounts", title: "Clearer sign-up and password help", detail: "Sign-up and password reset list the password rules and tick them off as you type, with a strength meter from red to green. Problems show in red under their field, including an email that already has an account.", commits: ["fd088b7","0b5e32f"] },
      { area: "Site", title: "A new footer with the newest covers", detail: "The site's pages now end on an inset panel, dark in the light theme and light in the dark one, with the newest covers fanned in.", commits: ["75cb0e9","60bfaf9"] },
      { area: "Site", title: "A 404 page built from posts", detail: "A missing page now shows a 404 made of real library covers that lift towards the cursor and flip to show another post, with links home and to the library.", commits: ["75cb0e9"] },
    ],
  },
  {
    date: "2026-10-10",
    headline: "Real brands, a dashboard, boards and accounts",
    entries: [
      { area: "Library", title: "Real brand posts replace the demo", detail: "The homepage now shows real posts from real brands, with their own images, in place of made-up examples.", commits: ["4887304"] },
      { area: "Library", title: "Thirty brands across seven categories", detail: "Fourteen brands joined, including Shopify, Coca-Cola, McDonald's, Robinhood, Uber and Amazon, taking the library to 149 posts. E-commerce is a new category, Food delivery is now Food & drink, and brand names now show the brand's logo.", commits: ["ea81705","58f81b8"], brands: true },
      { area: "Dashboard", title: "Your signed-in dashboard", detail: "Signed-in members get a feed of the whole library in a grid that fits your screen, a search that suggests recent searches and categories, and settings for theme and tile size.", commits: ["ea81705","155a4e7","f4b9a37"] },
      { area: "Dashboard", title: "Posts open over the feed", detail: "Open a post and it appears over the feed you were browsing, with every slide, the brand, the full caption with mentions and hashtags linked, the boards it's on and Save. Placeholders show while it loads.", commits: ["155a4e7"] },
      { area: "Boards", title: "Boards you can keep and share", detail: "Save posts to named boards that stay with your account. Each board has its own page with notes on the images. Share makes a read-only link, which stops working as soon as you turn sharing off.", commits: ["332ba20","87bcb35","f4b9a37"] },
      { area: "Accounts", title: "Sign up and sign in", detail: "Create an account with your email and a password, and reset a forgotten password by email. The sign-in pages are one simple card over a drifting wall of library covers.", commits: ["8464c47","332ba20","87bcb35"] },
      { area: "Site", title: "Dark mode", detail: "Switch between light and dark from the navigation, or let Curatit follow your system setting. Your choice is remembered, and colours, code blocks and category tabs all adapt.", commits: ["8464c47","ea81705"] },
      { area: "Homepage", title: "How it works and categories, reworked", detail: "The How it works illustrations now show search results with matched tags, a carousel slide by slide and a board as a client sees it, looping until you click. Category tabs swap covers in place, and the 'One library. One search.' scene now draws a small version of the real dashboard.", commits: ["58f81b8","f4b9a37"] },
    ],
  },
  {
    date: "2026-10-09",
    headline: "Curatit begins: a new name and homepage",
    entries: [
      { area: "Site", title: "Curatit gets its name and wordmark", detail: "Curatit got its name, with a wordmark set in Hedvig Letters Serif and a new browser icon.", commits: ["a0c40e8"] },
      { area: "Accounts", title: "Sign-in and sign-up, without distractions", detail: "The sign-in and sign-up pages drop the menu and footer, so the form has the page to itself.", commits: ["a0c40e8"] },
      { area: "Homepage", title: "A homepage made for Curatit", detail: "The homepage opens on cards of images flying towards you, under ‘Find the brand posts worth studying.’, with a FAQ further down. The website directory moved to a page of its own.", commits: ["2c57f60"] },
      { area: "Homepage", title: "From scattered saves to one library", detail: "A section that holds still as you scroll: references saved everywhere fade into a single Curatit library window, and scrolling back reverses it.", commits: ["ed2530a"] },
      { area: "Homepage", title: "Curatit for AI agents, announced", detail: "A coming-soon section announces a Curatit MCP server, so your AI agent can search by brief, pull a post's analysis and open a board. A looping chat shows it, and Get notified leads to sign-up.", commits: ["ed2530a"] },
      { area: "Homepage", title: "A closing call with brand reels", detail: "The page ends on ‘Building for a brand? Start with your next brief.’ between two reels of placeholder brand tiles turning along an arc, which run sideways on phones.", commits: ["ed2530a","fefde04"] },
    ],
  },
];
