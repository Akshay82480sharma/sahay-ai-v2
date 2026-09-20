# Gemini fallback chain for Sahay: what to keep, what to change

An internal note for Person A (phase A6: real LLM). It turns the pasted Gemini Flash quota-chain advice into a design that fits Sahay's spec, checked against Google's docs as of 20 September 2026 (models and 3.8 pages updated 2026-09-17, rate limits 2026-09-02).

## 1. Fact-check of the pasted message

| Claim | Verdict | Evidence |
|---|---|---|
| Stable Flash models: 3.8, 3.7, 3.6, 3.5, plus 3.5 Flash-Lite | **Correct** | Models page lists all five as Stable. IDs: `gemini-3.8-flash`, `gemini-3.7-flash`, `gemini-3.6-flash`, `gemini-3.5-flash`, `gemini-3.5-flash-lite` |
| 3.7 is for complex coding and agentic work; 3.6 for general everyday tasks | **Correct** | Matches Google's own descriptions |
| 3.8 supports low, medium and high thinking | **Correct, with a catch** | Default is `medium`. `minimal` is not supported on 3.8 and returns an error |
| Rotating several API keys raises your free quota | **Wrong** | "Rate limits are applied per project, not per API key" (rate-limits page) |
| (not mentioned) All chain models are free on the free tier | Correct | Pricing page: "Free of charge" for input and output |
| (not mentioned) `gemini-3.1-flash-lite` is also Stable and cheap | Correct | Models page |
| (not mentioned) Free-tier content is used to improve Google's products | **Matters for Sahay** | Pricing page, row "Used to improve our products": Yes on the free tier, No on paid |

Google also says, on the 3.8 page, that low thinking suits latency-critical work "like incident response pipelines". That is your use case, so the design below follows it.

## 2. What to change for Sahay

**1. End the chain at the keyword engine, not at Flash-Lite.** Your `CLAUDE.md` says the app must never crash when the LLM is unavailable. A five-model chain that ends at another API call still fails when the network does. The last rung is `keyword_rules.py`, which needs no internet.

**2. One call per report, not one call per task.** The pasted routing table sends classification, extraction, duplicate detection and summary to different models. Quota is counted in requests, so that turns one report into three or four. Sahay needs one structured call that returns type, severity, priority, location, `required_resources` and a summary (the fields `POST /reports` returns), plus the false-report flag your internal `classify()` signature carries. Duplicate detection is distance, time and type, so it needs no LLM at all. Dispatch ranking can be plain logic, as your split already plans (tested with plain dicts); the LLM's job is the `reasoning` text.

**Spec gap to close:** the README promises "likely false reports are flagged", but `API_SPEC.md` has no field for it. Decide whether the flag only lowers `confidence`, or gets a field (then update the spec first and tell Person B).

**3. Use three tiers, ordered for availability, not prestige.** Tasks here are simple and short, so a fallback is there for its own limits and lower cost, not for more capability.

| Tier | Model ID | Why |
|---|---|---|
| 1 | `gemini-3.8-flash` at low thinking | Google's own pick for latency-critical incident work |
| 2 | `gemini-3.6-flash` | Everyday tasks; its own model limits |
| 3 | `gemini-3.5-flash-lite` | Google describes it for "high-volume agentic tasks, translation, and simple data processing" |

Keep the list in an env var. If AI Studio shows tight limits, add `gemini-3.7-flash` or `gemini-3.1-flash-lite` to it; nothing else changes.

**4. One deadline for the whole chain.** If each of five tiers gets an 8-second timeout, the worst case is 40 seconds before the keyword engine even starts. Give the whole classification one budget (about 5 seconds). Each attempt gets whatever is left; when less than about a second remains, go straight to keywords.

**5. Cool down a model after a 429.** Otherwise every later report pays the cost of a failed call to a model you already know is exhausted. Mark it cooling for a minute (longer if the error says the daily limit is gone; daily limits reset at midnight Pacific) and skip it instantly.

**6. Pace your own calls.** The simulator ingests 15 reports over 30 seconds (your spec), which is 30 requests a minute at one call per report. At four calls per report it would be 120. Compare with the RPM that AI Studio shows for each model, and set your own limiter below the lowest. Reports that cannot get a slot in time take the keyword path.

**7. Cache by text.** Hash the normalised text plus `source`. The scenario scripts repeat, so rehearsals stop burning quota.

**8. Treat error types differently.** A quota error is not a bug; a wrong model ID is. See the table in section 4. Add a startup self-check that sends one tiny prompt to each configured model and logs which ones answered. Without it, a typo in a model ID looks exactly like "the LLM is slow" and every report quietly goes to keywords.

**9. Drop key rotation.** Extra keys in one project share one quota. Spreading across extra projects or accounts to multiply the free tier is something I could not find Google endorsing, and losing a key the night before the demo costs far more than it saves. Legitimate levers: fewer calls (change 2), the cache (7), separate model limits (3), and linking billing, and the rate-limits page says the Free to Tier 1 upgrade "will typically take effect instantly". At list prices a few hundred classification calls should cost roughly a dollar or less (my estimate, assuming about 700 input and 250 output tokens per call; thinking tokens count as output, so measure).

**10. Keep real citizen data off the free tier.** Free-tier prompts may be used to improve Google's products. Your demo data is synthetic, so this is fine, but say so in the README. It is also a point in your favour with judges.

## 3. Settings

Add to `.env.example` (placeholders only; the repo is public). Values are starting points to tune after you measure real latency.

```
# ---------- LLM router ----------
LLM_PROVIDER=mock                 # mock | gemini
GEMINI_API_KEY=your_key_here
GEMINI_MODELS=gemini-3.8-flash,gemini-3.6-flash,gemini-3.5-flash-lite
LLM_TIMEOUT_SECONDS=3             # per call
LLM_DEADLINE_SECONDS=5            # whole chain, all tiers together
LLM_COOLDOWN_SECONDS=60           # skip a model this long after a 429
LLM_CACHE_SIZE=500
LLM_MAX_RPM=8                     # placeholder: set below the lowest RPM shown in AI Studio
```

Pin exact model IDs. The models page says `-latest` aliases are hot-swapped, and preview models have "more restrictive rate limits".

## 4. Decision procedure and error handling

For each report:

1. Cache hit? Return it.
2. Set the deadline.
3. For each tier in order: skip it if cooling; skip it if your pacing limiter has no slot; stop if the time left is under about a second; otherwise call it with `min(time left, per-call timeout)`.
4. Validate the JSON: `type` in the enum, `severity` an integer 1 to 5, `priority` in the enum, resource types valid. Repair small slips (clamp severity, unknown type becomes `other`). Otherwise treat as a failure.
5. On success, cache and return. On failure, act as below and try the next tier.
6. Nothing left: run the keyword engine, which cannot fail.

| Signal | Meaning | Router action |
|---|---|---|
| `429 RESOURCE_EXHAUSTED` | Rate, daily or spend limit | Cool that model down, try the next |
| 5xx, `503`, `504`, timeout | Transient | Try the next; cool down after two in a row |
| `400` or `404` | Your bug: bad parameter or wrong model ID | Disable that model for this run, log an ERROR, try the next |
| `200` but invalid JSON | Model slip | Repair if trivial, else try the next |
| Deadline spent, or all tiers cooling | | Keyword engine immediately |

Google's rate-limits page names `429 RESOURCE_EXHAUSTED` for spend-based limits and describes RPM, TPM and RPD overruns only as "a rate limit error"; I am assuming the same code, which fits Google's standard error model. The other rows are also the standard Google API codes. Confirm all of them on the API errors page, and log one raw `429` body during development, before you code against them.

## 5. Request settings: where AI-written code goes wrong

Google's 3.8 migration checklist says to strip `temperature`, `top_p` and `top_k`, replace `thinking_budget` with `thinking_level`, and remove `candidate_count`. Its quickstart calls `client.interactions.create(...)` with a `thinking_level` setting in `generation_config`; older `generate_content` samples also exist. A coding agent writing from memory will likely use the old parameters.

- Copy the call from the current quickstart, not from memory.
- Keep per-model request options in one dict. Do not send the same `thinking_level` to every tier: `minimal` errors on 3.8, and I did not verify which levels 3.6 and 3.5 Flash-Lite accept. Read each model's page (linked from the models page) first.
- Use the docs' Structured outputs feature so the model returns schema-checked JSON, which cuts invalid-JSON fallbacks.

## 6. Where it lives

| Piece | File |
|---|---|
| Tier loop, cooldowns, pacing, cache | `services/llm/gemini.py` |
| Calls the provider, falls back to keywords | `services/classifier.py` |
| Env settings | `core/config.py`, `.env.example` |
| Fault-injection tests | `tests/test_classifier_fallback.py` |

If Sahay is Gemini-only, delete `services/llm/claude.py` and `ANTHROPIC_API_KEY` from `.env.example`. Update the README tech-stack line, which still says "Gemini / Claude".

## 7. Tests (fake client, no API key)

- A `429` on tier 1 falls to tier 2, and tier 1 is skipped afterwards without another call.
- `429` on every tier returns the keyword result, and total time stays under the deadline.
- A timeout on tier 1 leaves the remaining budget to the next tier.
- Invalid or out-of-range JSON is repaired or falls through.
- A `400` disables that model and logs an error.
- A repeated report makes zero API calls.
- The real Gemini path is exercised at least once by hand with a real key. The fallback hides failures, so a passing test suite alone does not prove the LLM works.

## 8. Build order

1. Get the key. Open <https://aistudio.google.com/rate-limit> and write down RPM and RPD for your three models.
2. Write a 20-line script that sends one tiny prompt to each model ID and prints the reply. This catches wrong IDs and parameters before any router exists.
3. Build the router and the tests.
4. Build a set of 20 to 30 labelled reports in Gujarati, Hinglish and English (reuse your scenario scripts). Run it against each tier and choose the order from results, not guesses. The same set becomes your classifier test fixtures.

## 9. Not verified

- Actual free-tier RPM and RPD numbers: the docs do not list them; they are in AI Studio behind a login.
- Whether each model's quota is counted separately in practice. Docs say limits vary by model. Test it once: exhaust tier 1, then confirm tier 2 still answers.
- The exact retry-delay fields in a `429` body. Log one raw body during development.
- Real latency of each tier at low thinking.
- Whether Google's terms restrict using several projects to multiply free quota. I found nothing either way, so I advise against it on risk alone.

Sources: [Models](https://ai.google.dev/gemini-api/docs/models) · [What's new in 3.8 Flash](https://ai.google.dev/gemini-api/docs/latest-model) · [Rate limits](https://ai.google.dev/gemini-api/docs/rate-limits) · [Pricing](https://ai.google.dev/gemini-api/docs/pricing)
