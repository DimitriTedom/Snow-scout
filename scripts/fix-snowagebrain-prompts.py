#!/usr/bin/env python3
"""Fix era consistency in SnowAgeBrain image prompts."""
from __future__ import annotations

import re
from pathlib import Path

SRC = Path(r"C:\Users\Dimitri SnowDev\Downloads\SnowAgeBrain_163_FinalPrompts_TOOL_READY.txt")
DST = SRC  # overwrite tool-ready file

STYLE_MODERN = (
    "Style constraint: A simple flat-colored comic illustration in MS Paint style. "
    "Thick uneven black outlines, wobbly hand-drawn lines, flat solid color fills, no shading, "
    "no gradients, no 3D elements, no realistic textures, horizontal 16:9 frame format. "
    "ERA RULE — PRESENT DAY: characters are stickmen with white circular heads and thin black limbs, "
    "wearing casual modern everyday clothing (hoodie, t-shirt, jeans, sneakers) — never animal-skin tunics. "
    "Backgrounds are simple flat modern settings (bedroom, apartment, city lights through window). "
    "No prehistoric landscapes or stone-age props unless shown only inside a small thought bubble."
)

STYLE_ANCIENT = (
    "Style constraint: A simple flat-colored comic illustration in MS Paint style. "
    "Thick uneven black outlines, wobbly hand-drawn lines, flat solid color fills, no shading, "
    "no gradients, no 3D elements, no realistic textures, horizontal 16:9 frame format. "
    "ERA RULE — PREHISTORIC PAST: characters are stickmen with white circular heads and thin black limbs, "
    "wearing primitive jagged animal-skin tunics and bare feet. "
    "Backgrounds are flat prehistoric landscapes (golden savanna, rocky hills, tribal camp, lean-to shelter) "
    "inspired by crude cave-wall simplicity. No phones, furniture, buildings, cars, or any modern technology."
)

STYLE_SPLIT = (
    "Style constraint: A simple flat-colored comic illustration in MS Paint style. "
    "Thick uneven black outlines, wobbly hand-drawn lines, flat solid color fills, no shading, "
    "no gradients, no 3D elements, no realistic textures, horizontal 16:9 frame format. "
    "ERA RULE — SPLIT PANEL: divide the frame with a bold vertical line. "
    "LEFT side = PREHISTORIC (animal-skin tunics, savanna/tribal camp, stone tools, campfire). "
    "RIGHT side = PRESENT DAY (casual modern clothes, apartment/phone). "
    "Never mix eras in one panel except this explicit left/right split."
)

STYLE_METAPHOR = (
    "Style constraint: A simple flat-colored comic illustration in MS Paint style. "
    "Thick uneven black outlines, wobbly hand-drawn lines, flat solid color fills, no shading, "
    "no gradients, no 3D elements, no realistic textures, horizontal 16:9 frame format. "
    "ERA RULE — METAPHOR: modern stickman protagonist in casual clothes on a simple flat neutral background; "
    "symbolic prehistoric elements (stone tools, gears, ancient figures) appear only inside head cutaway, "
    "thought bubbles, or floating icons — never worn on the body or mixed into the room."
)

# Pure prehistoric flashback scenes (tribe bonding arc + anthropology)
ANCIENT_SCENES = {
    24, 25, 26, 27, 31, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55,
    56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 75, 76,
    77, 78, 91, 105, 106, 107, 130, 131, 132, 133, 134, 135, 136, 137,
}

SPLIT_SCENES = {
    19, 20, 22, 23, 28, 32, 74, 79, 81, 92, 93, 108, 112, 122, 138, 150, 157, 163,
}

# Modern protagonist; prehistoric content only in bubbles/icons
MODERN_SCENES = {3, 6}

METAPHOR_SCENES = {18, 21, 29, 35, 38, 39, 40, 77, 90, 102}

# Scene-specific visual rewrites (full visual description after "MS Paint style of ")
VISUAL_OVERRIDES: dict[int, str] = {
    3: (
        "a modern stickman in casual hoodie lying in bed looking at a glowing smartphone, "
        "with a small thought bubble above his head showing tiny ancient stickmen in animal-skin tunics "
        "on a flat savanna — ancient figures only inside the bubble"
    ),
    19: (
        "SPLIT PANEL: modern stickman in t-shirt and jeans holding a smartphone looking confused on the right; "
        "left side shows flat prehistoric savanna with ancient stickmen in animal-skin tunics around a campfire"
    ),
    20: (
        "SPLIT PANEL: modern stickman in casual clothes standing in the center looking confused; "
        "left background prehistoric savanna with small tribe in animal-skin tunics; "
        "right background flat modern city skyline"
    ),
    22: (
        "modern stickman in hoodie comparing two floating stick-figure options: "
        "one in animal-skin tunic labeled ancient, one in t-shirt labeled modern profile"
    ),
    23: (
        "a flat timeline arrow from left to right: left end shows ancient stickmen in animal-skin tunics on savanna; "
        "right end shows modern stickman in casual clothes holding smartphone"
    ),
    28: (
        "SPLIT PANEL with speed lines: left shows ancient tribal camp with stickmen in animal-skin tunics; "
        "right shows modern stickman in hoodie holding smartphone"
    ),
    32: (
        "SPLIT PANEL: left shows ancient stickman in animal-skin tunic successfully hunting with a wooden spear on savanna; "
        "right shows modern stickman in casual clothes holding smartphone looking confused in apartment — do not combine both in one figure"
    ),
    34: (
        "modern stickman in hoodie having a lightbulb moment in apartment, "
        "small idea bubble showing prehistoric brain gears on left and smartphone icon on right"
    ),
    37: (
        "ancient stickmen in animal-skin tunics: one carefully observing another's hunting and gathering behavior "
        "during daily tasks on open savanna, thoughtful expression"
    ),
    74: (
        "SPLIT PANEL: left shows ancient stickmen in animal-skin tunics with clear direct interaction around campfire; "
        "right shows modern stickman in hoodie confused surrounded by many floating mixed-signal chat icons from dating app"
    ),
    79: (
        "SPLIT PANEL with speed lines: left fades from ancient tribal camp; right shows modern stickman in casual clothes "
        "opening dating app on smartphone in bedroom"
    ),
    81: (
        "SPLIT PANEL: left shows small tribe of 30 ancient stickmen in animal-skin tunics in tight camp circle on savanna; "
        "right shows thousands of floating modern dating profile icons flooding a smartphone screen"
    ),
    92: (
        "SPLIT PANEL: left ancient stickman in animal-skin tunic discovering food on savanna with excited expression; "
        "right modern stickman in hoodie with flood of dating profiles on phone screen"
    ),
    93: (
        "SPLIT PANEL: left ancient hunter in animal-skin tunic returning to tribe with positive group reaction around fire; "
        "right modern stickman in casual clothes getting a small match notification on phone"
    ),
    105: (
        "ancient stickmen in animal-skin tunics slowly getting to know a small number of people in tribal camp over time, "
        "open savanna background, no modern objects"
    ),
    106: (
        "ancient stickman in animal-skin tunic observing the same few tribe members over weeks in prehistoric camp, "
        "simple time-passing sun symbols, savanna landscape"
    ),
    108: (
        "SPLIT PANEL: left ancient stickmen in animal-skin tunics bonding slowly around campfire; "
        "right modern stickman in hoodie swiping rapidly on smartphone"
    ),
    112: (
        "SPLIT PANEL: left tight circle of ancient stickmen in animal-skin tunics with warm connection on savanna; "
        "right modern stickman in casual clothes surrounded by hundreds of shallow glowing profile icons"
    ),
    122: (
        "SPLIT PANEL: left ancient pair of stickmen in animal-skin tunics in deep long-term bond by shelter; "
        "right modern stickman in hoodie receiving quick small dopamine sparkles from new match notifications"
    ),
    130: (
        "ancient stickmen in animal-skin tunics in stable pair bonds beside a simple lean-to shelter on savanna, "
        "cooperative parenting with small child stick figures — anthropological prehistoric scene"
    ),
    131: (
        "ancient hunter-gatherer stickmen in animal-skin tunics living in stable pairs with cooperative parenting "
        "in small tribal band on savanna — anthropological prehistoric scene, not modern"
    ),
    132: (
        "ancient hunter-gatherer stickmen in animal-skin tunics in small group showing stable pair bonds "
        "around campfire, flat prehistoric landscape"
    ),
    138: (
        "SPLIT PANEL: left ancient stickmen in animal-skin tunics in practical stable pair bond by lean-to shelter; "
        "right modern stickman in hoodie overwhelmed by too many dating profile choices on phone"
    ),
    150: (
        "SPLIT PANEL: left prehistoric savanna with ancient stickmen in animal-skin tunics; "
        "right modern stickman in casual clothes in apartment with calm understanding expression"
    ),
    157: (
        "SPLIT PANEL: modern stickman in hoodie in center looking with understanding; "
        "left panel prehistoric savanna with ancient tribe; right panel modern apartment with city window"
    ),
    163: (
        "SPLIT PANEL: modern stickman in casual clothes taking a small positive step forward in apartment; "
        "left background prehistoric savanna with ancient stickmen in animal-skin tunics; "
        "right background modern city — calm understanding expression"
    ),
}

OLD_STYLE = re.compile(
    r"Style constraint: A simple flat-colored comic illustration in MS Paint style\. "
    r"Thick uneven black outlines.*?Backgrounds are simple flat-colored vector landscapes\.",
    re.DOTALL,
)


def scene_number(header: str) -> int:
    m = re.search(r"SCENE (\d{4})", header)
    if not m:
        raise ValueError(f"No scene number in: {header[:60]}")
    return int(m.group(1))


def classify(scene: int, visual: str) -> str:
    if scene in MODERN_SCENES:
        return "modern"
    if scene in VISUAL_OVERRIDES or scene in SPLIT_SCENES:
        if scene in METAPHOR_SCENES:
            return "metaphor"
        if scene in ANCIENT_SCENES:
            return "ancient"
        return "split"
    if scene in ANCIENT_SCENES:
        return "ancient"
    if scene in METAPHOR_SCENES:
        return "metaphor"
    v = visual.lower()
    if any(k in v for k in ("split panel", "left side", "right side", "between two flat backgrounds")):
        return "split"
    if any(k in v for k in ("ancient stick", "tribe", "savanna", "hunter-gatherer", "tribal camp", "animal-skin tunic")):
        if any(k in v for k in ("phone", "smartphone", "modern room", "apartment", "bedroom", "dating app", "swiping")):
            return "split"
        return "ancient"
    return "modern"


def enhance_visual(scene: int, visual: str, era: str) -> str:
    if scene in VISUAL_OVERRIDES:
        return VISUAL_OVERRIDES[scene]

    v = visual.strip()

    if era == "ancient":
        v = re.sub(r"\bthe stickman\b", "an ancient stickman in an animal-skin tunic", v, flags=re.I)
        v = re.sub(r"\bstickman\b", "ancient stickman in animal-skin tunic", v, flags=re.I)
        v = re.sub(r"\bstickmen\b", "ancient stickmen in animal-skin tunics", v, flags=re.I)
        v = re.sub(r"with a modern phone[^,.]*", "", v, flags=re.I)
        v = re.sub(r"holding (?:the |a )?phone[^,.]*", "holding a wooden tool", v, flags=re.I)
        v = re.sub(r"smartphone[^,.]*", "", v, flags=re.I)
        if "savanna" not in v.lower() and "camp" not in v.lower() and "prehistoric" not in v.lower():
            v += ", flat prehistoric savanna landscape"
        return v

    if era == "modern":
        if "modern stickman" not in v.lower():
            v = re.sub(r"\bthe stickman\b", "a modern stickman in casual hoodie and jeans", v, count=1, flags=re.I)
            v = re.sub(r"\bof the stickman\b", "of a modern stickman in casual clothes", v, count=1, flags=re.I)
            v = re.sub(r"\bof a stickman\b", "of a modern stickman in casual clothes", v, count=1, flags=re.I)
        v = re.sub(r"\banimal[- ]skin tunic[s]?\b", "hoodie", v, flags=re.I)
        v = re.sub(r"\bprimitive jagged\b", "casual", v, flags=re.I)
        if any(k in v.lower() for k in ("phone", "swip", "profile", "match", "dating", "app")):
            if "apartment" not in v.lower() and "bedroom" not in v.lower() and "modern room" not in v.lower():
                v += ", simple modern apartment background"
        return v

    if era == "metaphor":
        if "modern stickman" not in v.lower():
            v = re.sub(r"\bthe stickman\b", "a modern stickman in casual clothes", v, count=1, flags=re.I)
        return v

    return v  # split uses overrides mostly


def style_for(era: str) -> str:
    return {
        "modern": STYLE_MODERN,
        "ancient": STYLE_ANCIENT,
        "split": STYLE_SPLIT,
        "metaphor": STYLE_METAPHOR,
    }[era]


def parse_prompts(text: str) -> list[str]:
    return [p.strip() for p in re.split(r"\n\s*\n", text.strip()) if p.strip()]


def process_prompt(raw: str) -> str:
    m = re.match(r"(SCENE \d{4} \([^)]+\))\s+(.*)", raw, re.DOTALL)
    if not m:
        raise ValueError(f"Bad prompt format: {raw[:80]}")
    header, body = m.group(1), m.group(2)
    scene = scene_number(header)

    visual, _old_style = body.split("Style constraint:", 1)
    visual = visual.strip().removeprefix("A simple flat-colored comic illustration in MS Paint style of ").strip()

    era = classify(scene, visual)
    visual = enhance_visual(scene, visual, era).rstrip(" .")
    new_visual = f"A simple flat-colored comic illustration in MS Paint style of {visual}."
    return f"{header} {new_visual} {style_for(era)}"


def main() -> None:
    text = SRC.read_text(encoding="utf-8")
    prompts = parse_prompts(text)
    if len(prompts) != 163:
        raise SystemExit(f"Expected 163 prompts, found {len(prompts)}")

    updated = [process_prompt(p) for p in prompts]
    out = "\n\n".join(updated) + "\n"
    DST.write_text(out, encoding="utf-8")

    eras: dict[str, int] = {}
    for p in updated:
        for key, style in [
            ("modern", STYLE_MODERN),
            ("ancient", STYLE_ANCIENT),
            ("split", STYLE_SPLIT),
            ("metaphor", STYLE_METAPHOR),
        ]:
            if style in p:
                eras[key] = eras.get(key, 0) + 1
                break

    print(f"Updated {DST}")
    print(f"Prompt count: {len(updated)}")
    print("Era breakdown:", eras)


if __name__ == "__main__":
    main()