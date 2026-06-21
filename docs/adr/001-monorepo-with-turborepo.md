# ADR 001 — Monorepo with pnpm Workspaces + Turborepo

**Status**: Accepted  
**Date**: 2026-01

---

## Context

AskBase consists of three distinct deployable apps (API, web dashboard, embeddable widget) and two shared packages (types, UI components). We needed to decide whether to manage these as separate repositories or a single monorepo.

Key constraints:
- Shared TypeScript types between API and web must stay in sync without a publish step
- Widget bundle must remain small (~10kb) with no accidental shared-library bloat
- CI must be fast — rebuilding everything on every commit is not acceptable as the codebase grows

## Decision

Use a **pnpm workspace monorepo** with **Turborepo** for build orchestration.

## Reasoning

**pnpm workspaces** solve the dependency sharing problem cleanly. `packages/shared` is imported directly by `apps/api` and `apps/web` at build time — no npm publish, no version drift, no stale type mismatches.

**Turborepo** provides:
- Remote caching — unchanged packages are never rebuilt (CI goes from ~4 min to ~45s on cache hits)
- Parallel task execution — `pnpm dev` starts all three apps concurrently with correct dependency ordering
- Task graph — `build` in `apps/web` automatically waits for `build` in `packages/shared`

**Widget isolation** is maintained because Turborepo respects package boundaries — the widget's Vite build only pulls in what it explicitly imports. No accidental shadcn or Drizzle in the bundle.

## Alternatives Considered

| Option | Rejected Because |
|--------|-----------------|
| Polyrepo (separate Git repos) | Type sync requires publish step; PRs span multiple repos; local dev requires manual linking |
| Nx | More configuration overhead; Turborepo is simpler for this project size |
| Single `src/` directory | No clear package boundaries; widget bundle would include server-side code |

## Consequences

- All engineers work in one repo — simpler onboarding, one PR per feature
- `pnpm install` at root installs all dependencies; developers need pnpm ≥ 8
- Turborepo remote cache requires a Vercel account or self-hosted cache server in CI
