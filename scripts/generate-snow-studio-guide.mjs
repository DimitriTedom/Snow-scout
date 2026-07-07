/**
 * Guide d'installation Snow Video Studio — version visuelle enrichie
 * Génère : Guide_Installation_Snow_Video_Studio.docx
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
  Header,
  HeadingLevel,
  LevelFormat,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  ShadingType,
  TabStopPosition,
  TabStopType,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDir, "..", "..");
const outPath = path.join(workspaceRoot, "Guide_Installation_Snow_Video_Studio.docx");

// ── Palette Snow Video Studio ──────────────────────────────────────────────
const C = {
  navy: "1B3A5C",
  blue: "2E75B6",
  sky: "D5E8F0",
  ice: "E8F4FD",
  white: "FFFFFF",
  gray: "F2F4F7",
  codeBg: "ECEFF1",
  text: "1A1A2E",
  muted: "5A6A7A",
  success: "E8F5E9",
  successText: "1B5E20",
  warning: "FFF8E1",
  warningText: "E65100",
  danger: "FFEBEE",
  dangerText: "B71C1C",
  tip: "E3F2FD",
  tipText: "0D47A1",
  altRow: "F7FAFC",
  headerText: "FFFFFF",
};

const PAGE = {
  width: 12240,
  height: 15840,
  margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
};
const CONTENT_W = PAGE.width - PAGE.margin.left - PAGE.margin.right; // 10080

const border = { style: BorderStyle.SINGLE, size: 1, color: "D0D7DE" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

// ── Helpers ────────────────────────────────────────────────────────────────

function run(text, opts = {}) {
  return new TextRun({ text, font: "Arial", size: 22, color: C.text, ...opts });
}

function spacer(pts = 200) {
  return new Paragraph({ spacing: { after: pts }, children: [new TextRun({ text: "", size: 2 })] });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 160, line: 276 },
    children: [run(text, opts)],
  });
}

function pRuns(children) {
  return new Paragraph({ spacing: { after: 160, line: 276 }, children });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, font: "Arial", size: 32, bold: true, color: C.navy })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.blue, space: 4 } },
    children: [new TextRun({ text, font: "Arial", size: 28, bold: true, color: C.blue })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, font: "Arial", size: 24, bold: true, color: C.navy })],
  });
}

function bullet(ref, text, opts = {}) {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 100, line: 276 },
    children: [run(text, opts)],
  });
}

function numbered(ref, text, opts = {}) {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 100, line: 276 },
    children: [run(text, opts)],
  });
}

function link(label, url) {
  return new ExternalHyperlink({
    children: [new TextRun({ text: label, style: "Hyperlink", size: 22, font: "Arial", color: C.blue })],
    link: url,
  });
}

function linkP(label, url) {
  return new Paragraph({ spacing: { after: 100 }, children: [link(label, url)] });
}

function textPara(text, opts = {}) {
  const { bold, color, align, size = 20 } = opts;
  return new Paragraph({
    alignment: align,
    children: [
      new TextRun({
        text,
        font: "Arial",
        size,
        bold: Boolean(bold),
        color: color ?? C.text,
      }),
    ],
  });
}

function tblCell(children, opts = {}) {
  const { width, fill, bold, color, align, cellBorders = borders, colspan } = opts;
  const wrap = (c) =>
    typeof c === "string" ? textPara(c, { bold, color, align }) : c;
  const paras = Array.isArray(children) ? children.map(wrap) : [wrap(children)];
  return new TableCell({
    borders: cellBorders,
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    columnSpan: colspan,
    shading: fill ? { fill, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 140, right: 140 },
    children: paras,
  });
}

function styledTable(rows, colWidths, opts = {}) {
  const { headerFill = C.blue, headerColor = C.headerText, alt = true } = opts;
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: rows.map((row, ri) =>
      new TableRow({
        children: row.map((cell, ci) => {
          const isHeader = ri === 0;
          const altFill = alt && ri > 0 && ri % 2 === 0 ? C.altRow : undefined;
          if (typeof cell === "object" && cell.paragraphs) return cell;
          return tblCell(String(cell), {
            width: colWidths[ci],
            fill: isHeader ? headerFill : altFill,
            bold: isHeader,
            color: isHeader ? headerColor : C.text,
          });
        }),
      }),
    ),
  });
}

function callout(type, title, lines) {
  const palette = {
    info: { fill: C.ice, accent: C.blue, titleColor: C.navy },
    tip: { fill: C.tip, accent: C.tipText, titleColor: C.tipText },
    warn: { fill: C.warning, accent: C.warningText, titleColor: C.warningText },
    danger: { fill: C.danger, accent: C.dangerText, titleColor: C.dangerText },
    success: { fill: C.success, accent: C.successText, titleColor: C.successText },
  }[type];
  const accentBorder = {
    top: border,
    bottom: border,
    right: border,
    left: { style: BorderStyle.SINGLE, size: 18, color: palette.accent },
  };
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    rows: [
      new TableRow({
        children: [
          tblCell(
            [
              new Paragraph({
                spacing: { after: 80 },
                children: [
                  new TextRun({ text: title, bold: true, size: 22, font: "Arial", color: palette.titleColor }),
                ],
              }),
              ...lines.map((line) =>
                typeof line === "string"
                  ? new Paragraph({ spacing: { after: 60 }, children: [run(line, { size: 20 })] })
                  : line,
              ),
            ],
            { width: CONTENT_W, fill: palette.fill, cellBorders: accentBorder },
          ),
        ],
      }),
    ],
  });
}

function codeBlock(lines) {
  const paras = (Array.isArray(lines) ? lines : [lines]).map(
    (line) =>
      new Paragraph({
        spacing: { after: 40, line: 240 },
        children: [new TextRun({ text: line, font: "Courier New", size: 18, color: "263238" })],
      }),
  );
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    rows: [
      new TableRow({
        children: [
          tblCell(paras, {
            width: CONTENT_W,
            fill: C.codeBg,
            cellBorders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "B0BEC5" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "B0BEC5" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "B0BEC5" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "B0BEC5" },
            },
          }),
        ],
      }),
    ],
  });
}

function sectionBanner(num, title, subtitle) {
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    rows: [
      new TableRow({
        children: [
          tblCell(
            [
              new Paragraph({
                spacing: { after: 40 },
                children: [
                  new TextRun({ text: `SECTION ${num}`, size: 18, font: "Arial", color: C.sky, bold: true }),
                ],
              }),
              new Paragraph({
                spacing: { after: subtitle ? 60 : 0 },
                children: [
                  new TextRun({ text: title, size: 30, font: "Arial", color: C.white, bold: true }),
                ],
              }),
              ...(subtitle
                ? [
                    new Paragraph({
                      children: [new TextRun({ text: subtitle, size: 20, font: "Arial", color: C.sky, italics: true })],
                    }),
                  ]
                : []),
            ],
            { width: CONTENT_W, fill: C.navy, cellBorders: noBorder },
          ),
        ],
      }),
    ],
  });
}

function toolCard(name, port, role, repo, color) {
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [1800, 8280],
    rows: [
      new TableRow({
        children: [
          tblCell(
            [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: name.split(" ").pop(), bold: true, size: 28, font: "Arial", color: C.white })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: `:${port}`, size: 20, font: "Arial", color: C.sky })],
              }),
            ],
            { width: 1800, fill: color, cellBorders: noBorder },
          ),
          tblCell(
            [
              new Paragraph({
                spacing: { after: 60 },
                children: [new TextRun({ text: name, bold: true, size: 24, font: "Arial", color: C.navy })],
              }),
              new Paragraph({
                spacing: { after: 60 },
                children: [run(role, { size: 20, color: C.muted })],
              }),
              new Paragraph({ children: [link(repo, `https://github.com/DimitriTedom/${repo}`)] }),
            ],
            { width: 8280, fill: C.gray, cellBorders: borders },
          ),
        ],
      }),
    ],
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// ── Cover page ───────────────────────────────────────────────────────────

function coverPage() {
  return [
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: [CONTENT_W],
      rows: [
        new TableRow({
          children: [
            tblCell(
              [
                new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: " ", size: 4 })] }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: "❄", size: 72, font: "Arial", color: C.sky }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 120 },
                  children: [
                    new TextRun({ text: "SNOW VIDEO STUDIO", size: 52, bold: true, font: "Arial", color: C.white }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 80 },
                  children: [
                    new TextRun({
                      text: "Guide d'installation & d'utilisation",
                      size: 32,
                      font: "Arial",
                      color: C.sky,
                      italics: true,
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 400 },
                  children: [
                    new TextRun({
                      text: "Suite complète pour créateurs YouTube ghost niche",
                      size: 24,
                      font: "Arial",
                      color: C.white,
                    }),
                  ],
                }),
              ],
              { width: CONTENT_W, fill: C.navy, cellBorders: noBorder },
            ),
          ],
        }),
      ],
    }),
    spacer(300),
    styledTable(
      [
        ["Élément", "Détail"],
        ["Version", "2.0 — Juillet 2026"],
        ["Auteur", "Dimitri (@dimitri-snowdev)"],
        ["Outils couverts", "Snow Scout · Snow Transcriber · Snow Assembler · Kits Grok"],
        ["Plateformes", "Windows 10/11 · Linux (Ubuntu/Debian)"],
        ["Prérequis", "Node.js 20+ · Docker · Git · Clés API"],
        ["Licence", "Open source — dépôts GitHub DimitriTedom"],
      ],
      [3200, 6880],
    ),
    spacer(200),
    callout(
      "info",
      "Comment utiliser ce guide",
      [
        "Ce document est autonome : suivez-le de la page 2 à la checklist finale.",
        "Les encadrés bleus = informations · jaunes = attention · verts = succès · rouges = erreurs fréquentes.",
        "Les blocs gris = commandes à copier-coller dans votre terminal.",
        "Aucune connaissance préalable en développement n'est requise — chaque étape est détaillée.",
      ],
    ),
    pageBreak(),
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: "Table des matières", bold: true, size: 32, font: "Arial", color: C.navy })],
    }),
    new TableOfContents("Table des matières", { hyperlink: true, headingStyleRange: "1-3" }),
    pageBreak(),
  ];
}

// ── Numbering refs ───────────────────────────────────────────────────────

const NUM_REFS = [
  "bullets",
  "pipeline",
  "winsteps",
  "linuxsteps",
  "scoutwin",
  "transwin",
  "asmwin",
  "supa",
  "ytapi",
  "scoutuse",
  "transuse",
  "zennasm",
  "craveasm",
  "grok",
  "full",
  "mcp",
  "check",
  "faq",
];

function numberingConfig() {
  return NUM_REFS.map((ref) => ({
    reference: ref,
    levels: [
      {
        level: 0,
        format: ref === "bullets" ? LevelFormat.BULLET : LevelFormat.DECIMAL,
        text: ref === "bullets" ? "\u2022" : "%1.",
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } },
      },
    ],
  }));
}

// ── Document body ────────────────────────────────────────────────────────

function buildContent() {
  return [
    ...coverPage(),

    sectionBanner("01", "Vue d'ensemble", "Comprendre la suite Snow Video Studio"),
    spacer(200),
    p(
      "Snow Video Studio est une chaîne d'outils open-source qui couvre l'intégralité du cycle de production YouTube faceless : de la découverte d'outliers viraux jusqu'au MP4 final prêt à publier sur YouTube.",
    ),
    callout("tip", "Pour qui est cette suite ?", [
      "Créateurs de chaînes ghost niche (documentaire, psychologie, food-history, stickman…)",
      "Producteurs qui utilisent Grok, Veo3/Flow, ou des images batch (Zapi)",
      "Équipes qui veulent automatiser la recherche, la transcription et l'assemblage vidéo",
      "Toute personne avec une bible de chaîne (.md) et une niche définie",
    ]),

    h2("Les quatre piliers de la suite"),
    toolCard("Snow Scout", "3002", "Recherche d'outliers YouTube, brief JSON Grok-ready, analyse des commentaires viraux, remix cross-niche via votre bible.", "Snow-scout", C.blue),
    spacer(120),
    toolCard("Snow Transcriber", "3001", "Audio narration → scènes horodatées (JSON agent + blocs Veo3). Moteur Whisper local dans Docker.", "Snow-transcriber", "1565C0"),
    spacer(120),
    toolCard("Snow Assembler", "3000", "Clips vidéo Veo3 ou images stickman + narration TTS → MP4 assemblé via FFmpeg (Docker).", "Snow-assembler", "0D47A1"),
    spacer(120),
    toolCard("Kits Grok Project", "—", "Instructions agent, bibles, prompts Veo3/stickman, workflows par chaîne (CRAVE & CONQUER, Snow Age Brain).", "grok-project-*", C.navy),

    h2("Pipeline de production — vue globale"),
    codeBlock([
      "┌─────────────────────────────────────────────────────────────────────┐",
      "│  PHASE 0 — Bible de chaîne (.md) + Grok Project configuré            │",
      "└───────────────────────────────┬─────────────────────────────────────┘",
      "                                ▼",
      "  [Snow Scout]  Search → Build brief → JSON + grokPastePrompt",
      "                                ▼",
      "  [Grok Project]  3–5 idées → Script TTS → ✅ Validation humaine",
      "                                ▼",
      "  [Vous]  TTS (ElevenLabs / Clipchamp / Google) → narration.m4a",
      "                                ▼",
      "  [Snow Transcriber]  Upload audio → snow-transcriber-agent.json",
      "                                ▼",
      "  [Grok / Flow / Zapi]  Prompts scène → SCENE_XX.mp4 ou 0000_.png",
      "                                ▼",
      "  [Snow Assembler]  Dossier épisode → assembled.mp4",
      "                                ▼",
      "  [Publication]  Titre CTR + description SEO + tags + thumbnail",
      "└─────────────────────────────────────────────────────────────────────┘",
    ]),

    h2("Tableau des ports et URLs"),
    styledTable(
      [
        ["Service", "Port", "URL locale", "Technologie"],
        ["Snow Scout UI", "3002", "http://localhost:3002/scout", "Next.js 15 + Supabase"],
        ["Snow Transcriber UI", "3001*", "http://localhost:3001/transcriber", "Next.js 15"],
        ["Snow Assembler UI", "3000", "http://localhost:3000/assembler", "Next.js 15"],
        ["Moteur Whisper", "8000", "http://localhost:8000/health", "Python + faster-whisper (Docker)"],
        ["Moteur FFmpeg", "8001", "http://localhost:8001/health", "Python + FFmpeg (Docker)"],
        ["PostgreSQL Supabase", "5432/6543", "Console supabase.com", "Base de données auth"],
      ],
      [2400, 1200, 3600, 2880],
    ),
    callout("warn", "* Note sur les ports Transcriber", [
      "Par défaut Snow Transcriber utilise le port 3000. Si Snow Assembler tourne en même temps, lancez Transcriber sur 3001 :",
      'PORT=3001 npm run dev   (Linux)   ou modifiez le script dev dans package.json.',
    ]),

    pageBreak(),
    sectionBanner("02", "Prérequis système", "Matériel, logiciels et comptes API"),
    spacer(200),

    h2("Configuration matérielle recommandée"),
    styledTable(
      [
        ["Composant", "Minimum", "Recommandé", "Impact"],
        ["Processeur (CPU)", "4 cœurs", "8+ cœurs", "Whisper et FFmpeg sont CPU-bound"],
        ["Mémoire RAM", "8 Go", "16 Go+", "Docker + 3 apps Next.js simultanées"],
        ["Stockage", "20 Go libres", "50 Go+", "Modèles Whisper, cache Scout, exports MP4"],
        ["GPU", "Non requis", "NVIDIA CUDA (avancé)", "Accélération Whisper optionnelle"],
        ["Réseau", "Connexion stable", "Fibre", "Téléchargement modèles Docker (~2 Go)"],
      ],
      [2000, 2000, 2000, 4080],
    ),
    callout("warn", "Carte graphique AMD (2 Go VRAM)", [
      "Restez sur WHISPER_DEVICE=cpu et WHISPER_COMPUTE_TYPE=int8.",
      "La VRAM est insuffisante pour Whisper base+ en GPU dans Docker.",
      "Pour aller plus vite : WHISPER_MODEL=tiny (moins précis, beaucoup plus rapide).",
    ]),

    h2("Logiciels obligatoires"),
    styledTable(
      [
        ["Logiciel", "Version min.", "Rôle", "Lien de téléchargement"],
        ["Node.js LTS", ">= 20.12", "Interfaces web des 3 outils", "https://nodejs.org"],
        ["npm", "inclus avec Node", "Gestion des dépendances", "—"],
        ["Git", "récent", "Cloner les dépôts GitHub", "https://git-scm.com"],
        ["Docker Desktop (Win) / Engine (Linux)", "récent", "Moteurs Whisper + FFmpeg", "https://docker.com"],
        ["PowerShell ou Terminal", "—", "Exécuter les commandes", "Inclus dans l'OS"],
      ],
      [1800, 1400, 3200, 3680],
    ),

    h2("Comptes et clés API nécessaires"),
    styledTable(
      [
        ["Service", "Outil", "Obligatoire ?", "Variable .env", "Obtenir la clé"],
        ["YouTube Data API v3", "Snow Scout", "Oui", "YOUTUBE_API_KEYS", "console.cloud.google.com"],
        ["OpenRouter", "Snow Scout (remix IA)", "Optionnel", "OPENROUTER_API_KEYS", "openrouter.ai"],
        ["Supabase", "Snow Scout (auth)", "Oui", "NEXT_PUBLIC_SUPABASE_*", "supabase.com"],
        ["Grok.com", "Script + visuels", "Recommandé", "—", "grok.com"],
        ["Google Cloud TTS", "Narration (option)", "Optionnel", "—", "cloud.google.com/text-to-speech"],
        ["ElevenLabs", "Narration (option)", "Optionnel", "—", "elevenlabs.io"],
      ],
      [2000, 1800, 1200, 2200, 2880],
    ),

    h2("Créer une clé YouTube Data API — pas à pas"),
    numbered("ytapi", "Aller sur https://console.cloud.google.com"),
    numbered("ytapi", "Créer un projet (ex. « snow-scout-youtube »)"),
    numbered("ytapi", "Menu → APIs & Services → Library → chercher « YouTube Data API v3 » → Enable"),
    numbered("ytapi", "APIs & Services → Credentials → Create Credentials → API Key"),
    numbered("ytapi", "Copier la clé → YOUTUBE_API_KEYS dans Snow-scout/.env"),
    numbered("ytapi", "Créer une 2e clé sur un 2e projet Google pour la rotation de quota"),
    callout("tip", "Astuce quota YouTube", [
      "Quota gratuit : ~10 000 unités/jour par clé.",
      "Une recherche consomme ~100 unités. Deux clés = double quota.",
      "Format .env : YOUTUBE_API_KEYS=AIzaSyXXXX,AIzaSyYYYY",
    ]),

    pageBreak(),
    sectionBanner("03", "Installation Windows", "Étapes détaillées pour Windows 10/11"),
    spacer(200),

    h2("Étape 1 — Installer les prérequis"),
    numbered("winsteps", "Télécharger Node.js 20 LTS : https://nodejs.org — cocher « Add to PATH »"),
    numbered("winsteps", "Télécharger Git : https://git-scm.com — options par défaut"),
    numbered("winsteps", "Télécharger Docker Desktop : https://docker.com/products/docker-desktop"),
    numbered("winsteps", "Activer WSL2 si Docker le demande (Windows Features → Virtual Machine Platform)"),
    numbered("winsteps", "Redémarrer le PC si nécessaire, lancer Docker Desktop → attendre « Engine running »"),
    numbered("winsteps", "Vérifier dans PowerShell :"),
    codeBlock(["node -v    # doit afficher v20.x ou v22.x", "npm -v", "git --version", "docker --version"]),

    h2("Étape 2 — Contourner le caractère & dans les chemins"),
    callout("danger", "Problème Windows critique — caractère &", [
      "Si votre dossier contient & (ex. CRAVE & CONQUER), npm casse ses scripts .bin.",
      "Solution officielle du projet : créer un lecteur virtuel avec subst.",
    ]),
    codeBlock([
      '# PowerShell — administrateur non requis',
      'subst S: "D:\\SnowDev\\Videos\\Youtube\\CRAVE & CONQUER"',
      "S:",
      "cd S:\\Snow-scout",
      "npm run dev",
    ]),
    p("Travaillez toujours depuis S: pour npm install et npm run dev. Les trois repos utilisent scripts/run-next.mjs."),

    h2("Étape 3 — Cloner les dépôts"),
    codeBlock([
      "mkdir D:\\SnowStudio",
      "cd D:\\SnowStudio",
      "git clone https://github.com/DimitriTedom/Snow-scout.git",
      "git clone https://github.com/DimitriTedom/Snow-transcriber.git",
      "git clone https://github.com/DimitriTedom/Snow-assembler.git",
    ]),

    h2("Étape 4 — Installer Snow Scout"),
    styledTable(
      [
        ["Commande", "Description"],
        ["cd Snow-scout", "Entrer dans le dossier"],
        ["npm run install:safe", "Installation sécurisée (Windows + chemins spéciaux)"],
        ["copy .env.example .env", "Créer le fichier de configuration"],
        ["notepad .env", "Remplir les variables (voir Section 05)"],
        ["npm run db:migrate", "Créer les tables Supabase via Prisma"],
        ["npm run dev", "Lancer l'interface sur http://localhost:3002"],
      ],
      [3600, 6480],
    ),

    h2("Étape 5 — Installer Snow Transcriber"),
    codeBlock([
      "cd Snow-transcriber",
      "npm install",
      "copy .env.example .env",
      "npm run engine:up      # Premier build Docker : 5 à 15 minutes",
      "npm run dev",
      "# Ouvrir http://localhost:3000/transcriber",
      "# Ou tout-en-un : npm run dev:all",
    ]),

    h2("Étape 6 — Installer Snow Assembler"),
    codeBlock([
      "cd Snow-assembler",
      "npm install --ignore-scripts",
      "node scripts/run-prisma.mjs generate",
      "copy .env.example .env",
      "npm run engine:up",
      "npm run dev",
      "# Ouvrir http://localhost:3000/assembler",
    ]),
    callout("success", "Installation Windows terminée", [
      "Vous devriez pouvoir ouvrir les trois interfaces dans votre navigateur.",
      "Passez à la Section 05 pour configurer les fichiers .env en détail.",
    ]),

    pageBreak(),
    sectionBanner("04", "Installation Linux", "Ubuntu / Debian — commandes complètes"),
    spacer(200),

    h2("Installation des prérequis"),
    codeBlock([
      "sudo apt update && sudo apt upgrade -y",
      "sudo apt install -y git curl build-essential ca-certificates gnupg",
      "# Node.js 20",
      "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -",
      "sudo apt install -y nodejs",
      "# Docker",
      "sudo apt install -y docker.io docker-compose-plugin",
      "sudo usermod -aG docker $USER",
      "# Déconnexion/reconnexion requise pour le groupe docker",
    ]),

    h2("Cloner et configurer"),
    codeBlock([
      "mkdir -p ~/SnowStudio && cd ~/SnowStudio",
      "git clone https://github.com/DimitriTedom/Snow-scout.git",
      "git clone https://github.com/DimitriTedom/Snow-transcriber.git",
      "git clone https://github.com/DimitriTedom/Snow-assembler.git",
      "",
      "# Pour chaque repo :",
      "cp .env.example .env && nano .env",
      "npm install",
    ]),

    h2("Chemins Docker sous Linux (Assembler)"),
    codeBlock([
      "# Snow-assembler/.env — exemple Linux",
      "ZENN_DATA_DIR=/home/vous/Documents/Zenn",
      "CRAVE_VIDEOS_DIR=/home/vous/Videos/crave-episodes",
      "ASSEMBLER_OUTPUT_HOST_DIR=/home/vous/Snow-assembler/output",
    ]),
    callout("info", "Avantage Linux", [
      "Pas de problème de caractère & dans les chemins.",
      "npm install fonctionne sans subst ni install:safe.",
      "Docker Engine natif — souvent plus performant que Docker Desktop.",
    ]),

    pageBreak(),
    sectionBanner("05", "Configuration Snow Scout", "Supabase, YouTube API, utilisation complète"),
    spacer(200),

    h2("Fichier .env — modèle complet"),
    codeBlock([
      "# ── YouTube Data API ──────────────────────────────────",
      "YOUTUBE_API_KEYS=AIzaSyXXXXXXXX,AIzaSyYYYYYYYY",
      "",
      "# ── OpenRouter (remix IA — optionnel) ─────────────────",
      "OPENROUTER_API_KEYS=sk-or-v1-xxxxxxxxxxxxxxxx",
      "OPENROUTER_REMIX_MODELS=google/gemma-2-9b-it:free,meta-llama/llama-3.2-3b-instruct:free",
      "SCOUT_REMIX_PROVIDER=openrouter",
      "",
      "# ── Cache local ───────────────────────────────────────",
      "SCOUT_CACHE_DIR=/chemin/vers/.scout-cache",
      "PORT=3002",
      "",
      "# ── Supabase (projet hébergé) ─────────────────────────",
      "NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "DATABASE_URL=postgresql://postgres.xxx:6543/postgres?pgbouncer=true",
      "DIRECT_URL=postgresql://postgres.xxx:5432/postgres",
    ]),

    h2("Configurer Supabase — guide détaillé"),
    numbered("supa", "Créer un compte sur https://supabase.com → New Project"),
    numbered("supa", "Choisir une région proche (ex. eu-west-1 pour l'Europe)"),
    numbered("supa", "Attendre le provisionnement (~2 minutes)"),
    numbered("supa", "Settings → API : copier Project URL → NEXT_PUBLIC_SUPABASE_URL"),
    numbered("supa", "Settings → API : copier anon public key → NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    numbered("supa", "Settings → Database → Connection string → Transaction pooler (port 6543)"),
    numbered("supa", "Ajouter ?pgbouncer=true à la fin → DATABASE_URL"),
    numbered("supa", "Copier aussi la connexion Direct (port 5432) → DIRECT_URL"),
    numbered("supa", "Authentication → Providers → activer Email"),
    numbered("supa", "Authentication → URL Configuration :"),
    bullet("bullets", "Site URL : http://localhost:3002"),
    bullet("bullets", "Redirect URLs : http://localhost:3002/auth/callback"),
    numbered("supa", "Dans Snow-scout : npm run db:migrate"),

    h2("Utiliser Snow Scout — workflow complet"),
    styledTable(
      [
        ["Étape", "Action", "Résultat attendu"],
        ["1", "Créer un compte → /auth/register", "Email de confirmation"],
        ["2", "Cliquer le magic link → /dashboard", "Session active"],
        ["3", "Scout → New channel project", "Formulaire de création"],
        ["4", "Coller la bible de chaîne (.md complet)", "Contexte pour le remix"],
        ["5", "Ajouter mots-clés seed + URLs concurrents", "Recherches rapides"],
        ["6", "Search → classer par outlier score", "Liste de vidéos ranked"],
        ["7", "Build brief sur une vidéo", "Dialog + JSON téléchargé"],
        ["8", "Copier JSON + grokPastePrompt → Grok", "3–5 idées générées"],
      ],
      [800, 4800, 4480],
    ),

    h2("Contenu du brief JSON (champs clés)"),
    styledTable(
      [
        ["Champ JSON", "Description", "Usage Grok"],
        ["sourceOutlier", "Stats, titre, description, tags, URL", "Comprendre l'outlier source"],
        ["sourceChannel", "Propriétaire, abonnés, description chaîne", "Contexte concurrent"],
        ["topComments", "Commentaires triés par likes", "Détecter la douleur émotionnelle"],
        ["viralSignals", "Drivers de viralité, tier d'engagement", "Pourquoi ça a percé"],
        ["channelProject.bibleExcerpt", "Extrait de votre bible", "Angle-shift obligatoire"],
        ["agentInstructions", "Consignes pour l'agent Grok", "Générer 3–5 idées"],
        ["grokPastePrompt", "Prompt prêt à coller", "Démarrer le chat Grok"],
      ],
      [2800, 3600, 3680],
    ),
    callout("danger", "Ce que Snow Scout ne fait PAS", [
      "❌ Pas de script complet",
      "❌ Pas de prompts de scènes Veo3",
      "❌ Pas d'assemblage vidéo",
      "❌ Pas d'export PDF",
      "✅ Uniquement : recherche, brief, et idées de remix pour Grok",
    ]),

    pageBreak(),
    sectionBanner("06", "Snow Transcriber", "Whisper local — de l'audio aux scènes horodatées"),
    spacer(200),

    h2("Configuration .env"),
    codeBlock([
      "TRANSCRIBER_ENGINE_URL=http://localhost:8000",
      "WHISPER_MODEL=base          # tiny | base | small | medium | large-v3",
      "WHISPER_DEVICE=cpu          # cpu (recommandé) ou cuda (NVIDIA)",
      "WHISPER_COMPUTE_TYPE=int8   # int8 | float16 | float32",
      "MAX_UPLOAD_MB=100",
    ]),

    h2("Modes de découpage des scènes"),
    styledTable(
      [
        ["Mode", "Quand l'utiliser", "Exemple"],
        ["Fixed duration", "Veo3 / clips de durée fixe (6s, 8s, 10s)", "52 scènes × 6s = ~5 min"],
        ["Natural pauses", "Rythme organique, pauses naturelles de la voix", "Documentaires narratifs"],
      ],
      [2400, 4000, 3680],
    ),

    h2("Workflow Transcriber"),
    numbered("transuse", "npm run engine:up — vérifier http://localhost:8000/health"),
    numbered("transuse", "npm run dev — ouvrir /transcriber"),
    numbered("transuse", "Uploader narration.m4a (ou .mp3 / .wav)"),
    numbered("transuse", "Choisir Scene duration : 6 secondes (standard Veo3)"),
    numbered("transuse", "Cliquer Generate scenes — attendre la transcription"),
    numbered("transuse", "Exporter snow-transcriber-agent.json"),
    numbered("transuse", "Optionnel : exporter les blocs [SCENE XX] pour Veo3"),

    h2("Exemple de sortie JSON"),
    codeBlock([
      '{',
      '  "sceneCount": 52,',
      '  "sceneDuration": 6,',
      '  "totalDuration": 311.2,',
      '  "scenes": [',
      '    { "id": 1, "start": 0, "end": 6, "duration": 6,',
      '      "text": "Look closely at your kitchen. Sixty percent..." },',
      '    { "id": 2, "start": 6, "end": 12, "duration": 6,',
      '      "text": "You do not see it. But it is in your bread..." }',
      "  ]",
      "}",
    ]),

    pageBreak(),
    sectionBanner("07", "Snow Assembler", "FFmpeg — images ou vidéos → MP4 final"),
    spacer(200),

    h2("Deux workflows supportés"),
    h3("Workflow A — Images stickman (Snow Age Brain / Zenn)"),
    codeBlock([
      "episodes/why_you_cant_stop_scrolling/",
      "├── why_you_cant_stop_scrolling.json   ← timeline scènes",
      "├── images/",
      "│   ├── 0000_A stickman scrolling phone.png",
      "│   ├── 0008_A stickman brain dopamine.png",
      "│   └── ...",
      "└── narration.m4a",
      "→ Sortie : Snow-assembler/output/assembled.mp4",
    ]),
    numbered("zennasm", "UI Assembler → onglet Zenn / Images"),
    numbered("zennasm", "Pointer vers le dossier épisode"),
    numbered("zennasm", "Chemin Docker : /data/zenn/episodes/nom_episode/"),
    numbered("zennasm", "Validate → Assemble"),

    h3("Workflow B — Vidéo Veo3 (CRAVE & CONQUER)"),
    codeBlock([
      "Videos/CRAVE — EPISODE 02/",
      "├── SCENE_01.mp4",
      "├── SCENE_02.mp4  ... SCENE_52.mp4",
      "├── snow-transcriber-agent.json",
      "└── narration.m4a",
      "→ Sortie : output/crave-videos/assembled.mp4",
    ]),
    numbered("craveasm", "UI Assembler → onglet CRAVE / Video"),
    numbered("craveasm", "Sélectionner dossier + JSON transcriber"),
    numbered("craveasm", "L'assembler trim chaque clip aux timestamps exacts"),
    numbered("craveasm", "Render → MP4 dans ASSEMBLER_OUTPUT_HOST_DIR"),

    h2("Configuration .env Assembler"),
    codeBlock([
      "ASSEMBLER_ENGINE_URL=http://localhost:8001",
      "ZENN_DATA_DIR=C:/Users/Vous/Documents/Zenn",
      "CRAVE_VIDEOS_DIR=D:/Videos/crave-episodes",
      "ASSEMBLER_OUTPUT_HOST_DIR=D:/Snow-assembler/output",
    ]),

    pageBreak(),
    sectionBanner("08", "Kits Grok Project", "Configurer votre agent de production IA"),
    spacer(200),

    h2("Kits disponibles"),
    styledTable(
      [
        ["Kit", "Chaîne type", "Visuels", "Dossier local"],
        ["CRAVE & CONQUER", "Food-history × dark psychology", "Veo3 / Flow → SCENE_XX.mp4", "grok-project-crave-and-conquer/"],
        ["Snow Age Brain", "Evolutionary mismatch / stickman", "Grok Imagine → 0000_.png", "grok-project-snow-age-brain/"],
        ["Custom", "Votre niche", "Selon votre pipeline", "Créez votre propre kit"],
      ],
      [2200, 3000, 2800, 2080],
    ),

    h2("Créer un Grok Project — 6 étapes"),
    numbered("grok", "Aller sur https://grok.com → Projects → New Project"),
    numbered("grok", "Nom : « Ma Chaîne — Production Agent »"),
    numbered("grok", "Custom Instructions : coller Part 2 de GROK_PROJECT_*_AGENT.md"),
    numbered("grok", "Knowledge / Files : uploader bible + guides + workflows"),
    numbered("grok", "Images : attacher thumbnails concurrents + refs visuelles"),
    numbered("grok", "Premier message : utiliser starter-prompts/chat-prompts.md"),

    h2("Prompt de démarrage type"),
    codeBlock([
      "Je colle un brief Snow Scout (JSON ci-dessous).",
      "Suis agentInstructions dans le JSON.",
      "Génère 3–5 idées angle-shiftées pour ma bible.",
      "Champs par idée : title, hook, angle, thumbnailBrief, rationale.",
      "Attends que je choisisse UNE idée avant d'écrire le script.",
      "",
      "[coller ici le JSON du brief Scout]",
    ]),

    pageBreak(),
    sectionBanner("09", "Workflow complet — exemple réel", "De zéro à assembled.mp4"),
    spacer(200),

    callout("info", "Scénario : chaîne « Brain & History » — niche evolutionary mismatch", [
      "Ce walkthrough utilise les trois outils + Grok. Adaptez les noms à votre propre niche.",
    ]),

    h3("Étape 0 — Préparer la bible (30 min)"),
    bullet("bullets", "Rédiger un .md : audience, ton, formules de titres, règles thumbnail"),
    bullet("bullets", "Définir 3 piliers de contenu (ex. P1 Core / P2 Anchor / P3 Dark hook)"),
    bullet("bullets", "Uploader dans Snow Scout ET dans le Grok Project"),

    h3("Étape 1 — Idéation Snow Scout (15 min)"),
    numbered("full", "Créer projet « Brain & History », coller la bible"),
    numbered("full", "Rechercher : ancient humans, evolutionary psychology"),
    numbered("full", "Build brief sur l'outlier le mieux scoré (score + engagement %)"),
    numbered("full", "Télécharger le JSON → coller dans Grok"),

    h3("Étape 2 — Script Grok (1–2 h)"),
    numbered("full", "Choisir 1 idée parmi les 3–5 proposées"),
    numbered("full", "Demander le script narration TTS-ready"),
    numbered("full", "Valider phrase par phrase — GATE obligatoire avant audio"),

    h3("Étape 3 — Narration TTS (30 min)"),
    numbered("full", "ElevenLabs / Clipchamp / Google TTS avec script approuvé"),
    numbered("full", "Exporter : narration.m4a (un seul fichier continu)"),

    h3("Étape 4 — Snow Transcriber (10 min)"),
    numbered("full", "Upload narration.m4a → mode Fixed 6s → Generate"),
    numbered("full", "Exporter snow-transcriber-agent.json"),

    h3("Étape 5 — Visuels (2–8 h selon outil)"),
    numbered("full", "Grok génère les prompts par scène"),
    numbered("full", "Veo3/Flow : SCENE_01.mp4 … ou Zapi : 0000_.png …"),

    h3("Étape 6 — Snow Assembler (15 min)"),
    numbered("full", "Placer clips/images + JSON + narration dans le dossier épisode"),
    numbered("full", "Assembler → assembled.mp4"),

    h3("Étape 7 — Publication YouTube"),
    numbered("full", "Demander à Grok : titre CTR, description SEO, tags, chapitres"),
    numbered("full", "Créer thumbnail (Canva / Photoshop / Grok Imagine)"),
    numbered("full", "Upload sur YouTube Studio"),

    pageBreak(),
    sectionBanner("10", "Configuration MCP", "Connecter Cursor, Antigravity, Grok CLI"),
    spacer(200),

    h2("Build des serveurs MCP"),
    codeBlock([
      "cd Snow-scout      && npm run mcp:install && npm run mcp:build",
      "cd Snow-transcriber && npm run mcp:install && npm run mcp:build",
      "cd Snow-assembler  && npm run mcp:install && npm run mcp:build",
    ]),

    h2("Configuration MCP — modèle complet"),
    codeBlock([
      "// Fichier : ~/.gemini/config/mcp_config.json  (Antigravity)",
      "// ou : .cursor/mcp.json  (Cursor)",
      "{",
      '  "mcpServers": {',
      '    "snow-scout": {',
      '      "command": "node",',
      '      "args": ["C:/chemin/absolu/Snow-scout/mcp-server/dist/index.js"]',
      "    },",
      '    "snow-transcriber": {',
      '      "command": "node",',
      '      "args": ["C:/chemin/absolu/Snow-transcriber/mcp-server/dist/index.js"],',
      '      "env": { "SNOW_ENGINE_URL": "http://localhost:8000" }',
      "    },",
      '    "snow-assembler": {',
      '      "command": "node",',
      '      "args": ["C:/chemin/absolu/Snow-assembler/mcp-server/dist/index.js"],',
      '      "env": { "ASSEMBLER_ENGINE_URL": "http://localhost:8001" }',
      "    }",
      "  }",
      "}",
    ]),

    h2("Outils MCP exposés"),
    styledTable(
      [
        ["Serveur", "Outil MCP", "Action"],
        ["snow-scout", "scout_search_outliers", "Rechercher des outliers par mot-clé"],
        ["snow-scout", "scout_outlier_brief", "Générer le brief JSON complet"],
        ["snow-transcriber", "snow_transcribe_audio", "Transcrire un fichier audio"],
        ["snow-transcriber", "snow_format_veo3_blocks", "Exporter blocs [SCENE XX]"],
        ["snow-assembler", "snow_assembler_validate_project", "Valider un dossier épisode"],
        ["snow-assembler", "snow_assembler_assemble_images", "Rendre le MP4 final"],
      ],
      [2200, 3600, 4280],
    ),

    pageBreak(),
    sectionBanner("11", "Dépannage & FAQ", "Résoudre les problèmes les plus courants"),
    spacer(200),

    h2("Tableau de dépannage"),
    styledTable(
      [
        ["Symptôme", "Cause", "Solution"],
        ["npm install échoue", "Caractère & dans le chemin", "subst S: ou cloner vers D:\\SnowStudio"],
        ["Engine not healthy", "Docker arrêté", "Lancer Docker Desktop → npm run engine:up"],
        ["Whisper très lent", "Modèle trop lourd", "WHISPER_MODEL=tiny dans .env"],
        ["YouTube API 403/429", "Quota dépassé", "Ajouter 2e clé dans YOUTUBE_API_KEYS"],
        ["Magic link crash", "Redirect URL incorrecte", "Vérifier Supabase → Redirect URLs"],
        ["Brief Scout invisible", "Cache navigateur", "Ctrl+Shift+R + redémarrer npm run dev"],
        ["Assembler : images introuvables", "Mauvais chemin Docker", "Utiliser /data/zenn/episodes/…"],
        ["Port 3000 déjà utilisé", "Conflit Transcriber/Assembler", "Lancer Scout sur 3002, un seul sur 3000"],
        ["ERR_MEMORY_ALLOCATION_FAILED", "Pression mémoire Node.js", "Redémarrer terminal, npm run dev avec plus de RAM"],
      ],
      [2600, 3000, 4480],
      { headerFill: C.navy },
    ),

    h2("FAQ — Questions fréquentes"),
    h3("Puis-je utiliser la suite sans Grok ?"),
    p("Oui pour Scout, Transcriber et Assembler. Grok (ou un autre LLM) reste nécessaire pour le script et les prompts de scènes — sauf si vous les écrivez manuellement."),

    h3("Dois-je payer pour les APIs ?"),
    p("YouTube Data API : gratuit avec quota journalier. OpenRouter : modèles :free disponibles. Supabase : tier gratuit suffisant pour usage personnel. Grok : selon votre abonnement xAI."),

    h3("Puis-je créer ma propre niche (pas CRAVE ni Snow Age Brain) ?"),
    p("Oui — c'est le principe multi-tenant de Snow Scout. Collez votre propre bible, vos mots-clés, et créez votre Grok Project custom."),

    h3("Les trois outils peuvent-ils tourner en même temps ?"),
    p("Oui. Lancez Scout (:3002), Transcriber (:3001) et Assembler (:3000) dans trois terminaux séparés. Les moteurs Docker 8000 et 8001 sont partagés."),

    pageBreak(),
    sectionBanner("12", "Checklist & Ressources", "Vérification finale avant le premier épisode"),
    spacer(200),

    h2("Checklist de premier lancement"),
    callout("success", "Cochez chaque point avant de produire votre premier épisode", []),
    numbered("check", "Node.js 20+, Git, Docker installés et fonctionnels"),
    numbered("check", "3 dépôts clonés depuis github.com/DimitriTedom"),
    numbered("check", "Fichiers .env remplis pour Scout, Transcriber, Assembler"),
    numbered("check", "Supabase configuré + npm run db:migrate réussi"),
    numbered("check", "YOUTUBE_API_KEYS testées (recherche Scout fonctionne)"),
    numbered("check", "npm run engine:up sur Transcriber ET Assembler"),
    numbered("check", "npm run dev sur les 3 outils — interfaces accessibles"),
    numbered("check", "Grok Project créé avec bible uploadée"),
    numbered("check", "Test bout-en-bout : Search → Build brief → Transcribe → Assemble"),

    h2("Liens officiels"),
    linkP("Snow Scout — github.com/DimitriTedom/Snow-scout", "https://github.com/DimitriTedom/Snow-scout"),
    linkP("Snow Transcriber — github.com/DimitriTedom/Snow-transcriber", "https://github.com/DimitriTedom/Snow-transcriber"),
    linkP("Snow Assembler — github.com/DimitriTedom/Snow-assembler", "https://github.com/DimitriTedom/Snow-assembler"),
    linkP("OpenRouter — openrouter.ai", "https://openrouter.ai"),
    linkP("Supabase — supabase.com", "https://supabase.com"),
    linkP("Google Cloud Console — console.cloud.google.com", "https://console.cloud.google.com"),
    linkP("Grok Projects — grok.com", "https://grok.com"),
    linkP("Node.js LTS — nodejs.org", "https://nodejs.org"),
    linkP("Docker Desktop — docker.com/products/docker-desktop", "https://www.docker.com/products/docker-desktop"),

    spacer(300),
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: [CONTENT_W],
      rows: [
        new TableRow({
          children: [
            tblCell(
              [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: "Vous avez tout ce qu'il faut pour lancer votre chaîne YouTube ghost niche.",
                      size: 24,
                      bold: true,
                      font: "Arial",
                      color: C.navy,
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 100 },
                  children: [
                    new TextRun({
                      text: "Questions · Issues GitHub · @dimitri-snowdev",
                      size: 20,
                      font: "Arial",
                      color: C.muted,
                      italics: true,
                    }),
                  ],
                }),
              ],
              { width: CONTENT_W, fill: C.ice, cellBorders: { ...borders, top: { style: BorderStyle.SINGLE, size: 8, color: C.blue } } },
            ),
          ],
        }),
      ],
    }),
  ];
}

// ── Build document ───────────────────────────────────────────────────────

const docHeader = new Header({
  children: [
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.blue, space: 4 } },
      children: [
        new TextRun({ text: "Snow Video Studio", size: 18, font: "Arial", color: C.blue, bold: true }),
        new TextRun({ text: "\tGuide d'installation v2.0", size: 18, font: "Arial", color: C.muted }),
      ],
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    }),
  ],
});

const docFooter = new Footer({
  children: [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "Dimitri (@dimitri-snowdev)  ·  ", size: 18, font: "Arial", color: C.muted }),
        new TextRun({ text: "Page ", size: 18, font: "Arial", color: C.muted }),
        new TextRun({ children: [PageNumber.CURRENT], size: 18, font: "Arial", color: C.muted }),
        new TextRun({ text: " / ", size: 18, font: "Arial", color: C.muted }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, font: "Arial", color: C.muted }),
      ],
    }),
  ],
});

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22, color: C.text } } },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: C.navy },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: C.blue },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: C.navy },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: { config: numberingConfig() },
  sections: [
    {
      properties: {
        page: {
          size: { width: PAGE.width, height: PAGE.height },
          margin: PAGE.margin,
        },
      },
      headers: { default: docHeader },
      footers: { default: docFooter },
      children: buildContent(),
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outPath, buffer);
console.log(`✓ Guide généré : ${outPath} (${(buffer.length / 1024).toFixed(1)} Ko)`);