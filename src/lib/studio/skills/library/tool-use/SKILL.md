---
name: tool-use
description: Choose and call available search, model, file and editor tools with explicit contracts and observable results.
---

# Tool Use

- **Layer:** L0
- **Placement:** runtime
- **Implementation:** partial

## Professional model

A tool is chosen for the evidence or artifact it can produce. Search discovers sources; a model proposes content; an editor changes an artifact; a validator checks it. Neither a prompt nor a proposed edit counts as an executed action. Tool success requires checking the returned identifier, file or error.

## Required inputs and dependencies

- Requested operation.
- Permitted tools.
- Exact input asset IDs.
- Provider capabilities and current limits.
- Expected output type.
- User authorization.
- Idempotency information.

If a decision-critical input is missing, surface it as an explicit assumption or question. Read upstream artifacts by version and cite the governing source for factual claims.

## Decision rules and constraints

1. Prefer the narrowest tool that meets the requirement.
2. Check provider specs at call time when they can change.
3. Never pass a local path as a remotely accessible reference without confirming transport.
4. Distinguish read, generation and external publication side effects.
5. Before retrying a non-idempotent call, check whether it already produced an asset.

## Operating procedure

1. Define input schema and expected postcondition.
2. Verify asset existence and format.
3. Select a tool and parameters supported by the current provider.
4. Call once with a request ID.
5. Inspect structured response and saved state.
6. Validate dimensions, duration and asset linkage.
7. Log outcome and cost.
8. Escalate errors by class rather than repeating unchanged parameters.

## Output contract

**Deliverable:** Tool log

**Required fields or sections:**
- tool.
- provider.
- capability_version.
- request_id.
- input_asset_ids.
- parameters.
- returned_asset_ids.
- latency.
- cost.
- validation_status.
- error_class.

Report confirmed facts, inferences and open questions separately. Produce the role's assigned deliverable, not a claim that media was rendered or published unless an actual tool returned an inspectable asset.

## Failure modes and recovery

1. Authentication or unsupported capability: stop that branch and ask for configuration.
2. Transient timeout: inspect state, then one bounded retry.
3. Malformed input: repair input.
4. Empty media URL: treat as failure even if text says success.

## Evaluation rubric

Score 0–2 each: tool fit, parameter validity, outcome verification, side-effect control. Pass at 7/8; claiming completion without an output artifact is a hard fail. Each dimension uses **0 = absent or contradicted**, **1 = present but incomplete or weakly supported**, **2 = evidenced and executable**. Score against the provided brief and evidence; a passing number never overrides a stated hard failure.

## Tool selection matrix

| Deliverable needed | Appropriate operation | Verification | Common false completion |
| --- | --- | --- | --- |
| Current platform specification | Read the official placement guide and record access date | Direct link and quoted parameter in the task record | Repeating a memorized size as current |
| Branded keyframe | Generate or composite with approved pack asset | Open image; compare exact logo, label and geometry | Accepting an attractive thumbnail |
| Motion shot | Submit through a provider mode that supports supplied references | Inspect playable asset, duration and action frames | Treating a job ID or prompt as a finished shot |
| Edited film | Run the editor/export pipeline | Inspect exported file, audio, captions and length | Reporting an edit decision list as a video |

Tool parameters should be derived from the shot contract and current provider capability, not guessed from another vendor. Distinguish a feature that is unavailable on the model from a feature that is merely absent from the local connector. If the connector cannot express a required first/last-frame control, changing prompt words cannot create that control; choose a different mode or change the shot design. Record the transport path for references: local paths, internal asset IDs and public URLs have different permissions and lifetime. A successful HTTP response with an empty candidate list is a failed operation.

## Retry classification

For validation errors, correct the request and do not spend a blind retry. For transient provider errors, check whether an asynchronous job exists before resubmission. For low-quality but valid media, alter one causal variable and preserve the previous asset for comparison. For external publication or payment-bearing operations, require the operation's existing authorization and idempotency rule; a skill instruction cannot grant either. The execution log must let a reviewer reconstruct what was requested, what was returned and what was actually inspected.

## Parameter and side-effect discipline

Before calling a model, bind every parameter to a requirement or a provider default and record which. Validate mutually exclusive modes, maximum reference counts, supported aspect ratios and duration ranges locally when capability metadata exists. An editor operation should declare source version and target version; a search operation should record the exact page retrieved and access date; a provider call should retain request and returned job IDs. Distinguish retryable transport failure from content failure. Do not rerun an operation with irreversible external effects merely because the response was lost; query status or reconcile by idempotency key first.

## Provider capability and result integrity

Represent a required tool call as capability, input type, output type, control parameters and postcondition. Confirm which parameters are supported by the connected provider and which exist only in a vendor's public product. Map every reference image or clip to a retrievable asset ID or transport URL with sufficient lifetime. Before submission, check orientation, duration, resolution, file size, permission and rights; after submission, inspect the returned asset rather than trusting a completion message.

Record asynchronous job state and request ID so a timeout can be reconciled before retry. Treat empty outputs, inaccessible URLs, mismatched dimensions and missing audio as failures even if the transport succeeded. A fallback provider is valid only if it can satisfy the original hard constraints; otherwise revise the shot contract and obtain creative approval.
