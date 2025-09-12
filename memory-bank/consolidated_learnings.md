# Consolidated Learnings — Peepers (summary of 2025-09-12 work)

## High-value patterns & decisions
1. Icon handling
- Pattern: Replace raw inline SVGs with a single icon library (lucide-react) and control sizing via utility classes.
- Rationale: Prevents unbounded SVG rendering, centralizes styling, improves maintainability.

2. Images & performance
- Pattern: Prefer next/image for product thumbnails (explicit width/height) or enforce max dimensions via global CSS if using <img>.
- Rationale: next/image optimizes delivery and enforces predictable sizing; global constraints avoid layout break when utilities are missing.

3. Tailwind + PostCSS (Tailwind v4+)
- Pattern: Use the official adapter `@tailwindcss/postcss` in `postcss.config.mjs`. Ensure `autoprefixer` present.
- Rationale: Tailwind v4 moved to a PostCSS adapter; using the adapter avoids runtime build errors and unknown-utility issues.

4. Brand color aliases
- Pattern: Add an alias color palette (e.g., `green` aliasing `primary`) in `tailwind.config.js` to avoid legacy utility breakage (ex. `bg-green-700`) while using a branded palette.
- Rationale: Smooths migration and reduces unexpected unknown-utility errors in existing files.

5. Next.js + Windows (OneDrive) caveat
- Pattern: If dev server fails with EINVAL readlink errors referencing `.next`, remove `.next` and restart the dev server.
- Rationale: OneDrive and Windows can produce broken symlinks in the build cache; deleting cache forces a clean rebuild.

6. OAuth / ML integration strategy (high level)
- Pattern: Centralized token manager service (getAccessToken / refresh / invalidate) + encrypted storage for refresh tokens + webhook-driven cache invalidation.
- Rationale: Simplifies token lifecycle handling, improves resilience and observability, and keeps product data current.

7. Webhooks & idempotency
- Pattern: Accept webhook POSTs, validate signature if provided, ack quickly, enqueue for async processing and use a dedupe store (Redis) keyed by event ID.
- Rationale: Prevents duplicate processing and keeps webhook handling reliable under load.

8. Dev workflow & safety
- Pattern: Create feature branch (e.g., `fix/layout-audit`) and commit incremental changes before broad refactors; keep `.env.local` out of repo.
- Rationale: Protects CI/CD, keeps preview deploys clean, and enables revert/iteration.

## Operational commands / checks discovered
- Run dev locally: cd peepers-website && npm run dev
- Clean build cache if encountering readlink errors: rm -rf .next && npm run dev
- Install Tailwind adapter and autoprefixer when Tailwind v4+: npm install -D @tailwindcss/postcss autoprefixer

## Knowledge items to keep for future tasks
- Next.js metadata API: viewport/themeColor should be exported via `viewport` export rather than metadata when using App Router (warnings observed).
- next/image: when sizing via CSS, include `width: auto` or `height: auto` to maintain aspect ratio (Next.js console warning observed).
- When migrating or introducing brand colors, add alias keys to `tailwind.config.js` to avoid breaking utility usage in older files.
