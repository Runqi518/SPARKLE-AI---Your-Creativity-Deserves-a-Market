# Performance Evaluation

- **Layer:** L4
- **Placement:** standalone
- **Implementation:** operational

## Professional model

Performance signals reflect the ad, audience, auction, placement, landing experience and measurement setup. Diagnose the funnel but avoid causal claims from uncontrolled comparisons. Locate weakness at the opening, hold, persuasion or action stage, then relate observed results back to the objective.

## Required inputs and dependencies

- Campaign objective.
- Creative versions.
- Spend.
- Reach.
- Impressions and conversion events.
- Date window.
- Audience/placement.
- Landing and offer changes.
- Baseline or holdout.

If a decision-critical input is missing, surface it as an explicit assumption or question. Read upstream artifacts by version and cite the governing source for factual claims.

## Decision rules and constraints

1. Use exact metric definitions and denominators.
2. Compare like placement and period.
3. Distinguish early retention from click propensity and post-click conversion.
4. Treat small samples and platform selection bias cautiously.
5. Recommend a test that isolates one creative change and includes a guardrail.

## Operating procedure

1. Validate data quality and attribution window.
2. Build per-version funnel metrics.
3. Identify earliest divergence and likely confounders.
4. Inspect the corresponding creative beat.
5. Write hypotheses with alternative causes.
6. Rank tests by expected business impact and cost.
7. Predeclare success, stop and follow-up rules.

## Output contract

**Deliverable:** Evaluation

**Required fields or sections:**
- metric table with definitions.
- confidence caveats.
- beat-level diagnosis.
- alternative explanations.
- prioritized experiments.
- expected learning and data needed.

Report confirmed facts, inferences and open questions separately. Produce the role's assigned deliverable, not a claim that media was rendered or published unless an actual tool returned an inspectable asset.

## Failure modes and recovery

1. No baseline: report descriptive patterns only.
2. High CTR/low sales: inspect promise/landing/offer match before rewriting hook.
3. Sparse data: collect more or run qualitative comprehension checks.
4. Metric mismatch: correct calculations before conclusions.

## Evaluation rubric

Score 0–2 each: data validity, causal humility, creative specificity, test design. Pass at 7/8; invented uplift or certainty fails. Each dimension uses **0 = absent or contradicted**, **1 = present but incomplete or weakly supported**, **2 = evidenced and executable**. Score against the provided brief and evidence; a passing number never overrides a stated hard failure.

## Measurement and causal boundary

Before diagnosis, define each metric's numerator, denominator, attribution window and collection method. Confirm spend, exposure, placement, audience, time period and offer changes. A high view rate says little about purchase if the audience is poorly matched; a low conversion rate may reflect landing or inventory problems. Treat platform dashboards as observational unless a controlled test or credible comparison design supports a causal conclusion.

| Funnel signal | First creative review | Confounder to inspect |
| --- | --- | --- |
| Initial attention | First frame, relevance and brand timing | Placement and targeting |
| Retention | Information sequence, proof pacing and repetition | Video loading and length distribution |
| Click/action | Value clarity, CTA and promise match | Offer, link and page usability |
| Business result | Qualified traffic and conversion quality | Attribution, price, stock and seasonality |

## Experiment decision record

For each proposed test, state hypothesis, changed creative variable, invariants, eligible audience, primary metric, guardrail metric, minimum observation window and stopping rule. If several variables change, label the result a route comparison. Do not report percentage uplift without baseline volume and uncertainty. Rank next actions by expected learning as well as expected outcome; a cheap test that distinguishes two plausible causes may be more valuable than another decorative variant. Archive unsuccessful hypotheses so the team does not repeatedly rediscover the same weak angle.

## Measurement validity and creative causality

Begin with campaign objective, metric definition, attribution window, spend, audience, placement, period and creative version. Separate delivery differences from response differences and the ad's influence from landing page or offer effects. CTR, view-through and CVR answer different questions; none alone proves a concept is strategically strong. State sample and confounding limitations before comparing variants.

Locate the earliest credible performance weakness and map it to the creative beat that could affect it. Propose one testable revision with expected signal, controlled conditions and a result that would disconfirm the hypothesis. Report observed result, plausible interpretation and next decision separately. If evidence is too thin, recommend instrumentation or a qualitative comprehension check instead of declaring a winner.
