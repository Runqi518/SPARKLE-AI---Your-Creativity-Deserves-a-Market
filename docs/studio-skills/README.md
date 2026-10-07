# Sparkle Studio Skills

There are 16 skills: four original workflows and twelve additions. The agent catalog retains eight roles.

Select skills with the plus button at the top of AI Studio Partner and send a request. The backend adds each selected skill's inputs, execution steps, deliverables and quality checks to the text model's system instructions. Multiple skills can run together; duplicate selection does not duplicate instructions. Add agent returns to team execution. The workflows remain independent.

Skills produce text, creative plans, review findings and prompts. Canvas generation nodes continue to produce images and videos. Asset links alone do not automatically provide video frames or image analysis; workflows depend on supplied descriptions and readable information.

## Added skills

- [Audience & Hook Strategy](audience-hook-strategy.md): audience insights, advertising angles and opening hooks.
- [UGC Ad Writer](ugc-ad-writer.md): natural creator-friendly scripts with genuine product value and action.
- [Product Demo Planner](product-demo-planner.md): filmable, understandable and verifiable demonstrations.
- [Shot List Builder](shot-list-builder.md): executable shot lists for filming or generation.
- [Visual Consistency Check](visual-consistency-check.md): cross-shot continuity based on available evidence.
- [Platform Format Adapter](platform-format-adapter.md): placement-specific visuals, pacing and copy.
- [CTA & Offer Writer](cta-offer-writer.md): concise calls to action with complete offer conditions.
- [Brand Voice Adapter](brand-voice-adapter.md): brand-consistent copy preserving facts and intent.
- [Compliance & Claims Review](compliance-claims-review.md): unsupported or misleading claims and review needs.
- [Accessibility Pass](accessibility-pass.md): caption readability and muted-viewing comprehension.
- [Creative Variant Generator](creative-variant-generator.md): distinct, comparable and testable creative routes.
- [Ad Performance Review](ad-performance-review.md): diagnosis and test plans from actual campaign data.

## Original skills

- [Reference breakdown](reference-breakdown.md): reusable pacing, shot structure and expression.
- [Motion graphics](motion-graphics.md): editable text, data and graphic animation plans.
- [Caption polish](caption-polish.md): clear, readable and brand-consistent captions.
- [Brand check](brand-check.md): advertising copy and concepts checked against a brand brief.

## Implementation

- Catalog: `src/lib/studio/capabilities.ts`
- Complete instructions: `src/lib/studio/skill-instructions.ts`
- Execution: `POST /api/studio/skills/run`
- Definition lookup: `GET /api/studio/skills`

The skill endpoint accepts only skills, not agents, and injects only selected definitions. Agents execute through separate endpoints and per-role runs; see [Agent workflows](../studio-agents/README.md). Missing data must be identified or requested, never fabricated. Keep documentation synchronized with executable definitions.
