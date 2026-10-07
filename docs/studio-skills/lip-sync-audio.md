# Lip-sync & Audio

- **Layer:** L3
- **Placement:** provider-spec
- **Implementation:** specification

## Professional model

Lip sync requires an audio master, phoneme timing and visible mouth footage; it is not satisfied by a plausible voiceover. The quality of dialogue, voice identity, room tone and mouth motion must be judged separately. When the product currently has no compatible synthesis and synchronization provider, deliver an audio direction plan and mark this capability unimplemented.

## Required inputs and dependencies

- Approved spoken script and pronunciation.
- Voice consent/rights.
- Character footage.
- Language and accent.
- Audio specs.
- Enabled speech and lip-sync providers.
- Target shot timecodes.

If a decision-critical input is missing, surface it as an explicit assumption or question. Read upstream artifacts by version and cite the governing source for factual claims.

## Decision rules and constraints

1. Do not clone a real voice without authorization.
2. Lock the final line before generating mouth motion.
3. Use only shots with visible, suitable faces for lip-sync evaluation.
4. Prefer VO over dialogue when face coverage is absent.
5. Check timing, consonant closures, facial artifacts and sound-image relationship through full playback.

## Operating procedure

1. Verify provider capability and rights.
2. Generate or ingest final speech.
3. Align line to shot duration.
4. Run synchronization if available.
5. Inspect mouth motion at phoneme-dense moments and shot boundaries.
6. Mix with ambience/music.
7. Render captions.
8. Approve only an inspectable audio/video asset.

## Output contract

**Deliverable:** Audio/lip-sync record

**Required fields or sections:**
- script version.
- voice source/rights.
- audio ID.
- face video ID.
- sync provider.
- timing map.
- QC timecodes.
- caption file.
- approval status.

Report confirmed facts, inferences and open questions separately. Produce the role's assigned deliverable, not a claim that media was rendered or published unless an actual tool returned an inspectable asset.

## Failure modes and recovery

1. Speech overrun: revise script or shot duration before time-stretching excessively.
2. Sync drift: re-align from the correct audio master.
3. Facial deformation: replace shot or use VO.
4. Unavailable provider: return plan and required integration, never a claimed completed sync.

## Evaluation rubric

Score 0–2 each: intelligibility, sync accuracy, facial fidelity, rights/readiness. Pass at 7/8; unconsented voice or absent output asset fails. Each dimension uses **0 = absent or contradicted**, **1 = present but incomplete or weakly supported**, **2 = evidenced and executable**. Score against the provided brief and evidence; a passing number never overrides a stated hard failure.

## Preconditions and synchronization chain

Lip sync has strict prerequisites: final approved spoken text, a mastered audio file, rights to the voice, a face shot with a readable mouth, compatible provider controls and a target timeline. If any are absent, do not describe lip sync as executed. Speech generation and mouth synchronization are separate operations; each produces its own artifact and must be inspected before the next stage. A line changed after synchronization invalidates the mouth animation.

| Stage | Required check | Failure route |
| --- | --- | --- |
| Script lock | Exact words, language, pronunciation and duration | Revise line before generating audio |
| Voice asset | Consent, identity, performance, intelligibility | Re-record or choose authorized voice |
| Sync asset | Mouth movement follows phonemes and pauses | Re-align, change coverage or use VO |
| Final mix | Dialogue remains intelligible with music and ambience | Remix and recheck captions |

## Quality and rights boundary

Inspect at full playback speed and at dense consonant or closed-mouth moments, not only on a still frame. Check facial deformation, jaw consistency, timing drift and cut-boundary continuity. Keep captions tied to the final script and actual audio timing. Do not use an unauthorized person's voice or suggest that a music track is cleared without a rights record. Where the current application lacks a supported provider, the skill can produce a production plan and required integration contract only; it must label the media operation unperformed.

## Speech source and temporal alignment

Confirm speaker identity, script approval, language, pronunciation, voice rights and whether the voice is recorded or synthetic. Align phoneme-level mouth movement to the final audio track rather than to an earlier script draft. Track timing changes caused by pauses, names and qualifiers. If the face is too small or occluded for reliable sync, select a different shot rather than asserting synchronization from a waveform alone.

Inspect lips, jaw, facial expression and audio together at normal speed, including cuts into and out of speech. Check language accuracy and emotional performance separately from technical alignment. Keep captions synchronized to final words and preserve an accessible muted version. Report rights and identity approval as independent gates; technical success cannot substitute for them.
