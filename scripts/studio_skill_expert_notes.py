"""Capability-specific senior review notes used by the Sparkle skill builder."""

EXPERT_NOTES = {
'planner': r'''## Execution topology and replanning policy

| Observed situation | Planning choice | Evidence required before advancing |
| --- | --- | --- |
| Product fact or approved claim is missing | Block claim-dependent copy and proof shots; continue independent environment work | A dated source of truth or an explicit claim-free concept |
| A specialist output is useful but fails one acceptance item | Reopen the smallest task and its downstream dependents | A revised artifact ID and a dependency impact list |
| Two tasks can proceed concurrently | Parallelize only if they write separate artifacts and consume the same immutable brief version | Distinct output IDs, shared input version and a merge owner |
| A late user correction changes strategy | Freeze the old branch, preserve its audit trail and build a new dependency path | Decision record showing what changed and why |

A plan is complete only when every required deliverable has a producer, acceptance evidence and a consumer or final destination. Do not confuse “Agent returned text” with “the brief is approved”; those are different states. In a multi-shot ad, define the gate at the point where a mistake would propagate: product truth before visual generation, script timing before a storyboard, canonical character reference before multi-shot renders, and actual media inspection before edit lock. A planner may use a provisional assumption to unblock exploration, but must mark all derived artifacts provisional and prevent them from being represented as final.
''',

'tool-use': r'''## Tool selection matrix

| Deliverable needed | Appropriate operation | Verification | Common false completion |
| --- | --- | --- | --- |
| Current platform specification | Read the official placement guide and record access date | Direct link and quoted parameter in the task record | Repeating a memorized size as current |
| Branded keyframe | Generate or composite with approved pack asset | Open image; compare exact logo, label and geometry | Accepting an attractive thumbnail |
| Motion shot | Submit through a provider mode that supports supplied references | Inspect playable asset, duration and action frames | Treating a job ID or prompt as a finished shot |
| Edited film | Run the editor/export pipeline | Inspect exported file, audio, captions and length | Reporting an edit decision list as a video |

Tool parameters should be derived from the shot contract and current provider capability, not guessed from another vendor. Distinguish a feature that is unavailable on the model from a feature that is merely absent from the local connector. If the connector cannot express a required first/last-frame control, changing prompt words cannot create that control; choose a different mode or change the shot design. Record the transport path for references: local paths, internal asset IDs and public URLs have different permissions and lifetime. A successful HTTP response with an empty candidate list is a failed operation.

## Retry classification

For validation errors, correct the request and do not spend a blind retry. For transient provider errors, check whether an asynchronous job exists before resubmission. For low-quality but valid media, alter one causal variable and preserve the previous asset for comparison. For external publication or payment-bearing operations, require the operation's existing authorization and idempotency rule; a skill instruction cannot grant either. The execution log must let a reviewer reconstruct what was requested, what was returned and what was actually inspected.''',

'memory-context': r'''## State model and precedence

Represent each memory item as `{value, scope, source_id, observed_at, approved_at, status, supersedes}`. Scope distinguishes brand-wide identity from campaign decisions and shot-local state. Status distinguishes approved fact, user preference, working assumption and rejected proposal. A prompt summary is a retrieval aid; the underlying record and asset remain authoritative. Never merge two visually similar product variants into one identity record simply because their names match.

| Conflict | Resolution rule | Downstream effect |
| --- | --- | --- |
| User correction vs an older Agent summary | Current explicit correction wins; retain old value as superseded | Re-evaluate artifacts that used the old value |
| Approved brand book vs a reference advertisement | Brand book governs the user's brand; reference informs mechanism only | Remove conflicting palette, logo or voice choices |
| Two current approved source documents disagree | Mark disputed and ask the owner for a decision | Block claim or package-sensitive output |
| Generated frame vs approved product photo | Photo governs identity; frame is candidate output | Reject or repair the frame |

## Retrieval and compaction

Build context packs by task: a Scriptwriter needs proposition, voice, claim ledger, shot evidence and CTA; a Scene Designer needs palette, location, product dimensions and continuity states. Old exploratory variants may be summarized or archived, but do not compact away the reason the current choice was approved. Persist links from each output to exact input versions so a later correction can invalidate only affected work. When a conversation becomes long, summarize decisions and unresolved questions separately, then confirm the summary against stored artifacts. A discussed claim is not equivalent to an approved claim.''',

'critic-recovery': r'''## Defect taxonomy and repair routing

| Defect class | Observable evidence | First repair | Escalate when |
| --- | --- | --- | --- |
| Strategy | Viewer cannot infer why this product matters | Revisit proposition and proof order | Multiple executions fail the same comprehension test |
| Factual or brand | Package or offer differs from approved source | Correct source link or replace exact asset | Source documents conflict or claim approval is unclear |
| Structural | Shot plan exceeds duration or lacks causal beat | Re-cut timeline or split action | Required proof cannot fit the format |
| Generation | Subject geometry or motion violates the shot contract | Simplify motion, lock reference, render one targeted attempt | Same artifact recurs or budget is exhausted |
| Infrastructure | Provider timeout with unknown job state | Query persisted job by request ID | Completion state cannot be established |

A critic should cite the exact line, frame or metric that supports a defect. “Feels weak” is a prompt for diagnosis, not a repair instruction. Rank defects by harm to truth and comprehension before polish. Set a stopping condition before the first retry: maximum attempts, incremental cost, acceptable residual defect and fallback shot construction. A variant that scores higher aesthetically but loses product fidelity is not an improvement.

## Comparative acceptance

Keep a baseline and candidate with the same source brief and rubric. For a motion repair, compare the exact failure interval and adjacent frames, not just the best still. For a copy repair, compare promise clarity and factual scope, not length alone. Report unresolved defects in the handoff so the editor does not mistake “best available” for “approved.” When the user supplies a correction, reopen the causal upstream decision and dependent artifacts; do not simply append a caveat to a wrong result.''',

'brief-interpretation': r'''## Brief interrogation by decision consequence

| Brief defect | Why it matters | Useful question or provisional action |
| --- | --- | --- |
| No defined success criterion | It names no business result or target behavior | Ask whether awareness, qualified visits or sales is primary; retain shareability as a creative hypothesis |
| Undifferentiated audience | Audience context determines demonstration and language | Identify a concrete buying or use situation; show alternatives rather than inventing research |
| Unsupported superiority objective | Comparative superiority requires evidence and a comparator | Request substantiation; otherwise frame a visible, non-comparative benefit |
| Platforms named without placements | Viewing contexts change opening and edit | Record exact placements, not platform names alone |

The output should have two layers. The **decision brief** contains approved choices and the single job of the ad. The **evidence ledger** preserves where each product, audience and KPI statement came from, its confidence and any approval gap. A creative team can proceed with a provisional audience hypothesis, but it cannot present that hypothesis as research. Use a “minimum viable brief” only if its omissions do not affect claim truth, product depiction or destination; list what would change if the assumption proves false.
''',

'consumer-insight': r'''## Insight quality test

| Candidate content | Classification | Why it passes or fails |
| --- | --- | --- |
| Isolated survey percentage | Data point | Quantifies an attitude but does not explain behavior or suggest a product-specific idea |
| Broad demographic preference | Generic observation | Too broad to distinguish this product or a buying moment |
| Situation, friction, behavior and motivation linked | Plausible tension | Explains behavior, but still needs research support and category fit |
| Tension connected to a verified product property | Creative implication | Converts understanding into a possible communication decision |

Use source triangulation where possible: qualitative accounts reveal language and mechanisms; behavioral or sales data tests prevalence; customer support and reviews expose real friction but overrepresent people motivated to comment. Record sample, date, geography and selection bias. An insight is strong when it predicts a creative choice and could be falsified by credible contrary behavior. Interview prompts should ask for a recent real instance, sequence of decisions and workaround, not whether a proposed ad “sounds relatable.”
''',

'brand-strategy': r'''## Brand asset hierarchy

Separate **owned and approved** cues from **category conventions** and **new proposals**. An owned pack silhouette or sonic logo can be used immediately if the supplied asset is current. A color common to every competitor cannot by itself provide attribution. A proposed mnemonic may be useful, but needs testing and approval before being treated as existing equity. Assess each cue on recognition, distinctiveness, scalability across placements, production reliability and compatibility with the proposition. The brand kit should specify where the cue appears in a 6-second, 15-second and longer cut, not merely list hex values.

| Decision | Favor this when | Reject or qualify when |
| --- | --- | --- |
| Early package appearance | The product itself resolves the hook or needs fast identification | It disrupts a setup whose payoff depends on mystery; still establish brand meaning promptly |
| Existing character or sonic cue | Audience recognition and usage rights are documented | It is merely “on trend” or licensed for another campaign |
| New visual style | It helps express a verified product role and preserves identity | It recolors packaging or turns a functional product into an implausible luxury object |

## Message and claim governance

Rank the primary proposition, supporting benefit, proof and optional context. A short ad should usually make one central promise; other details can live on the landing page or a separate cut. Brand voice rules need observable positive and prohibited language patterns, not adjectives such as “authentic.” Product truth has its own boundary: a brand may sound confident, but confidence cannot expand the evidence. The first creative review should flag implied outcome guarantees created by visuals as well as written claims. If an asset library is absent, create a provisional inventory of supplied material and state that recognition is untested.''',

'ad-strategy': r'''## Proposition and angle selection matrix

| Test | Strong answer | Weak answer |
| --- | --- | --- |
| Relevance | Resolves a named audience barrier in a real situation | Repeats a generic aspiration such as “better life” |
| Product specificity | Depends on an observable or evidenced product property | Could be relabeled for any competitor |
| Proof | Can be shown, demonstrated or sourced within the format | Requires the audience to accept an unsupported adjective |
| Action fit | CTA follows naturally from current awareness and offer | Pushes purchase before the viewer understands the category |

A USP is a diagnostic question, not a mandatory claim. If no credible exclusive feature exists, choose a differentiated combination of situation, brand cue and proof. Beware of a “pain point” that the brand itself cannot solve. A strong strategy can be summarized as: *for this audience at this moment, show this product truth in this way so they can believe this proposition and take this action*. Test the chain backwards: if the CTA is a store locator, is local availability confirmed? If the proof is a comparison, are conditions fair and documented?
''',

'platform-strategy': r'''## Placement decision table

| Viewing context | Creative implication | Validation |
| --- | --- | --- |
| Vertical feed with interface overlays | Compose product and text for the visible safe region; use a first frame that is readable at small size | Preview the actual placement and current official safe-area guidance |
| Skippable video placement | Establish relevance and brand meaning before the likely skip point, then keep a complete longer argument | Watch the cut with the skip behavior simulated; verify product/brand recognition |
| Sound-forward short video | Give music, speech or authentic effects a narrative job | Review sound-on mix and a captioned muted version |
| Sound-off viewing | Make the proposition legible through action and captions | Ask a cold viewer for the message with audio muted |

Do not apply “vertical,” “UGC” or “fast edits” as universal recipes. A product with tiny interface details may need screen capture, magnification or a slower proof beat. An emotional story may need enough time for setup; compressing it can erase causality. Treat platform research as a set of constraints and hypotheses, then test against the campaign’s own audience and metrics. Exact dimensions, duration limits and UI overlays are live specifications; record source URL and check date in the version matrix.
''',

'performance-creative': r'''## Response-stage diagnosis

| Signal pattern | Plausible creative question | Alternative explanation to check |
| --- | --- | --- |
| Weak initial hold | Does the first frame state a relevant tension or action? | Placement, audience targeting or load behavior |
| Strong hold, weak click | Is the value clear and is the next action earned? | CTA visibility, offer, link placement |
| Strong click, weak qualified visit or sale | Does the hook promise something the page cannot fulfill? | Landing speed, price, inventory, attribution |
| Declining performance over time | Has the audience seen the same mechanism too often? | Auction pressure, targeting expansion, seasonality |

A test plan should declare what remains constant. If opening, body, offer and landing page all change, the result is a route comparison, not evidence that a particular hook caused the difference. Use a portfolio of variant types: one changes audience motivation, one changes proof, one changes visual format. Do not call color swaps “new concepts.” Compare performance within sufficiently similar audience, spend and placement conditions; report uncertainty when sample size or attribution is weak.
''',

}

EXPERT_NOTES.update({
'creative-concept': r'''## Territory architecture

A territory needs a **strategic invariant** that survives multiple executions and a **creative grammar** that makes those executions recognizably related. Record the invariant as an audience tension, brand role and proof requirement. The grammar may govern narrative reversal, recurring visual device, casting behavior, product interaction or sound. A tagline can express the territory but cannot substitute for this system. Require at least three distinct executions before approving a territory; if it produces only one film, classify it as an execution idea. Do not count superficial changes in setting or color as distinct executions.

| Gate | Approval evidence | Failure signal |
| --- | --- | --- |
| Product causality | Removing the product breaks the idea or removes its resolution | Competitor could be substituted without changing the story |
| Brand attribution | Owned cue or brand behavior is integral to the mechanism | Branding is only an end card |
| Repeatability | The mechanism works across different situations and placements | Every extension repeats the same gag |
| Feasibility | Required proof, assets and production method are available or budgeted | Effect depends on unverified performance or fragile generation |

## Selection and handoff

Score territories independently before debating taste. Distinguish **novelty** from **strategic fit**; a less surprising route may be stronger if it makes the product role clear and scalable. Keep rejected territories with reasons: low proof, high production burden, weak brand attribution or audience mismatch. After selection, hand off a concise invariant, explicit allowed variations, first-frame options, proof beats, brand cue placement and prohibited shortcuts. A director should know what can change in a shot without breaking the idea. If the team cannot articulate that boundary, the concept is not yet ready for production.''',

'reference-analysis': r'''## Observation protocol

Classify every assertion as **directly observed**, **inferred**, or **unknown**. Direct observation requires accessible footage, frames or transcript. Still images cannot establish edit pace, camera trajectory, music or the precise order of unseen beats. When a full film is accessible, capture timecodes, first-frame behavior, information revealed at each beat, product visibility, transition logic and ending action. Record uncertainty when a fast cut, composite or offscreen action makes a production technique ambiguous.

| Layer | Question to answer | Transfer boundary |
| --- | --- | --- |
| Attention | What creates an immediate question or change? | Transfer the function, not an identifiable shot |
| Argument | What belief changes and what evidence supports it? | Rebuild with the target product's actual proof |
| Form | How do framing, cut rhythm, type and sound support the argument? | Avoid copying distinctive combinations or sequences |
| Brand | When and how is attribution established? | Replace source-brand assets with approved target cues |

## Mechanism extraction

Write a mechanism statement without source-specific nouns or visual details. Then challenge it: would the mechanism still work with the user's product truth, audience and placement? A reference with excellent craft but a weak product role should not become the default blueprint. Produce an adaptation brief with retained function, deliberately changed expression, production requirements and uncertainty. If the request is to reproduce a reference closely, identify which elements are generic format conventions and which are distinctive expression; keep the user's creative route original. Do not infer effectiveness from award recognition or a platform showcase alone.''',

'copywriting': r'''## Message architecture and timing

Separate four jobs: **hook** establishes a relevant promise or question; **body** advances understanding; **proof** makes the proposition credible; **CTA** states the next action. A line can perform two jobs, but stacking three unconnected benefits usually weakens recall. For every sentence or super, record the supporting product fact and the visual beat that makes it intelligible. If an assertion has no evidence, remove it, qualify it or mark approval pending. The first-person voice of a creator must be tied to that person's real experience.

| Copy mode | Favor when | Primary failure |
| --- | --- | --- |
| Voiceover | Visuals need explanation or emotional point of view | Narration describes what is already obvious |
| Dialogue | Interaction reveals tension or character | Speech sounds written for a brand presentation |
| Supers | Critical fact must survive muted viewing | Text competes with proof or exceeds reading time |
| End card | Action and destination must be unmistakable | Offer conditions or brand cue are missing |

## Editorial pass

Read aloud at intended performance speed with pauses and visual action. Do not use an average words-per-minute formula as a substitute for a timed read: unfamiliar product names, numbers and qualifiers slow comprehension. Cut secondary ideas before accelerating delivery. Check each line for ambiguity, implied absolutes, category jargon, visual contradiction and platform-specific truncation. Deliver a claim ledger with exact source, permitted wording and remaining approval. Script changes that affect the proof shot must be sent back to the director and editor; copy is not an isolated text artifact.''',

'creative-director': r'''## Direction as a production system

Translate abstract adjectives into observable choices. A direction such as “confident” needs a defined stance toward camera, motion, light contrast, performance restraint, sound and graphic hierarchy. Each choice should support a planned audience perception or product truth. Keep **visual invariants** separate from **expressive range**: packaging, logo and recurring brand cues may be fixed while location, talent or edit energy vary by audience. This distinction prevents a moodboard from becoming an inflexible shot recipe.

| Review level | Decision owned by Creative Director | Handoff test |
| --- | --- | --- |
| Strategy | Territory, proposition and intended response | Specialists can state the same core idea independently |
| Visual system | Palette, materials, lens/movement tendencies, product treatment | Adjacent shots feel related without suppressing useful variation |
| Proof | Which moment earns belief and how it is shown | The key claim is visible or sourced, not merely narrated |
| Brand | Distinctive cues and memory structure | The ad remains attributable without a final logo-only rescue |

## Review discipline

Review outputs in sequence: first-frame comprehension, proof clarity, brand attribution, emotional progression and execution feasibility. Resist solving a weak proposition by adding visual complexity. When two references conflict, identify which specific quality each is meant to contribute, then decide what to keep and discard. Issue a revision as a change to a defined system variable, not an unbounded “make it more premium” note. The Creative Director's approval does not certify product claims, rights or final media quality; those require their own evidence gates.''',

'director': r'''## Spatial and action design

Create a scene map before shot descriptions: subject entrances, product position, action axis, camera side, eyelines and changes of state. The viewer must understand where the product is, who operates it and what changed. Camera movement should reveal an action, shift perspective or connect spaces; movement for energy alone may make a demonstration harder to judge. Plan the moment before and after the key action so editorial has usable entry and exit handles.

| Shot function | Minimum information | Common failure |
| --- | --- | --- |
| Establish | Context and spatial relationship | Too much setup before the advertising task begins |
| Action | Who acts, where the product is, visible start/end state | Hands or props hide the mechanism |
| Reaction | Why the action matters to the subject | Reaction is disconnected from proof |
| Detail | Specific material or mechanism to inspect | Detail is attractive but not interpretable |

## Coverage and continuity gate

Specify shot size, axis, camera height, blocking, action state and intended cut point for every shot. Preserve screen direction through adjacent coverage unless the change is established. If a generated clip cannot reliably perform a long chain of actions, split the beat into independently verifiable shots. Budget performance time, not just edit length. Handoff must contain a continuous timeline, stable shot IDs and notes on props, wardrobe, hands and product state. A storyboard with beautiful frames but ambiguous action fails the director's contract.''',

'cinematography': r'''## Camera choice hierarchy

Begin with the information the viewer must perceive, then choose shot scale, viewpoint, distance, focus and light. A close-up is useful when it reveals a mechanism; it fails if a hand or reflection blocks the evidence. A wide shot is useful for context; it fails when product identity becomes too small. Describe focal length by its perceptual intent and physical constraints rather than assigning a fashionable number. Evaluate how the frame changes after vertical crop and interface overlays.

| Visual problem | Camera response | Check before approval |
| --- | --- | --- |
| Small product action | Stable angle, sufficient depth of field, clear hand separation | Action readable at delivery size |
| Reflective pack | Controlled key and flag placement | Label and silhouette remain true |
| Spatial transition | Establishing angle or motivated camera move | Screen direction and eyeline remain legible |
| Text overlay | Planned negative space without hiding proof | Actual typography fits safe region |

## Lighting and shot continuity

Document key direction, quality, color temperature intent, exposure priority and reflective surfaces. Keep enough continuity across coverage that the product's color and material do not appear to change. Deliberate lighting shifts need a narrative reason and an edit plan. For synthetic generation, translate these choices into observable language and reference images; do not assume exact optical controls exist. Handoff should include a camera card and a continuity comparison of adjacent shots, with particular attention to product label, focus plane, movement direction and light source logic.''',

'art-direction': r'''## Production world and asset truth

Maintain separate lists for **hero product**, **functional props**, **background dressing** and **wardrobe**. Hero product details use approved asset references; functional props must support the action safely and plausibly; background dressing establishes audience context without competing for attention. Every item needs a continuity state and an owner. A visual reference can suggest material or atmosphere but does not authorize changes to packaging, feature geometry or logo.

| Control | Required record | Failure to catch |
| --- | --- | --- |
| Product | Variant, color, shape, label, scale and orientation | Synthetic or practical pack mismatch |
| Set | Geometry, sightlines, practical light and clutter | Camera cannot see the proof action |
| Props | Action role and pre/post state | Object teleports or implies unsupported use |
| Wardrobe | Palette, texture and continuity by shot | Talent visually competes with product cue |

## Approval and reset plan

Create an art bible with asset IDs, exact attributes, materials, palette, scene plans and prohibited elements. Define what the crew or generation operator must reset between takes or variants. Check labels and competing marks on the final intended crop, not just in design files. If a product asset is missing, use a provisional placeholder only for composition exploration and block final approval. For generated backgrounds, separate environment generation from exact pack depiction when the model cannot preserve typography or geometry. Handoff includes the canonical reference sheet and a shot-state ledger so visual consistency can be audited later.''',

'editing': r'''## Edit logic and information load

Build the cut around changes in audience understanding. Mark the beat that introduces the problem, the beat that proves the proposition and the beat that gives direction. A cut can compress time, reveal a contrast or redirect attention; a transition should have a narrative or spatial purpose. Avoid treating rapid cutting as a universal retention rule. The proof beat must remain on screen long enough to be perceived at delivery size and playback speed.

| Edit decision | Use when | Verification |
| --- | --- | --- |
| Match action | Preserving a continuous product operation | Entry and exit states align |
| Montage | Compressing repeated or parallel activity | Viewer still understands cause and result |
| Graphic insert | Explaining a fact the image cannot carry | Claim wording and hold time are approved |
| Hard cut | Creating a clear new beat or emphasis | Spatial jump does not confuse the product action |

## Timeline audit

Inventory actual source assets and record missing shots separately. For each timeline item, capture source in/out, destination in/out, purpose, audio, caption, transition and brand cue. Verify arithmetic: total duration, overlaps, black frames, subtitle holds, audio tails and CTA screen time. Review sound-on and muted cuts independently. Placement versions may reorder or replace shots but must preserve the approved proposition and evidence. Do not claim the edit is finished until the exported file has been inspected for frame, audio, caption and encoding defects. Any cut that creates an implied unsupported before/after result is a hard failure.''',

'sound': r'''## Sonic role and mix hierarchy

Assign each sound layer a job: speech communicates a claim or point of view; authentic product sound evidences action; ambience establishes space; music controls energy and emotion; a brand mnemonic supports recognition. Avoid adding layers that all compete in the same frequency and attention band. The mix priority should be explicit by beat, with speech and critical product action protected. A designed effect must not imply a mechanism or performance the product does not have.

| Layer | Decision record | Acceptance check |
| --- | --- | --- |
| Voice | Speaker, performance intent, pronunciation, pace and rights | Words and qualifiers intelligible on intended devices |
| Music | Source, rights, entrance, energy change and exit | Supports message without masking it |
| SFX | Triggering image, source and realism boundary | Synchronizes with actual visible action |
| Ambience | Spatial continuity and transition | Does not contradict location or cut |

## Delivery and accessibility

Use a timecoded cue sheet tied to the approved edit version. Check sync at transitions and in shots whose action supplies proof. Review on phone speakers and headphones; do not assert a measured loudness without an actual file and meter. Maintain a muted-viewing path through captions and visual action. Rights status has three states: cleared, pending and unusable; only cleared assets belong in a final deliverable. When dialogue needs lip sync, route to the generation capability only if an enabled provider and suitable face footage exist; otherwise plan voiceover or alternate coverage.''',
})

EXPERT_NOTES.update({
'prompt-compiler': r'''## Prompt compilation contract

A prompt package has five separable components: **visual anchors**, **subject action**, **camera action**, **scene action**, and **preservation constraints**. Avoid blending them into a long prose paragraph full of contradictory adjectives. For I2V, the input frame owns appearance and composition; text should chiefly describe motion and what must stay stable. For T2V, the prompt must establish the visible subject and environment more fully. An endpoint-control mode is eligible only when the provider actually supports it for the chosen model and duration.

| Source shot property | Prompt representation | Validation |
| --- | --- | --- |
| Identity-critical pack or person | Approved reference ID plus short preservation rule | First, middle and final frames match canonical attributes |
| One physical action | Observable verb, direction and end state | Motion follows the intended sequence |
| Camera behavior | Locked, pan, dolly or other supported motion language | Background parallax and framing behave accordingly |
| Narrative purpose | Desired visual evidence, not abstract emotion alone | A reviewer can infer the shot's job |

## Versioned iteration

Store the shot card, compiled prompt, provider mode/version, references, settings and output asset together. Change one causal dimension per retry: action complexity, reference strength, camera motion or shot duration. Do not respond to a geometry error by adding more mood adjectives. If exact text or logo cannot be preserved, route to compositing or a practical insert. The compiler must never present a prompt as a generated shot. Mark unsupported controls, ambiguous action state and missing reference transport before any paid call.''',

'model-routing': r'''## Capability gates before ranking

Model choice starts with **hard requirements**: input mode, reference count, frame controls, aspect ratio, duration, output format, audio behavior, rights and account availability. A provider that fails a hard requirement is ineligible regardless of leaderboard rank. Only after filtering should the runtime compare quality, latency, price and reliability. Record the date and model version for every capability claim; static routing folklore becomes obsolete quickly.

| Shot requirement | Routing consequence | Evidence |
| --- | --- | --- |
| Exact packaging identity | Prefer modes accepting an approved image or a compositing path | Local reference-preservation sample |
| Complex physical action | Compare motion/physics performance on representative shots | Direct media inspection, not aggregate score alone |
| Controlled start and end state | Use endpoint mode only if connector and provider expose it | Current API documentation and test response |
| Tight budget or deadline | Estimate attempts, queue latency and fallback cost | Recent local history and current pricing |

## Local benchmark protocol

Choose a small, representative subset that stresses the campaign's actual risks, not only easy beauty shots. Hold reference quality, duration and acceptance rubric constant when comparing providers. Score product fidelity, action coherence, usable frames, audio and cost per accepted shot. A high aggregate benchmark score may be irrelevant if the campaign depends on exact typography. Persist failure types as well as wins; the fallback should have a different failure profile. When no provider qualifies, route the creative plan toward stills, practical footage, compositing or a simpler action rather than fabricating compatibility.''',

'image-generation': r'''## Asset classes and approval thresholds

Different image roles require different tolerances. **Exploratory style frames** may be assessed for mood and composition. **Canonical character or environment frames** require repeatability across later shots. **Hero product frames** require exact branded details and production-ready crop. Do not evaluate all three with the same aesthetic score. Split a complex image into layers when appropriate: approved pack, generated environment, shadow/reflection treatment and editable typography.

| Asset role | Hard gate | Downstream handoff |
| --- | --- | --- |
| Product hero | Pack geometry, color, label and logo match approved source | Asset ID, crop and exact-identity rules |
| Character anchor | Distinctive traits and wardrobe are stable | Reference set and allowed variation |
| Environment anchor | Geography and light direction support planned coverage | Scene layout and continuity notes |
| Keyframe | Entry/exit state matches storyboard | Camera and motion constraints for video |

## Review protocol

Inspect the full-resolution file at intended placement size. Check hands, edges, reflections, product-label legibility, typography, perspective and negative space. Record whether defects are local and compositable or require a new generation. A close-up of a branded object should not be approved on a small preview. Keep prompt, model version, seed if available and input references with the asset; otherwise a later shot cannot reliably reproduce it. Approval means the image is fit for its declared role, not that all derivatives are automatically approved.''',

'video-generation': r'''## Shot decomposition and mode choice

Break motion into shots whose action, camera and end state can be evaluated. Long multi-action prompts increase ambiguity: the model may omit an action, reverse order or drift identity. Use T2V for exploratory motion without fixed appearance, I2V when the entry frame anchors a product or character, and endpoint control only when supported and when both frames describe a physically plausible path. Audio generation, if available, has its own rights and sync checks.

| Failure risk | Preventive design | Inspection point |
| --- | --- | --- |
| Identity drift | Approved reference and limited camera/subject change | Every high-motion interval |
| Physics error | Simpler action, shorter duration, clear contact points | Action start, contact and result |
| Temporal discontinuity | Explicit entry/exit state and adjacent-shot context | First/last frames and cut boundary |
| Brand-text mutation | Exact source asset or post composite | All frames where text is visible |

## Acceptance procedure

Confirm request settings and reference transport before submission. An asynchronous job ID is a pending state, not a usable clip. After completion, verify playable file, dimensions, duration and asset persistence; inspect full-speed playback plus timecoded samples around the key action. Decide accept, targeted repair, alternate construction or stop under a recorded attempt budget. Store every candidate with the reason it was rejected. A technically smooth clip that fails the advertising proof beat is not accepted.''',

'consistency': r'''## Identity versus state

An **identity invariant** is a property that should not change across the campaign, such as product silhouette, approved label, face structure or owned brand color. A **state variable** legitimately changes through action, such as lid position, clothing layer, prop location or time of day. A **style parameter** may vary within an approved range. Put these in separate ledger columns; otherwise reviewers may either reject intentional changes or miss identity drift.

| Comparison | Inspect | Decision |
| --- | --- | --- |
| Shot to canonical reference | Exact product/person attributes | Reject unauthorized identity change |
| Adjacent shot boundary | Hand, prop, posture, light and direction | Require visible transition or repair |
| Intra-shot time samples | Morphing, flicker and geometry | Reject temporal mutation even if endpoints match |
| Platform variants | Cue and claim preservation after crop/edit | Rebuild framing if core identity is lost |

## Dependency control

Every shot should declare entry state, action and exit state. The next shot's entry must match or show a motivated change. When a canonical reference changes, identify every derived frame, prompt, video and edit that must be revisited; do not silently redefine the reference to match a flawed generation. Prioritize product, people and causal props over harmless background variations. Report unresolved discrepancies with timecode and severity so the editor can decide whether a cut hides or magnifies them. Continuity approval should cite the exact canonical asset version.''',

'lip-sync-audio': r'''## Preconditions and synchronization chain

Lip sync has strict prerequisites: final approved spoken text, a mastered audio file, rights to the voice, a face shot with a readable mouth, compatible provider controls and a target timeline. If any are absent, do not describe lip sync as executed. Speech generation and mouth synchronization are separate operations; each produces its own artifact and must be inspected before the next stage. A line changed after synchronization invalidates the mouth animation.

| Stage | Required check | Failure route |
| --- | --- | --- |
| Script lock | Exact words, language, pronunciation and duration | Revise line before generating audio |
| Voice asset | Consent, identity, performance, intelligibility | Re-record or choose authorized voice |
| Sync asset | Mouth movement follows phonemes and pauses | Re-align, change coverage or use VO |
| Final mix | Dialogue remains intelligible with music and ambience | Remix and recheck captions |

## Quality and rights boundary

Inspect at full playback speed and at dense consonant or closed-mouth moments, not only on a still frame. Check facial deformation, jaw consistency, timing drift and cut-boundary continuity. Keep captions tied to the final script and actual audio timing. Do not use an unauthorized person's voice or suggest that a music track is cleared without a rights record. Where the current application lacks a supported provider, the skill can produce a production plan and required integration contract only; it must label the media operation unperformed.''',

'qc-regeneration': r'''## QC gate and repair selection

QC must inspect the actual output file and compare it to the shot contract, canonical references and adjacent shots. A prompt, thumbnail or provider completion flag is insufficient. Apply hard gates first: missing asset, unreadable or changed brand identity, false product behavior, impossible required action, rights violation. Then score graded dimensions such as aesthetics, pacing, flicker and minor background continuity. The defect record needs timecode, observable evidence, likely cause and proposed repair.

| Defect mechanism | First intervention | Stop or reroute condition |
| --- | --- | --- |
| Action overload | Reduce verbs or divide into shots | Narrative beat cannot survive split |
| Weak reference control | Improve canonical asset or choose a mode with stronger anchoring | Provider still mutates identity |
| Camera-induced drift | Reduce motion or change camera path | Proof becomes unreadable |
| Provider-specific artifact | Try eligible fallback with the same rubric | Cost or time ceiling reached |

## Comparison discipline

Predeclare attempt ceiling and acceptable residual defects. Compare candidate to baseline at identical timecodes and delivery size, not by selecting the best still from each. Preserve accepted aspects when revising one variable. Record total cost per accepted shot, not only cost per render. If the failure is strategic or factual, return to upstream strategy or source assets; generation retries cannot cure a wrong proposition. An unresolved hard defect remains a failed shot even if the latest candidate is the best available.''',

'creative-quality': r'''## Independent creative assessment

Evaluate the work from the audience's first exposure before reading the internal rationale. Capture the immediate inferred product, problem, benefit and emotion. Then compare that account with the intended brief. This reduces the tendency to “see” a strategy that exists only in the presentation. Separate **craft quality** from **advertising effectiveness**: polished photography can coexist with weak product relevance, and an unusual concept can be clear even with rough production.

| Dimension | Evidence to inspect | Failure mode |
| --- | --- | --- |
| Clarity | First-view takeaway and information order | Audience cannot infer the proposition |
| Relevance | Audience tension and product role | Story could belong to any brand |
| Distinctiveness | Mechanism and owned cues | Work looks interchangeable in category |
| Craft coherence | Image, edit, copy and sound serving one idea | Departments pull toward different meanings |

## Review and revision protocol

Record specific beat or timecode evidence for every low score. Ask whether a revision can repair the current territory or whether the territory itself is flawed. Prioritize changes that improve truth, comprehension and brand attribution before polish. Do not equate a jury award or a high platform engagement rate with success for this campaign's objective. If the artifact is only a text concept, mark judgments about real performance, motion and sound provisional. The review output should specify the smallest change likely to improve the audience takeaway and what observation would verify it.''',

'brand-compliance': r'''## Claim, asset and implication audit

Review three layers separately: **literal claims** in VO, dialogue and supers; **visual implications** produced by demonstration, before/after structure or comparison; and **brand asset fidelity** including logo, pack, color and sonic cues. A claim can be unsupported even if it is implied rather than spoken. Keep an evidence ledger with source document, scope, conditions, date, approver and permitted wording. Do not treat a previous draft as approval evidence.

| Review item | Pass evidence | Escalation |
| --- | --- | --- |
| Product feature | Approved specification or test under matching conditions | Feature is inferred from a generated image |
| Outcome claim | Substantiation matches strength and audience scope | Absolute wording exceeds limited study |
| Offer | Price, dates, eligibility and destination are documented | Terms are missing or contradictory |
| Identity | Exact approved assets and allowed transformations | AI output alters label or shape |

## Correction and sign-off

For each issue, record observed expression, source rule, severity and smallest correction. Prefer removing or narrowing a claim to burying a critical qualifier in unreadable text. Where legal or regulatory interpretation is required, mark specialist review pending; a skill is not an attorney or regulator. Reinspect the final rendered frame and audio after edits, because a correct script can still become a misleading ad through crop, timing or juxtaposition. A pass applies to the inspected version only; any later creative or source change reopens the affected items.''',

'performance-evaluation': r'''## Measurement and causal boundary

Before diagnosis, define each metric's numerator, denominator, attribution window and collection method. Confirm spend, exposure, placement, audience, time period and offer changes. A high view rate says little about purchase if the audience is poorly matched; a low conversion rate may reflect landing or inventory problems. Treat platform dashboards as observational unless a controlled test or credible comparison design supports a causal conclusion.

| Funnel signal | First creative review | Confounder to inspect |
| --- | --- | --- |
| Initial attention | First frame, relevance and brand timing | Placement and targeting |
| Retention | Information sequence, proof pacing and repetition | Video loading and length distribution |
| Click/action | Value clarity, CTA and promise match | Offer, link and page usability |
| Business result | Qualified traffic and conversion quality | Attribution, price, stock and seasonality |

## Experiment decision record

For each proposed test, state hypothesis, changed creative variable, invariants, eligible audience, primary metric, guardrail metric, minimum observation window and stopping rule. If several variables change, label the result a route comparison. Do not report percentage uplift without baseline volume and uncertainty. Rank next actions by expected learning as well as expected outcome; a cheap test that distinguishes two plausible causes may be more valuable than another decorative variant. Archive unsuccessful hypotheses so the team does not repeatedly rediscover the same weak angle.''',

'generation-quality': r'''## Media-level dimension taxonomy

Separate **identity fidelity**, **spatial geometry**, **temporal coherence**, **physical plausibility**, **cinematic intention** and **delivery fitness**. Aggregate benchmark scores can suggest what to inspect, but local acceptance must use the actual branded asset and shot purpose. A clip may score well on smoothness while changing the package; it may preserve the package while failing the action. Audio and lip sync are evaluated only when the artifact actually contains them.

| Dimension | Inspection method | Hard failure boundary |
| --- | --- | --- |
| Identity | Compare sampled frames to canonical pack/person assets | Product, logo or character changes materially |
| Motion/physics | Review action onset, contact, trajectory and result | Required action becomes impossible or misleading |
| Time | Review start, middle, end and cut boundaries | State jumps without a motivated transition |
| Delivery | Verify file, ratio, resolution, audio and caption compatibility | Asset cannot be used in intended placement |

## Evidence and escalation

Record every defect with timecode, frame reference, severity and whether it is local or recurrent. A score should distinguish uninspected from passed; absence of evidence is not a zero-defect result. Compare repeated generations under the same rubric and note the cost of reaching an accepted shot. If a defect is inherent to the requested motion or provider mode, recommend a different shot construction rather than further prompt ornamentation. Keep creative quality and generation quality as separate reviews so technical polish does not conceal a weak advertising idea.''',
})

ADDITIONAL_CONTROLS = {
'planner': r'''## State transitions and completion semantics

Use explicit states such as `blocked`, `ready`, `running`, `needs_review`, `accepted`, `stale` and `failed`; do not infer success from the absence of an error. Only a validated artifact may enter `accepted`. The transition from `needs_review` to `accepted` records reviewer, criteria and version. A failed independent branch should not invalidate unrelated accepted artifacts, while a corrected upstream source should mark every dependent output `stale`. Replanning must cite the triggering event and show which tasks were added, removed or rescheduled. A run may stop with partial usable work, but must identify the missing acceptance gates and never present partial completion as full delivery.''',
'tool-use': r'''## Parameter and side-effect discipline

Before calling a model, bind every parameter to a requirement or a provider default and record which. Validate mutually exclusive modes, maximum reference counts, supported aspect ratios and duration ranges locally when capability metadata exists. An editor operation should declare source version and target version; a search operation should record the exact page retrieved and access date; a provider call should retain request and returned job IDs. Distinguish retryable transport failure from content failure. Do not rerun an operation with irreversible external effects merely because the response was lost; query status or reconcile by idempotency key first.''',
'memory-context': r'''## Retention and retrieval policy

Retain approved identity and claim records until explicitly superseded. Keep rejected ideas only as compact decision history when they would otherwise reappear; avoid injecting them into every Agent prompt. Preserve the full provenance of generated assets even when conversational context is summarized. Retrieval should answer a role-specific question and include the smallest relevant evidence set. If no approved source exists, the context pack must say “unverified” rather than silently omit the field; omission could be mistaken for permission to invent. A stale asset remains readable for audit, but should not be selected as a current reference.''',
'critic-recovery': r'''## Severity and stopping policy

Use a severity ladder: **blocker** for truth, rights, identity or unusable asset failures; **major** for broken comprehension, causal continuity or required proof; **minor** for local craft defects that do not change meaning. Repair blockers before scoring aesthetic alternatives. For every attempted repair, record the expected change and the observation that would prove improvement. If the same cause persists after the configured attempts, change the production method or escalate to a human decision. Never suppress a blocker by averaging it with strong scores in other dimensions.''',
'brief-interpretation': r'''## Brief readiness gate

A brief is ready for concept development when the product or service is identifiable, the intended audience situation is concrete enough to shape execution, the ad's primary job is stated, the proposition has a plausible proof path, and restrictions are known. It is ready for final copy only when claim wording and CTA destination are confirmed. It is ready for media generation only when exact product assets and visual prohibitions are available. These are different readiness levels; a team may explore concepts while a claim is pending but must label downstream work accordingly. Preserve the original client language alongside the normalized brief so a reviewer can challenge the interpretation.''',
'consumer-insight': r'''## Evidence confidence and transfer test

Confidence should be attached to the *behavioral inference*, not to how elegantly the sentence is written. Rate source quality, recency, sample relevance, consistency across sources and plausible rival explanations. A qualitative insight can be strategically useful without population prevalence, but its scope must remain narrow; a large sample can be statistically robust yet fail to explain motivation. Before transfer into a territory, ask whether the product genuinely changes the friction, whether the audience can recognize the situation quickly, and what observation would falsify the bridge. If the bridge depends on an unverified product property, the insight remains separate from the proposition until that property is confirmed.''',
'brand-strategy': r'''## Attribution and asset governance

Check attribution in three ways: recognition of a distinctive asset without the logo, correct association of the story with the brand, and continuity of cues across placements. None is guaranteed by logo screen time alone. Maintain a source-of-truth asset register with version, format, crop rules, usage rights and owner. For newly proposed cues, specify what must be tested before standardization; do not claim they already hold memory equity. When a brand rule conflicts with legibility or platform UI, propose an approved adaptation rather than silently breaking the rule. The output should distinguish mandatory, recommended and experimental cues.''',
'ad-strategy': r'''## Proof hierarchy and objective discipline

Rank proof by its ability to support the exact proposition: direct observation of a relevant action, documented test under matching conditions, qualified third-party evidence, authorized testimony, and finally unsupported assertion. These are not interchangeable, and a strong production treatment cannot promote weak proof into fact. Separate communication outcomes (understanding, brand association, intent) from business outcomes (qualified visits, trial, sales); state which are measured and which remain hypotheses. A strategy should name its likely failure point and competing explanation before production. If the objective is broad awareness, do not overfit every asset to a click; if the objective is immediate response, do not hide the offer and action behind a long atmospheric reveal.''',
'platform-strategy': r'''## Version governance

Create one invariant record for proposition, claims, product identity and brand cues, then a separate adaptation record for each placement. Every adaptation needs the current specification source, last verified date, crop plan, sound and caption plan, CTA behavior and required source assets. Review on the actual placement mockup rather than an isolated frame. If a platform recommends a tactic that conflicts with the brand's approved tone, preserve the underlying function of the tactic while changing its expression. Treat platform performance claims as population-level guidance; acceptance depends on the local campaign's creative and measurement results.''',
'performance-creative': r'''## Experimental validity gate

A creative test is interpretable when variants share a defined audience, placement, offer, landing experience, attribution window and enough exposure to observe the target outcome. When those conditions cannot be held, label the result observational and document the confounds. Decide before launch whether the goal is to optimize a known mechanism or learn which mechanism works; these imply different variant breadth. Preserve a truthful promise even if an exaggerated hook temporarily wins a click metric. After review, record what the result updates in the creative model, not merely which asset received more spend.''',
}
for skill_id, controls in ADDITIONAL_CONTROLS.items():
    EXPERT_NOTES[skill_id] += '\n\n' + controls
