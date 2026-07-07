# Snow Scout v1 — Setup

## Decisions (July 2026)

| Topic | Choice |
|-------|--------|
| Persistence | **Supabase + Prisma from v1** — multi-tenant `ChannelProject` per user |
| YouTube API | **Rotating `AIza` keys** — comma-separated in `YOUTUBE_API_KEYS` |
| Remix LLM | **OpenRouter free models** — rotate keys + models; fallback `template` |
| Local Ollama | **Dropped** for v1 — 2GB VRAM insufficient |
| Dynamic users | Any clone user pastes bible, competitors, keywords, outliers |

## Environment

```bash
cp .env.example .env
```

| Variable | Purpose |
|----------|---------|
| `YOUTUBE_API_KEYS` | Two+ YouTube Data API v3 keys, comma-separated |
| `OPENROUTER_API_KEYS` | One+ OpenRouter keys, comma-separated |
| `OPENROUTER_REMIX_MODELS` | Free models to rotate (`:free` suffix) |
| `SCOUT_REMIX_PROVIDER` | `openrouter` \| `template` \| `agent` |
| `SCOUT_CACHE_ADAPTER` | `file` (default) \| `supabase` — YouTube API response cache |
| `SCOUT_CACHE_BUCKET` | Storage bucket for API cache (default `scout-cache`) |
| `SCOUT_BRIEFS_BUCKET` | Storage bucket for outlier briefs (default `scout-briefs`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only — required for Storage (briefs + optional cache) |
| Supabase vars | From hosted project or `npm run supabase:start` |

## OpenRouter free tier

- Create account at [openrouter.ai](https://openrouter.ai)
- Generate API key(s) — add multiple accounts for rotation like YouTube
- Default free models (rotated automatically):
  - `google/gemma-2-9b-it:free`
  - `meta-llama/llama-3.2-3b-instruct:free`
  - `qwen/qwen-2-7b-instruct:free`
- On rate limit / 429 → rotator tries next key, then next model
- Quality: good enough for title/hook remix; not Opus-level

## Hosted Supabase (recommended — faster than local Docker)

1. Create project at [supabase.com](https://supabase.com) (e.g. `snow-scout`)
2. **Project Settings → API** → copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Project Settings → Database** → copy connection strings:
   - **Transaction pooler** (port 6543) → `DATABASE_URL` (add `?pgbouncer=true`)
   - **Direct** (port 5432) → `DIRECT_URL`
4. **Authentication → Providers** → enable Email
5. Run migration (no `supabase start` needed):

```bash
npm run install:safe
npm run db:migrate
npm run dev
```

**Service role key:** add `SUPABASE_SERVICE_ROLE_KEY` from **Project Settings → API** when using Supabase Storage for briefs and API cache. Server routes upload after auth check — never expose this key in the browser or commit it.

### Supabase Storage (briefs + cache)

Outlier briefs are saved to a private bucket instead of relying only on browser `localStorage`:

| Bucket | Path pattern | Contents |
|--------|--------------|----------|
| `scout-briefs` | `{userId}/{projectId}/{videoId}.json` | Grok-ready outlier briefs |
| `scout-cache` | `api-cache/{key}.json` | YouTube search / comments cache (when `SCOUT_CACHE_ADAPTER=supabase`) |

**Create buckets** (hosted Supabase → SQL Editor, or local after `supabase start`):

```bash
# Apply migration (creates both buckets)
npx supabase db push
# Or paste supabase/migrations/20260706120000_scout_storage_buckets.sql in SQL Editor
```

**Enable in `.env`:**

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SCOUT_CACHE_ADAPTER=supabase   # optional — moves API cache off disk
SCOUT_CACHE_BUCKET=scout-cache
SCOUT_BRIEFS_BUCKET=scout-briefs
```

Briefs persist to Storage whenever `SUPABASE_SERVICE_ROLE_KEY` is set (even if cache stays on disk). Reload the project page — the latest brief restores from `GET /api/scout/briefs`.

## Local Supabase (optional)

```bash
npm run supabase:start
# Copy vars from supabase status into .env
npm run db:migrate
```

Open http://localhost:3002/scout

## Multi-tenant model

Each user creates **Channel Projects**:

- Paste **channel bible** (any niche)
- **Competitor URLs** (one per line)
- **Seed keywords**
- **Known outlier URLs**

No hardcoded CRAVE/SnowAgeBrain — those are just Dimitri's first projects.

## MCP

```bash
npm run mcp:install
npm run mcp:build
```

Add to Antigravity MCP config (see `mcp-server/` after v1.1 adds API token proxy).

## Ports

| App | Port |
|-----|------|
| Snow Scout | 3002 |
| Snow Transcriber | 3001 |
| Snow Assembler | 3000 |