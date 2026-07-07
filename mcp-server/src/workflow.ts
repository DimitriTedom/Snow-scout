export const SNOW_SCOUT_WORKFLOW = `# Snow Scout — Agent Workflow

## Purpose
Find engagement-weighted YouTube outliers and remix them into the user's channel niche.

## Prerequisites
- Snow Scout app running (default http://localhost:3002) OR call MCP tools directly
- User has a **ChannelProject** with bible text and optional seeds (competitors, keywords, outliers)
- \`YOUTUBE_API_KEYS\` configured server-side (rotated automatically)
- \`OPENROUTER_API_KEYS\` for server-side remix (or \`SCOUT_REMIX_PROVIDER=template\`)

## Typical flow
1. \`scout_list_projects\` or user provides \`projectId\`
2. \`scout_search_outliers\` with keyword (or seed keywords from project)
3. \`scout_analyze_video\` on top result
4. \`scout_download_thumbnail\` for CTR reference
5. \`scout_outlier_brief\` (or POST /api/scout/outlier-brief) → Grok-ready JSON: video stats, channel owner, top liked comments, viralSignals, agentInstructions
6. Optional \`userRemixMethod\` in request — if empty, JSON tells Grok to generate 3–5 ideas
7. **Gate:** user picks idea → hand off to script / Snow Transcriber workflow

## Rules
- Rank by outlier score (engagement × log views), not raw views
- Never copy source titles verbatim
- Angle-shift using channel bible lens
`;