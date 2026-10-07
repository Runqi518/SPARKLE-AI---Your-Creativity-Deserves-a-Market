# Sparkle advertising skill architecture

Sparkle uses one advertising decision chain: **Objective → Audience → Insight → Proposition → Creative Angle → Proof → Execution → CTA → Validation**. This is a synthesis of advertising cases and platform guidance, not a borrowed proprietary method. The skill system separates the *knowledge and decisions* needed for an ad from the *provider operations* that create media.

## Placement decisions

| Capability | Placement | Reason |
| --- | --- | --- |
| Planner; Tool Use; Memory & Context; Critic & Recovery | General runtime | Every run needs state, tools and recovery. These should never be optional attachments. Runtime is only partially implemented; the documents describe the target operating policy. |
| Brief Interpretation | Creative Director core | Every campaign direction starts with a usable brief and evidence ledger. |
| Consumer Insight; Brand Strategy; Ad Strategy; Platform Strategy; Performance Creative | Standalone | Each is a reusable, conditional investigation applicable across specialists. |
| Creative Concept; Reference Analysis | Standalone | A brief or reference can call for these methods without changing the Agent's role. |
| Copywriting | Scriptwriter core | Required craft for that role. |
| Creative Director | Creative Director core | Required cross-department visual and narrative control. |
| Director; Cinematography | Storyboard Designer core | Sparkle's storyboard role owns shot staging and camera choices. |
| Art Direction | Product Visual Designer and Scene Designer core | The product and environment roles must preserve material, pack and set truth. |
| Editing | Final Editor core | Required timeline, caption and cut discipline. |
| Sound | Sound Director core | Required cue and mix discipline. |
| Prompt Compiler; Consistency | Standalone | Reusable across visual roles and only needed for generation-oriented jobs. |
| Model Routing; Image Generation; Video Generation; Lip-sync & Audio; QC & Regeneration | Provider/runtime specification | These require live provider capabilities, assets, cost policy and inspection. A Markdown instruction alone cannot execute them. |
| Creative Quality; Brand Compliance; Performance Evaluation; Generation Quality | Standalone evaluation | Run when concepts, evidence, metrics or media are available. Actual metrics and frames must be supplied for empirical judgments. |

The eight existing Agents remain in [`src/lib/studio/agents`](../src/lib/studio/agents). Every Agent now loads a detailed core file. Selected standalone skills are checked for compatibility and loaded from [`src/lib/studio/skills/library`](../src/lib/studio/skills/library). The loader no longer uses short TypeScript fallback instructions. The maximum of three attachments and a prompt-size gate guard context cost. Existing selectable names remain as detailed specializations so saved work still resolves.

## Research-to-rule synthesis

- [Effie's case entry kit](https://current.effie.org/2026/Materials/2026_Effie%20Awards%20US_Entry%20Kit.pdf), [ARF's Ogilvy Award sample cases](https://thearf.org/arf-events/2023-ogilvy-awards-sample-cases/) and [D&AD's Tide analysis](https://www.dandad.org/insights/awards/tide-ad-campaign-case-study-insights) support linking an observed tension to strategy, execution and measured result. The skills require that causal bridge and distinguish observations from hypotheses.
- [IPA effectiveness research](https://ipa.co.uk/knowledge/effectiveness-research-analysis/les-binet-peter-field) and [Ipsos research on distinctive brand assets](https://www.ipsos.com/en/power-you-why-distinctive-brand-assets-are-driving-force-creative-effectiveness) inform separation of long-term brand memory from immediate response and systematic preservation of owned brand cues. No historical budget ratio is hard-coded.
- [TikTok Creative Codes](https://ads.tiktok.com/business/en-US/creative-codes), [Meta Reels guidance](https://www.facebook.com/business/ads/facebook-instagram-reels-ads) and [YouTube ABCD](https://www.thinkwithgoogle.com/_qs/documents/18468/ABCDs_PDFPlaybook_April2022_Final_1mSQVej.pdf) inform placement-aware openings, product clarity and direction. Exact safe areas and provider capabilities are verified at use time.
- [Motion's strategy engine](https://motionapp.com/library/frameworks/creative-strategy-engine) and [creative analysis](https://motionapp.com/library/frameworks/creative-analysis) inform the distinction between motivation, angle, hook and visual format, and between attention, persuasion and action failures. These are starting hypotheses for local testing.
- [Runway's prompting guide](https://help.runwayml.com/hc/en-us/articles/39789879462419-Gen-4-Video-Prompting-Guide) and [Google's Veo API guide](https://ai.google.dev/gemini-api/docs/veo?hl=en) inform shot-level prompt compilation and capability checks. [VBench](https://arxiv.org/abs/2311.17982), [VBench 2.0](https://arxiv.org/abs/2503.21755) and [FilmBench](https://arxiv.org/abs/2607.24241) inform media QC dimensions, while actual brand fidelity still needs direct inspection.

The user-provided source map is implemented as 5–8 direct links per skill, with original sources preferred. Award cases and platform showcase galleries are treated as selected examples; they are not evidence of guaranteed transfer to a new campaign. The `SKILL.md` files state decision rules and hard failures a strategist or production specialist can dispute and revise.

## Current automation boundary

Sparkle currently composes Agent prompts, runs the existing provider layer, persists attached skill IDs and validates structured Agent output. It does not yet autonomously replan a campaign, compare live vendor prices, perform lip sync, score generated video end-to-end, or regenerate failed shots. The corresponding capability documents say `partial` or `specification`. Implementing the final **General Runtime → Advertising → Creative/Production → Generation → Evaluation → automatic iteration** loop requires asset inspection, capability metadata, attempt budgets, versioned state and user-visible acceptance decisions.
