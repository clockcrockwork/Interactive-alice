#!/usr/bin/env python3
"""Check the front-end invariants that no linter can express.

Biome handles style and ordinary correctness. The rules below are this project's
own, listed in CLAUDE.md, and each one has already been stated in a document:

  prose            narrative text must not appear in code; it is resolved by id
  absolute-path    asset and link URLs stay relative, so the build runs anywhere
  shot-list        the mapping file is the only list of shots and beats
  scroll-read      scene code takes progress from the runtime, not from the window
  inline-style     scripts set custom properties; GSAP owns everything else
  keyframe-layout  keyframes animate transform and opacity, not layout
  reduced-motion   a stylesheet with motion carries a reduced-motion block
  bfcache          nothing listens for unload, which would disqualify the page

A line may opt out with a trailing comment naming the rule and a reason:

    el.style.width = w + 'px';  /* check-frontend: allow inline-style — measured once on resize */

Usage:
    python3 scripts/check-frontend.py [--quiet]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
ROOTS = ("src", "build", "tests")
SCENES_DIR = REPO_ROOT / "experience" / "scenes"

ALLOW = re.compile(r"check-frontend:\s*allow\s+([a-z-]+)")
# Kana and CJK ideographs: narrative text in a code file, not a comment convention.
CJK = re.compile(r"[぀-ヿ一-鿿]")
ABSOLUTE = re.compile(r"""(?:src|href)\s*=\s*["']/|url\(\s*/|from\s+["']/""")
SCROLL_READ = re.compile(r"window\.(?:scrollY|pageYOffset)|documentElement\.scrollTop")
# An assignment to a style property. Reading one, or calling getPropertyValue and
# friends, is fine; writing a property other than a custom one is what GSAP owns.
INLINE_STYLE = re.compile(r"\.style\.(?!setProperty|getPropertyValue|removeProperty)[A-Za-z_$][\w$]*\s*=")
SET_PROPERTY_VAR = re.compile(r"setProperty\(\s*['\"]--")
# A layout-triggering property, wherever it sits on the line.
LAYOUT_PROPS = re.compile(
    r"(?:^|[{;])\s*(top|left|right|bottom|width|height|inset|margin[\w-]*|padding[\w-]*|"
    r"border-[\w-]*width|font-size|box-shadow)\s*:"
)
MOTION = re.compile(r"@keyframes|transition\s*:|animation\s*:")


def shot_and_beat_ids() -> set[str]:
    ids: set[str] = set()
    for path in sorted(SCENES_DIR.glob("*.scene.json")):
        scene = json.loads(path.read_text(encoding="utf-8"))
        for shot in scene["shots"]:
            ids.add(shot["id"])
            ids.update(beat["id"] for beat in shot["beats"])
    return ids


def allowed(line: str, rule: str) -> bool:
    match = ALLOW.search(line)
    return bool(match) and match.group(1) == rule


def report(problems: list[str], path: Path, number: int, rule: str, message: str) -> None:
    problems.append(f"{path.relative_to(REPO_ROOT)}:{number}: [{rule}] {message}")


def check_code(path: Path, text: str, ids: set[str], problems: list[str]) -> None:
    in_keyframes = 0
    for number, line in enumerate(text.splitlines(), start=1):
        if path.suffix in {".ts", ".css"} and CJK.search(line) and not allowed(line, "prose"):
            report(problems, path, number, "prose",
                   "narrative text belongs in text/locales/, referenced by segment id")
        if ABSOLUTE.search(line) and not allowed(line, "absolute-path"):
            report(problems, path, number, "absolute-path",
                   "use a relative URL or import the asset through the bundler")
        if path.suffix == ".ts":
            if SCROLL_READ.search(line) and "runtime" not in path.parts and not allowed(line, "scroll-read"):
                report(problems, path, number, "scroll-read",
                       "take progress from the runtime context, not from the window")
            if INLINE_STYLE.search(line) and not allowed(line, "inline-style"):
                report(problems, path, number, "inline-style",
                       "write a CSS custom property; GSAP owns the properties it animates")
            if "addEventListener('unload'" in line.replace('"', "'") and not allowed(line, "bfcache"):
                report(problems, path, number, "bfcache",
                       "an unload listener disqualifies the page from the back/forward cache")
        if path.suffix == ".css":
            if "@keyframes" in line:
                in_keyframes = line.count("{")
            elif in_keyframes:
                in_keyframes += line.count("{") - line.count("}")
                found_layout = LAYOUT_PROPS.search(line)
                if found_layout and not allowed(line, "keyframe-layout"):
                    report(problems, path, number, "keyframe-layout",
                           f"{found_layout.group(1)} triggers layout; animate transform and opacity")

    found = {i for i in ids if re.search(rf"""['"]{re.escape(i)}['"]""", text)}
    if len(found) >= 2 and "check-frontend: allow shot-list" not in text:
        report(problems, path, 1, "shot-list",
               f"names {len(found)} shot or beat ids ({', '.join(sorted(found)[:3])}…); "
               "read them from the mapping file instead of listing them here")

    if path.suffix == ".css" and MOTION.search(text) and "prefers-reduced-motion" not in text:
        report(problems, path, 1, "reduced-motion",
               "a stylesheet with motion needs its reduced-motion counterpart")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--quiet", action="store_true", help="print only problems")
    args = parser.parse_args()

    roots = [REPO_ROOT / name for name in ROOTS if (REPO_ROOT / name).exists()]
    if not roots:
        if not args.quiet:
            print("ok: no front end yet, nothing to check")
        return 0

    ids = shot_and_beat_ids()
    problems: list[str] = []
    files = [
        path
        for root in roots
        for path in root.rglob("*")
        # Generated pages are build output, derived from the mapping rather than a
        # second copy of it, so they are not hand-written code to police.
        if path.suffix in {".ts", ".css", ".html"} and path.is_file() and "generated" not in path.parts
    ]
    for path in sorted(files):
        check_code(path, path.read_text(encoding="utf-8"), ids, problems)

    for problem in problems:
        print(f"error: {problem}", file=sys.stderr)
    if problems:
        print(f"\n{len(problems)} problem(s) found", file=sys.stderr)
        return 1
    if not args.quiet:
        print(f"ok: {len(files)} file(s) checked")
    return 0


if __name__ == "__main__":
    sys.exit(main())
