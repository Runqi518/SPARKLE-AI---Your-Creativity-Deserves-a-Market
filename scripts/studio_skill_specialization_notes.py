"""Distinct operating decisions for Sparkle's named, selectable workflows."""

SPECIALIZATION_NOTES = {
'commercial-ad-strategy': r'''## Campaign architecture and decision gate

Separate the commercial objective from the communication task and the behavior expected of this asset. Identify the buying situation, the category alternative and the reason the product can credibly win. A proposition passes only if the audience can understand it, the product can support it and production can demonstrate it within the placement. When two propositions are both viable, compare their evidence strength, brand distinctiveness and cost to show; record why one was rejected rather than blending them into an unfocused promise.

Use the full strategy chain as a dependency test. The insight must change the proposition or creative angle; the proof must support the exact promise; the execution must make the proof visible; the CTA must lead to a real next step. If any link is absent, revise the earliest broken link. Separate expected communication effects from business results and specify the measurement owner, baseline and confounders. Do not present an attractive territory as validated strategy without evidence from the brief, research or testing.''',
'product-launch': r'''## Adoption sequence and launch truth

Identify what is objectively new: product, feature, availability, audience access or positioning. Confirm release date, market, distribution, inventory, eligibility and approved product language before using novelty or urgency. Map the adoption barrier separately for first exposure, consideration and first use; a reveal that creates awareness may leave the practical barrier unresolved. Sequence launch assets according to actual media capacity, not an assumed full funnel.

For each phase specify the audience question, product answer, proof format, required asset, destination and metric. Keep the visual identity stable while changing the information depth. If product access is limited, direct viewers to an accurate waitlist or information destination. If demonstration assets are unavailable, build a claim-safe explanation and list the pickup needed. Failure is a launch plan whose CTA cannot be fulfilled or whose “new” claim cannot be verified.''',
'reference-breakdown': r'''## Observation protocol and transfer boundary

Record what can actually be seen or heard before interpreting intent. A still frame cannot establish edit rhythm; muted video cannot establish sound design; a selected clip cannot establish campaign performance. For each accessible beat capture time range, hook mechanism, product role, framing, camera or edit change, copy, audio and transition. Mark uncertain observations as unverified. Then state the causal hypothesis: how the device earns attention, conveys a benefit or creates attribution.

Transfer the mechanism at an abstract level and redesign the expression for the user's product truth. Change the scenario, sequence, character relationship, language and visual signature enough to produce an original ad. Check whether the transferred mechanism still works when the source brand, budget and category advantage are removed. If only a link or thumbnail is available, deliver a limited analysis and request inspectable media rather than inventing timecodes or sound.''',
'motion-graphics': r'''## Graphic cue specification

Treat each graphic as a timed information event with an owner and purpose. Identify whether it clarifies a product action, labels proof, carries a claim, supplies navigation or creates brand recognition. For every cue record exact text or asset ID, entry and exit time, spatial placement, hierarchy, animation behavior, safe area, contrast and verification status. Align motion with the underlying action; the graphic should clarify a causal beat rather than compete with it.

Exact logos, labels, prices and legal qualifiers require approved text or vector assets. Generated textures may support the design but must not be trusted for exact lettering. Check graphics over the real footage, including the busiest and brightest frames. If the viewer cannot read a claim before the next cut, shorten wording, lengthen the hold or move information to another beat. Include silent-viewing and audio-on checks.''',
'caption-polish': r'''## Caption timing and semantic preservation

Start from a locked transcript or approved script and flag any mismatch with the recorded audio. Split phrases at natural syntactic boundaries; preserve names, numbers, qualifiers and conditions as exact strings. Record time in/out, line break, safe position and any intentional non-speech sound that affects comprehension. A caption should remain on screen long enough to read at normal playback speed without masking the product action or face.

Review the complete cut muted: the core proposition, evidence and CTA must remain understandable. Then review with sound to catch early or late entries, repeated words and captions that contradict speech. If a qualifier is too long for the available frame, revise the surrounding copy or the edit; do not silently drop the qualifier. Mark unsupported translations or localization as pending review.''',
'brand-check': r'''## Brand deviation triage

Compare the actual asset against the current approved brand package, not a memory of a previous campaign. Review first brand cue, product geometry, logo, palette, type, tone, message hierarchy, claim language and CTA. Distinguish a hard defect, such as wrong packaging or unsupported claim, from a stylistic concern that needs creative judgment. Record exact frame or line, governing rule, severity, owner and smallest viable repair.

Check attribution as a viewing experience. A logo at the end does not necessarily make the opening or demonstration recognizably the brand's. If a proposed deviation strengthens comprehension, document the tradeoff and ask the brand owner to approve it; do not silently rewrite the standard. Conclude with pass, revise or specialist review for each item, and keep unresolved items visible in the delivery record.''',
'audience-hook-strategy': r'''## Motivation-led hook design

Build each hook from a distinct audience situation or motivation. Specify the first visible action, spoken or written line, promised payoff, product relevance and proof beat that fulfills it. Compare mechanisms such as recognizable friction, immediate demonstration, a consequential question or a credible result. Avoid variants that only change adjectives while keeping the same underlying promise.

Reject a hook when its body cannot pay it off, when the product appears as an arbitrary late insert, or when it implies an outcome that is not substantiated. Rank candidates by relevance, proof availability, brand attribution, production burden and fit with the placement. In testing, hold landing page, audience and measurement window stable where possible; report a hook hypothesis, not a predicted CTR. Retention alone does not prove product understanding.''',
'ugc-ad-writer': r'''## Creator truth and performance direction

Separate creator testimony, scripted demonstration and actor performance in the brief. A first-person purchase, use or result statement requires confirmation from the speaker; a script cannot manufacture lived experience. Write lines in the creator's natural register while preserving approved product facts, disclosure needs and offer terms. Build a shot and copy plan for selfie footage, product use and cutaways so every spoken promise has a visible or documented support.

Mark which lines are fixed for accuracy and which can be improvised. Provide a performance note on pauses and emphasis instead of over-polishing every sentence. Review the script for hidden comparatives, exaggerated before/after implications and unsupported urgency. If the creator has no authentic experience to report, switch to observational demonstration or clearly identified presenter copy. Supply alternate openings only when each changes the audience entry point or proof approach.''',
'product-demo-planner': r'''## Demonstration integrity

Define the beginning state, user action, product response and observable result. The camera must show enough of the operation for a viewer to connect cause and effect; a beauty close-up cannot substitute for proof. Specify props, product version, environmental conditions, reset procedure, timing and any off-camera assistance. State which benefit is demonstrated and which remains a verbal claim.

For comparisons, match starting conditions, framing and measurement method. If matched conditions are impossible, use a single-product demonstration and avoid implied superiority. Divide an action when the chosen generation or shooting mode cannot perform it reliably in one take. Acceptance requires visible product truth, repeatable conditions and a shot list that an operator can execute. Failure includes a montage that hides the actual result or edits around a material limitation.''',
'shot-list-builder': r'''## Shot contract and continuity ledger

Create stable shot IDs and an unbroken timeline. For each shot define duration, narrative job, product role, shot scale, lens intent, camera position and movement, blocking, action, start and end states, audio and super alignment, transition and asset source. The total of durations must equal the target cut, with no implicit gaps or overlaps. The shot plan should tell a cinematographer or generation operator what evidence must be visible.

Track geography, screen direction, hand used, product orientation and prop state across every adjacent cut. Mark a shot as existing, pickup, planned generation or unavailable; never place a non-existent clip in an “approved” edit. If a shot needs several independent actions, split it or prioritize the one that proves the proposition. Recompute timing after each change and identify downstream effects on VO, music and captions.''',
'visual-consistency-check': r'''## Frame-to-frame state audit

Build an anchor sheet from approved product, character, wardrobe and scene references. For each shot compare identity features, material/color, logo and label, lighting direction, object state, action state and framing. Record the exact frame or interval where a defect appears. Distinguish an intentional state change, such as a jacket removed on camera, from an unexplained drift across a cut.

Prioritize product misrepresentation and character identity loss over minor palette variation. Decide whether the smallest repair is a crop, cutaway, compositing pass, targeted regeneration or upstream prompt correction. A text prompt may describe continuity, but it cannot prove rendered frames meet it. When actual media is unavailable, return an unverified plan-level check rather than a visual pass. Include accepted reference IDs in the handoff.''',
'platform-format-adapter': r'''## Placement-specific adaptation

Confirm the named placements, aspect ratios, interface overlays, maximum durations, audio defaults and current specification source before preparing versions. Identify the proof beat, brand cue and CTA in the master, then verify each remains visible and legible after reframing. Recut the opening when the viewing context changes; resizing alone may remove the action that makes the ad understandable.

Deliver a version matrix with framing, timing, subtitle layout, audio treatment, end-card and destination for each placement. Mark where new footage or graphic layouts are required. Review every version in its actual crop and with likely interface occlusion, both muted and with sound. Do not declare compliance from target dimensions alone; actual rendered exports still require inspection.''',
'cta-offer-writer': r'''## Action and offer governance

Separate the requested action from commercial terms. Confirm destination URL or in-app action, price, discount calculation, eligibility, geographic availability, deadline, inventory condition and legal qualifier before writing urgency or savings language. A CTA should ask for an action the viewer can actually take at this stage; an awareness asset may direct to learning or discovery, while a high-intent asset may request purchase or booking when supported.

Provide exact approved wording, on-screen hold, visual placement, destination and mandatory conditions. Check that the CTA is consistent in voiceover, super, end card and landing page. If offer information is missing, write a claim-safe information CTA and flag the unresolved offer. Do not convert a limited test or conditional benefit into a universal promise.''',
'brand-voice-adapter': r'''## Voice inference and source hierarchy

Start from approved writing, current brand guidance and explicit prohibited language. Do not infer a stable voice from a logo, color palette or a single campaign line. Separate durable brand behavior from a campaign-specific tone and from platform conventions. For each source, record version, market and approval status; when materials conflict, defer to the current approved source and flag the conflict for the owner. If no reliable source exists, offer a provisional style direction rather than labeling it the brand voice.

Translate abstract adjectives into observable axes: sentence length, syntax, formality, directness, humor, emotional intensity, level of technical detail, pronoun choice and vocabulary. Define both a preferred pattern and a boundary for each axis. Preserve legally and factually fixed text as locked spans; the writer may adjust the framing around those spans but not soften qualifications or expand claims. Identify whether a signature phrase is an approved asset or merely a recurring habit.

## Rewrite decision procedure

1. Lock the source copy's proposition, claim scope, numbers, product names, offer terms and required qualifications.
2. Annotate each sentence by function: hook, explanation, proof, transition or CTA; remove filler before changing tone.
3. Diagnose the deviation against a named voice axis. “Off-brand” alone is not actionable feedback.
4. Rewrite structure and diction while keeping the communication function and factual meaning. Create a second intensity option only when it serves a different placement or audience tolerance.
5. Compare the new and source lines for altered implication, added certainty, lost proof, unintended humor and reading duration.
6. Read the revised copy aloud and inspect it beside the visual or caption context; voice can fail when separated from image timing.
7. Deliver the final lines with a compact rule card, material-change rationale and any approval flags.

## Review and recovery

Score each proposed line on brand fit, semantic fidelity, audience clarity and production fit using 0–2 per dimension. A score of 7/8 is the minimum for a confident recommendation, but any changed claim scope or omitted condition is an automatic failure. If the approved voice is warm but the product category requires precise safety or financial language, keep the required precision and move warmth into surrounding copy. If a signature phrase makes the CTA less clear, favor clear action and place the phrase elsewhere. Escalate only genuine conflicts in approved sources; do not use them as an excuse to invent brand policy.''',
'compliance-claims-review': r'''## Claim ledger and implied meaning

Review literal copy, implied visual result, voice performance and sound cues together. For each claim record exact wording, comparator, geography, audience, timeframe, evidence ID, approval owner and required qualifier. Classify product facts, quantified outcomes, comparative superiority, testimonials, price/offer terms and sensitive-category promises separately because their evidence burdens differ.

When evidence supports a narrower statement, revise to that scope; do not mark a broad statement “probably fine.” A before/after edit, reaction shot or simulated demonstration can imply a result absent from the written copy. Record the frame and proposed repair. Conclude pass, revise or specialist review. The skill can identify evidence gaps and production risks; legal certification requires the qualified reviewer named by the campaign.''',
'accessibility-pass': r'''## Multimodal comprehension review

Inspect the actual cut with audio muted, then with the screen ignored where practical. Critical proposition, proof condition and CTA should not exist only in one channel unless an accessible equivalent is supplied. Check caption accuracy, contrast over changing footage, type size, reading time, interface occlusion, flashing, color-only distinctions and audio intelligibility. Use the platform's current presentation context to assess safe placement.

Log timecoded defects and the smallest correction. If text is unreadable during a fast cut, simplify or extend the hold; if music masks speech, rebalance the mix; if a visual comparison relies on color alone, add labels or narration. Separate verified issues in the rendered asset from plan-level risks. Do not claim formal accessibility compliance from a script or storyboard alone.''',
'creative-variant-generator': r'''## Experiment design and learning value

Define the invariant brief, product facts, offer, landing experience, audience and measurement window before proposing variants. Choose one primary creative variable per comparison: motivation, first-frame mechanism, proof type, presentation format or CTA. A variant that changes all of these may be useful as a new concept, but it cannot isolate the cause of a performance difference.

For each candidate record hypothesis, altered beat, unchanged elements, production cost, expected signal, minimum observation period and stop condition. Review all variants for brand identity and claim parity. If the available volume is too small for a useful comparison, treat results as directional learning and use qualitative review to diagnose comprehension. Never promise a winning variant based on platform examples alone.''',
'ad-performance-review': r'''## Evidence before diagnosis

Request the objective, spend, dates, audience, placement, creative version IDs, attribution setting and metric definitions. Compare results only where delivery conditions are reasonably similar; auctions, targeting, landing pages and offers can confound creative conclusions. Separate observed data from a causal interpretation. Identify the earliest weak stage: delivery, opening attention, sustained viewing, click intent or conversion after the click.

Map that stage to a visible creative beat and propose a test that changes a specific mechanism. Do not diagnose a hook from CPA alone or a landing page from low view-through alone. Rank tests by expected information gain, feasibility and potential business impact. Record what result would disconfirm the hypothesis. If data is incomplete, provide a measurement gap list and provisional hypotheses rather than a confident verdict.''',
}

CORE_NOTES = {
'creative-director-core': r'''## Decision ownership and approval path

The Creative Director owns a coherent campaign decision, not every specialist's craft output. Reconcile objective, audience behavior, product truth, brand cues, idea and proof into one brief that can be handed off. Compare creative territories on strategic fit, distinction, evidence, production feasibility and likely failure mode. State the tradeoff behind the chosen route and identify what evidence could reverse the decision. When upstream research is absent, mark the insight provisional instead of presenting intuition as audience truth.

Handoffs must specify the proposition, nonnegotiable brand and claim boundaries, desired viewer takeaway, reference mechanism, channel role and required proof beat. Assign open questions to an owner. Reject a visually attractive treatment if a viewer would remember the spectacle without understanding why this product matters. Reopen the decision if a later specialist discovers the proof is unavailable; do not ask copy or editing to hide the gap.''',
'scriptwriter-core': r'''## Script lock and production handoff

Use a continuous timecoded AV table. Each row must specify image or action, VO/dialogue, on-screen words, sound role, brand cue, proof source and transition intent. Let the visual carry information when possible; copy should advance meaning rather than narrate obvious action. Before lock, test the opening without context, the body against the exact proposition and the CTA against the real destination. Read the entire script aloud at performance pace with pauses and product names.

Flag every factual, comparative, experiential and offer claim with source and approval status. If proof is not shootable or available, revise the line and list the needed pickup. Distinguish writer alternatives from approved copy so downstream teams cannot accidentally produce the wrong version. A valid handoff includes total duration, alternate opening rationale, claim ledger and unresolved production dependencies.''',
'product-visual-designer-core': r'''## Product identity lock

Create a reference hierarchy: approved pack and product photography govern geometry, color, materials, label, logo and functional details; mood references govern only treatment. Produce an anchor sheet with front, side, scale, key components, safe camera views and known failure-prone features. Record permitted stylization separately from immutable product facts. In hero frames, reserve enough pixels and light for the audience to recognize the product and any required label.

For each image or shot request, state the product's initial state, orientation, hand interaction, support surface and expected final state. If a model cannot reliably reproduce exact brand text, specify compositing from an approved asset. Review candidate output at full resolution, not only a thumbnail. Reject attractive variations that change function, packaging or identity; route them back to prompt constraints or compositing.''',
'character-designer-core': r'''## Cast and continuity contract

Define character identity from supplied references or approved casting direction, then separate stable traits from wardrobe, expression, pose and lighting. Record canonical images and allowed variation for each trait. Describe the person's role in proving the idea: what they do, what they notice and how their behavior makes the product relevant. Avoid assigning demographic or cultural attributes that the brief does not support.

Hand the storyboard a per-shot state ledger: entry pose, hand used, clothing, hair, accessories, gaze and exit state. Check every generated frame against the same anchor, including side and motion views. If identity drifts, first determine whether reference quality, angle, lighting or model capability caused it. Do not “fix” the character by changing approved identity across the campaign.''',
'scene-designer-core': r'''## Environment and scene geography

Build an environment master with plan-view orientation, camera axis, motivated light sources, time of day, color/material palette and product-use surfaces. Specify which environmental cues convey the audience situation and which are incidental. Avoid background details that imply an unsupported use case or draw attention from the demonstration. Record props with owner, position and state so resets can be executed between takes or generations.

For each scene variant, preserve the established geography and light direction unless the script calls for a transition. Mark practical shooting needs and model-generation risks separately. Review whether the environment supports product scale, contrast, legibility and action path. A beautiful location that hides the proof or cannot cut with adjacent shots fails the scene contract.''',
'storyboard-designer-core': r'''## Shot evidence and temporal continuity

Turn the locked script into stable shot IDs with continuous time in/out. Every shot needs one dominant narrative job, explicit product role, subject and camera movement, framing, start and end state, reference IDs, audio/super alignment and acquisition method. Treat a generated shot as a single controllable action unless current provider capability and testing support more. Identify shots that require real footage, compositing, stills or pickups.

Run two reviews: first follow the story with the copy muted to test visual causality; then follow the timecodes and state ledger to test continuity. Verify total duration exactly and track screen direction, hands, product orientation and prop state across cuts. Do not invent missing character or product references. If the script demands more action than the cut permits, return a precise timing or story revision request.''',
'sound-director-core': r'''## Audio cue and rights contract

Produce a timecoded cue sheet for VO/dialogue, diegetic product sound, ambience, designed effects and music. Assign each cue a narrative job: clarify action, direct attention, build emotion or mark the brand. Specify speech performance, priority in the mix, transition and silence. A designed click or impact must not imply a physical property the product lacks. Preserve a silent-viewing path through captions and visuals.

Track source, license, territory, term and approval for music and voice assets. Do not label a library track cleared without documentation. Review speech intelligibility on the intended device context and check that sound cues line up with actual visible actions. Handoff must distinguish final recorded assets from proposed sounds and include pickup or licensing blockers.''',
'final-editor-core': r'''## Edit conform and delivery gate

Start with an asset inventory linked to shot IDs. Mark each item as existing, approved, pending generation, pickup or unusable. Build a single timeline that reconciles picture, VO, music, effects, captions, graphics, brand cue and CTA. Check continuity at cut points, product truth at full resolution and every text hold in its actual placement. A treatment or edit decision list cannot be called an exported film.

For each requested aspect ratio or duration, preserve the proposition, proof and action; record what was recut rather than assuming crop equivalence. Before export approval, inspect the rendered file for duration, audio channels, caption accuracy, interface safe areas, end-card destination and visual defects. When editing or export tools are unavailable, deliver a conform plan with missing assets and acceptance gates, and state that the film remains unrendered.''',
}
