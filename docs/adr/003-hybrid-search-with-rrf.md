# ADR 003 — Hybrid Search with Reciprocal Rank Fusion

**Status**: Accepted  
**Date**: 2026-01

---

## Context

AskBase retrieves document chunks to answer user queries. Pure vector search (semantic similarity) performs well on conceptual or paraphrased queries but degrades on exact-match queries — product names, error codes, version numbers, proper nouns. Pure keyword search (BM25) handles exact matches well but fails on semantic variation ("how do I cancel" vs "termination of subscription").

We needed a retrieval strategy that handles both.

## Decision

Use **hybrid search** — vector search and BM25 keyword search run in parallel, results merged using **Reciprocal Rank Fusion (RRF)** — followed by a **cross-encoder reranker**.

## Reasoning

### Why hybrid over pure vector

In internal evaluation against a test set of 200 domain-specific queries:

| Strategy | Recall@5 | Precision@3 |
|----------|----------|-------------|
| Vector only | 0.71 | 0.58 |
| BM25 only | 0.63 | 0.61 |
| Hybrid (RRF) | **0.84** | **0.74** |
| Hybrid + rerank | **0.89** | **0.81** |

The improvement is most pronounced on queries containing model numbers, specific feature names, and short exact-match phrases — exactly the type of queries businesses care most about.

### Why RRF over weighted score fusion

Weighted score fusion (`α × vector_score + (1-α) × bm25_score`) requires tuning `α` per domain and is sensitive to score distribution differences between the two systems. RRF uses only rank positions:

```
RRF_score(d) = Σ 1 / (k + rank_i(d))
```

where `k=60` (standard constant). This is:
- Parameter-free — no `α` to tune per tenant
- Robust to score scale differences between vector cosine similarity and BM25 tf-idf
- Proven in the TREC literature across diverse retrieval tasks

### Why a cross-encoder reranker

The first-stage retrieval (vector + BM25) optimises for recall — getting relevant documents in the candidate set. The reranker optimises for precision — putting the most relevant documents first. Cross-encoders attend jointly to the query and each candidate, producing a relevance score that is significantly more accurate than the bi-encoder similarity used in retrieval. The cost is acceptable because the reranker only processes the top-20 candidates (not the full corpus).

## Implementation

```
1. Vector search: pgvector cosine similarity → top 20 chunks
2. BM25 search:  Postgres tsvector + ts_rank  → top 20 chunks
3. Merge:        RRF(vector_results, bm25_results, k=60)
4. Rerank:       cross-encoder score on merged top-20
5. Select:       top-5 by reranker score → context window
```

Both searches run as a single SQL query using CTEs. No application-level merge of two separate round trips.

## Consequences

- Retrieval latency: ~40–80ms (vs ~20ms for vector-only) — acceptable given total response time target of <2s
- The `tsvector` GIN index on `chunks.fts` adds ~15% to the size of the chunks table — acceptable
- BM25 in Postgres is an approximation (tf-idf, not true BM25) — sufficient for our use case; true BM25 would require a Rust extension or Elasticsearch
