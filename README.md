<div align="center">

<br />

<h1>AskBase</h1>

<p><strong>AI chat assistants that answer from your documents — not from thin air.</strong></p>

<p>Upload your knowledge base. Describe your assistant in one sentence. Embed one script tag. Live in 60 seconds.</p>

<br />

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16_+_pgvector-336791?style=flat-square&logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![Redis](https://img.shields.io/badge/Redis-7-dc382d?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![License](https://img.shields.io/badge/License-Private-red?style=flat-square)](#license)

<br />

</div>

---

## The problem

Every AI chatbot builder we tried had the same failure mode: the bot confidently answered from wherever the model felt like — not from your actual docs. The answers looked right. They were wrong.

AskBase is built around one constraint: **the AI can only answer from what you give it.**

Every response is grounded in your documents and cited back to the exact source. Every response is scored for faithfulness and relevance before it reaches the visitor. If the confidence is too low — the answer is vague, the context is thin, or the question is outside the knowledge base — the system doesn't guess. It tells the visitor honestly, flags the conversation, and routes it to a human agent in the Live Console with full context already loaded. The agent sees the entire history, takes over in real time, and when they resolve it, that resolution is captured — feeding back into what the system knows.

---

## How it works

```
1. Upload          →  PDF, URL, or plain text. Processed automatically.
2. Describe        →  One sentence. That's your assistant's entire config.
3. Embed           →  One <script> tag. Works on any site, any stack.
```

That's the product. Everything else — chunking, embedding, hybrid search, reranking, evaluation, handoff — happens invisibly underneath.

---

## What's inside

**Retrieval**
- Hybrid search — vector similarity + BM25 keyword search, merged via Reciprocal Rank Fusion
- HyDE query expansion — hypothetical document embeddings improve recall on short or vague queries
- Cross-encoder reranker — re-scores candidates before they hit the context window

**Generation**
- GPT-4o primary, Groq LLaMA-3 fallback
- Every response is grounded — citations link back to the exact source chunk
- Temperature 0.2 — factual, not creative

**Evaluation**
- Faithfulness + relevance scored on every response before delivery
- Confidence below threshold → automatic escalation to a human agent

**Platform**
- Multi-tenant — fully isolated knowledge base, vector space, and config per business
- Embeddable widget — customisable, real-time, Socket.io
- Live Console — agent takeover with full conversation history
- Role-based access — Owner · Admin · Agent

---

## Architecture

```
  Widget (React + Vite)          Dashboard (Next.js 15)
         │                               │
         └──────────────┬────────────────┘
                        │  REST + WebSocket
               ┌────────▼────────┐
               │   API Server    │
               │ Express + TypeScript
               │ Auth · RAG · Ingestion · Live Console
               └───────┬─────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
   ┌──────▼──────┐           ┌──────▼──────┐
   │ PostgreSQL  │           │   Redis 7   │
   │ 16+pgvector │           │ Pub/Sub     │
   │ Relational  │           │ Sessions    │
   │ + Vector    │           │ Rate limits │
   └─────────────┘           └─────────────┘
```

```
apps/
  api/      Express + TypeScript  —  all business logic, RAG, auth, WebSockets
  web/      Next.js 15            —  dashboard, onboarding wizard, live console
  widget/   React + Vite          —  embeddable chat, minimal bundle

packages/
  shared/   Zod schemas + TypeScript types
  ui/       shadcn/ui component library
```

---

## Stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| API | Express.js + TypeScript |
| Frontend | Next.js 15 (App Router) |
| Widget | React + Vite |
| Database | PostgreSQL 16 + pgvector |
| ORM | Drizzle ORM |
| Cache / Pub-Sub | Redis 7 |
| Auth | httpOnly cookies — 15 min access + 7 day refresh with silent rotation |
| Real-time | Socket.io |
| Validation | Zod |
| Embeddings | OpenAI `text-embedding-3-small` (1536d) |
| Generation | GPT-4o · Groq LLaMA-3 fallback |

---

## RAG Pipeline

```
  INGEST
  ──────
  Raw file  →  Parse  →  Chunk (512 tok / 64 overlap)
                                │
                          Enrich (Groq)
                          keywords · summary · hypothetical Qs
                                │
                          Embed (text-embedding-3-small)
                                │
                          Store  →  pgvector + GIN (fts)


  QUERY
  ─────
  User query  →  HyDE rewrite  →  Hypothetical answer embedded
                                          │
                              ┌───────────┴───────────┐
                          Vector search           BM25 search
                          (cosine / pgvector)     (tsvector / GIN)
                              └───────────┬───────────┘
                                    RRF merge (top 20)
                                          │
                                   Cross-encoder rerank
                                          │
                                     Top 5 chunks
                                          │
                                  GPT-4o generation
                                  grounded · streamed · cited
                                          │
                            Faithfulness + relevance eval
                                          │
                              ┌───────────┴───────────┐
                         Confident                Low confidence
                         → deliver                → escalate to agent
```

---

## Roadmap

| Status | Feature |
|--------|---------|
| ✅ | RAG pipeline — ingestion, hybrid retrieval, reranking, generation, evaluation |
| ✅ | Embeddable widget — real-time, customisable, one script tag |
| ✅ | Live Console — agent takeover, Socket.io, full context handoff |
| ✅ | Multi-tenant auth — JWT, httpOnly cookies, role-based access |
| 🔜 | Flows — visual conversation builder, conditional branches, webhook nodes |
| 🔜 | Agentic — connect external APIs, perform real actions (orders, refunds, bookings) |
| 🔜 | Proactive — behaviour-triggered messages before the visitor asks |
| 🔜 | Agent Assist — AI co-pilot for humans, live suggestions, tone scoring |
| 🔜 | Self-healing KB — cluster failed queries, auto-suggest missing entries |
| 🔜 | Omnichannel — WhatsApp · Email · Instagram DMs |

---

## Documentation

| | |
|---|---|
| [System Architecture](docs/architecture.md) | Full system diagram, request lifecycle, multi-tenancy model, deployment topology, security |
| [RAG Pipeline](docs/rag-pipeline.md) | Every stage in detail — ingestion, retrieval, reranking, generation, evaluation, handoff |
| [Data Model](docs/data-model.md) | ER diagram, full schema with SQL, index strategy |
| [ADR 001 — Monorepo](docs/adr/001-monorepo-with-turborepo.md) | Why pnpm workspaces + Turborepo over polyrepo |
| [ADR 002 — pgvector](docs/adr/002-pgvector-over-dedicated-vector-db.md) | Why pgvector over Pinecone and Qdrant, with migration path |
| [ADR 003 — Hybrid Search](docs/adr/003-hybrid-search-with-rrf.md) | Why hybrid search + RRF + reranker, with benchmark numbers |

---

## Pricing

**Completely free. No card. No catch.**

I'm a solo builder. I don't have the compute budget to run a paid tier responsibly right now — so I'm not going to fake one. Everything AskBase does is available to anyone who wants to use it, for free, until that changes.

When it does change, it will be because the product has earned it — not because I put up a paywall on day one.

If you're a founder using this and want to support the project — even minimally — [reach out](mailto:hello@askbase.io). We'll handle your custom workflow personally.

---

<div align="center">

[askbase.io](https://askbase.io) · [hello@askbase.io](mailto:hello@askbase.io)

<sub>Private repository. All rights reserved.</sub>

</div>
