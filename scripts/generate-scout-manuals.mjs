import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  LevelFormat,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const tableWidth = 9360;

function cell(text, opts = {}) {
  const { bold, fill, width = 4680 } = opts;
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: fill ? { fill, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: Boolean(bold), size: 22, font: "Arial" })],
      }),
    ],
  });
}

function table(rows, colWidths) {
  return new Table({
    width: { size: tableWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: rows.map(
      (row) =>
        new TableRow({
          children: row.map((item, i) =>
            typeof item === "string"
              ? cell(item, { width: colWidths[i], bold: row === rows[0] })
              : cell(item.text, {
                  width: colWidths[i],
                  bold: item.bold ?? row === rows[0],
                  fill: item.fill,
                }),
          ),
        }),
    ),
  });
}

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
}

function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
}

function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 160 },
    children: [new TextRun({ text, size: 22, font: "Arial", ...opts })],
  });
}

function bullet(ref, text) {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 22, font: "Arial" })],
  });
}

function numbered(ref, text) {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 22, font: "Arial" })],
  });
}

function code(text) {
  return new Paragraph({
    spacing: { after: 160 },
    children: [new TextRun({ text, size: 20, font: "Courier New" })],
  });
}

function docMeta({ title, subtitle, owner, version }) {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: title, bold: true, size: 40, font: "Arial" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: subtitle, size: 26, font: "Arial", italics: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({ text: `Owner: ${owner}  |  Version: ${version}`, size: 22, font: "Arial" }),
      ],
    }),
  ];
}

function baseDoc(children, numbering) {
  return new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 22 } } },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 32, bold: true, font: "Arial" },
          paragraph: { spacing: { before: 240, after: 200 }, outlineLevel: 0 },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 28, bold: true, font: "Arial" },
          paragraph: { spacing: { before: 200, after: 160 }, outlineLevel: 1 },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 24, bold: true, font: "Arial" },
          paragraph: { spacing: { before: 160, after: 120 }, outlineLevel: 2 },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "\u2022",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
        {
          reference: "numbers",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
        {
          reference: "steps",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
        ...numbering,
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "Page ", size: 20, font: "Arial" }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 20, font: "Arial" }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
}

function craveConquerManual() {
  const children = [
    ...docMeta({
      title: "Snow Scout User Manual",
      subtitle: "CRAVE & CONQUER — Video Ideation Workflow",
      owner: "Dimitri (@dimitri-snowdev)",
      version: "1.0 — July 2026",
    }),

    h1("1. What Snow Scout Does"),
    p(
      "Snow Scout is the ideation step of the Snow Video Studio pipeline. It finds engagement-weighted YouTube outliers and remixes them into angle-shifted video ideas for your channel bible.",
    ),
    p(
      "Important: Snow Scout does NOT output a PDF, a full script, scene prompts, or a complete production package. It gives you validated remix ideas — title, hook, angle, and thumbnail direction — so you can lock an idea before writing.",
    ),

    h2("What you get after Remix"),
    table(
      [
        ["Field", "Description"],
        ["title", "Remix title for CRAVE & CONQUER"],
        ["hook", "Opening curiosity angle / cold-open direction"],
        ["angle", "How the outlier was shifted through your bible lens"],
        ["thumbnailBrief", "CTR direction for the thumbnail"],
        ["rationale", "Why this remix should outperform"],
      ],
      [2800, 6560],
    ),
    p("Search results also include: views, engagement %, outlier score, and thumbnail preview."),

    h1("2. Prerequisites"),
    bullet("bullets", "Snow Scout running locally on port 3002"),
    bullet("bullets", "Supabase account (login at http://localhost:3002)"),
    bullet("bullets", "YOUTUBE_API_KEYS in .env (comma-separated for rotation)"),
    bullet("bullets", "OPENROUTER_API_KEYS in .env (for AI remix; or SCOUT_REMIX_PROVIDER=template)"),
    bullet("bullets", "Channel bible pasted into project: Crave_and_Conquer_Ghost_Niche_Bible.md"),

    h1("3. Start Snow Scout"),
    code('subst S: "D:\\SnowDev\\Videos\\Youtube\\CRAVE & CONQUER\\Snow-scout"'),
    code("S:"),
    code("npm run dev"),
    p("Open http://localhost:3002 → Log in → Scout."),

    h1("4. Create a Channel Project"),
    numbered("steps", 'Go to Scout → "New channel project"'),
    numbered("steps", "Name: CRAVE & CONQUER"),
    numbered("steps", "Paste full ghost niche bible into the bible field"),
    numbered("steps", "Optional seeds — Competitors: Crumb Lore channel URL"),
    numbered("steps", "Optional seeds — Keywords: history of sugar, food history, dark psychology"),
    numbered("steps", "Optional seeds — Outlier URLs: known viral food-history videos"),
    numbered("steps", 'Click "Create project & open Scout"'),

    h1("5. Search for Outliers"),
    numbered("steps", 'Enter a keyword (e.g. "history of sugar")'),
    numbered("steps", "Click Search or use a seed keyword chip"),
    numbered("steps", "Review results ranked by outlier score (not raw views)"),
    numbered("steps", "Pick a top result with high engagement and empire/war framing"),

    h1("6. Remix into CRAVE Ideas"),
    numbered("steps", 'Click Remix on your chosen outlier'),
    numbered("steps", "Wait for 3 angle-shifted ideas through your bible lens"),
    numbered("steps", "Read title, hook, angle, thumbnail brief, and rationale"),
    numbered("steps", "Gate 0 — YOU pick one idea. Scout stops here."),

    h2("CRAVE remix lens (reminder)"),
    p(
      'Every food you crave was someone else\'s weapon. Shift outliers through: brain wiring → named manipulation → empire → modern mirror.',
    ),

    h1("7. What Snow Scout Does NOT Do"),
    bullet("bullets", "No PDF export (not built yet)"),
    bullet("bullets", "No script writing"),
    bullet("bullets", "No Veo3 scene prompts"),
    bullet("bullets", "No narration audio or video assembly"),
    bullet("bullets", "SavedIdea export is planned but not in the UI yet"),

    h1("8. After Scout — Full CRAVE Pipeline"),
    table(
      [
        ["Step", "Tool", "Output"],
        ["1 Ideation", "Snow Scout", "Title, hook, angle, thumbnail brief"],
        ["2 Script", "Grok CRAVE Project", "episodes/<slug>/script.md"],
        ["3 Narration", "You (ElevenLabs / Clipchamp)", ".mp3 audio file"],
        ["4 Transcriber", "Snow Transcriber :3001", "snow-transcriber-agent.json"],
        ["5 Prompts", "Grok CRAVE Project", "CC_EP##_Scene_Prompts_GROK.txt"],
        ["6 Video", "Grok / Google Flow Veo3", "SCENE_01.mp4 … SCENE_NN.mp4"],
        ["7 Assembly", "Snow Assembler :3000", "assembled.mp4"],
        ["8 YouTube", "Grok / manual", "title, description, tags, thumbnail"],
      ],
      [1800, 3200, 4360],
    ),

    h1("9. Handoff to Grok Project"),
    p("Kit folder: grok-project-crave-and-conquer/"),
    p("After picking a Scout idea, open your Grok CRAVE & CONQUER project and paste:"),
    code(
      "I picked Scout option [N]. Source: [YouTube URL]. Write a full TTS-ready narration script. Food: [X]. Mechanism: [Y]. Scene duration: 6s/8s/10s. Stop for my approval before prompts.",
    ),

    h1("10. Save Your Idea Manually (until export is built)"),
    p("Create a folder and brief file yourself:"),
    code("episodes/<slug>/idea-brief.md"),
    p("Paste: chosen title, hook, angle, thumbnail brief, source URL, outlier score, and your scene duration choice."),

    h1("11. Example Workflow — Sugar Episode"),
    numbered("steps", 'Scout search: "history of sugar"'),
    numbered("steps", "Remix Crumb Lore Sugar outlier"),
    numbered("steps", 'Pick: "Sugar: The Drug They Sold You As Food"'),
    numbered("steps", "Grok writes script → you approve → TTS"),
    numbered("steps", "Snow Transcriber → Veo3 prompts → SCENE_XX clips"),
    numbered("steps", "Snow Assembler → YouTube metadata"),

    h1("12. Related Files"),
    bullet("bullets", "Grok kit: ../grok-project-crave-and-conquer/"),
    bullet("bullets", "Bible: ../Crave_and_Conquer_Ghost_Niche_Bible.md"),
    bullet("bullets", "Veo3 guide: ../CC_Veo3_Prompt_Writing_Guide.md"),
    bullet("bullets", "Master workflow: ../SNOW_VIDEO_STUDIO_WORKFLOW.md"),
  ];

  return baseDoc(children, []);
}

function snowAgeBrainManual() {
  const children = [
    ...docMeta({
      title: "Snow Scout User Manual",
      subtitle: "Snow Age Brain — Video Ideation Workflow",
      owner: "Dimitri (@dimitri-snowdev)",
      version: "1.0 — July 2026",
    }),

    h1("1. What Snow Scout Does"),
    p(
      "Snow Scout is the ideation step of the Snow Video Studio pipeline. It finds engagement-weighted YouTube outliers and remixes them into angle-shifted video ideas for your channel bible.",
    ),
    p(
      "Important: Snow Scout does NOT output a PDF, a full script, image prompts, or a complete production package. It gives you validated remix ideas — title, hook, angle, and thumbnail direction — so you can lock an idea before writing.",
    ),

    h2("What you get after Remix"),
    table(
      [
        ["Field", "Description"],
        ["title", "Remix title for Snow Age Brain"],
        ["hook", "Modern pain reframed as evolutionary signal"],
        ["angle", "Pillar shift (P1 Core / P2 Anchor / P3 Dark hook)"],
        ["thumbnailBrief", "Ancient/modern split thumbnail direction"],
        ["rationale", "Why this remix should outperform"],
      ],
      [2800, 6560],
    ),
    p("Search results also include: views, engagement %, outlier score, and thumbnail preview."),

    h1("2. Prerequisites"),
    bullet("bullets", "Snow Scout running locally on port 3002"),
    bullet("bullets", "Supabase account (login at http://localhost:3002)"),
    bullet("bullets", "YOUTUBE_API_KEYS in .env (comma-separated for rotation)"),
    bullet("bullets", "OPENROUTER_API_KEYS in .env (for AI remix; or SCOUT_REMIX_PROVIDER=template)"),
    bullet("bullets", "Channel bible: ghost_niche_bible.txt or PDF from Documents/Zenn/research/"),

    h1("3. Start Snow Scout"),
    code('subst S: "D:\\SnowDev\\Videos\\Youtube\\CRAVE & CONQUER\\Snow-scout"'),
    code("S:"),
    code("npm run dev"),
    p("Open http://localhost:3002 → Log in → Scout."),

    h1("4. Create a Channel Project"),
    numbered("steps", 'Go to Scout → "New channel project"'),
    numbered("steps", "Name: Snow Age Brain"),
    numbered("steps", "Paste evolutionary mismatch ghost niche bible"),
    numbered("steps", "Optional seeds — Competitors: Zenn-style ancient humans channels"),
    numbered("steps", "Optional seeds — Keywords: ancient humans night, evolutionary psychology"),
    numbered("steps", "Optional seeds — Outlier URLs: viral ancient-history / psychology videos"),
    numbered("steps", 'Click "Create project & open Scout"'),

    h1("5. Search for Outliers"),
    numbered("steps", 'Enter a keyword (e.g. "ancient humans night")'),
    numbered("steps", "Click Search or use a seed keyword chip"),
    numbered("steps", "Review results ranked by outlier score (not raw views)"),
    numbered("steps", "Pick high-engagement curiosity-engine videos (682K+ style outliers)"),

    h1("6. Remix into Snow Age Brain Ideas"),
    numbered("steps", 'Click Remix on your chosen outlier'),
    numbered("steps", "Wait for 3 angle-shifted ideas through your bible lens"),
    numbered("steps", "Map each idea to pillar P1, P2, or P3"),
    numbered("steps", "Gate 0 — YOU pick one idea. Scout stops here."),

    h2("Snow Age Brain remix lens (reminder)"),
    p(
      "You are a 300,000-year-old hunter-gatherer living in 2026 — and that is why everything hurts. Angle-shift through evolutionary mismatch, not copy titles.",
    ),
    p('Example: "What Ancient Humans Did at Night" → "How Did Ancient Humans Get Married?"'),

    h2("Three content pillars"),
    table(
      [
        ["Pillar", "Theme", "Example title"],
        ["P1 Core engine", "Modern problem → ancient biology", "Why You Can't Stop Scrolling (Your Brain Is Hunting)"],
        ["P2 Anchor series", "How ancient humans actually lived", "What an Ancient Human's Day Actually Felt Like"],
        ["P3 Dark hook", "Uncomfortable evolutionary truths", "Why We Evolved to Fear Being Alone More Than Death"],
      ],
      [2200, 3600, 3560],
    ),

    h1("7. What Snow Scout Does NOT Do"),
    bullet("bullets", "No PDF export (not built yet)"),
    bullet("bullets", "No script writing"),
    bullet("bullets", "No stickman image prompts"),
    bullet("bullets", "No narration audio or video assembly"),
    bullet("bullets", "SavedIdea export is planned but not in the UI yet"),

    h1("8. After Scout — Full Snow Age Brain Pipeline"),
    table(
      [
        ["Step", "Tool", "Output"],
        ["1 Ideation", "Snow Scout", "Title, hook, pillar, thumbnail brief"],
        ["2 Script", "Grok Snow Age Brain Project", "episodes/<slug>/script.md"],
        ["3 Narration", "You (ElevenLabs / Clipchamp)", ".mp3 audio file"],
        ["4 Transcriber", "Snow Transcriber :3001", "snow-transcriber-agent.json"],
        ["5 Prompts", "Grok Snow Age Brain Project", "stickman prompts + style block"],
        ["6 Images", "Grok Imagine / Zapi", "0000_description.png … (timestamp named)"],
        ["7 Assembly", "Snow Assembler :3000", "assembled.mp4"],
        ["8 YouTube", "Grok / manual", "title, description, tags, thumbnail"],
      ],
      [1800, 3200, 4360],
    ),

    h1("9. Handoff to Grok Project"),
    p("Kit folder: grok-project-snow-age-brain/"),
    p("After picking a Scout idea, open your Grok Snow Age Brain project and paste:"),
    code(
      "I picked Scout option [N]. Source: [YouTube URL]. Pillar: [P1/P2/P3]. Write a 10-minute TTS-ready script. Evolutionary mismatch angle. Stop for my approval before image prompts.",
    ),

    h1("10. Save Your Idea Manually (until export is built)"),
    p("Create a folder under Documents/Zenn/episodes/:"),
    code("C:\\Users\\Dimitri SnowDev\\Documents\\Zenn\\episodes\\<slug>\\idea-brief.md"),
    p("Paste: chosen title, hook, pillar, thumbnail brief, source URL, and scene duration (6s or 8s)."),

    h1("11. Example Workflow — Scrolling Episode"),
    numbered("steps", 'Scout search: "screen addiction brain" or ancient humans curiosity'),
    numbered("steps", "Remix top outlier through P1 Core engine"),
    numbered("steps", 'Pick: "Why You Can\'t Stop Scrolling (Your Brain Is Hunting)"'),
    numbered("steps", "Grok writes script → you approve → TTS"),
    numbered("steps", "Snow Transcriber → stickman image prompts (MS Paint style block)"),
    numbered("steps", "Generate PNGs → Snow Assembler → YouTube metadata"),

    h1("12. Visual Reminder (post-Scout)"),
    bullet("bullets", "Every image prompt needs the mandatory MS Paint stickman style block"),
    bullet("bullets", "Watermark @SnowAgeBrain on ~10% of scenes only"),
    bullet("bullets", "Thumbnail: LEFT ancient warm + RIGHT modern cool, max 6 words"),

    h1("13. Related Files"),
    bullet("bullets", "Grok kit: ../grok-project-snow-age-brain/"),
    bullet("bullets", "Bible PDF: Documents/Zenn/research/ghost_niche_bible_evolutionary_mismatch.pdf"),
    bullet("bullets", "Style bible: Documents/Zenn/brand/bible_style.md"),
    bullet("bullets", "Master workflow: ../SNOW_VIDEO_STUDIO_WORKFLOW.md"),
  ];

  return baseDoc(children, []);
}

async function writeDoc(doc, filename) {
  const buffer = await Packer.toBuffer(doc);
  const out = path.join(root, filename);
  fs.writeFileSync(out, buffer);
  console.log(`Wrote ${out} (${buffer.length} bytes)`);
}

await writeDoc(craveConquerManual(), "Manual_Crave_Conquer_For_Snow-scout.docx");
await writeDoc(snowAgeBrainManual(), "Manual_SnowAgeBrain_For_Snow-scout.docx");