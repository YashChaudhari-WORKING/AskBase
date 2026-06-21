# ADR 002 — pgvector over a Dedicated Vector Database

**Status**: Accepted  
**Date**: 2026-01

---

## Context

AskBase needs a vector store for chunk embeddings (1536-dimensional, `text-embedding-3-small`). The main candidates were:

- **pgvector** — PostgreSQL extension; same DB instance already used for all relational data
- **Pinecone** — managed, purpose-built vector database
- **Weaviate** — open-source, self-hostable vector database
- **Qdrant** — open-source, Rust-based, high performance

## Decision

Use **pgvector** within the existing PostgreSQL 16 instance.

## Reasoning

**Operational simplicity is the dominant factor at this stage.** Adding a second stateful service (Pinecone, Qdrant) means:
- A second connection to manage, monitor, and secure
- A second failure point
- Cross-service transactions become impossible — storing a chunk and its embedding atomically requires two separate writes with no rollback guarantee

With pgvector, storing a chunk and its embedding is a single transaction. If the embedding write fails, the chunk is not persisted. Consistency is guaranteed by the database.

**Query performance is sufficient.** With an `ivfflat` index (`lists=100`), approximate nearest-neighbour search on 1M vectors completes in under 10ms on a standard Postgres instance. At AskBase's current and near-term scale (100k–500k chunks per tenant), this is more than adequate.

**Hybrid search is native.** The most important reason: AskBase uses hybrid vector + BM25 keyword search. With pgvector, both searches run in a single SQL query joined by Reciprocal Rank Fusion. With a dedicated vector DB, the keyword search would need to run separately in Postgres and the results merged in application code — slower, more complex, and harder to maintain.

## Alternatives Considered

| Option | Rejected Because |
|--------|-----------------|
| Pinecone | Managed cost scales with vectors stored; no SQL joins; keyword search requires separate system |
| Qdrant | Additional service to operate; no transactional guarantees with Postgres |
| Weaviate | Heavier operationally; GraphQL query interface adds complexity |

## Migration Path

If scale demands it (>10M vectors per tenant, sub-millisecond latency requirements), the embedding store can be migrated to a dedicated vector DB without touching the rest of the schema. The `chunk_embeddings` table is isolated and accessed only through the retrieval service layer.

## Consequences

- All data (relational + vector) lives in one Postgres instance — simpler backups, simpler monitoring
- `ivfflat` index requires a `VACUUM ANALYZE` after bulk inserts to maintain query quality — handled automatically by the ingestion service post-batch
- `pgvector` supports up to 2000 dimensions — sufficient for all current embedding models
