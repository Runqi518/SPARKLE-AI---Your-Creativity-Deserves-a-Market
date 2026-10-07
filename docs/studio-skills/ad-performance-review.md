# Ad Performance Review

Identifier: `ad-performance-review`

Diagnose creative performance from actual user-supplied campaign data and propose actionable tests.

## When to use

Analyzing opening retention, clicks, conversion or creative fatigue from campaign data.

## Inputs

- Spend, impressions, views, clicks, conversions and revenue by creative or ad group
- Time range, attribution window, currency and metric definitions
- Audience, placement, budget, offer and landing-page differences
- Scripts, variants, baselines or historical data

## Execution steps

1. Check completeness, time ranges, currency, attribution and definitions; mark missing or incomparable data.
2. With nonzero denominators and clear inputs, calculate CTR=clicks/impressions, CPC=spend/clicks, CPA=spend/conversions and ROAS=attributed revenue/spend; state the conversion-rate denominator.
3. Separate possible viewing, clicking and conversion-funnel issues; use scripts to identify creative explanations to test.
4. Check simultaneous changes in audience, placement, offers and landing pages; distinguish observations from causal explanations.
5. Propose up to three priority tests, defining hypothesis, creative changes, fixed factors, primary metric and evidence needed.
6. Without data, provide a collection template and analysis plan; with insufficient samples, state that conclusions are unavailable and do not invent benchmarks or significance.

## Deliverables

- Data quality and comparability
- Computable metrics, formulas and missing inputs
- Observation–possible cause–evidence–uncertainty
- Priority tests and additional data needed

## Quality checks

- No division by zero or mixed currencies or incompatible definitions
- No fabricated campaign data, benchmarks or significance
- No treating correlation as causation or guaranteeing revenue improvements
