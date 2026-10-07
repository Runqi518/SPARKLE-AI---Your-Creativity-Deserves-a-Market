import type { Edge } from "@xyflow/react";
import type { Template, StudioNode } from "./data";

export const adLayers = [
  { key: "objective", name: "Objective" },
  { key: "audienceInsight", name: "Audience Insight" },
  { key: "proposition", name: "Proposition" },
  { key: "concept", name: "Big Idea / Concept" },
  { key: "narrative", name: "Narrative" },
  { key: "artDirection", name: "Art Direction" },
  { key: "execution", name: "Execution & Conversion" },
] as const;
export type AdPlan = Record<(typeof adLayers)[number]["key"], string>;

export const templateIndustries = [
  "Beauty, fragrance & luxury", "Fashion & sneakers", "Food & beverage",
  "Automotive & technology", "Home & lifestyle", "Toys & games",
  "Commerce & apps", "Sport & outdoors", "Culture, music & art", "Purpose & brand",
];

type CampaignTemplate = Template & { industry: string; styles: string[]; adPlan: AdPlan };

// The photos reference real campaigns. The editable plans below are original
// Sparkle exercises, not brand-authored briefs or claims about campaign results.
const campaigns: CampaignTemplate[] = [
  {
    id: "golden-presence", name: "Golden presence", category: "Brand",
    industry: "Beauty, fragrance & luxury", styles: ["Celebrity Glamour", "Editorial", "Extreme Macro"],
    description: "A luminous fragrance portrait. Skin, gold and glass become one visual signature.",
    image: "/template-campaigns/dior-gold.jpg", imagePosition: "center 28%", price: 0,
    imageCredit: { label: "Dior · J’adore x Rihanna", url: "https://www.dior.com/en_id/beauty/discover-jadore-lor.html" },
    adPlan: {
      objective: "Launch a premium fragrance and build recognition of its bottle silhouette. Prioritize remembered brand cues over a list of features.",
      audienceInsight: "For fragrance lovers who use scent as an expression of presence. The desire is to feel unmistakably themselves, rather than to copy a celebrity.",
      proposition: "A scent that makes your presence felt. Replace this creative line with the brand’s approved fragrance proposition; avoid unsupported longevity claims.",
      concept: "Presence, made visible: a thin ribbon of golden light moves from a skin close-up into glass, then resolves into the product silhouette.",
      narrative: "20 seconds: 0–3s, an eye and a flash of gold; 3–8s, portrait and a deliberate gesture; 8–14s, extreme macro of glass and liquid; 14–17s, the bottle appears; 17–20s, brand and a quiet invitation.",
      artDirection: "Champagne gold, warm skin and deep shadow. Editorial portraiture with negative space; one sculptural piece of jewelry, restrained styling and real skin texture. No glitter overlays or ornamental type.",
      execution: "Use a portrait lens and controlled macro lighting. Match the gold reflection across cuts; record a single glass note for the reveal. Close with an approved pack shot, brand name and ‘Discover the fragrance’. Adapt to 9:16 without cropping the face or bottle.",
    },
  },
  {
    id: "pleasure-in-detail", name: "Pleasure in the detail", category: "Product",
    industry: "Food & beverage", styles: ["Food Porn", "Hyperreal", "Macro", "Pop Art"],
    description: "A sensory ice-cream film with chocolate fractures, vivid fruit and considered color.",
    image: "/template-campaigns/magnum-pleasure.jpg", imagePosition: "center", price: 0,
    imageCredit: { label: "Magnum · Pleasure Express", url: "https://www.unilever.com/news/news-search/2024/magnum-leads-in-moodfood-trend-with-innovative-new-range/" },
    adPlan: {
      objective: "Build appetite and introduce one new flavor. Make the distinctive coating and ingredient pairing easy to recall at the shelf.",
      audienceInsight: "For adults seeking a small, intentional indulgence. Texture and anticipation are more persuasive than a loud catalogue of ingredients.",
      proposition: "An indulgent contrast of crisp chocolate and a creamy center. Substitute the actual product’s ingredients and approved descriptions.",
      concept: "The pleasure is in the break: a single chocolate fracture opens a miniature world of fruit, texture and color.",
      narrative: "15 seconds: 0–2s, a pristine coating; 2–5s, slow-motion crack; 5–9s, creamy interior and ingredient macros; 9–12s, one satisfying bite or product turn; 12–15s, packaging, flavor and brand.",
      artDirection: "Hyperreal food styling on a matte blush or pistachio set. Rich chocolate highlights, fresh fruit and crisp shadows. Use one pop-art color contrast, generous negative space and clean packaging.",
      execution: "Light the coating with a broad strip reflection; capture the fracture at high frame rate and layer a close-mic crunch. Keep the edible product consistent between shots. Finish with a legible flavor label and ‘Find your flavor’; no unsupported nutrition or mood claims.",
    },
  },
  {
    id: "room-to-exhale", name: "Room to exhale", category: "Lifestyle",
    industry: "Home & lifestyle", styles: ["Scandinavian", "Warm Lifestyle", "Architectural", "Soft Minimal"],
    description: "A softly architectural home story: one considered change makes the morning feel different.",
    image: "/template-campaigns/ikea-sleep.jpg", imagePosition: "center", price: 0,
    imageCredit: { label: "IKEA · Sleep campaign", url: "https://www.ikea.com/de/de/newsroom/corporate-news/ikea-startet-grosse-schlafoffensive-mit-marketingkampagne-pub1415c410/" },
    adPlan: {
      objective: "Make a home product desirable through a believable daily ritual. Connect the product to a tangible change in the room rather than generic wellbeing promises.",
      audienceInsight: "For people whose home must support busy days. A quiet, organized corner feels like control regained, even without a large renovation.",
      proposition: "A considered room can make space for a better everyday ritual. Specify the real product benefit: storage, adjustable light or comfortable materials.",
      concept: "The room takes a breath: one simple product interaction changes the composition from crowded to calm.",
      narrative: "20 seconds: 0–4s, a close, busy morning; 4–8s, the person uses the hero product; 8–13s, light, linen and space unfold; 13–17s, a relaxed wide composition; 17–20s, product name and invitation.",
      artDirection: "Scandinavian proportions, warm whites, pale wood and one muted terracotta accent. Soft directional daylight, tactile linen and architectural framing. Keep the room lived-in rather than showroom perfect.",
      execution: "Match the before and after camera position. Favor restrained camera movement and real room tone over decorative transitions. Show the product interaction clearly; end with the actual product and ‘Make room for your everyday’. Keep dimensions and functional claims accurate.",
    },
  },
  {
    id: "small-world-big-play", name: "Small world, big play", category: "Brand",
    industry: "Toys & games", styles: ["Playful", "Stop-motion", "3D Character", "Cartoon"],
    description: "A playful miniature world built from a child’s idea, with tactile stop-motion possibilities.",
    image: "/template-campaigns/lego-play.png", imagePosition: "center", price: 0,
    imageCredit: { label: "LEGO · Play Is Your Superpower", url: "https://www.lego.com/en-us/aboutus/news/2024/september/play-is-your-superpower-campaign" },
    adPlan: {
      objective: "Inspire imaginative play and communicate what can be built with the toy. Emphasize creative possibility rather than pressure to collect or purchase.",
      audienceInsight: "Children see potential worlds in ordinary objects; parents want play that invites participation. An unfinished idea can be more inviting than a flawless adult-built model.",
      proposition: "A small idea can become a whole world. Show the real play function and age-appropriate pieces.",
      concept: "A doodle escapes the page: a child’s sketch becomes a tactile miniature character that transforms the room one object at a time.",
      narrative: "20 seconds: 0–3s, the sketch twitches; 3–8s, hands build the first character; 8–14s, stop-motion exploration; 14–17s, child and parent add a new piece; 17–20s, the play world and brand.",
      artDirection: "A carefully limited primary palette, rounded cartoon shapes and real material texture. Use stop-motion or a clearly stylized 3D character; preserve the handmade quality. Bright, designed sets without clutter.",
      execution: "Plan animation on twos with locked camera and consistent light. Record clicks, taps and playful movement accents. Keep product proportions and assembly truthful. Close with ‘What will you build?’ and an age-appropriate product cue; obtain permissions for any child performers.",
    },
  },
  {
    id: "one-small-reset", name: "One small reset", category: "Product",
    industry: "Commerce & apps", styles: ["Product Demo", "Problem → Solution", "UGC", "Direct Response"],
    description: "A calm creator-led app demonstration: one real problem, one useful interaction, one clear next step.",
    image: "/template-campaigns/headspace-app.png", imagePosition: "center", price: 0,
    imageCredit: { label: "Headspace · App promotional visual", url: "https://www.headspace.com/" },
    adPlan: {
      objective: "Drive qualified app exploration or trial starts. Demonstrate one useful feature and ensure the CTA and landing screen describe the same offer.",
      audienceInsight: "For busy viewers who feel that a new habit requires too much effort. They need to see a small, manageable action before hearing a large promise.",
      proposition: "Start with one manageable moment. Define the specific in-app action and avoid medical or guaranteed outcome claims.",
      concept: "One tap, one small reset: a real creator interrupts an everyday moment with a short, useful app interaction.",
      narrative: "15 seconds: 0–3s, creator names a familiar friction; 3–7s, actual app screen and one tap; 7–11s, the activity in context; 11–13s, a natural reaction; 13–15s, the exact next step and offer terms.",
      artDirection: "Warm natural daylight, uncluttered framing and a carefully designed screen inset. Pair candid creator delivery with restrained brand illustration. Legible subtitles, real UI and no frantic stickers or fake notifications.",
      execution: "Record genuine on-device actions, pace edits around each tap and keep the UI readable in 9:16. Test two spoken hooks while holding the demo constant. End with ‘Explore the app’ or the verified trial offer; show trial duration, price and renewal terms where applicable.",
    },
  },
  {
    id: "another-way-up", name: "Another way up", category: "Lifestyle",
    industry: "Sport & outdoors", styles: ["Documentary", "POV", "Epic Landscape", "Slow Motion"],
    description: "An athlete’s fresh perspective, told through real rock, measured effort and an expansive landscape.",
    image: "/template-campaigns/arcteryx-climb.png", imagePosition: "center", price: 0,
    imageCredit: { label: "Arc’teryx · Summer of Climb", url: "https://blog.arcteryx.com/news/climbing-is-a-fresh-perspective-introducing-summer-of-climb-by-arcteryx/" },
    adPlan: {
      objective: "Build credibility for an outdoor collection by showing a real use context. Let product details support the athlete’s experience rather than interrupt it.",
      audienceInsight: "For outdoor participants who value attention, skill and connection to place. Progress is often a new perspective, not a louder declaration of victory.",
      proposition: "Made to move with your next perspective. Use only verified material, fit and performance benefits for the featured product.",
      concept: "The next hold changes the view: an intimate moment of effort opens into a landscape the viewer could not see before.",
      narrative: "25 seconds: 0–4s, fingertips and breath; 4–10s, an honest attempt; 10–16s, a POV route decision and movement; 16–21s, landscape reveal; 21–25s, athlete, product detail and brand.",
      artDirection: "Documentary texture, mineral colors and natural light. Contrast an overhead rock detail with an epic wide; preserve weather and real exertion. Avoid synthetic mountain composites and exaggerated danger.",
      execution: "Combine stabilized POV, a long-lens observational shot and a permitted landscape wide. Slow one key movement, keeping the rest at natural speed. Use breath and contact sound; close with ‘Explore the collection’. Plan the shoot with qualified athletes and appropriate safety support.",
    },
  },
  {
    id: "the-sound-of-belonging", name: "The sound of belonging", category: "Brand",
    industry: "Culture, music & art", styles: ["Collage", "Mixed Media", "Analog", "Experimental Film"],
    description: "An analog fan collage: personal rituals become a richly layered portrait of music culture.",
    image: "/template-campaigns/spotify-fanlife.png", imagePosition: "center", price: 0,
    imageCredit: { label: "Spotify · Fan Life", url: "https://newsroom.spotify.com/2025-04-14/celebrating-the-vibrant-traditions-that-make-global-fandoms-unique-with-new-campaign/" },
    adPlan: {
      objective: "Build affinity with a music or cultural brand through recognizably personal fan rituals. Create a visual identity that extends naturally into posters and short films.",
      audienceInsight: "Fans do not only consume music: they collect, dress, gather and create around it. Belonging is made from small shared signals.",
      proposition: "Your music lives beyond the headphones. Replace with the cultural brand’s approved positioning and a specific participation route.",
      concept: "A living fan wall: one photo expands into a collage of tickets, handwritten notes, fabric, movement and faces, each revealing a different ritual.",
      narrative: "20 seconds: 0–3s, a handwritten lyric-shaped note without quoted lyrics; 3–8s, three fan rituals; 8–14s, rhythmic collage accumulation; 14–17s, people connect; 17–20s, one unifying brand cue.",
      artDirection: "Analog photography, torn paper and purposeful mixed media. Rich but controlled color, visible grain and expressive typography with a strict hierarchy. Use a consistent grid underneath the apparent spontaneity.",
      execution: "Shoot fan portraits with permission; animate original collage elements to a licensed track. Alternate tactile stop-frame details and live action. Keep the music and artwork rights documented. End with an invitation such as ‘Find your people’ and the actual playlist or event destination.",
    },
  },
  {
    id: "seen-as-you-are", name: "Seen as you are", category: "Brand",
    industry: "Purpose & brand", styles: ["Narrative Film", "Emotional Storytelling", "Documentary", "Conceptual"],
    description: "A human brand portrait built on an intimate shared moment rather than a manufactured transformation.",
    image: "/template-campaigns/dove-real.jpg", imagePosition: "center", price: 0,
    imageCredit: { label: "Dove · Real Beauty", url: "https://www.dove.com/us/en/campaigns/purpose/keep-beauty-real.html" },
    adPlan: {
      objective: "Build trust around a brand purpose through a credible human story. Define the real action or commitment the end card will direct viewers to.",
      audienceInsight: "For people navigating pressure about appearance and identity. Being recognized by someone close can matter more than external approval.",
      proposition: "Being seen as you are matters. Ground the brand connection in an existing, verifiable commitment rather than an invented social-impact claim.",
      concept: "A look that says enough: two people share an ordinary moment, and a small gesture makes acceptance visible without a explanatory speech.",
      narrative: "30 seconds: 0–5s, a quiet moment of hesitation; 5–12s, everyday context; 12–20s, a conversation or reassuring gesture; 20–25s, an unforced shared smile; 25–30s, purpose statement and a concrete next step.",
      artDirection: "Documentary intimacy, soft window light, natural skin texture and warm neutrals. Eye-level framing and room for pauses. Avoid before/after comparisons, beauty filters and sentimental stock imagery.",
      execution: "Work with contributors whose stories are represented accurately and with consent. Record natural dialogue and leave silence around the key gesture. Connect the end card to the real initiative or resource; captions and an accessible transcript should preserve the meaning without sound.",
    },
  },
  {
    id: "quiet-form", name: "The quiet product film", category: "Product",
    industry: "Automotive & technology", styles: ["Futurism", "Industrial", "CGI", "Soft Minimal"],
    description: "A precision-led hardware reveal: material, interaction and one useful capability.",
    image: "/template-campaigns/apple-iphone-pro.jpg", imagePosition: "center 38%", price: 0,
    imageCredit: { label: "Apple · iPhone 16 Pro", url: "https://www.apple.com/newsroom/2024/09/apple-debuts-iphone-16-pro-and-iphone-16-pro-max/" },
    adPlan: {
      objective: "Introduce a hardware product and establish one capability worth exploring. Balance a distinctive material reveal with a clear demonstration.",
      audienceInsight: "For design-conscious buyers who appreciate precision but need to understand what the engineering lets them do.",
      proposition: "Precision you can put to work. Replace with one verified feature and show its practical effect.",
      concept: "From surface to possibility: a macro journey through the material resolves into a real user interaction.",
      narrative: "15 seconds: 0–3s, a material edge in darkness; 3–6s, complete silhouette; 6–11s, one useful interaction; 11–15s, product hero, feature line and brand.",
      artDirection: "Industrial precision, graphite and warm metal with a single controlled highlight. Use CGI only to extend real geometry; match the physical product exactly. Crisp typography and generous black or white space.",
      execution: "Use a macro slider and a locked screen-demo setup. Match reflections across the reveal and isolate the interaction sound. Keep UI, dimensions and capability claims accurate. Close with ‘Explore the product’ and create a sound-off cut with one legible feature caption.",
    },
  },
  {
    id: "sculpted-light", name: "Sculpted in light", category: "Brand",
    industry: "Automotive & technology", styles: ["Cinematic", "Dark Luxury", "Industrial"],
    description: "A cinematic automotive portrait, sculpted through shadow, architecture and purposeful movement.",
    image: "/template-campaigns/porsche-timeless-machine.jpg", imagePosition: "center", price: 24,
    imageCredit: { label: "Porsche · Timeless Machine", url: "https://newsroom.porsche.com/en/scene-passion/porsche-911-new-eigth-generation-992-timeless-machine-art-irene-kung-anton-corbijn-16594.html" },
    adPlan: {
      objective: "Build desire for an automotive design and its recognizable silhouette. Make one brand cue memorable before presenting detailed specifications elsewhere.",
      audienceInsight: "For buyers who see a vehicle as both an engineered object and a design statement. Controlled confidence is more appealing than spectacle for its own sake.",
      proposition: "A form that holds its presence in motion. Add the real model’s approved positioning and verified product detail.",
      concept: "Light draws the car: an architectural line of light reveals the same distinctive contour while the surroundings change.",
      narrative: "20 seconds: 0–4s, one lit contour; 4–9s, detail and interior gesture; 9–15s, a restrained moving profile; 15–18s, complete hero silhouette; 18–20s, model and brand.",
      artDirection: "Dark luxury, stone, graphite and precise highlights. Cinematic contrast with detail retained in the shadows. Architectural framing and realistic surface reflections; avoid neon tunnels and excessive lens flares.",
      execution: "Plan controlled studio lighting and professionally managed driving shots. Match screen direction and the light line across cuts. Build sound from real mechanical textures. Finish with a readable model name and ‘Discover the model’; show verified specifications only when relevant.",
    },
  },
  {
    id: "daily-ritual", name: "An everyday ritual", category: "Lifestyle",
    industry: "Beauty, fragrance & luxury", styles: ["Soft Minimal", "Macro", "Editorial"],
    description: "A fragrance ritual told through amber glass, natural materials and an unhurried gesture.",
    image: "/template-campaigns/aesop-eidesis.webp", imagePosition: "center 52%", price: 18,
    imageCredit: { label: "Aesop · Evoking Eidesis", url: "https://www.aesop.com/evoking-eidesis-fable.html" },
    adPlan: {
      objective: "Introduce a fragrance through a sensory ritual and recognizable packaging. Invite discovery rather than attempting to explain every note in one film.",
      audienceInsight: "For people who treat personal care as a considered pause. Tactile objects and quiet surroundings signal intention.",
      proposition: "A small ritual with a distinctive sensory character. Use the actual fragrance notes and approved description.",
      concept: "The trace of a ritual: glass, a hand and a reflection create a sequence of quiet sensory echoes.",
      narrative: "15 seconds: 0–3s, amber glass macro; 3–7s, hand lifts and uses the bottle; 7–11s, a natural-material detail; 11–15s, bottle, fragrance name and brand.",
      artDirection: "Amber, warm stone, soft mineral neutrals and natural shadow. Editorial still-life compositions, honest material texture and restrained serif or brand typography.",
      execution: "Shoot practical reflections and a consistent hand gesture. Use subtle room tone with one spray sound. Keep bottle labels legible and avoid invented efficacy claims. Close with ‘Discover the scent’; produce a shorter still-life loop for the product page.",
    },
  },
  {
    id: "new-perspective", name: "A new perspective", category: "Product",
    industry: "Fashion & sneakers", styles: ["Street Culture", "Dynamic Photography", "High-energy", "Photomontage", "Y2K"],
    description: "A sneaker story with graphic street framing, athletic rhythm and tactile product details.",
    image: "/template-campaigns/nike-winning.jpg", imagePosition: "center", price: 0,
    imageCredit: { label: "Nike · Winning Isn’t for Everyone", url: "https://about.nike.com/en/newsroom/releases/winning-isnt-for-everyone-campaign" },
    adPlan: {
      objective: "Launch a hero sneaker with a recognizable silhouette and a clear role in the wearer’s day. Build a visual system that can extend to short social edits.",
      audienceInsight: "For streetwear-minded athletes whose style moves between practice and the city. The shoe is part of an individual rhythm, not just an isolated pack shot.",
      proposition: "Your rhythm, in motion. Replace with the actual shoe’s approved positioning; distinguish styling from any verified performance benefits.",
      concept: "A step becomes a beat: foot strikes, street textures and product details form an original visual rhythm.",
      narrative: "15 seconds: 0–2s, foot strike and graphic freeze; 2–6s, city movement; 6–10s, lace, sole and silhouette details; 10–12s, one complete movement; 12–15s, sneaker hero and brand.",
      artDirection: "Street culture with disciplined Y2K flash photography and purposeful photomontage. Concrete neutrals, one brand accent and hard daylight. Preserve the shoe’s real shape; use a consistent graphic grid rather than random effects.",
      execution: "Mix low-angle tracking, direct-flash stills and a clean macro setup. Edit to recorded footfalls and a licensed beat. Keep two hook variants while holding the hero product sequence constant. Close with ‘Find your pair’ and a readable product name, with subtitles inside platform-safe margins.",
    },
  },
];

export function buildCampaignWorkflow(template: CampaignTemplate): CampaignTemplate {
  const positions = [
    { x: 40, y: 40 }, { x: 40, y: 660 }, { x: 490, y: 40 },
    { x: 490, y: 660 }, { x: 940, y: 40 }, { x: 940, y: 660 }, { x: 1390, y: 40 },
  ];
  const nodes: StudioNode[] = adLayers.map((layer, index) => ({
    id: layer.key, type: "asset", position: positions[index],
    data: { kind: "text", label: `${String(index + 1).padStart(2, "0")} · ${layer.name}`,
      content: template.adPlan[layer.key], caption: "Editable creative plan", track: "Captions", duration: 5 },
  }));
  nodes.push({
    id: "campaign-reference", type: "asset", position: { x: 940, y: 1280 },
    data: { kind: "image", label: "Campaign visual reference", url: template.image,
      caption: `${template.imageCredit?.label} · Visual reference`, track: "Video", duration: 5,
      sourceUrl: template.imageCredit?.url },
  }, {
    id: "film-draft", type: "asset", position: { x: 1390, y: 660 },
    data: { kind: "video", label: "Opening scene · Video draft", caption: "First 5 seconds · Generate your own version",
      prompt: `Generate only the opening 5 seconds of an original ad using my own product and brand, following the opening described in Narrative. The full ad plan below is context for the remaining shots. The campaign image is a visual reference, not footage to reproduce.\n\n${adLayers.map(layer => `${layer.name}: ${template.adPlan[layer.key]}`).join("\n\n")}`,
      track: "Video", start: 0, duration: 5,
      generationOptions: { aspectRatio: "9:16", resolution: "1080p", duration: 5, count: 1 } },
  });
  const pairs = [
    ["objective", "proposition"], ["audienceInsight", "proposition"],
    ["proposition", "concept"], ["concept", "narrative"], ["concept", "artDirection"],
    ["campaign-reference", "artDirection"], ["narrative", "execution"],
    ["artDirection", "execution"], ["execution", "film-draft"],
  ];
  const edges: Edge[] = pairs.map(([source, target]) => ({ id: `${source}-${target}`, source, target, sourceHandle: "output", targetHandle: "input" }));
  return { ...template, nodes, edges };
}

export const templates: Template[] = campaigns.map(buildCampaignWorkflow);
