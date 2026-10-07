"""Build Sparkle's capability instructions and separate research provenance."""
from pathlib import Path
import json
import re
from studio_skill_expert_notes import EXPERT_NOTES
from studio_skill_specialization_notes import CORE_NOTES, SPECIALIZATION_NOTES
from studio_skill_advanced_notes import ADVANCED_NOTES

ROOT = Path(__file__).resolve().parents[1] / 'src/lib/studio/skills/library'
SOURCES = {
'A1': ('Anthropic, Building Effective Agents', 'https://www.anthropic.com/engineering/building-effective-agents'),
'A2': ('OpenAI, Agents SDK', 'https://developers.openai.com/api/docs/guides/agents/sdk'),
'A3': ('OpenAI, Agents API errors', 'https://developers.openai.com/api/docs/guides/agents-api/errors'),
'A4': ('Microsoft AutoGen, Teams', 'https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/teams.html'),
'A5': ('LangGraph, Thinking in LangGraph', 'https://docs.langchain.com/oss/javascript/langgraph/thinking-in-langgraph'),
'B1': ('Effie, 2026 entry kit', 'https://current.effie.org/2026/Materials/2026_Effie%20Awards%20US_Entry%20Kit.pdf'),
'B2': ('D&AD, Tide case study', 'https://www.dandad.org/insights/awards/tide-ad-campaign-case-study-insights'),
'B3': ('IPA, Binet and Field effectiveness research', 'https://ipa.co.uk/knowledge/effectiveness-research-analysis/les-binet-peter-field'),
'B4': ('ARF, Ogilvy Award sample cases', 'https://thearf.org/arf-events/2023-ogilvy-awards-sample-cases/'),
'B5': ('Motion, Creative Strategy Engine', 'https://motionapp.com/library/frameworks/creative-strategy-engine'),
'B6': ('Motion, Hook Writing', 'https://motionapp.com/library/frameworks/hook-writing'),
'B7': ('Motion, Creative Analysis', 'https://motionapp.com/library/frameworks/creative-analysis'),
'B8': ('TikTok, Creative Codes', 'https://ads.tiktok.com/business/en-US/creative-codes'),
'B9': ('Meta, Reels ads guidance', 'https://www.facebook.com/business/ads/facebook-instagram-reels-ads'),
'B10': ('Google, YouTube ABCD playbook', 'https://www.thinkwithgoogle.com/_qs/documents/18468/ABCDs_PDFPlaybook_April2022_Final_1mSQVej.pdf'),
'B11': ('TikTok, Top Ads overview', 'https://ads.tiktok.com/business/library/NA_Creative_Center_Top_Ads_One_Pager.pdf'),
'B12': ('Ipsos, Power of You', 'https://www.ipsos.com/en/power-you-why-distinctive-brand-assets-are-driving-force-creative-effectiveness'),
'B13': ('Ipsos, Emotion, Attention and Memory', 'https://www.ipsos.com/en/emotion-attention-and-memory-advertising'),
'B14': ('ARF, Ogilvy Awards judging criteria', 'https://thearf.org/wp-content/uploads/2024/03/DOA24_ENTRY-KIT-V4.pdf'),
'B15': ('Ogilvy, What Is the Big IdeaL?', 'https://www.ogilvy.com/sites/g/files/dhpsjz106/files/pdfdocuments/Ogilvy_WhatsTheBigIdeaL.pdf'),
'C1': ('StudioBinder, Composition', 'https://www.studiobinder.com/blog/rules-of-shot-composition-in-film/'),
'C2': ('StudioBinder, Blocking and Staging', 'https://www.studiobinder.com/blog/blocking-and-staging-scenes/'),
'C3': ('StudioBinder, Production Design', 'https://www.studiobinder.com/blog/what-is-production-design-in-film/'),
'C4': ('StudioBinder, Continuity Editing', 'https://www.studiobinder.com/blog/what-is-continuity-editing-in-film/'),
'C5': ('StudioBinder, Screen Direction', 'https://www.studiobinder.com/blog/what-is-screen-direction-in-film/'),
'C6': ('Blackmagic Design, DaVinci Resolve Training', 'https://www.blackmagicdesign.com/products/davinciresolve/training'),
'D1': ('Runway, Gen-4 Video Prompting', 'https://help.runwayml.com/hc/en-us/articles/39789879462419-Gen-4-Video-Prompting-Guide'),
'D2': ('Runway, Image to Video Prompting', 'https://help.runwayml.com/hc/en-us/articles/48324313115155-Image-to-Video-Prompting-Guide'),
'D3': ('Google AI for Developers, Veo API', 'https://ai.google.dev/gemini-api/docs/veo?hl=en'),
'D4': ('Artificial Analysis, Video Leaderboard', 'https://artificialanalysis.ai/embed/text-to-video-leaderboard/leaderboard/text-to-video'),
'E1': ('VBench paper', 'https://arxiv.org/abs/2311.17982'),
'E2': ('VBench 2.0 paper', 'https://arxiv.org/abs/2503.21755'),
'E3': ('Meta, Movie Gen Bench', 'https://github.com/facebookresearch/moviegenbench'),
'E4': ('FilmBench paper', 'https://arxiv.org/abs/2607.24241'),
'E5': ('Video-Bench', 'https://github.com/Video-Bench/Video-Bench'),
}
SOURCE_HEURISTICS = {
'A1':'fixed workflows, routing and evaluator loops', 'A2':'tool, state and guardrail contracts',
'A3':'error classes, saved-state checks and bounded retries', 'A4':'specialist handoffs and dependency discipline',
'A5':'state checkpoints and recoverable steps', 'B1':'objective-to-result effectiveness chain',
'B2':'a category insight turned into a branded creative mechanism', 'B3':'distinct brand and response effects',
'B4':'research-led insight-to-execution evidence', 'B5':'motivation-to-angle-to-format decomposition',
'B6':'hook promise and payoff mechanics', 'B7':'stage-specific creative diagnosis',
'B8':'opening, body, close and native placement cues', 'B9':'Reels-specific composition and placement',
'B10':'attention, branding, connection and direction', 'B11':'selected high-performing ads as hypotheses',
'B12':'distinctive visual and sonic brand assets', 'B13':'emotion, attention and memory links',
'B14':'research quality, insight, idea and impact criteria', 'B15':'brand purpose as a coherent creative platform',
'C1':'framing and visual attention hierarchy', 'C2':'subject-camera blocking and staging',
'C3':'sets, props, costume and coherent world-building', 'C4':'spatial and action continuity across cuts',
'C5':'screen direction and viewer geography', 'C6':'editing, sound and delivery craft training',
'D1':'simple subject and camera motion instructions', 'D2':'input-image anchoring in image-to-video',
'D3':'current Veo modes and control eligibility', 'D4':'changing model quality comparisons',
'E1':'temporal, identity and motion dimensions', 'E2':'physics, commonsense and controllability dimensions',
'E3':'human motion and physics stress dimensions', 'E4':'cinematic-language evaluation',
'E5':'human-aligned generative-video benchmarks',
}

SKILLS = {}
def add(id, name, layer, placement, status, description, model, inputs, rules, procedure, output, failures, rubric, sources):
    SKILLS[id] = dict(name=name, layer=layer, placement=placement, status=status, description=description,
                      model=model, inputs=inputs, rules=rules, procedure=procedure, output=output,
                      failures=failures, rubric=rubric, sources=sources)

# L0: these are runtime policies, not optional UI skills.
add('planner','Planner','L0','runtime','partial','Plan and revise an advertising production run from explicit dependencies, evidence gates and budget limits.',
    'Plan around deliverable dependencies, not a ceremonial list of agents. A script can begin from a verified brief; a shot plan cannot claim a finalized product appearance before that source is settled. Keep a state ledger of objective, evidence, decisions, artifact versions and open blockers. Use fixed orchestration for routine flows and replan only when observed state changes.',
    'User objective; requested deliverables; available files and media; deadline and spend ceiling; Agent capabilities; current artifact/version; unresolved facts.',
    'Require an observable output and acceptance gate for each task; run independent research or design branches concurrently only when they cannot overwrite the same artifact; prioritize critical-path blockers over optional polish; replan after an invalid result, changed brief, unavailable provider or new evidence; cap iteration by time, cost and quality gain.',
    'Normalize the objective into deliverables and measurable acceptance criteria; classify facts as confirmed, inferred or missing; build a dependency graph with producer and consumer for every artifact; schedule independent tasks and record versioned outputs; after each task compare result to its contract and decide advance, repair, reroute or ask; finish when all required gates pass or report the exact blocked dependency.',
    'Plan record: task_id, owner, input_artifact_ids, output_artifact_id, dependency_ids, evidence_gate, cost_estimate, status, revision_reason. Return the current critical path and next executable task.',
    'If a late brand correction invalidates a concept, mark dependent script and shots stale and regenerate only those; if cost ceiling is reached, stop optional variants and preserve usable artifacts; if an output is merely stylistically weak, route to the relevant critic instead of restarting the whole plan.',
    'Score 0–2 each: dependency correctness, observable gates, revision selectivity, cost discipline. Pass at 7/8; any missing owner or fabricated completed artifact is a hard fail.',
    'A1 A2 A3 A4 A5')
add('tool-use','Tool Use','L0','runtime','partial','Choose and call available search, model, file and editor tools with explicit contracts and observable results.',
    'A tool is chosen for the evidence or artifact it can produce. Search discovers sources; a model proposes content; an editor changes an artifact; a validator checks it. Neither a prompt nor a proposed edit counts as an executed action. Tool success requires checking the returned identifier, file or error.',
    'Requested operation; permitted tools; exact input asset IDs; provider capabilities and current limits; expected output type; user authorization; idempotency information.',
    'Prefer the narrowest tool that meets the requirement; check provider specs at call time when they can change; never pass a local path as a remotely accessible reference without confirming transport; distinguish read, generation and external publication side effects; before retrying a non-idempotent call, check whether it already produced an asset.',
    'Define input schema and expected postcondition; verify asset existence and format; select a tool and parameters supported by the current provider; call once with a request ID; inspect structured response and saved state; validate dimensions, duration and asset linkage; log outcome and cost; escalate errors by class rather than repeating unchanged parameters.',
    'Tool log: tool, provider, capability_version, request_id, input_asset_ids, parameters, returned_asset_ids, latency, cost, validation_status, error_class.',
    'Authentication or unsupported capability: stop that branch and ask for configuration; transient timeout: inspect state, then one bounded retry; malformed input: repair input; empty media URL: treat as failure even if text says success.',
    'Score 0–2 each: tool fit, parameter validity, outcome verification, side-effect control. Pass at 7/8; claiming completion without an output artifact is a hard fail.',
    'A1 A2 A3 A5 D1 D3')
add('memory-context','Memory & Context','L0','runtime','partial','Maintain versioned project, brand and artifact state with provenance and conflict resolution.',
    'Memory is a selective state store, not an ever-growing transcript. Persist source facts, user preferences, approved decisions and produced artifact IDs separately. Each claim needs source, timestamp, confidence and scope. Current user corrections outrank older inferred summaries; brand documents outrank stylistic guesses.',
    'Project and campaign IDs; brief; approved brand assets; conversation; current script/shot versions; generation assets; explicit user corrections.',
    'Retrieve only state relevant to the current role and task; use immutable artifact IDs plus version links rather than overwriting history; separate stable brand constraints from campaign-specific choices; never promote an Agent inference to a confirmed product fact; when sources conflict, show the conflict and use the latest authoritative source.',
    'Ingest source with provenance; normalize entities and constraints; mark confirmed, assumed, disputed or expired; retrieve a compact role-specific context pack; reconcile new output against the state ledger; write an updated version only after validation; record which dependent artifacts become stale.',
    'Context pack: objective, audience, approved facts, prohibited claims, brand cues, decisions, current artifact IDs, conflicts and unresolved questions. Every item carries source_id and status.',
    'If context is too large, preserve source facts and current decisions before old drafts; if a model repeats an obsolete claim, reject the affected output and refresh the context pack; if two approved documents disagree, stop claim-dependent work and request resolution.',
    'Score 0–2 each: provenance, currentness, relevance, conflict handling. Pass at 7/8; silently overwriting a confirmed brand fact is a hard fail.',
    'A2 A3 A5 B1 B12')
add('critic-recovery','Critic & Recovery','L0','runtime','partial','Diagnose failed outputs, select bounded repairs and stop when evidence or budget is insufficient.',
    'Critique against the task contract and supplied evidence before subjective polish. Classify failures as factual, strategic, structural, brand, provider, media artifact or transient infrastructure. Repair the smallest causal input and preserve valid work. Evaluator–optimizer loops require a clear rubric and stopping rule.',
    'Artifact and its input versions; acceptance rubric; provider logs; cost/time budget; visible media; user priorities.',
    'Block unsupported claims and product misrepresentation regardless of aesthetic score; do not retry identical inputs after deterministic validation failure; use a different provider only if the required capability and asset rights are met; allow at most a configured number of attempts per shot; terminate when quality gain is below cost threshold.',
    'Run contract validation; identify the earliest causal failure; assign severity and evidence; choose prompt repair, upstream brief correction, asset replacement, provider fallback or human review; generate one targeted candidate; compare against the same rubric and retain the better version; log attempt count, cost and reason to stop.',
    'Issue record: artifact_id, defect_type, severity, evidence_frame_or_text, causal_input, repair_action, attempt_count, expected_gain, decision. Include accepted and rejected version IDs.',
    'If a hand is distorted, vary motion complexity or crop rather than changing the brand strategy; if a claim is wrong, correct the source fact and all dependent copy; if repeated renders fail, preserve the best version and report the unresolved defect.',
    'Score 0–2 each: accurate diagnosis, minimal repair, evidence of improvement, budget/stop discipline. Pass at 7/8; undisclosed residual hard defect fails.',
    'A1 A3 A5 E1 E2 E3')

# L1: strategy and platform practice.
add('brief-interpretation','Brief Interpretation','L1','agent-core','operational','Convert a raw request into a decision-ready advertising brief with facts, gaps and success measures.',
    'A useful brief connects a business outcome to an audience behavior, product truth and communications job. Distinguish the client objective from the ad task: “increase trial” may require showing ease of use, while “feel premium” is a creative direction rather than a measurable business result. Judge the causal chain from objective and audience barrier through idea, execution and observed result; visual polish alone is insufficient.',
    'Business and campaign objective; product/offer facts; target audience and market; channel and placement; timing/budget; baseline/KPI definitions; restrictions and proof.',
    'Ask only for missing facts that would change the proposition, legality or production plan; do not infer a target segment from a reference aesthetic; normalize KPI numerator, denominator and period; separate deliverable requirements from hypotheses; resolve conflicting instructions by the latest explicit user decision.',
    'Extract source statements verbatim into a fact ledger; classify objective, audience, barrier, product advantage, proof, channel, CTA and constraints; convert vague goals into an observable communication task; identify decision-critical gaps; draft one core brief and explicit assumptions; check that every creative recommendation can trace to a brief item.',
    'Brief: objective; target behavior; audience and context; human tension; product truth and proof; single-minded proposition; channel/format; mandatory assets; CTA; KPI and baseline; unknowns; source references.',
    'If the KPI is “engagement” without a definition, specify candidate measures and ask which matters; if proof is missing, write a demonstration hypothesis rather than a performance claim; if budget or duration is absent, offer a bounded assumption and label it.',
    'Score 0–2 each: factual fidelity, causal clarity, measurable outcome, production usefulness. Pass at 7/8; invented product facts fail.',
    'B1 B2 B4 B5 B14 C1')
add('consumer-insight','Consumer Insight','L1','standalone','operational','Find a defensible audience tension that can change the ad idea and be tested.',
    'An insight explains behavior or motivation, not merely a demographic fact. Distinguish observed behavior, interpretation and implication. A product fact or statistic alone does not explain audience behavior. Use jobs, pain/desire, purchase obstacles and cultural context, but do not stereotype a segment or claim qualitative anecdotes represent a population.',
    'Audience and purchase/use context; interviews or research with dates; reviews/search/social observations; category alternatives; product evidence; market and language.',
    'Require at least one traceable observation for a confident insight; favor a tension with a specific consequence and a product-relevant resolution; separate “who they are” from “what they need at this moment”; rate transfer risk when using another brand’s evidence; mark unresearched cultural interpretations as hypotheses.',
    'Inventory evidence and sampling limits; map trigger, desired progress, friction and workaround; phrase two or three candidate tensions as “Although X, people Y because Z”; test each against counterexamples and product relevance; select one insight and write what different execution it unlocks; propose a small validation study or creative test.',
    'Insight card: observation/source, audience/job, tension, motivating mechanism, confidence, product bridge, creative implication, disconfirming evidence, validation method.',
    'Thin evidence: output hypotheses and interview questions; conflicting segments: split by situation instead of averaging; generic “people want convenience”: specify the moment, cost of friction and current workaround; stereotype risk: rewrite in behavioral terms.',
    'Score 0–2 each: evidence, explanatory power, product link, testability. Pass at 7/8; unsupported universal consumer claim fails.',
    'B1 B4 B5 B12 B13 B14')
add('brand-strategy','Brand Strategy','L1','standalone','operational','Define the brand meaning, distinctive cues, tone and claim boundaries that creative must preserve.',
    'Brand strategy links a recognizable asset system to a desired memory and category buying situation. Distinctive cues can include pack silhouette, color, character, phrase and sound; showing a logo alone may not make the story attributable. Separate durable brand rules from campaign-specific mood. Use distinctive assets consistently, then verify whether people correctly attribute the work to the brand.',
    'Approved brand book and asset files; existing ads; product packaging; audience and category; approved claims; campaign objective; legal or regional constraints.',
    'Prefer assets already owned and recognized over invented cues; establish a message hierarchy with one primary promise; do not alter logo, package or regulated claim to fit a reference; distinguish visual identity from subjective adjectives such as “premium”; assign each cue a production use and a verification method.',
    'Audit supplied assets and recurring codes; identify category entry point and desired association; draft positioning and tone guardrails; rank primary, supporting and optional messages; define pack/logo/sonic appearance by beat; create a claims ledger; test attribution by imagining the brand name removed; approve only supported cues.',
    'Brand kit: positioning, primary association, cue inventory with asset IDs, tone markers, message hierarchy, claim/evidence table, mandatory and prohibited uses, unresolved approvals.',
    'No brand book: derive provisional cues only from supplied assets and mark them unapproved; conflicting brand materials: prioritize current approved material; generic aesthetics: name concrete material, lighting, palette and typography decisions; missing evidence: remove claim or request substantiation.',
    'Score 0–2 each: attribution, consistency, claim support, execution clarity. Pass at 7/8; altered packaging or unsupported claim fails.',
    'B1 B3 B12 B13 B15 B2')
add('ad-strategy','Ad Strategy','L1','standalone','operational','Turn objective, insight and proof into a proposition, campaign angle and response path.',
    'The strategy is a causal argument: audience friction → product answer → credible proof → desired behavior. A USP is useful only when genuinely ownable and relevant; do not invent uniqueness from a generic feature. Separate broad brand-building outcomes from short-term response targets and choose a primary job for each asset.',
    'Decision-ready brief; audience insight; product facts and differentiators; proof; funnel stage; offer and destination; brand rules; KPI definitions.',
    'Choose one main proposition per short ad; rank angles by relevance, distinctiveness, proof and production feasibility; for low-awareness audiences explain category or problem before heavy product detail; for high-intent audiences show fit, proof and action; CTA must match a real destination and available offer.',
    'Write an objective-to-validation chain; list candidate propositions and evidence; reject unsupported or interchangeable claims; build three distinct angles by changing the mechanism, not synonyms; select a lead angle with tradeoffs; map proof beats and CTA; define a falsifiable test and a brand cue plan.',
    'Strategy card: objective, audience, insight, proposition, reason-to-believe, primary angle, rejected alternatives, proof sequence, brand cue, CTA, KPI, experiment hypothesis.',
    'If no ownable advantage exists, use a credible contextual benefit or distinctive execution; if a claim cannot be proved, downgrade it to a demonstrable action; if objective is mixed, split assets or choose priority instead of blending incompatible asks.',
    'Score 0–2 each: causal link, differentiation, evidence, measurable action. Pass at 7/8; proposition without product truth fails.',
    'B1 B2 B3 B4 B5 B14')
add('platform-strategy','Platform Strategy','L1','standalone','operational','Adapt an ad idea to placement behavior, technical constraints and native attention patterns.',
    'Platform guidance is a design input, not a guarantee. Plan an attention earning opening, a clear body, a recognizable brand cue and a directed close. Adapt composition to each placement and its interface. Use current official specifications for exact dimensions, duration and safe areas because these change.',
    'Source master, target placements, campaign objective, product/brand cues, asset rights, subtitles, aspect ratios, current platform specification links.',
    'Preserve proposition and product truth across versions; reframe action for placement rather than crop blindly; if sound-off viewing is common, ensure screen text can carry core meaning; keep critical product, face and CTA clear of placement UI; distinguish a feed edit from a skippable in-stream edit.',
    'Confirm target placements and current specs; map viewing context and interruption pattern; choose opening frame and early brand cue; create a version matrix for framing, captions, duration, audio and CTA; audit safe areas on actual mockups; render or request platform previews; record any unavailable asset and adaptation risk.',
    'Version matrix: placement, spec URL/date, aspect ratio, duration, first frame, product/brand appearance, caption plan, audio plan, CTA, required crop/re-edit, validation status.',
    'If source footage cannot support vertical crop, propose a new composition or graphic layout; if spec cannot be verified, label the setting provisional and request a current check; if a hook is platform-native but off-brand, keep the mechanism and rewrite its voice.',
    'Score 0–2 each: technical fit, message retention, brand recognition, placement readability. Pass at 7/8; clipped claim or CTA fails.',
    'B8 B9 B10 B11 B12')
add('performance-creative','Performance Creative','L1','standalone','operational','Build performance hypotheses, distinct creative variants and a disciplined learning loop.',
    'A hook is a promise that the next seconds must pay off. Diagnose attention, comprehension, persuasion and action as separate failure points rather than treating CTR or CPA as a complete creative verdict. Decompose each variant into audience motivation, angle, hook and format; treat platform showcases as hypotheses rather than transferable causal proof.',
    'Baseline ad and variants; objective and funnel stage; audience; placement; performance data with definitions, spend and time window; product proof; brand constraints.',
    'Change one primary mechanism per controlled comparison; make variants meaningfully different in first frame, proof or audience motivation; do not declare a winner from tiny or confounded samples; optimize to the stated business KPI while monitoring brand and claim quality; preserve a holdout when feasible.',
    'Audit current creative and metrics by stage; identify the earliest likely break; form a causal hypothesis; design two or three variants with one major changed variable each; specify asset and production requirements; define exposure, metric and decision threshold before launch; review results with confidence limits and plan the next round.',
    'Experiment card: baseline, hypothesis, changed variable, variant storyboard, invariant facts, target metric, guardrail metric, sample/time window, interpretation rule, next action.',
    'Low data: label signals directional and collect more; high CTR but low conversion: inspect landing/offer fit as well as ad promise; apparent win with unsupported claim: reject; fatigue: vary motivation or proof, not only colors.',
    'Score 0–2 each: hypothesis quality, variant distinctness, measurement discipline, truthful promise. Pass at 7/8; invented uplift fails.',
    'B5 B6 B7 B8 B9 B11 B13')

# L2: craft methods live with the corresponding specialist unless reusable by several roles.
add('creative-concept','Creative Concept','L2','standalone','operational','Generate and select campaign territories with a clear strategic mechanism and execution system.',
    'A big idea is a repeatable relationship between insight, brand and execution, not a witty line. Require an explicit causal bridge from audience observation to a brand-specific mechanism; keep the creative expression original. A territory should support multiple ads while remaining attributable to the product.',
    'Approved brief; audience insight; proposition and proof; brand cues; placements; production limits; reference materials with provenance.',
    'Diverge across mechanisms such as demonstration, reversal, social situation and visual metaphor; reject territories that need invented product behavior; prefer a territory that survives three executions and two placements; score novelty against category conventions and feasibility separately; retain one safe and one ambitious option when uncertainty is high.',
    'Write the strategic invariant; generate at least three genuinely different territories; express each as a one-sentence idea plus an execution route; test brand attribution, proof, repeatability and cost; identify why the lead territory wins; translate the selected idea into a first-frame, hero beat and closing action.',
    'Territory cards: name, insight, mechanism, brand role, visual system, three executions, proof requirement, production risk, rejected cliché. Selection matrix with weighted rationale.',
    'If ideas are all taglines, vary the underlying visual or narrative mechanism; if a reference dominates, abstract its function and change situation, imagery and language; if a beautiful idea obscures the product, rebuild the role of the product or reject it.',
    'Score 0–2 each: insight connection, brand attribution, execution range, feasibility. Pass at 7/8; no credible product role fails.',
    'B1 B2 B4 B5 B14 C2')
add('reference-analysis','Reference Analysis','L2','standalone','operational','Deconstruct a supplied ad into transferable mechanisms without copying its protected expression.',
    'Separate observation from inference. A frame sample supports visible composition but not exact soundtrack, timing or unseen camera movement. Analyze structure, tension, product role, edit rhythm, visual grammar and evidence, then transfer the mechanism into the user’s facts. Selected high-performing ads can suggest mechanisms to test, but cannot prove those mechanisms will work for this campaign.',
    'Reference URL or uploaded video/stills; observed frames and timecodes; target product and objective; rights constraints; desired placement.',
    'Label every detail observed, inferred or unknown; identify what makes the reference work before naming its surface style; do not recreate distinctive scenes, dialogue, characters or shot sequence; compare target-product proof requirements; verify media access before claiming a full-film analysis.',
    'Inventory accessible material and duration; create a beat map with timecodes only where observed; describe camera, framing, typography, sound and transitions with confidence labels; infer the attention and persuasion mechanism; identify reference-dependent elements to avoid; produce two original transfers; test each against the user’s brand and proposition.',
    'Analysis: observation table, inferred mechanism, confidence and gaps, non-transferable signature elements, adaptation options, target beat map, verification questions.',
    'Only stills available: report visual analysis without claimed pacing or sound; inaccessible link: request file or describe a provisional plan; close imitation: change setting, sequence, characters and visual code while retaining a general function; poor reference fit: explain mismatch.',
    'Score 0–2 each: observation accuracy, mechanism clarity, originality, product fit. Pass at 7/8; invented unseen details fail.',
    'B1 B2 B7 B11 C1 C4')
add('copywriting','Copywriting','L2','agent-core','operational','Write timed advertising copy that makes a truthful promise, proves it and directs action.',
    'Copy should carry the proposition through the audience’s language. A hook earns attention by raising a relevant question or showing a consequential action; the body must deliver what the opening implies. Plan attention, brand recognition and direction as distinct jobs; word counts and fixed opening windows are design hypotheses, not guarantees.',
    'Brief, audience vocabulary, approved product claims, proof shots, duration, platform, brand voice, CTA destination and legal text.',
    'Use one primary promise per short spot; make the first spoken or written line intelligible with the first frame; prefer concrete verbs and visible outcomes over abstract adjectives; budget spoken words to performance and pauses, then read aloud; mark testimonial and offer language as pending unless confirmed.',
    'Draft the proposition sentence; write three different hook mechanisms; select one by relevance and available proof; create a timecoded AV script with visual, spoken copy, supers and silence; cut redundancy where image already carries information; verify exact claims and CTA; read aloud at intended pace and revise for natural speech.',
    'AV script: time in/out, image/action, VO/dialogue, supers, sound cue, evidence source and CTA; alternate hooks; claim ledger; timing estimate.',
    'If dialogue sounds like a brochure, remove stacked benefits and write from a specific situation; if copy exceeds duration, remove secondary claims before increasing speed; if proof footage is absent, soften or remove the claim; if a creator has no real experience, do not script a false first-person testimonial.',
    'Score 0–2 each: clarity, promise/proof fit, voice, timing. Pass at 7/8; unsupported claim or fabricated experience fails.',
    'B5 B6 B8 B10 B14 C4')
add('creative-director','Creative Director','L2','agent-core','operational','Translate strategy into a coherent visual and narrative system across specialist outputs.',
    'Creative direction is a set of choices with causal purpose: what the audience should notice, feel, understand and remember at each beat. Tie mood, casting, palette, texture, setting and product treatment to the proposition. A moodboard is evidence of intended direction, not a substitute for instructions that a director, designer and editor can execute.',
    'Approved strategy and brand kit; script or concept; product asset IDs; reference permissions; budget; channel; production and model limits.',
    'Define an invariant visual spine before shot details; make the brand cue part of the action rather than a disconnected logo stamp; select one dominant visual contrast; specify what must stay fixed and what may vary; challenge each aesthetic choice with “what message does this help?”; do not claim generated moodboard assets exist unless provided.',
    'Restate objective and audience response; choose a territory and reject near alternatives; specify visual concept, palette, material, talent, environment and product hero rules; translate into first frame, proof beat and final memory; brief art, camera, sound and edit departments; review a sample shot against the spine; document approved deviations.',
    'Direction deck: concept sentence, audience response, visual anchors, product treatment, color/material/lighting rules, casting and location, beat-level direction, brand cue plan, approved/prohibited treatments, unresolved decisions.',
    'If visual references conflict, identify the shared strategic quality and choose one coherent system; if “premium” is vague, specify surface, light, framing and pace; if the product is obscured, re-stage the hero beat; if assets cannot be produced, simplify the visual grammar.',
    'Score 0–2 each: strategic causality, cross-shot coherence, brand attribution, department executability. Pass at 7/8; contradictory visual directions fail.',
    'B1 B2 B12 B15 C1 C2 C3')
add('director','Director','L2','agent-core','operational','Stage scenes and shots so performance, action, space and narrative purpose remain legible.',
    'A shot exists to advance understanding or feeling. Blocking defines where subject, product and camera move in space; screen direction and eyelines keep the action intelligible. Cutting within a scene is easier when action continuity and spatial axis are planned before coverage.',
    'Script and beat intent; location plan; product and talent constraints; duration; camera resources; storyboard; generation limits where synthetic footage is planned.',
    'Assign a purpose to every shot; make the product action visible from a credible viewpoint; avoid crossing the action axis without an establishing reset; split complex multi-action beats into coverage; protect performance time and readable pauses; never add a scene that cannot be motivated by the message.',
    'Break the script into story beats; map geography and subject/product positions; block action and camera for each beat; plan coverage with shot size, angle, movement and cut point; note props, continuity states and eyelines; rehearse timing or simulate with panels; revise shots that depend on impossible action or missing coverage.',
    'Shot plan: shot ID, beat purpose, start/end, blocking, lens/height intent, frame and movement, action state before/after, audio cue, transition, continuity note and production dependency.',
    'If geography is confusing, add an establishing frame or simplify movement; if the product action is obscured, change blocking before changing copy; if a generated shot cannot sustain multiple actions, split it; if duration overruns, remove redundant coverage instead of compressing proof.',
    'Score 0–2 each: action legibility, spatial continuity, purpose, executable timing. Pass at 7/8; unresolved product-action visibility fails.',
    'C1 C2 C3 C4 C5 B10')
add('cinematography','Cinematography','L2','agent-core','operational','Design framing, camera, lens and light to direct attention and preserve visual continuity.',
    'Use shot size and perspective to control information: a wide shot establishes use context, a medium shot clarifies action, and a close-up proves the product mechanism. Lens, distance, depth and movement should have a reason. A “cinematic” adjective without camera and lighting choices is not a production instruction.',
    'Shot purpose; action blocking; aspect ratio; product surfaces and label orientation; location light; reference frames; camera or model capabilities.',
    'Choose camera distance before focal-length language; protect legibility of claims and product geometry; use camera movement only when it reveals or emotionally reframes information; establish light direction and color continuity across coverage; check how a vertical crop changes eye and product placement.',
    'Identify attention target for each beat; select shot scale and viewpoint; define composition and negative space for text; choose static or motivated movement; plan key/fill/background relationship and reflections; specify depth-of-field priority; test adjacent shots for axis, eyeline, brightness and scale jumps.',
    'Camera card: shot ID, purpose, size, angle, camera height/distance, lens intent, movement path, focus target, light direction/quality, product-label visibility, crop-safe area.',
    'If product text warps in generation, use a locked-off close-up or composited pack asset; if hand action is hard to parse, move camera to the action side; if shallow depth hides proof, deepen focus; if lighting breaks between shots, anchor a consistent key direction.',
    'Score 0–2 each: attention hierarchy, action clarity, visual continuity, feasibility. Pass at 7/8; unreadable product proof fails.',
    'C1 C2 C4 C5 D1 D3')
add('art-direction','Art Direction','L2','agent-core','operational','Specify sets, props, wardrobe and product placement as a consistent production world.',
    'Production design makes the proposition visible before copy is read. Props and surfaces must be motivated by the user situation, while brand assets provide recognition. Separate hero product details that must be exact from environment cues that may vary; a photogenic scene is not useful if it hides product identity or creates a false use context.',
    'Brand and product asset files; script/shot list; setting and audience context; wardrobe/casting notes; palette; budget; continuity states.',
    'Lock packaging geometry, logo, color and label orientation from approved assets; choose props for narrative function, not decoration; control competitive logos and unsupported use claims; define a reset state for every practical action; ensure set and costume contrast support product visibility.',
    'Build a scene world from audience context; list hero, functional and background props; create color/material hierarchy; mark exact product placement by shot; define wardrobe and grooming constraints; document before/after continuity states; review frames for clutter, logo conflicts and false affordances.',
    'Art bible: scene inventory, palette/material board, product asset IDs and exact attributes, prop/wardrobe list, placement diagram, continuity photo requirements, prohibited elements.',
    'Missing packaging photo: request it or use a clearly provisional generic prop; cluttered frame: remove competing colors/props; inconsistent generated scenes: reuse a canonical environment reference and reduce variation; false use context: restage rather than relying on a disclaimer.',
    'Score 0–2 each: brand fidelity, narrative function, continuity, shot usability. Pass at 7/8; altered product or logo fails.',
    'B12 B15 C1 C2 C3 D2')
add('editing','Editing','L2','agent-core','operational','Build a timed cut whose information, continuity, sound and CTA resolve at the chosen placement.',
    'Editing is information architecture. Cut where the audience has understood the action or when the next image changes the argument; speed alone is not retention. Preserve screen direction and match action where continuity matters, and use montage intentionally when compression is clearer. Platform rhythm is a testable adaptation, not a fixed cuts-per-second target.',
    'Approved script and shots; asset availability and in/out handles; VO/music rights; placement specs; duration; caption and brand rules.',
    'Ensure the first frame establishes a relevant question or product action; keep proof on screen long enough to parse; use transitions only when they clarify a change; align supers with what is visible; give CTA a complete and readable hold; maintain separate audio-on and muted-viewing checks.',
    'Inventory actual clips versus planned shots; assemble a radio and visual cut; map beats and timecodes; choose cut points by action, information and sound; place captions and brand cues; create placement variants; review continuity and pace at actual speed; verify final duration and export settings with current platform spec.',
    'Edit decision list: asset ID, source in/out, timeline in/out, cut/transition, audio cue, caption, brand/proof purpose, unresolved pickup. Include version matrix and duration sum.',
    'Missing proof footage: identify a pickup rather than substitute an unsupported claim; confusing jump: add an insert or reset geography; unreadable super: extend hold or shorten text; weak end action: reallocate time from redundant setup.',
    'Score 0–2 each: comprehension, rhythm, continuity, CTA delivery. Pass at 7/8; a cut that implies an unproved result fails.',
    'C4 C5 C6 B8 B10 E4')
add('sound','Sound','L2','agent-core','operational','Design voice, music, effects and ambience around the story and brand memory.',
    'Sound directs attention and can be a distinctive brand asset. Separate diegetic product sounds from score; a click can prove a mechanism if it is authentic, while added sound must not imply a product property it lacks. Music should support the edit’s emotional arc and leave space for speech.',
    'Locked or timed script; shot plan; actual product sound references; voice/talent requirements; music and SFX rights; platform audio specs; brand sonic assets.',
    'Prioritize intelligibility of claims and CTA; use a sonic cue consistently only if approved; mark generated or licensed sound as pending until assets and rights exist; ensure captions carry essential meaning when muted; do not infer audio from silent video frames.',
    'Build an audio beat map; choose vocal point of view, pace and pauses; list product-action effects and ambience with source and timing; define music entrance, energy and exit; set mix priorities and ducking points; check speech on phone speakers and muted playback; verify rights and final loudness against delivery specs.',
    'Sound cue sheet: time in/out, source asset, VO/dialogue, music state, SFX/ambience, narrative purpose, mix priority, rights status, caption equivalent.',
    'If music masks the proof line, duck or thin arrangement; if the real click is weak, do not fabricate a “lock” property without product approval; if rights are missing, use a cleared alternative or a brief style description; if lip sync is unavailable, prefer VO or non-speaking coverage.',
    'Score 0–2 each: intelligibility, narrative fit, brand fit, rights/readiness. Pass at 7/8; unlicensed asset presented as cleared fails.',
    'B8 B10 B12 B13 C6 E3')

# L3: reasoning specifications; actual provider execution is governed by capability and artifact checks.
add('prompt-compiler','Prompt Compiler','L3','standalone','operational','Compile a shot plan into concise, model-compatible prompts and control inputs.',
    'A model prompt is an execution contract, not a compressed creative deck. For image-to-video, the image usually establishes identity and visual composition while text should specify intended motion; Specify motion in simple, direct language and iterate one variable at a time. Keep invariant identity in references and vary one motion variable at a time.',
    'Approved shot card; product/person/scene reference IDs; exact model and mode; duration/aspect ratio; motion goal; prohibited changes; provider current capability document.',
    'Choose text-to-video only when appearance can be newly synthesized; choose image-to-video when identity or pack fidelity matters; use first/last frames only if current provider supports it; describe observable subject, camera and scene motion; avoid conflicting directives such as “locked camera” and “orbit” in one shot.',
    'Read the shot’s narrative purpose and invariant states; inspect reference assets; choose generation mode and supported controls; separate visual anchors from motion instruction; write one positive action sequence and one concise preservation clause; specify output settings; run a low-cost test; adjust a single cause of failure and version the prompt.',
    'Compiled prompt package: model/mode, reference IDs, positive prompt, preservation constraints, duration, aspect, camera control, first/last frame IDs if used, expected end state, validation frames.',
    'Subject drift: strengthen reference or simplify motion; impossible multi-action prompt: split shot; static output: make the verb and camera motion explicit; warped text: use exact pack asset or composite in post; unsupported control: remove it and choose a supported mode.',
    'Score 0–2 each: shot fidelity, control validity, identity protection, testability. Pass at 7/8; invented model capability fails.',
    'D1 D2 D3 C1 C2 E1')
add('model-routing','Model Routing','L3','runtime-spec','specification','Choose an image, video or audio provider from current capabilities, quality needs and cost.',
    'Model routing is a runtime service because it depends on live provider APIs, pricing, availability, rights and account configuration. Fixed vendor-to-shot rules become stale. Use task-specific capability gates before subjective quality rankings; leaderboard scores provide comparative evidence but do not establish performance on the user’s product and motion.',
    'Shot type and acceptance criteria; current enabled providers; feature matrix; API mode/spec version; price/latency; privacy and rights restrictions; reference assets; historical local outcomes.',
    'Reject providers missing mandatory mode, aspect, duration, reference or audio controls; rank eligible providers on product fidelity, motion/physics, latency and cost using explicit weights; preserve a fallback with a different failure profile; consider image-first plus animation when exact pack appearance dominates; require a small benchmark on representative shots before large batch generation.',
    'Query current provider metadata; form mandatory and preferred requirements; filter incompatible models; estimate total attempts and cost; pick primary and fallback; run a representative sample; score outputs against the shot rubric; update routing history with date, provider version and observed results.',
    'Routing decision: shot_id, required_capabilities, eligible_models, disqualifications, weighted_scores, primary, fallback, expected cost/time, validation sample, current spec links.',
    'No eligible model: return a revised production option such as still+edit or live-action pickup; unsupported parameter: repair request without charging retries; changing provider specs: invalidate cached capability; leaderboard mismatch: prioritize local sample.',
    'Score 0–2 each: capability fit, evidence, cost transparency, fallback quality. Pass at 7/8; claiming live availability from a static document fails.',
    'D1 D2 D3 D4 E1 E2')
add('image-generation','Image Generation','L3','provider-spec','specification','Generate product, character, scene and keyframe images with identity and brand controls.',
    'Image generation is an executable provider operation, with a craft procedure surrounding it. Separate exploratory style frames from approval-critical pack frames. A product image must preserve geometry, logo, material and claim labels; text synthesis is prone to errors, so approved packaging should be supplied as an asset or composited where possible.',
    'Shot/keyframe brief; approved reference images; exact product attributes; aspect and resolution; model controls; usage rights; output destination.',
    'Use approved imagery for exact branded objects; generate backgrounds separately when the product cannot be kept true; lock character reference and wardrobe before a multi-frame series; define composition and negative space for copy; create small contact sheets before high-resolution production; validate every file, not only the best preview.',
    'Select target image role; build a visual anchor sheet; choose model/mode and aspect; draft prompt and references; render low-cost candidates; inspect product, hands, text, composition and brand cues; select and version approved frame; pass asset ID and invariants downstream.',
    'Image asset record: file/asset ID, prompt version, model/version, reference IDs, approved crop, identity anchors, defects, reviewer decision, downstream usage.',
    'Warped label: replace with approved pack composite; inconsistent character: anchor a single reference and simplify costume; beautiful but irrelevant background: recompose around proof; unresolved licensing: keep asset out of final deliverables.',
    'Score 0–2 each: product fidelity, composition, visual consistency, technical usability. Pass at 7/8; altered logo or critical label fails.',
    'D1 D2 D3 B12 C1 C3')
add('video-generation','Video Generation','L3','provider-spec','specification','Generate shot-level motion using supported T2V, I2V and frame controls with explicit QC.',
    'Video generation must be shot-specific. Text-to-video offers broad exploration; I2V is useful when the first frame anchors identity; first/last-frame workflows can constrain endpoints where supported. These modes do not guarantee physically correct transitions or exact branded text. Keep each prompt’s action count low and verify temporal behavior across the whole clip.',
    'Approved shot card; input and end frames; references; model capability; duration/aspect; camera motion; audio needs; cost budget; acceptance rubric.',
    'Do not invoke unsupported controls; prefer short, single-action shots for exact product behavior; check start, midpoint and end plus rapid motion frames; keep a shot’s invariant state explicit; record seed or version when available; never mark a shot complete from a thumbnail.',
    'Choose mode from visual-lock needs; confirm current parameters; compile prompt and inputs; submit with request ID; inspect response and asset existence; sample frames and playback at real speed; evaluate motion, physics, brand, continuity and audio; accept, targeted-repair or fallback according to attempt budget.',
    'Shot generation record: input asset IDs, mode/provider/version, prompt, settings, output ID, sampled timecodes, defects, rubric scores, approval and attempt cost.',
    'Physics failure: simplify action or split shot; character drift: strengthen reference and reduce camera motion; transition mismatch: use a cut or insert instead of forcing a long interpolation; API timeout: check saved state before retry.',
    'Score 0–2 each: shot intent, identity, temporal/physical quality, artifact completeness. Pass at 7/8; brand mutation or unusable motion fails.',
    'D1 D2 D3 E1 E2 E3')
add('consistency','Consistency','L3','standalone','operational','Control product, character, wardrobe, scene and style identity across shots and revisions.',
    'Continuity is a state management problem as much as a visual similarity problem. Maintain canonical identity assets and explicit per-shot state transitions. Judge identity consistency and temporal stability separately; a smooth shot can still show the wrong product or clothing.',
    'Approved reference pack; asset IDs; product attributes; character and wardrobe sheets; scene bible; shot plan; generated frames and timestamps.',
    'Treat logo, pack silhouette and approved color as hard invariants; track state that may change (lid open/closed, object in hand, wet/dry, time of day) separately; compare adjacent shots at cut boundaries; do not solve a continuity error by silently changing the source of truth; prioritize narrative-critical objects.',
    'Create identity and state ledger; annotate every shot’s entry/exit states; compare samples against canonical assets and previous shot; classify mismatch as identity, state, lighting or intentional transition; repair the smallest shot or source prompt; re-check dependent shots after a change.',
    'Continuity ledger: entity_id, invariant attributes, state variables, reference IDs, shot entry/exit, defect timecode, severity, fix owner and verification result.',
    'No canonical product photo: request one and mark visual output provisional; drift within a clip: reduce motion or change model; repeated scene drift: use a locked scene frame; conflicting continuity: choose an explicit story transition or reshoot one side.',
    'Score 0–2 each: identity fidelity, state continuity, transition clarity, traceability. Pass at 7/8; altered logo or unexplained product swap fails.',
    'D2 D3 E1 E2 C4 C5')
add('lip-sync-audio','Lip-sync & Audio','L3','provider-spec','specification','Generate and synchronize speech or audio only when an enabled tool can produce inspectable assets.',
    'Lip sync requires an audio master, phoneme timing and visible mouth footage; it is not satisfied by a plausible voiceover. The quality of dialogue, voice identity, room tone and mouth motion must be judged separately. When the product currently has no compatible synthesis and synchronization provider, deliver an audio direction plan and mark this capability unimplemented.',
    'Approved spoken script and pronunciation; voice consent/rights; character footage; language and accent; audio specs; enabled speech and lip-sync providers; target shot timecodes.',
    'Do not clone a real voice without authorization; lock the final line before generating mouth motion; use only shots with visible, suitable faces for lip-sync evaluation; prefer VO over dialogue when face coverage is absent; check timing, consonant closures, facial artifacts and sound-image relationship through full playback.',
    'Verify provider capability and rights; generate or ingest final speech; align line to shot duration; run synchronization if available; inspect mouth motion at phoneme-dense moments and shot boundaries; mix with ambience/music; render captions; approve only an inspectable audio/video asset.',
    'Audio/lip-sync record: script version, voice source/rights, audio ID, face video ID, sync provider, timing map, QC timecodes, caption file, approval status.',
    'Speech overrun: revise script or shot duration before time-stretching excessively; sync drift: re-align from the correct audio master; facial deformation: replace shot or use VO; unavailable provider: return plan and required integration, never a claimed completed sync.',
    'Score 0–2 each: intelligibility, sync accuracy, facial fidelity, rights/readiness. Pass at 7/8; unconsented voice or absent output asset fails.',
    'C6 E1 E2 E3 D3 A3')
add('qc-regeneration','QC & Regeneration','L3','runtime-spec','specification','Detect shot defects and drive bounded, causal regeneration after inspecting actual media.',
    'A real QC loop needs media inspection, defect localization, a fixed rubric, version history and an attempt budget. Inspect identity, motion, physics, artifacts and brand truth directly; benchmark scores cannot approve a specific branded ad. Regeneration should target one causal defect rather than random prompt changes.',
    'Generated media and source shot; canonical references; expected action; timecoded samples; provider metadata; max attempts and cost; brand rules.',
    'Hard-block logo/claim mutation, impossible required action or missing output; treat mild aesthetic variance as a weighted issue; require timecode evidence for a motion defect; never auto-regenerate without a remaining attempt budget; keep the best valid version and record all candidates.',
    'Verify file and playback; sample across full duration and inspect at normal speed; score identity, geometry, motion, physics, temporal continuity, audio and story purpose; localize root cause; choose prompt/asset/provider/shot-design repair; render one targeted candidate; compare on same rubric; accept or stop with residual defects.',
    'QC report: shot_id, asset_id, observed timecode, dimension, severity, evidence, likely cause, chosen repair, attempts/cost, accepted version, unresolved risks.',
    'If visual corruption recurs with the same movement, simplify the shot; if pack changes, re-anchor approved image rather than adding adjectives; if retry cost is exhausted, use static frame plus edit or request pickup; if actual media cannot be accessed, report QC as unperformed.',
    'Score 0–2 each: defect coverage, causal diagnosis, comparative evidence, budget discipline. Pass at 7/8; uninspected media marked passed fails.',
    'A1 A3 E1 E2 E3 E4 E5')

# L4: textual assessments are usable now; media-level scoring needs inspectable outputs.
add('creative-quality','Creative Quality','L4','standalone','operational','Evaluate whether an ad concept is clear, distinctive, emotionally coherent and executable.',
    'Evaluate creative quality independently from personal taste. Trace the brief through the insight, idea, proof and audience takeaway. Judge the strength of the advertising argument and evidence separately from aesthetic distinction; measure impact against the stated objective.',
    'Brief and success criterion; concept or cut; product proof; target audience; placement; brand kit; reference category work.',
    'Judge what a cold viewer can infer without a strategy presentation; separate originality from obscurity; require the product to matter to the narrative; distinguish an emotional response from a stated benefit; note production risk when the idea depends on unavailable assets or fragile generated action.',
    'Review the ad once for immediate takeaway; write the actual inferred proposition; compare it to brief intent; inspect distinctiveness, emotional logic, product role and execution coherence; give evidence by beat/timecode; rank no more than three changes by expected impact; re-evaluate after revision.',
    'Review: intended vs observed takeaway, scored dimensions, timecoded evidence, hard defects, prioritized revision and remaining uncertainty.',
    'If reviewers disagree, collect independent first-impression descriptions; if attractive craft masks a weak sell, repair product role before polish; if novelty confuses, add a bridge beat; if no finished media exists, evaluate the concept and mark visual judgments provisional.',
    'Score 0–2 each: clarity, relevance, originality, craft feasibility. Pass at 7/8; unrecognizable product relevance fails.',
    'B1 B2 B13 B14 C1 E4')
add('brand-compliance','Brand Compliance','L4','standalone','operational','Check creative against approved brand assets, product truth, claims and offer terms.',
    'A compliance pass compares the actual words and pixels with an approved source of truth. Distinctive assets improve attribution when used consistently, but a look-alike logo or invented claim damages it. Review textual claims, visual implications and product depiction; an image can imply a result that no line states.',
    'Approved brand kit; product pack and label assets; claim substantiation; offer terms; script and media; territory restrictions; placement.',
    'Treat exact logo, pack geometry, prohibited claims and mandatory disclosures as hard gates; distinguish substantiated, pending and unsupported claims; require scope qualifiers where evidence is limited; assess visual before/after and comparison fairness; do not certify legal compliance beyond supplied rules.',
    'Build a claim and asset inventory; compare every spoken line, super and visual demonstration to source evidence; inspect brand cues and pack frames; mark issues with timecode and severity; propose the smallest compliant rewrite or visual correction; request legal/brand owner review for unresolved interpretations.',
    'Compliance ledger: item/timecode, observed expression, governing source, status pass/revise/review, severity, correction, approver and version.',
    'Missing substantiation: remove or soften the claim; missing brand book: check only supplied rules and label scope; generated logo distortion: replace asset; offer terms absent: hold CTA or request terms; conflicting approval documents: ask owner to resolve.',
    'Score 0–2 each: claim traceability, asset fidelity, implication review, correction quality. Pass at 7/8; any unsupported material claim fails.',
    'B1 B9 B12 B13 B14 B15')
add('performance-evaluation','Performance Evaluation','L4','standalone','operational','Interpret measured ad response and prioritize a defensible creative test.',
    'Performance signals reflect the ad, audience, auction, placement, landing experience and measurement setup. Diagnose the funnel but avoid causal claims from uncontrolled comparisons. Locate weakness at the opening, hold, persuasion or action stage, then relate observed results back to the objective.',
    'Campaign objective; creative versions; spend, reach, impressions and conversion events; date window; audience/placement; landing and offer changes; baseline or holdout.',
    'Use exact metric definitions and denominators; compare like placement and period; distinguish early retention from click propensity and post-click conversion; treat small samples and platform selection bias cautiously; recommend a test that isolates one creative change and includes a guardrail.',
    'Validate data quality and attribution window; build per-version funnel metrics; identify earliest divergence and likely confounders; inspect the corresponding creative beat; write hypotheses with alternative causes; rank tests by expected business impact and cost; predeclare success, stop and follow-up rules.',
    'Evaluation: metric table with definitions, confidence caveats, beat-level diagnosis, alternative explanations, prioritized experiments, expected learning and data needed.',
    'No baseline: report descriptive patterns only; high CTR/low sales: inspect promise/landing/offer match before rewriting hook; sparse data: collect more or run qualitative comprehension checks; metric mismatch: correct calculations before conclusions.',
    'Score 0–2 each: data validity, causal humility, creative specificity, test design. Pass at 7/8; invented uplift or certainty fails.',
    'B1 B3 B7 B11 B12 B13')
add('generation-quality','Generation Quality','L4','standalone','operational','Evaluate generated media for identity, artifact, motion, physical and temporal quality.',
    'Synthetic media quality is multidimensional. Inspect subject consistency, smoothness, flicker, spatial relations, physical plausibility and cinematic language as separate dimensions. Use these as inspection dimensions, not as an automatic pass certificate for a specific commercial.',
    'Actual image/video/audio asset; intended shot; canonical references; timecode access; delivery specs; approved brand/claim rules.',
    'Require direct inspection of full output; evaluate technical usability separately from artistic fit; treat product/logo/claim changes as hard failures; inspect motion and physics at the exact action; compare first/last states to neighboring shots; identify defect severity and repair cause.',
    'Confirm file integrity; sample start, midpoint, end and high-motion intervals; watch full-speed playback with and without audio; score image geometry, subject identity, motion, physics, spatial/temporal continuity and lip-sync when relevant; compare to shot purpose; record timecoded defects and a repair recommendation.',
    'QC scorecard: asset_id, inspected duration, sample timecodes, dimension scores, hard defects, observed evidence, acceptance decision, targeted repair and reviewer confidence.',
    'Only thumbnail available: return unverified; physically impossible hero action: reject even if visual score is high; model benchmark high but local artifact poor: trust local evidence; repeated defect: switch shot construction rather than endless rerender.',
    'Score 0–2 each: identity/brand, motion/physics, temporal coherence, delivery fitness. Pass at 7/8; any critical product mutation fails.',
    'E1 E2 E3 E4 E5 D4')


def bullets(items):
    lines = [item.strip().rstrip('.') for item in items.split(';') if item.strip()]
    return '\n'.join(f'{i}. {item[0].upper() + item[1:]}.' for i, item in enumerate(lines, 1))

def input_fields(value):
    items = [item.strip().rstrip('.') for item in re.split(r'[;,]\s*', value) if item.strip()]
    return '\n'.join(f'- {item[0].upper() + item[1:]}.' for item in items)

def output_fields(value):
    artifact, separator, fields = value.partition(':')
    if not separator:
        return value
    parts = [item.strip().rstrip('.') for item in re.split(r'[;,]\s*', fields) if item.strip()]
    return f'**Deliverable:** {artifact.strip()}\n\n**Required fields or sections:**\n' + '\n'.join(f'- {part}.' for part in parts)

def write_skill(id, data):
    loc = ROOT / id / 'SKILL.md'
    loc.parent.mkdir(parents=True, exist_ok=True)
    source_ids = data['sources'].split()
    assert 5 <= len(source_ids) <= 8, (id, source_ids)
    expert_notes = EXPERT_NOTES.get(id, '')
    advanced_notes = ADVANCED_NOTES[id]
    text = f'''---
name: {id}
description: {data['description']}
---

# {data['name']}

- **Layer:** {data['layer']}
- **Placement:** {data['placement']}
- **Implementation:** {data['status']}

## Professional model

{data['model']}

## Required inputs and dependencies

{input_fields(data['inputs'])}

If a decision-critical input is missing, surface it as an explicit assumption or question. Read upstream artifacts by version and cite the governing source for factual claims.

## Decision rules and constraints

{bullets(data['rules'])}

## Operating procedure

{bullets(data['procedure'])}

## Output contract

{output_fields(data['output'])}

Report confirmed facts, inferences and open questions separately. Produce the role's assigned deliverable, not a claim that media was rendered or published unless an actual tool returned an inspectable asset.

## Failure modes and recovery

{bullets(data['failures'])}

## Evaluation rubric

{data['rubric']} Each dimension uses **0 = absent or contradicted**, **1 = present but incomplete or weakly supported**, **2 = evidenced and executable**. Score against the provided brief and evidence; a passing number never overrides a stated hard failure.

{expert_notes}

{advanced_notes}
'''
    loc.write_text(text, encoding='utf8')

if __name__ == '__main__':
    assert set(SKILLS) == set(ADVANCED_NOTES)
    for skill_id, content in SKILLS.items():
        write_skill(skill_id, content)
    print(f'Wrote {len(SKILLS)} SKILL.md files to {ROOT}')

# Existing Sparkle names remain valid. They inherit the underlying craft method and add a
# narrower execution contract; this avoids regressing saved campaigns during migration.
SPECIALIZATIONS = {
'commercial-ad-strategy': ('ad-strategy','Build a complete commercial strategy rather than a single ad angle. Compare at least two propositions, articulate the chosen audience behavior and investment role, and attach proof and measurement to each execution. Deliver a one-page creative brief with the full Objective → Audience → Insight → Proposition → Angle → Proof → Execution → CTA → Validation chain. When the campaign objective mixes long-term fame and immediate sales, name the primary job for each asset; do not make a short response ad carry every objective.'),
'product-launch': ('ad-strategy','Treat launch as an adoption problem: specify what is newly available, who needs to know, the barrier to first use, and the evidence that makes the change credible. Sequence tease, reveal, demonstration and reinforcement only when media plan and budget support all phases. Distinguish feature novelty from audience benefit; do not imply scarcity or “first ever” without evidence. Output a launch matrix with audience, message, proof, placement, CTA and KPI for each phase.'),
'reference-breakdown': ('reference-analysis','Produce an observation-led reference teardown. Mark each beat as observed, inferred or unavailable, with exact timecodes only when the full video can be inspected. For each beat record attention device, product role, framing, movement, copy, audio and transition; then isolate the transferable mechanism from protected expression. Deliver two original routes with explicit differences in setting, characters, language and sequence.'),
'motion-graphics': ('editing','Plan graphics as an information layer: identify the fact a graphic reveals, its timing relative to voice/action, and its reading hierarchy. Define typography, motion path, hold time, safe area and compositing source. Keep logo and claim text from approved vector or text assets; do not rely on generated imagery for exact copy. Output a cue sheet with timecode, graphic content, entrance/exit, asset owner and readability check. If motion obscures the product action, simplify or relocate it.'),
'caption-polish': ('copywriting','Revise captions for comprehension at playback speed and muted viewing. Preserve approved claim language; shorten surrounding copy rather than deleting qualifications. Split lines at phrase boundaries, avoid covering faces or proof, and record time in/out plus visual placement. Read the full caption track without audio to check narrative completeness. If a line needs an unreadably short hold, cut words or reallocate edit time.'),
'brand-check': ('brand-compliance','Run a campaign-level brand check beyond logo presence. Compare the main takeaway, first brand cue, packaging, palette, tone and CTA with the supplied brand kit. Separate a style deviation from a hard asset or claim violation; offer a specific correction and identify the source rule. Output pass/revise/review per item with timecode and owner.'),
'audience-hook-strategy': ('performance-creative','Write hooks from separate audience motivations, not six synonyms. For each candidate specify audience situation, unmet desire or friction, first-frame visual, spoken/super text, promise, proof beat and test hypothesis. Reject a hook if the body cannot pay it off. Choose priority hooks using relevance, credible proof and production cost; avoid fabricated urgency.'),
'ugc-ad-writer': ('copywriting','Use a truthful creator point of view. Distinguish genuine personal testimony from a scripted demonstration; first-person use, purchase and outcome claims require creator confirmation. Build a timed selfie/B-roll script with natural breaths, product actions, platform disclosure placeholder and CTA. Supply alternate openings that vary the motivation but not facts.'),
'product-demo-planner': ('director','Treat a product demo as a reproducible test: define starting state, user action, observable outcome, camera evidence and fair conditions. Prefer one clear benefit per demonstration. Record what is shown versus asserted, needed props, reset state and limitations. For comparisons or before/after, require matched conditions; otherwise use single-product proof.'),
'shot-list-builder': ('director','Deliver a continuous, nonoverlapping shot timeline with stable IDs, time in/out, narrative purpose, shot scale, blocking, lens intent, camera movement, subject action, audio, captions, transition and asset source. Sum durations exactly to the target and mark shots needing generation versus available footage. Track entry/exit states for hands, product and props. If a five-second shot needs three distinct actions, split it or reduce action.'),
'visual-consistency-check': ('consistency','Audit a specific set of shot descriptions or media against canonical product, person and scene references. Compare identity, state and style separately at each cut; record the exact defect and smallest correction. Do not infer visual consistency from text descriptions alone when actual frames exist but have not been inspected. Output a shot-by-shot continuity matrix with pass/revise/unverified.'),
'platform-format-adapter': ('platform-strategy','Adapt an existing master for named placements. Confirm current official dimensions and safe areas, then produce per-placement framing, edit, subtitle, audio and CTA changes. Do not call a center crop a strategy when it removes the product demonstration. Supply a side-by-side version matrix and list pickups needed to keep proof visible.'),
'cta-offer-writer': ('copywriting','Separate action language from offer terms. Confirm destination, eligibility, deadline, price and restrictions before writing urgency or savings. Match CTA to funnel stage and visual end card; provide one direct and one low-commitment option when appropriate. Output copy, on-screen hold, link destination and mandatory condition text. If offer evidence is absent, use a product-information CTA.'),
'brand-voice-adapter': ('brand-strategy','Translate supplied brand language into observable voice axes: sentence length, formality, humor, directness, banned terms and signature vocabulary. Rewrite copy while preserving claim scope and meaning; show before/after and explain each material change. Do not invent a voice from a logo alone. Output a compact voice rule card and revised lines.'),
'compliance-claims-review': ('brand-compliance','Audit each factual, comparative, testimonial and offer claim against its exact evidence. Capture implied claims created by visuals and sound, plus qualifiers and market scope. Assign pass, revise or specialist review; do not certify regulatory legality without competent review. Output a claim ledger with evidence ID, wording, scope and correction.'),
'accessibility-pass': ('editing','Check that the core story works with audio muted and that speech, supers and captions remain readable. Inspect contrast on actual frames, text placement outside interface overlays, reading time, flashes and critical information conveyed only by color or sound. Produce timecoded corrections and a silent-viewing summary. Do not declare WCAG compliance from a textual plan alone.'),
'creative-variant-generator': ('performance-creative','Create testable variants by changing one main creative mechanism at a time. Distinguish audience motivation, first-frame pattern, proof method and CTA; preserve product facts, landing page and measurement conditions unless those are the explicit variable. Output variant cards, hypotheses, invariants and stop rules.'),
'ad-performance-review': ('performance-evaluation','Review actual campaign results, not predicted performance. Request metric definitions, spend, period, audience and placement; separate descriptive differences from causal conclusions. Locate the earliest weak stage and examine its corresponding creative beat before recommending a rewrite. Output a ranked test plan with confounders and data needed.'),
}

def write_specialization(alias, parent, specialization):
    base = (ROOT / parent / 'SKILL.md').read_text(encoding='utf8')
    metadata = SKILLS[parent]
    name = alias.replace('-', ' ').title().replace('Ugc', 'UGC').replace('Cta', 'CTA')
    body = base.split('---\n', 2)[2]
    body = body.replace(f'# {metadata["name"]}', f'# {name}', 1)
    if alias in SPECIALIZATIONS:
        body = body.replace('**Placement:** agent-core', '**Placement:** standalone', 1)
        body = body.replace('**Placement:** provider-spec', '**Placement:** standalone', 1)
    marker = '## Professional model\n\n'
    extra = SPECIALIZATION_NOTES.get(alias, CORE_NOTES.get(alias, ''))
    body = body.replace(marker, f'## Specialization mandate\n\n{specialization}\n\n{extra}\n\n' + marker, 1)
    use_case = specialization.split('.')[0].strip()
    front = f'---\nname: {alias}\ndescription: {json.dumps(use_case + ".")}\n---\n'
    location = ROOT / alias / 'SKILL.md'
    location.parent.mkdir(parents=True, exist_ok=True)
    location.write_text(front + body, encoding='utf8')

if __name__ == '__main__':
    assert set(SPECIALIZATIONS) == set(SPECIALIZATION_NOTES)
    for alias, (parent, specialization) in SPECIALIZATIONS.items():
        write_specialization(alias, parent, specialization)
    print(f'Wrote {len(SPECIALIZATIONS)} compatibility specializations')

CORE_SPECIALIZATIONS = {
'creative-director-core': ('creative-director','Own the final campaign-level decision, not just a moodboard. Combine the decision-ready brief with a selected territory, proof architecture, brand cue plan and specialist handoffs. Where upstream strategy is absent, explicitly label provisional decisions. Reject concepts that are beautiful but have no product role. The Creative Director should deliver choices that a scriptwriter, storyboard artist and editor can implement without guessing the proposition.'),
'scriptwriter-core': ('copywriting','Own the final AV script contract. Align each line with an image or action and a verified evidence source; keep a continuous timeline and a complete CTA. Include natural read-aloud pacing, alternate opening and claim flags. If production lacks the proof shot, write a pickup requirement rather than compensating with stronger words.'),
'product-visual-designer-core': ('art-direction','Own approved product geometry, packaging and material truth in every hero image. Build an anchor sheet from actual product assets, define safe and unsafe camera views, and specify when compositing an approved pack is required. Capture the product state before and after each action. A stylish generated bottle with a wrong lid, color or label is a failed deliverable.'),
'character-designer-core': ('consistency','Create a cast identity card with face/hair/body/wardrobe anchors and the allowed range of expressions and poses. Separate inherent identity from costume and scene lighting. Review generated frames for identity drift and avoid inventing demographic or cultural traits not supplied in the brief. Hand the canonical reference IDs and shot-specific appearance states to the storyboard.'),
'scene-designer-core': ('art-direction','Own location geography, light direction and prop state across shots. Create an environment master with camera axis, time of day, palette, practical light sources and a resetable prop plan. Make background detail support the audience context while reserving visual hierarchy for the product action. A scene that looks good independently but cannot cut with adjacent shots needs revision.'),
'storyboard-designer-core': ('director','Turn the approved script into continuous shot IDs and timecodes. For every shot identify purpose, blocking, framing, movement, action state, audio/super alignment, references and generation or shooting dependency. Verify that all durations sum exactly, product proof is visible, and adjacent shots maintain geography. Mark unavailable visual assets instead of pretending they already exist.'),
'sound-director-core': ('sound','Own a timecoded VO, music, SFX and ambience cue sheet. Specify performance and mix priorities, not just adjectives. Preserve speech intelligibility and an accessible muted-viewing path. Distinguish recorded product sound from designed enhancement; require rights status for music and voice before final delivery.'),
'final-editor-core': ('editing','Own the executable edit decision list from actual assets and plans. Separate existing clips from pickups and generation tasks; reconcile shot timing, VO, captions, music and CTA in one timeline. Check every cut for continuity and every super for readable hold. Never report an exported film when only an edit plan exists.'),
}
if __name__ == '__main__':
    assert set(CORE_SPECIALIZATIONS) == set(CORE_NOTES)
    for alias, (parent, specialization) in CORE_SPECIALIZATIONS.items():
        write_specialization(alias, parent, specialization)
    print(f'Wrote {len(CORE_SPECIALIZATIONS)} Agent core specializations')
    doc = ROOT.parents[4] / 'docs' / 'studio-skills' / 'source-map.md'
    # GitHub-facing pages mirror the exact instructions that the runtime loads.
    for path in sorted(ROOT.glob('*/SKILL.md')):
        content = re.sub(r'^---\n[\s\S]*?\n---\n', '', path.read_text(encoding='utf8')).lstrip()
        doc.with_name(f'{path.parent.name}.md').write_text(content, encoding='utf8')
    print('Wrote 56 GitHub-facing skill pages')
    rows = ['# Skill research map', '', 'Maintainer reference only. Runtime SKILL.md files contain executable guidance without citations or bibliography sections. The 30 canonical L0–L4 capabilities were informed by the sources below; the source-to-heuristic relationship is recorded here. Compatibility specializations inherit their parent method and add narrower execution rules. Recheck changing platform and provider specifications against current official documentation before execution.', '', '| Layer | Skill | Placement | Sources and applied heuristics |', '| --- | --- | --- | --- |']
    for skill_id, data in SKILLS.items():
        links = '<br>'.join(f'[{SOURCES[sid][0]}]({SOURCES[sid][1]}) — {SOURCE_HEURISTICS[sid]}' for sid in data['sources'].split())
        rows.append(f'| {data["layer"]} | [{data["name"]}](../../src/lib/studio/skills/library/{skill_id}/SKILL.md) | {data["placement"]} | {links} |')
    doc.write_text('\n'.join(rows) + '\n', encoding='utf8')
    print(f'Wrote {doc}')
    inventory = doc.with_name('inventory.md')
    entries = sorted(ROOT.glob('*/SKILL.md'))
    listing = [
        '# Sparkle skill inventory', '',
        'These 56 English pages mirror the runtime skill files used by Sparkle. The linked pages are for review and are not added separately to model prompts.', '',
        '| Skill | Layer | Placement | Words |', '| --- | --- | --- | ---: |',
    ]
    for path in entries:
        content = path.read_text(encoding='utf8')
        layer = re.search(r'^- \*\*Layer:\*\* (.+?)\s*$', content, re.M).group(1)
        placement = re.search(r'^- \*\*Placement:\*\* (.+?)\s*$', content, re.M).group(1)
        listing.append(f'| [{path.parent.name}]({path.parent.name}.md) | {layer} | {placement} | {len(content.split())} |')
    inventory.write_text('\n'.join(listing) + '\n', encoding='utf8')
    print(f'Wrote {inventory}')
