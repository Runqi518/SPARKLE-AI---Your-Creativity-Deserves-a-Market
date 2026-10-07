---
name: memory-context
description: Maintain versioned project, brand and artifact state with provenance and conflict resolution.
---

# Memory & Context

- **Layer:** L0
- **Placement:** runtime
- **Implementation:** partial

## Professional model

Memory is a selective state store, not an ever-growing transcript. Persist source facts, user preferences, approved decisions and produced artifact IDs separately. Each claim needs source, timestamp, confidence and scope. Current user corrections outrank older inferred summaries; brand documents outrank stylistic guesses.

## Required inputs and dependencies

- Project and campaign IDs.
- Brief.
- Approved brand assets.
- Conversation.
- Current script/shot versions.
- Generation assets.
- Explicit user corrections.

If a decision-critical input is missing, surface it as an explicit assumption or question. Read upstream artifacts by version and cite the governing source for factual claims.

## Decision rules and constraints

1. Retrieve only state relevant to the current role and task.
2. Use immutable artifact IDs plus version links rather than overwriting history.
3. Separate stable brand constraints from campaign-specific choices.
4. Never promote an Agent inference to a confirmed product fact.
5. When sources conflict, show the conflict and use the latest authoritative source.

## Operating procedure

1. Ingest source with provenance.
2. Normalize entities and constraints.
3. Mark confirmed, assumed, disputed or expired.
4. Retrieve a compact role-specific context pack.
5. Reconcile new output against the state ledger.
6. Write an updated version only after validation.
7. Record which dependent artifacts become stale.

## Output contract

**Deliverable:** Context pack

**Required fields or sections:**
- objective.
- audience.
- approved facts.
- prohibited claims.
- brand cues.
- decisions.
- current artifact IDs.
- conflicts and unresolved questions. Every item carries source_id and status.

Report confirmed facts, inferences and open questions separately. Produce the role's assigned deliverable, not a claim that media was rendered or published unless an actual tool returned an inspectable asset.

## Failure modes and recovery

1. If context is too large, preserve source facts and current decisions before old drafts.
2. If a model repeats an obsolete claim, reject the affected output and refresh the context pack.
3. If two approved documents disagree, stop claim-dependent work and request resolution.

## Evaluation rubric

Score 0–2 each: provenance, currentness, relevance, conflict handling. Pass at 7/8; silently overwriting a confirmed brand fact is a hard fail. Each dimension uses **0 = absent or contradicted**, **1 = present but incomplete or weakly supported**, **2 = evidenced and executable**. Score against the provided brief and evidence; a passing number never overrides a stated hard failure.

## State model and precedence

Represent each memory item as `{value, scope, source_id, observed_at, approved_at, status, supersedes}`. Scope distinguishes brand-wide identity from campaign decisions and shot-local state. Status distinguishes approved fact, user preference, working assumption and rejected proposal. A prompt summary is a retrieval aid; the underlying record and asset remain authoritative. Never merge two visually similar product variants into one identity record simply because their names match.

| Conflict | Resolution rule | Downstream effect |
| --- | --- | --- |
| User correction vs an older Agent summary | Current explicit correction wins; retain old value as superseded | Re-evaluate artifacts that used the old value |
| Approved brand book vs a reference advertisement | Brand book governs the user's brand; reference informs mechanism only | Remove conflicting palette, logo or voice choices |
| Two current approved source documents disagree | Mark disputed and ask the owner for a decision | Block claim or package-sensitive output |
| Generated frame vs approved product photo | Photo governs identity; frame is candidate output | Reject or repair the frame |

## Retrieval and compaction

Build context packs by task: a Scriptwriter needs proposition, voice, claim ledger, shot evidence and CTA; a Scene Designer needs palette, location, product dimensions and continuity states. Old exploratory variants may be summarized or archived, but do not compact away the reason the current choice was approved. Persist links from each output to exact input versions so a later correction can invalidate only affected work. When a conversation becomes long, summarize decisions and unresolved questions separately, then confirm the summary against stored artifacts. A discussed claim is not equivalent to an approved claim.

## Retention and retrieval policy

Retain approved identity and claim records until explicitly superseded. Keep rejected ideas only as compact decision history when they would otherwise reappear; avoid injecting them into every Agent prompt. Preserve the full provenance of generated assets even when conversational context is summarized. Retrieval should answer a role-specific question and include the smallest relevant evidence set. If no approved source exists, the context pack must say “unverified” rather than silently omit the field; omission could be mistaken for permission to invent. A stale asset remains readable for audit, but should not be selected as a current reference.

## Context selection and staleness

Store facts at the scope where they hold: brand-wide, campaign, asset, character, scene or shot. Give each item a stable identifier, source link, approval state and supersession relationship. A recent generated artifact is not an authoritative source for product truth, even if it appears in several downstream prompts. Retrieval should choose the minimum context needed for the current decision and preserve exact IDs for anything that must remain visually or legally identical.

On every update, identify dependent artifacts and mark them current, provisional or stale. Resolve straightforward precedence from explicit user corrections and approved sources; ask for resolution when two current authoritative sources conflict. Do not compact a disagreement into a single confident summary. Make the context pack auditable enough that a specialist can identify which claim or image it relied on.
