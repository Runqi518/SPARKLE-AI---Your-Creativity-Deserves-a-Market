# Sparkle Studio skill library

The canonical, English-language skill source is [`src/lib/studio/skills/library`](../../src/lib/studio/skills/library). Each capability has a real `SKILL.md` with frontmatter, a professional model, evidence and input contract, decision rules, operating procedure, output contract, failure recovery, a rubric and domain-specific decision controls. The skills contain no illustrative cases or external citation sections. The build script [`scripts/build-studio-skill-library.py`](../../scripts/build-studio-skill-library.py) produces 30 L0–L4 capability files, 18 specialized workflows for older saved skill IDs, and eight Agent-core specializations. [`scripts/studio_skill_specialization_notes.py`](../../scripts/studio_skill_specialization_notes.py) holds the dedicated procedures for named workflows. Re-run the build script after editing source data; direct edits to generated files will be replaced.

The runtime loader reads these files only for a selected skill or Agent core. It strips frontmatter and checks size. Old TypeScript checklist fallback and flat Markdown content were removed. The application currently exposes 27 optional standalone workflows, including eight new canonical entries. The older workflow IDs remain selectable for saved campaigns and now load full specialization files.

The [research map](source-map.md) lists all 30 canonical capabilities and the source-to-heuristic relationships for maintainers. It is outside the runtime skill library and is not included in Agent prompts.

The [full inventory](inventory.md) links every skill page and shows its layer, placement and current size for direct review.

The 56 named Markdown pages in this directory are generated mirrors of the runtime `SKILL.md` bodies. They let reviewers inspect the full instructions at the GitHub paths used by the earlier documentation. The runtime library remains the source of truth; regenerate both views with `python3 scripts/build-studio-skill-library.py`.

## Invocation boundary

| Layer | Placement | Current execution |
| --- | --- | --- |
| L0 Planner, Tool Use, Memory & Context, Critic & Recovery | Runtime policy, never an optional UI attachment | Partial: ordered tasks, provider calls, saved context and validation exist; dynamic replanning and bounded media repair are specifications. |
| L1 Brief Interpretation | Creative Director core | Loaded on every Creative Director task. |
| L1 Consumer Insight, Brand Strategy, Ad Strategy, Platform Strategy, Performance Creative | Standalone | Selectable textual workflows; no live platform-research ingestion inside an Agent run. |
| L2 Creative Concept, Reference Analysis | Standalone | Selectable textual workflows. |
| L2 Copywriting, Creative Director, Director, Cinematography, Art Direction, Editing, Sound | Agent core | Loaded through the corresponding specialist role; Storyboard Designer carries Director and Cinematography. |
| L3 Prompt Compiler, Consistency | Standalone | Generate plans/prompts and inspect supplied references. |
| L3 Model Routing, Image Generation, Video Generation, Lip-sync & Audio, QC & Regeneration | Provider/runtime specifications | Detailed methods are documented; current provider nodes execute available generation. Vendor comparison, lip sync and automatic regeneration are not yet automated. |
| L4 Creative Quality, Brand Compliance, Performance Evaluation, Generation Quality | Standalone | Textual review or review of actually supplied media and metrics; no automatic media scoring loop. |

`Agent role + core methods + up to three compatible selected methods + source context → structured Agent output` is the present execution model. Skills cannot call a provider themselves. A generated prompt, shot plan or QC recommendation is not a rendered or approved asset.

## Source interpretation

The common planning chain is **Objective → Audience → Insight → Proposition → Creative Angle → Proof → Execution → CTA → Validation**. It is Sparkle's synthesis of case study structure, effectiveness research, platform advice and production practice; no single source prescribes it. A platform best practice is a hypothesis to test, not an outcome guarantee. A campaign case illustrates a mechanism, not a transferable performance claim. A benchmark identifies QC dimensions, not approval of a branded film. Provenance stays in the maintainer research map rather than the executable skill instructions.

Review a skill against a real campaign before expanding a rule. Check current provider and platform documentation before relying on exact specifications, model features or prices. Keep verified facts and assumptions distinct, and compare actual outputs with the skill's hard gates and rubric.
