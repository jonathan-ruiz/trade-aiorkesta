# @trade-aiorkesta/decision-layer

AI-augmented decision layer that evaluates rules + external context.

## Responsibilities
- Receives rule signals from rule-engine
- Fetches external data (sentiment, news, macro indicators)
- AI evaluation: "Should this trade happen given current context?"
- Trade recommendation with confidence score
- Explanation generation (why approve/reject)

## Design
Rule engine produces candidate trades. Decision layer applies judgment:
- Does this trade align with broader market conditions?
- Are there red flags in recent news?
- Is sentiment aligned with the trade direction?
- Historical performance of similar setups

Output: APPROVE | REJECT | DEFER + rationale + confidence (0-1)
