import { skills, type StudioSkillId } from "./capabilities";

export type SkillInstructions = {
  purpose: string;
  whenToUse: string;
  inputs: string[];
  steps: string[];
  output: string[];
  checks: string[];
};

// Executable text workflows: supplied to the text model only when the user selects a skill.
export const skillInstructions: Record<StudioSkillId, SkillInstructions> = {
  "audience-hook-strategy": {
    "purpose": "Turn audience needs, genuine product value and advertising objectives into testable angles and opening hooks.",
    "whenToUse": "Developing a new ad, improving weak openings or tailoring angles to different audiences.",
    "inputs": [
      "Product or service and confirmed selling points",
      "Audience, use cases, pain points and concerns",
      "Advertising objective, platform and duration",
      "Brand voice, available evidence and prohibited claims"
    ],
    "steps": [
      "Extract audience jobs, pain points, desired outcomes and purchase objections; label facts and assumptions separately.",
      "Map each feature to an audience benefit, prioritizing benefits supported by supplied evidence.",
      "Choose three distinct angles, such as problem-solving, demonstration and counterintuitive discovery; do not merely replace adjectives.",
      "Write two hooks per angle for the first 1\u20133 seconds, including the first-frame visual and on-screen copy.",
      "Explain the audience, motivation and follow-through required for each hook; align the opening promise with the body.",
      "Recommend two hooks to test first and state test hypotheses; ask the minimum necessary questions when key information is missing."
    ],
    "output": [
      "Audience insights: facts, assumptions and items to confirm",
      "Three angles with target audience and core benefit",
      "Six openings: spoken copy, first frame, on-screen text and continuation",
      "Two priority tests and hypotheses"
    ],
    "checks": [
      "The body and actual product information fulfill each hook",
      "No invented insights, research data or outcome guarantees",
      "Options differ meaningfully in motivation or execution"
    ]
  },
  "ugc-ad-writer": {
    "purpose": "Write natural creator-friendly user-sharing ad scripts with clear product value and action.",
    "whenToUse": "Creator-to-camera ads, everyday experiences, product reviews or user-sharing formats.",
    "inputs": [
      "Product, audience and verified benefits",
      "Creator identity, expression style and actual experience",
      "Duration, platform and desired action",
      "Demonstrable features, brand requirements and disclosures"
    ],
    "steps": [
      "Identify supported experiences; never fabricate first-person use, purchases or outcomes as genuine testimonials.",
      "Choose a natural everyday scenario and structure the script as opening, problem or need, demonstration or experience, benefits and CTA.",
      "Divide the target duration into segments with conversational short sentences; reduce jargon and stacked claims.",
      "Add selfie or B-roll visuals, product actions, on-screen text and required sponsorship-disclosure placeholders.",
      "Provide two stylistically distinct openings and one alternative ending while preserving product facts.",
      "Without actual experience, use demonstration language or mark experience statements as placeholders requiring creator confirmation."
    ],
    "output": [
      "Timed script: time, spoken copy, shooting actions and screen text",
      "B-roll list",
      "Two openings and one alternate ending",
      "Experience facts, disclosures and confirmation placeholders"
    ],
    "checks": [
      "Plausible duration and natural read-aloud rhythm",
      "No impersonated consumers or invented experiences",
      "Natural expression clearly communicates product value and CTA"
    ]
  },
  "product-demo-planner": {
    "purpose": "Translate abstract product features into demonstrations that can be filmed, understood and verified.",
    "whenToUse": "Explaining complex features, tutorials, benefit evidence or in-ad demonstrations.",
    "inputs": [
      "Features, instructions and limitations",
      "Audience and priority benefits",
      "Shooting conditions, props, setting and duration",
      "Verifiable test conditions and product information"
    ],
    "steps": [
      "Map features to user benefits and visible evidence, prioritizing one to three key features.",
      "Design a starting state, use action and visible outcome for each feature; specify props, camera angle and timing.",
      "Arrange steps in natural use order so viewers understand the relationship between actions and outcomes.",
      "For before/after or competitor comparisons, specify identical test conditions; without verifiable evidence, use a single-product demonstration.",
      "Write screen explanations and brief narration; do not replace evidence with invisible abstract adjectives.",
      "Identify benefits that cannot be shown directly, product limitations, verification tasks and alternate demonstration methods."
    ],
    "output": [
      "Feature\u2013benefit\u2013visible evidence mapping",
      "Demonstration table: action, angle, props, visual outcome and duration",
      "Narration and screen explanations",
      "Test conditions, limitations and missing assets"
    ],
    "checks": [
      "Executable under available shooting conditions",
      "Outcomes relate directly to features",
      "No fabricated before/after outcomes or unfair comparisons"
    ]
  },
  "shot-list-builder": {
    "purpose": "Break an advertising script into a shot-by-shot list for shooting or generation.",
    "whenToUse": "Turning an idea or script into storyboards, shooting plans, prompts or an editing handoff.",
    "inputs": [
      "Script, core benefits and CTA",
      "Total duration, aspect ratio and placement",
      "Characters, product, setting and references",
      "Available assets, shooting conditions and generation limits"
    ],
    "steps": [
      "Confirm duration and narrative structure; establish a continuous, non-overlapping timeline.",
      "Specify narrative purpose, shot size, camera position, subject action, movement and environment for each shot.",
      "Align speech, captions, music and effects; mark transitions and continuity requirements.",
      "Distinguish live action, existing assets and assets to generate; write prompts covering subject, action, environment, camera and style.",
      "Verify that shot durations sum to the target duration, captions allow reading time and the final CTA is complete.",
      "List shot dependencies, missing assets and complex actions that cannot fit within a single shot."
    ],
    "output": [
      "Shot table: ID, start/end, purpose, visuals, shot size, movement, action, audio, captions and transition",
      "Prompts or shooting instructions by shot ID",
      "Asset dependencies and continuity notes",
      "Total-duration check"
    ],
    "checks": [
      "No timeline gaps or double-counted time",
      "Each shot is understandable and executable independently",
      "Deliver instructions without claiming video generation or canvas changes"
    ]
  },
  "visual-consistency-check": {
    "purpose": "Check cross-shot visual continuity using supplied descriptions, annotations or observed material.",
    "whenToUse": "Multi-shot ads, recurring characters or products, and style drift across generated assets.",
    "inputs": [
      "Shot descriptions, annotations or readable visual material",
      "Baseline character, product and scene definitions",
      "Palette, lighting, materials, proportions and brand specifications",
      "Shot IDs and narrative order"
    ],
    "steps": [
      "Establish a baseline for identity and wardrobe, product appearance and logo, scene structure, lighting, palette and materials.",
      "Compare each shot against supplied information; record definite conflicts, possible conflicts and uncheckable items.",
      "Rank issues by high, medium and low priority, pointing to specific shots or text.",
      "Provide the smallest correction for each issue and the prompts or attributes to standardize.",
      "Summarize reusable fixed descriptions while retaining deliberate scene and narrative changes.",
      "If linked images or videos cannot be read, explain the scope and request annotated screenshots or shot descriptions."
    ],
    "output": [
      "Consistency baseline",
      "Issue table: shot, evidence, conflict, priority and correction",
      "Fixed cross-shot descriptions or prompts",
      "Uncheckable items and missing information"
    ],
    "checks": [
      "Every judgment is grounded in supplied information",
      "No claims of viewing inaccessible images or frames",
      "Intentional narrative changes are not treated as continuity errors"
    ]
  },
  "platform-format-adapter": {
    "purpose": "Adapt an ad into visual, pacing and copy versions for different placements.",
    "whenToUse": "Reusing content across TikTok, Instagram Reels, YouTube Shorts or other placements.",
    "inputs": [
      "Source script, shot list and aspect ratio",
      "Target platform and specific placement",
      "Duration, CTA, brand and audience",
      "Current platform specifications and safe-area templates supplied by the user, if available"
    ],
    "steps": [
      "Confirm platform and placement; distinguish general creative advice from requirements needing current verification.",
      "Adjust opening speed, segment order and ending to suit the viewing context.",
      "Recommend reframing and subject placement; identify regions text and CTA should avoid.",
      "Adjust caption length, information density, reading time, speech and muted-viewing comprehension.",
      "Deliver a separate script or change table for each placement; mark shots needing reshoots, additional images or recutting.",
      "Without current specifications, mark dimensions, duration limits and safe areas for verification; do not invent current policies."
    ],
    "output": [
      "Version comparison by platform or placement",
      "Adapted opening, body and CTA",
      "Aspect-ratio, caption, composition and edit changes",
      "Publishing specifications to verify"
    ],
    "checks": [
      "All versions retain product facts",
      "General advice and mandatory requirements are clearly distinguished",
      "No guarantees of approval, traffic or conversion"
    ]
  },
  "cta-offer-writer": {
    "purpose": "Express the advertising objective and actual offer as a concise, specific CTA with complete conditions.",
    "whenToUse": "Ad endings, promotional cards, button copy or offer wording.",
    "inputs": [
      "Objective and next user action",
      "Actual price, offer, validity and scope",
      "Stock, eligibility, redemption and restrictions",
      "Brand voice, landing-page content and length constraints"
    ],
    "steps": [
      "Choose one primary action\u2014learn more, buy, book, try or redeem\u2014and align it with the landing page.",
      "Collect confirmed offer facts and identify missing validity, eligibility, costs or restrictions.",
      "Generate five CTAs with different tones or motivations, each with short button copy and full ending copy.",
      "Explain each version's motivation, required offer details and suitable placement.",
      "Place important restrictions near the offer; use explicit placeholders rather than inventing dates, discounts or quantities.",
      "Select two priority versions and propose tests aligned with the objective."
    ],
    "output": [
      "Offer facts and missing details",
      "Five CTAs: button text, ending copy, motivation and conditions",
      "Required offer details",
      "Two priority versions"
    ],
    "checks": [
      "No invented discounts, countdowns, stock or scarcity",
      "Consistent prices and conditions",
      "CTA aligns with the objective and landing-page action"
    ]
  },
  "brand-voice-adapter": {
    "purpose": "Rewrite copy in a consistent brand voice while preserving facts and communication intent.",
    "whenToUse": "Aligning creators or variants, or adapting existing copy to a brand style.",
    "inputs": [
      "Source copy and purpose",
      "Brand brief, voice keywords and examples",
      "Preferred and prohibited words and immutable facts",
      "Audience, platform and length limits"
    ],
    "steps": [
      "Derive tone, sentence rhythm, vocabulary preferences and boundaries from brand materials.",
      "Identify off-brand sentences while preserving product facts, offer conditions and CTA.",
      "Create a primary version and an alternative with different intensity; avoid mechanical adjective swaps.",
      "Explain major changes and how they relate to brand examples.",
      "Provide reusable vocabulary guidance and short voice rules.",
      "Without a brand brief, propose a clearly labeled temporary direction and request confirmation."
    ],
    "output": [
      "Brand voice rules",
      "Primary and alternate copy",
      "Original\u2013rewrite\u2013rationale comparison",
      "Preferred and avoided words and directions to confirm"
    ],
    "checks": [
      "Facts, offer conditions and disclosures are preserved",
      "Rewrites fit supplied examples",
      "Unprovided preferences are not presented as established rules"
    ]
  },
  "compliance-claims-review": {
    "purpose": "Screen advertising claims for missing support, misleading wording or further review needs.",
    "whenToUse": "Pre-publication review of benefits, comparisons, prices, testimonials, offers and sensitive claims.",
    "inputs": [
      "Script, captions, offers and landing-page materials",
      "Target market, industry and platform",
      "Evidence, test reports, permissions and genuine testimonials",
      "Applicable rules and brand restrictions supplied by the user"
    ],
    "steps": [
      "Extract verifiable claims, including absolutes, numbers, benefits, guarantees, comparisons and testimonials.",
      "Link each claim to evidence and distinguish supported, insufficiently supported and missing information.",
      "Check eligibility, validity, fees and restrictions; identify testimonial authenticity and permission questions.",
      "Prioritize risks with original text, concern, evidence needed and conservative rewrites.",
      "Ask necessary questions when market, industry or platform requirements are unclear; do not invent applicable laws or policies.",
      "List items for business-owner or specialist confirmation and identify the work as information screening."
    ],
    "output": [
      "Claims table: source wording, evidence, concern, priority and rewrite",
      "Missing evidence and offer details",
      "Conservative revised copy",
      "Questions for further review"
    ],
    "checks": [
      "No unsupported legal or platform-compliance guarantees",
      "No fabricated studies, certifications, testimonials or regulatory citations",
      "Conservative copy still accurately reflects products and offers"
    ]
  },
  "accessibility-pass": {
    "purpose": "Improve advertising readability and comprehension across viewing conditions, especially captions and muted viewing.",
    "whenToUse": "Dense captions, fast information changes, unclear colors or excessive reliance on sound.",
    "inputs": [
      "Script, captions and shot durations",
      "Text size, colors, backgrounds and layout",
      "Target devices, aspect ratio and viewing context",
      "Music, narration, effects, flashing and rapid movement descriptions"
    ],
    "steps": [
      "Check caption length, line count, line breaks and display time; flag high reading load.",
      "Assess legibility using supplied colors and backgrounds; do not invent contrast values without precise colors.",
      "Identify information conveyed only through speech, sound or color and recommend text or visual alternatives.",
      "Review rapid cuts, flashing and complex backgrounds; suggest simplification or longer display.",
      "Rewrite captions needing improvement and list layout, background-layer and pacing changes.",
      "Identify visual effects or standards compliance that cannot be verified from descriptions alone."
    ],
    "output": [
      "Issues: time segment, readability or comprehension problem, priority and recommendation",
      "Improved captions",
      "Muted-viewing and layout changes",
      "Items requiring actual visuals or precise measurements"
    ],
    "checks": [
      "Caption facts match speech",
      "Important information has a visible expression",
      "No claims of actual accessibility measurement or certification"
    ]
  },
  "creative-variant-generator": {
    "purpose": "Generate meaningfully different, comparable and testable advertising routes from the same brief.",
    "whenToUse": "Multiple creative directions, testing matrices or insufficient variation between existing ads.",
    "inputs": [
      "Product, audience, objective and confirmed benefits",
      "Brand boundaries, fixed offer and CTA",
      "Existing ideas and directions to avoid repeating",
      "Platform, duration, budget and assets"
    ],
    "steps": [
      "Collect facts, offer conditions and constraints shared across versions.",
      "Design three to five routes differing in audience motivation, narrative or visual execution.",
      "Write each route's angle, opening, story outline, key visuals and CTA.",
      "Specify assets, production complexity, audience and creative hypothesis.",
      "Compare differences and remove variants that only change wording or colors while repeating the same idea.",
      "Recommend two initial versions; add single-variable A/B pairs when isolating one factor."
    ],
    "output": [
      "Fixed facts and constraints",
      "Three to five concepts: angle, opening, outline, visuals and CTA",
      "Differences and production requirements",
      "Priority concepts and single-variable A/B pairs"
    ],
    "checks": [
      "Each version has an explainable difference",
      "Facts and offers remain consistent",
      "Expected effects are hypotheses rather than guarantees"
    ]
  },
  "ad-performance-review": {
    "purpose": "Diagnose creative performance from actual user-supplied campaign data and propose actionable tests.",
    "whenToUse": "Analyzing opening retention, clicks, conversion or creative fatigue from campaign data.",
    "inputs": [
      "Spend, impressions, views, clicks, conversions and revenue by creative or ad group",
      "Time range, attribution window, currency and metric definitions",
      "Audience, placement, budget, offer and landing-page differences",
      "Scripts, variants, baselines or historical data"
    ],
    "steps": [
      "Check completeness, time ranges, currency, attribution and definitions; mark missing or incomparable data.",
      "With nonzero denominators and clear inputs, calculate CTR=clicks/impressions, CPC=spend/clicks, CPA=spend/conversions and ROAS=attributed revenue/spend; state the conversion-rate denominator.",
      "Separate possible viewing, clicking and conversion-funnel issues; use scripts to identify creative explanations to test.",
      "Check simultaneous changes in audience, placement, offers and landing pages; distinguish observations from causal explanations.",
      "Propose up to three priority tests, defining hypothesis, creative changes, fixed factors, primary metric and evidence needed.",
      "Without data, provide a collection template and analysis plan; with insufficient samples, state that conclusions are unavailable and do not invent benchmarks or significance."
    ],
    "output": [
      "Data quality and comparability",
      "Computable metrics, formulas and missing inputs",
      "Observation\u2013possible cause\u2013evidence\u2013uncertainty",
      "Priority tests and additional data needed"
    ],
    "checks": [
      "No division by zero or mixed currencies or incompatible definitions",
      "No fabricated campaign data, benchmarks or significance",
      "No treating correlation as causation or guaranteeing revenue improvements"
    ]
  },
  "reference-breakdown": {
    "purpose": "Extract reusable pacing, shot structure and expression from supplied reference descriptions.",
    "whenToUse": "Adapting a reference advertisement's structure into an original plan.",
    "inputs": [
      "Reference script, shot descriptions or readable material",
      "Own product, objective and duration"
    ],
    "steps": [
      "Identify opening, setup, benefits, evidence and CTA.",
      "Map shot order, duration, transitions and text/audio coordination.",
      "Distinguish reusable structures from brand-specific elements to replace.",
      "Propose an adaptation for the user's product; request shot descriptions when reference content is inaccessible."
    ],
    "output": [
      "Reference structure",
      "Reusable elements and replacements",
      "Original adaptation outline"
    ],
    "checks": [
      "No claims of viewing link-only videos",
      "No invented reference content",
      "Adaptation centers on the user's product and brand"
    ]
  },
  "motion-graphics": {
    "purpose": "Plan editable text, data and graphic animation.",
    "whenToUse": "Benefit cards, numerical displays, title animation or animated infographics.",
    "inputs": [
      "Information and brand visuals",
      "Aspect ratio, duration and shot background",
      "Actual data and available graphics"
    ],
    "steps": [
      "Establish hierarchy and simplify each screen.",
      "Define appearance, display duration, movement direction and exit for every element.",
      "Describe layout, text, graphics and coordination with shots.",
      "Identify editable properties and caption reading time."
    ],
    "output": [
      "Animation timeline",
      "Elements and editable properties",
      "Production instructions"
    ],
    "checks": [
      "Numbers have sources",
      "Animation does not obscure subjects or hinder reading",
      "Deliver a plan without claiming rendered animation"
    ]
  },
  "caption-polish": {
    "purpose": "Improve caption and short visual copy clarity, length and brand consistency.",
    "whenToUse": "Long, unnatural, hard-to-read or off-brand captions.",
    "inputs": [
      "Source captions, speech and duration",
      "Brand brief and aspect ratio",
      "Facts, prices and restrictions to retain"
    ],
    "steps": [
      "Identify verbosity, ambiguity, repetition and inconsistent tone.",
      "Use short sentences and semantic line breaks.",
      "Recommend display time and screen divisions based on duration.",
      "Verify facts and offer conditions and provide rewrite comparisons."
    ],
    "output": [
      "Original and revised copy",
      "Recommended line breaks and display timing",
      "Meaning questions to confirm"
    ],
    "checks": [
      "Preserve key facts and conditions",
      "Natural, readable wording",
      "No invented precise timing when duration is missing"
    ]
  },
  "brand-check": {
    "purpose": "Review advertising copy and creative direction against the brand brief.",
    "whenToUse": "Checking brand tone, visuals and expression boundaries.",
    "inputs": [
      "Brand brief, vocabulary and prohibited elements",
      "Script or creative descriptions to review"
    ],
    "steps": [
      "Collect established brand constraints.",
      "Compare copy and concepts against each constraint, citing sentences or shots.",
      "Distinguish clear deviations, improvements and missing information.",
      "Recommend minimal changes that preserve the central concept."
    ],
    "output": [
      "Brand constraints",
      "Deviations and evidence",
      "Recommended rewrites or corrections",
      "Information to confirm"
    ],
    "checks": [
      "Use the supplied brand brief as evidence",
      "Do not invent prohibitions",
      "Explain scope when brand information is unavailable"
    ]
  }
};

export function buildSkillPrompt(selectedNames: string[]): string {
  const selected = skills.filter(skill => selectedNames.includes(skill.name));
  if (!selected.length) return "No optional skills selected.";
  return selected.map(skill => {
    const definition = skillInstructions[skill.id];
    return [
      `Skill: ${skill.name} (${skill.id})`,
      `Purpose: ${definition.purpose}`,
      `Use when: ${definition.whenToUse}`,
      `Inputs to check:\n${definition.inputs.map(item => `- ${item}`).join("\n")}`,
      `Execution steps:\n${definition.steps.map((item, index) => `${index + 1}. ${item}`).join("\n")}`,
      `Deliverables:\n${definition.output.map(item => `- ${item}`).join("\n")}`,
      `Quality checks:\n${definition.checks.map(item => `- ${item}`).join("\n")}`,
    ].join("\n");
  }).join("\n\n");
}
