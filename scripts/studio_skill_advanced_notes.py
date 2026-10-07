"""Additional failure-sensitive operating knowledge for every canonical capability."""

ADVANCED_NOTES = {
'planner': r'''## Change impact and work authorization

Classify a change by the earliest decision it invalidates. A corrected product fact reopens strategy, copy and every visual that depicts it; a timing change may reopen script, storyboard, sound and edit without reopening positioning. Track this as an explicit dependency impact set. Distinguish tasks that can be performed with current authority from external publication, spend or irreversible actions that need their own authorization. Keep the plan executable after any branch fails by exposing the next unblocked task rather than simply marking the whole campaign failed.

Set a stop rule before exploration: maximum time, cost, attempts and acceptable unresolved defects. At each gate compare the expected quality gain of another iteration with its cost and the risk of destabilizing approved work. Record why a step was skipped or deferred so a downstream role cannot mistake omission for approval.''',
'tool-use': r'''## Provider capability and result integrity

Represent a required tool call as capability, input type, output type, control parameters and postcondition. Confirm which parameters are supported by the connected provider and which exist only in a vendor's public product. Map every reference image or clip to a retrievable asset ID or transport URL with sufficient lifetime. Before submission, check orientation, duration, resolution, file size, permission and rights; after submission, inspect the returned asset rather than trusting a completion message.

Record asynchronous job state and request ID so a timeout can be reconciled before retry. Treat empty outputs, inaccessible URLs, mismatched dimensions and missing audio as failures even if the transport succeeded. A fallback provider is valid only if it can satisfy the original hard constraints; otherwise revise the shot contract and obtain creative approval.''',
'memory-context': r'''## Context selection and staleness

Store facts at the scope where they hold: brand-wide, campaign, asset, character, scene or shot. Give each item a stable identifier, source link, approval state and supersession relationship. A recent generated artifact is not an authoritative source for product truth, even if it appears in several downstream prompts. Retrieval should choose the minimum context needed for the current decision and preserve exact IDs for anything that must remain visually or legally identical.

On every update, identify dependent artifacts and mark them current, provisional or stale. Resolve straightforward precedence from explicit user corrections and approved sources; ask for resolution when two current authoritative sources conflict. Do not compact a disagreement into a single confident summary. Make the context pack auditable enough that a specialist can identify which claim or image it relied on.''',
'critic-recovery': r'''## Diagnostic evidence and selective repair

Before proposing a retry, point to the exact line, frame interval, metric or missing asset that fails the contract. State whether the cause lies upstream in the brief, in the creative plan, in a prompt/control, in the provider or in the final assembly. Repair the earliest cause that explains the defect; changing the final prompt cannot correct a false product claim in the brief. Preserve the best prior version and compare candidates against the same source and rubric.

Treat mandatory truth and brand gates separately from scored craft dimensions. A more attractive result with an invented label is worse, even if its aesthetic score rises. Escalate repeated deterministic failures rather than consuming attempts on the same inputs. The recovery record must name the accepted version, unresolved defect, remaining budget and reason for stopping.''',
'brief-interpretation': r'''## Decision-ready brief threshold

A brief is ready when the team can choose an audience, proposition, proof method, format and success measure without inventing product facts. Separate required factual inputs from choices the team may make creatively. Translate broad goals into an observable audience behavior and communication job; define the KPI owner, baseline, time window and any measurement limitations. Preserve mandatory claims and asset requirements exactly, while labeling strategic interpretations as hypotheses.

When a brief combines incompatible objectives, expose the conflict and propose a primary role for each asset or phase. If market, audience or placement is unknown, state how each plausible answer would change the creative decision. Handoff should include a one-page decision summary plus an evidence ledger; a long questionnaire without prioritized consequences does not count as a usable brief.''',
'consumer-insight': r'''## Sampling and falsification discipline

Trace an insight through observation, interpretation, behavioral mechanism and creative consequence. Record where observations came from, who was included, when they were collected and what selection bias is likely. Reviews can reveal language and friction but overrepresent motivated customers; interviews can explain reasons but not establish prevalence. Avoid treating cultural shorthand as a universal audience trait. Identify a buying or use moment specific enough to guide a scene or hook.

Ask what contrary evidence would weaken the proposed tension and whether a competitor could solve it as well. If the insight does not change proposition, proof or execution, it is background context rather than a strategic engine. Offer a validation method matched to the uncertainty: interviews for mechanism, survey for incidence, observed behavior for friction or creative testing for message response.''',
'brand-strategy': r'''## Equity, attribution and governance

Classify each visual or sonic cue as approved equity, category convention or new proposal. Existing equity can be deployed when asset version and usage rights are clear; a new cue needs testing before it is described as recognizable. Specify the intended brand association and the buying context in which it should surface. Evaluate whether a cue survives small screens, short cuts, captions and sound-off viewing without distorting the product.

Build an asset register with owner, version, formats, safe use, prohibited alteration and review status. Review attribution by asking whether viewers could associate the story and proof with this brand before the final logo. When brand expression conflicts with claim clarity or accessibility, propose a documented adaptation for approval. Keep brand meaning and campaign mood separate so a temporary style does not silently become policy.''',
'ad-strategy': r'''## Proposition stress test

Test the selected proposition against four questions: does the audience care in the stated situation, is the product role specific, can the promise be demonstrated or substantiated, and can the desired action follow naturally? A unique claim without relevance is weak; a relevant generic claim may need distinctive execution and brand cues. Compare at least two angles by mechanism, not adjective. Include the strongest reason to reject each route.

Map the strategy to a proof sequence. Decide what viewers must see first to understand the problem, what proves the product answer and when the brand should become recognizable. Distinguish emotional memory goals from immediate response goals and define a primary job for each asset. If measurement is unavailable, state the expected observable proxy and its limits instead of asserting effectiveness.''',
'platform-strategy': r'''## Placement and creative adaptation

Plan at the placement level. Identify aspect ratio, interface occlusion, sound defaults, viewing intent, caption behavior, duration and available CTA surfaces from current official specifications. Then decide how the ad earns attention, establishes brand meaning, shows proof and directs action in that context. Do not transfer a fixed “first three seconds” formula across all formats or assume a center crop preserves the argument.

For every version, specify what changes in framing, opening, information density, audio, graphics and end card. Review the actual rendered asset with platform overlays and muted playback. Where a placement cannot show the proof legibly, request a new shot or reduce the message rather than shrinking text. Report unknown specifications as a verification task before production lock.''',
'performance-creative': r'''## Testable variation and diagnosis

Construct variants around explicit audience and creative hypotheses. Keep product facts, offer, destination and brand truth stable unless one is the variable under test. Distinguish an opening problem from a proof problem: low initial attention suggests a relevance or visual-start issue; drop-off after the promise can signal weak payoff; clicks without conversion may involve offer, landing page or targeting. The available data may not identify a single cause.

Each variant should name the altered mechanism, expected viewer behavior, production requirements, measurement window and disconfirming result. Review quality before launch so poor brand or claim compliance is not excused as an experiment. Use actual results to decide keep, revise or stop; do not present platform showcase ads as evidence that a mechanism will win in this campaign.''',
'creative-concept': r'''## Territory selection and extensibility

Generate concepts that differ in the relationship between audience tension, product role and storytelling device. A change of location or music alone is usually an execution variant. For each territory, identify the central audience takeaway, first brand cue, demonstrable proof, visual system and repeatable rule that could support several assets. Evaluate novelty against brand ownership and production feasibility; a surprise that only works once may be unsuitable for a campaign platform.

Perform a kill review before refinement: remove routes that need invented product behavior, unlicensed reference expression, unavailable production or a payoff too late for the placement. Document the chosen route and its strongest rejected alternative. If no concept passes, revisit the insight or proposition rather than adding decoration to weak material.''',
'reference-analysis': r'''## Evidence boundary and transformation

Inspect only accessible material and record what is observed versus inferred. A still image cannot establish movement, music or temporal structure. For video, use time ranges and describe attention device, story beat, product presence, framing, transition, text and audio. Where context or performance results are unavailable, state the limitation instead of assigning campaign intent or effectiveness.

Extract a transferable mechanism such as contrast, delayed reveal or demonstration logic, then rebuild the setting, characters, sequence and language from the user's product and brand. Test whether the mechanism still produces a clear viewer takeaway without the original brand. Reject a proposed adaptation if it copies distinctive expression or depends on a product advantage Sparkle's client does not possess.''',
'copywriting': r'''## Semantic and temporal control

Assign each line one communication job: attention, context, proof, emotional meaning or action. Mark claim source and approval next to factual language, including implied absolutes, testimonials and offer terms. Write to the audience's vocabulary and the actual visual beat. If the picture already shows a fact, use copy to interpret its importance or create momentum instead of repeating it. Keep supers comprehensible during muted viewing.

Time the script aloud with natural pauses, difficult names and necessary qualifiers. Cut secondary benefits before increasing speech speed. Check whether the hook's promise is paid off by visible evidence, whether the CTA is actionable and whether alternate copy changes the argument or merely synonyms. Hand production a locked copy version plus approval flags; an elegant line that cannot be supported is not ready.''',
'creative-director': r'''## Cross-discipline creative control

Set the campaign's governing idea, visual logic, proof hierarchy and brand attribution plan before specialists elaborate details. Distinguish inspiration from instruction: a moodboard can express atmosphere but cannot define product truth or shot continuity. Give each role a decision brief with approved constraints, open choices and required evidence. Review the first frame, product reveal and final action as a connected argument across visual, copy, sound and edit.

When specialist proposals conflict, resolve by objective and truth before personal taste. An art direction that hides the demonstration, a script that overclaims and a montage that drops the brand cue all need revision even if each craft output is polished. Record final decisions and remaining approvals so a later role does not infer that silence means consent.''',
'director': r'''## Action and coverage logic

For every scene define what changes for the viewer, where the product is in space and what action proves the claim. Plan blocking, eyelines, entry and exit states, camera axis and coverage so adjacent shots can cut coherently. Distinguish the master action from inserts; an insert should reveal information or emotion, not merely add variety. Reserve enough screen time for a demonstration to be understood at normal speed.

Test the shot plan without dialogue. If the action does not carry the intended product meaning, revise blocking or proof design before relying on narration. Identify practical resets, hand continuity, prop state and safety constraints. When a model or shoot cannot execute a complex action reliably, split the shot or simplify the choreography while preserving the viewer's causal understanding.''',
'cinematography': r'''## Optical and lighting intent

Specify camera distance, perspective, shot scale, lens intent, depth of field, movement and motivated lighting in relation to the information the viewer needs. A shallow focus hero frame may hide a label or user action; a dramatic angle may distort product geometry. Select a focal and lighting approach that keeps the approved product identifiable while creating the desired emphasis. State whether movement tracks action, reveals information or changes emotional proximity.

Maintain screen direction and key light logic across adjacent shots unless a deliberate transition resets geography. Review exposure and highlight control on reflective packaging, texture retention on dark products and readability of labels after compression. For generation prompts, communicate achievable camera behavior rather than piling incompatible lens and movement adjectives into one shot.''',
'art-direction': r'''## World-building with product truth

Translate the audience situation and brand identity into surfaces, props, wardrobe, color and environmental detail. Create a hierarchy of immutable product elements, approved brand cues and flexible scene choices. Every prop should support use context, scale, action or atmosphere; remove details that imply unsupported product features or compete with the proof. Document sourcing, reset needs and continuity state for props that move or change.

Review the actual camera frame, not just a flat moodboard. Check product separation, label legibility, texture behavior, reflections and color shifts under the planned light. If a more attractive environment misrepresents category or use, revise it. A production-design specification should let multiple shots feel like the same world without forcing identical compositions.''',
'editing': r'''## Causal cut and version control

Cut when the next image changes what the viewer knows, expects or feels. Track the proposition through opening, demonstration, proof, brand recognition and CTA; speed alone does not create retention. Maintain action and spatial continuity where needed, and use discontinuity only when it improves compression or creates a deliberate contrast. Check that key information stays readable through transitions, graphics and platform overlays.

Build an edit decision list linked to actual asset IDs and approvals. Mark placeholders and pickups explicitly. For shorter versions, preserve the strongest proof and essential action rather than just removing the middle. Review each export muted and with sound, at native aspect ratio and normal speed. Record what changed between versions so performance results can be tied to a real creative variable.''',
'sound': r'''## Sonic hierarchy and synchronization

Give each sound layer a function: speech communicates, product sound supports observed action, ambience locates the viewer, music shapes emotion and a sonic brand cue creates recognition. Time cues against the edit and identify moments where silence improves attention. A designed sound must not imply a physical property or result the product cannot deliver. Specify voice performance in actionable terms such as pace, emphasis and distance, rather than mood adjectives alone.

Check intelligibility under expected listening conditions and maintain a muted-viewing path through image and captions. Track source, license and approval for every voice and music asset. If final audio is unavailable, deliver a cue and mix plan labeled as provisional; do not describe generated or selected tracks as cleared without evidence.''',
'prompt-compiler': r'''## Semantic preservation across model instructions

Compile a shot contract into model-specific inputs without losing the creative purpose. Separate invariants such as product geometry and character identity from variables such as camera movement or background motion. Express one dominant action, camera behavior, duration and end state in concrete language; use reference assets for identity rather than hoping text recreates exact packaging. Confirm which controls the selected model actually supports.

Trace each prompt field back to the shot plan. If a requirement cannot be represented by the available mode, report the gap and choose another mode or shot design. Keep a versioned prompt with reference IDs, parameters and observed output defects. Revisions should alter the causal variable that failed, not add a longer list of conflicting adjectives.''',
'model-routing': r'''## Capability gate before preference

Route a shot by required input mode, character or product locking, camera control, duration, aspect ratio, audio needs, rights and cost ceiling. Check live connector and account capability rather than relying on public feature descriptions. Use quality comparisons only after hard requirements pass. A highly rated model that cannot accept the approved reference or return a usable asset is not a viable route.

Record provider choice, rejected alternatives, current specification source, expected cost and fallback. Pilot the highest-risk shot early to test identity and motion, then update route assumptions from actual output. If all available models fail a hard constraint, revise the production method, use live action/compositing or escalate the limitation; do not claim a prompt workaround can supply an absent API control.''',
'image-generation': r'''## Reference lock and approval-critical details

Classify the requested image as exploration, style frame, background, keyframe or approval-critical product image. The class determines how much exact identity control is required. Use approved product references for geometry, color, material, label and logo. When a model cannot reliably render exact text or packaging, plan compositing from approved assets. Specify subject, camera, light, environment and allowed variation separately so feedback can target one dimension.

Inspect outputs at native resolution for altered pack details, impossible reflections, hands, typography and product-use implications. Record accepted reference IDs and keep the selected keyframe stable for downstream video work. Do not promote an aesthetically strong draft to approved product truth because it resembles the reference at thumbnail size.''',
'video-generation': r'''## Shot-level generation contract

Choose text-to-video, image-to-video or endpoint-controlled mode based on the required identity lock and shot transition. Confirm the provider's actual duration, aspect, reference and camera capabilities. Keep a shot to one principal action where practical, with observable start and end states. Use the approved first frame for product or character identity when possible; do not let a prompt invent exact branded lettering.

Inspect the whole clip at real speed and sample critical transitions. Check action order, physical interaction, product geometry, identity drift, camera path, audio and end-state continuity. A valid file may still fail the commercial shot contract. If the same defect recurs, simplify action, change acquisition mode or use compositing; do not burn the attempt budget repeating an unchanged prompt.''',
'consistency': r'''## Identity and state matrix

Maintain canonical references for product, character, wardrobe, set and style with version IDs. For every shot record initial and final state, including hand position, product orientation, prop placement, lighting direction and damage or use marks. Compare adjacent shots by identity and temporal state separately: a person can look identical yet hold the wrong object, and a smooth transition can still alter the product.

Set tolerances by role. Package text, logo and product function may be immutable; ambient background detail may vary. Use actual frame inspection when media exists, and mark plan-only assessments unverified. Localize the defect and choose crop, edit, compositing or targeted regeneration based on severity and cost. Preserve accepted reference frames for later model calls.''',
'lip-sync-audio': r'''## Speech source and temporal alignment

Confirm speaker identity, script approval, language, pronunciation, voice rights and whether the voice is recorded or synthetic. Align phoneme-level mouth movement to the final audio track rather than to an earlier script draft. Track timing changes caused by pauses, names and qualifiers. If the face is too small or occluded for reliable sync, select a different shot rather than asserting synchronization from a waveform alone.

Inspect lips, jaw, facial expression and audio together at normal speed, including cuts into and out of speech. Check language accuracy and emotional performance separately from technical alignment. Keep captions synchronized to final words and preserve an accessible muted version. Report rights and identity approval as independent gates; technical success cannot substitute for them.''',
'qc-regeneration': r'''## Repair triage by causal defect

Audit generated media for brand/product truth, identity, physical plausibility, temporal coherence, action completion, image artifacts, sound and lip sync. Record defect location, severity, affected deliverable and the exact contract clause it violates. Block product or claim misrepresentation regardless of aesthetic quality. Use a fixed rubric across versions so a changed score reflects a real improvement.

Select the smallest repair: trim a bad tail, composite an exact pack, change a motion parameter, regenerate one shot or revise an upstream script. Define maximum attempts and fallback before retrying. Keep the best candidate and record residual defects. If no attempt meets hard gates, return a failed shot with an executable alternative rather than silently selecting the least bad render.''',
'creative-quality': r'''## Advertising argument review

Judge whether the audience can understand the situation, product role, proposition, proof and next action without hearing the team's intent explained. Separate distinctiveness and aesthetic craft from strategic relevance. Review the first impression, each beat's contribution, brand attribution and payoff. A visually striking ad can fail because the product appears late, the claim lacks proof or the viewer remembers only a generic category story.

Score against the actual brief and placement, noting both evidence and uncertainty. Distinguish a script-level risk from a defect observed in finished media. Rank revisions by expected gain in comprehension and brand meaning, not personal taste. When reviewers disagree, identify the audience interpretation that would resolve the dispute and propose a focused test.''',
'brand-compliance': r'''## Claim and asset traceability

Compare final words and pixels with approved brand assets, product specifications and claim evidence. Review explicit copy and implied meaning from visuals, demonstrations, montage and sound. Check logo, package geometry, tone, palette, message hierarchy, offer terms and required disclosures in the actual placement. Record exact timecode, source rule, severity and correction owner for every deviation.

Separate a hard violation from an optional style refinement. A score cannot override a wrong pack, unsupported outcome or missing condition. When no authoritative asset or claim source is supplied, mark the item unverified and request it; do not invent brand policy. After correction, inspect the new artifact rather than treating the proposed fix as applied.''',
'performance-evaluation': r'''## Measurement validity and creative causality

Begin with campaign objective, metric definition, attribution window, spend, audience, placement, period and creative version. Separate delivery differences from response differences and the ad's influence from landing page or offer effects. CTR, view-through and CVR answer different questions; none alone proves a concept is strategically strong. State sample and confounding limitations before comparing variants.

Locate the earliest credible performance weakness and map it to the creative beat that could affect it. Propose one testable revision with expected signal, controlled conditions and a result that would disconfirm the hypothesis. Report observed result, plausible interpretation and next decision separately. If evidence is too thin, recommend instrumentation or a qualitative comprehension check instead of declaring a winner.''',
'generation-quality': r'''## Media inspection dimensions

Review the actual rendered asset frame by frame where defects occur and at normal speed for overall action. Score identity, product fidelity, temporal smoothness, physics, camera behavior, composition, text, audio and speech sync separately. A still-frame inspection misses motion errors; a smooth clip may still have impossible product operation. Compare with approved anchors and the shot contract, not a generic aesthetic benchmark.

Flag hard defects that would mislead viewers or break the edit. Localize start/end time, affected object and severity so repair can target the cause. Distinguish defects visible in the asset from risks inferred from a prompt. A passing technical score does not approve brand claims or creative effectiveness; route those to their corresponding evaluators.''',
}
