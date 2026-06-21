# System Architecture

AskBase is a multi-tenant SaaS platform built as a monorepo across three deployable apps and two shared packages. This document describes the top-level architecture, data flow, and deployment topology.

---

## High-Level Diagram

```mermaid
graph TD
    subgraph Client
        W[Website Visitor] -->|HTTPS| WG[Embeddable Widget\nReact + Vite]
        U[Business User] -->|HTTPS| DB[Dashboard\nNext.js 15]
    end

    subgraph Edge
        WG -->|REST + WebSocket| GW[API Gateway\nExpress + TypeScript]
        DB -->|REST| GW
    end

    subgraph Core Services
        GW --> AUTH[Auth Service\nJWT · httpOnly cookies]
        GW --> RAG[RAG Pipeline\nQuery → Retrieve → Generate]
        GW --> ING[Ingestion Service\nParse → Chunk → Embed]
        GW --> LIVE[Live Console\nSocket.io]
    end

    subgraph Data
        RAG --> PG[(PostgreSQL 16\n+ pgvector)]
        ING --> PG
        AUTH --> PG
        LIVE --> RD[(Redis 7\nPub/Sub · Sessions)]
        RAG --> RD
    end

    subgraph AI
        RAG --> EMB[Embeddings\nOpenAI text-embedding-3-small]
        RAG --> LLM[Generation\nGPT-4o · Groq fallback]
    end
```

---

## App Boundaries

| App | Responsibility | Port |
|-----|---------------|------|
| `apps/api` | All business logic, auth, RAG, ingestion, WebSockets | 4000 |
| `apps/web` | Business dashboard, onboarding wizard, live agent console | 3000 |
| `apps/widget` | Embeddable chat UI served as a JS bundle | 5173 |

Apps share no runtime code directly. All cross-app communication goes through the API. Shared types live in `packages/shared` and are imported at build time only.

---

## Request Lifecycle — Chat Query

```mermaid
sequenceDiagram
    participant V as Visitor
    participant W as Widget
    participant A as API
    participant R as Redis
    participant P as Postgres/pgvector
    participant G as GPT-4o

    V->>W: types question
    W->>A: POST /api/chat (tenant_id, session_id, query)
    A->>A: authenticate widget API key
    A->>A: rewrite query (HyDE expansion)
    A->>P: hybrid search (vector + keyword)
    P-->>A: top-k chunks
    A->>A: rerank chunks (cross-encoder)
    A->>A: build context window
    A->>G: completion request
    G-->>A: streamed response
    A->>R: cache session context
    A->>P: persist message + eval scores
    A-->>W: stream tokens
    W-->>V: renders answer + citations
```

---

## Multi-Tenancy Model

Each tenant (business) is fully isolated at the data layer:

- **Knowledge base** — all documents, chunks, and embeddings are scoped by `tenant_id`
- **Vector search** — pgvector queries always include a `WHERE tenant_id = $1` predicate; no cross-tenant leakage is possible
- **Widget config** — appearance, behaviour, and confidence thresholds are stored per tenant
- **API keys** — each tenant has rotating API keys used to authenticate widget requests
- **Users** — role-based (Owner / Admin / Agent) scoped to the tenant

Tenants share the same database instance but are logically isolated. Infrastructure-level isolation (separate schemas or databases) is planned for Business-tier accounts in a future release.

---

## Deployment Topology (Production Target)

```mermaid
graph LR
    CF[Cloudflare\nDNS · DDoS · Edge Cache] --> LB[Load Balancer]
    LB --> API1[API Instance 1]
    LB --> API2[API Instance 2]
    LB --> WEB[Next.js\nVercel / Railway]
    API1 & API2 --> PG[(Postgres\nManaged — Neon / Supabase)]
    API1 & API2 --> RD[(Redis\nUpstash)]
    WEB --> CDN[Widget Bundle\nCDN — Cloudflare R2]
```

- API is stateless — any instance handles any request
- Sessions and pub/sub use Redis so WebSocket connections survive restarts
- Widget bundle is a static JS file served from CDN with long-lived cache headers

---

## Security Boundaries

| Surface | Control |
|---------|---------|
| Dashboard auth | httpOnly cookies, 15-min access token, 7-day refresh with silent rotation |
| Widget auth | Per-tenant API key sent in `Authorization` header, validated on every request |
| DB access | API only — no direct DB access from web or widget |
| Secrets | Environment variables only — never committed, never logged |
| CORS | Strict origin allowlist per tenant for widget requests |
| Rate limiting | Per-IP and per-tenant on all public endpoints via Redis token bucket |
