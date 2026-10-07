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
  locale-profile   code and styles read the locale profile, never a language's name:
                   no :lang() rule, no locale id literal, no branch on the page's
                   lang, no splitting a line at spaces outside units()
  node-pin         .nvmrc and package.json agree on one Node major

A line may opt out with a trailing comment naming the rule and a reason (a CSS
selector, by a comment on the first line of its block, where the formatter puts it):

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
# A language named in a selector. The one rule that may (font stacks are per script)
# carries an allow comment; see docs/text-experience-binding.md, Language differences.
LANG_SELECTOR = re.compile(r":lang\(\s*[A-Za-z]")
# Branching on the page's language in code, instead of reading its profile.
LANG_READ = re.compile(r"documentElement\.lang\b|\blang\s*[!=]==|startsWith\(\s*['\"][a-z]{2,3}\b")
# Splitting a line of text at spaces: a language may write no spaces, so lines are
# split by units() in src/demos/shell/words.ts, which reads the profile.
SPACE_SPLIT = re.compile(r"\.split\(\s*(?:'\s'|\"\s\"|' '|\" \"|/\(?\\s)")
WORDS_MODULE = REPO_ROOT / "src" / "demos" / "shell" / "words.ts"
LOCALES_FILE = REPO_ROOT / "text" / "locales.json"


def locale_literal() -> re.Pattern[str]:
    """A string literal that is one of the registry's locale ids."""
    ids = json.loads(LOCALES_FILE.read_text(encoding="utf-8"))["locales"].keys()
    names = "|".join(re.escape(name) for name in sorted(ids, key=len, reverse=True))
    return re.compile(rf"""['"`](?:{names})['"`]""")


def shot_and_beat_ids() -> set[str]:
    ids: set[str] = set()
    for path in sorted(SCENES_DIR.glob("*.scene.json")):
        scene = json.loads(path.read_text(encoding="utf-8"))
        for shot in scene["shots"]:
            ids.add(shot["id"])
            ids.update(beat["id"] for beat in shot["beats"])
    return ids


GENERATED = REPO_ROOT / "src" / "generated"


SCENES = REPO_ROOT / "src" / "scenes"


def is_scene_code(path: Path) -> bool:
    return path.is_relative_to(SCENES)


def is_generated(path: Path) -> bool:
    """Only this one tree is build output; everything else is hand-written."""
    return path.is_relative_to(GENERATED)


def allowed(line: str, rule: str) -> bool:
    match = ALLOW.search(line)
    return bool(match) and match.group(1) == rule


def report(problems: list[str], path: Path, number: int, rule: str, message: str) -> None:
    problems.append(f"{path.relative_to(REPO_ROOT)}:{number}: [{rule}] {message}")


def is_runtime_code(path: Path) -> bool:
    """Hand-written code that ships: src/, not its tests. Tests may name a locale."""
    return path.is_relative_to(REPO_ROOT / "src") and not path.name.endswith(".test.ts")


def check_code(
    path: Path, text: str, ids: set[str], problems: list[str], locales: re.Pattern[str]
) -> None:
    in_keyframes = 0
    lines = text.splitlines()
    for number, line in enumerate(lines, start=1):
        # The formatter puts a rule's comment on the line after its selector, so a
        # selector may also be allowed by the first line inside its block.
        following = lines[number] if number < len(lines) else ""
        if is_runtime_code(path) and not allowed(line, "locale-profile"):
            if (
                path.suffix == ".css"
                and LANG_SELECTOR.search(line)
                and not allowed(following, "locale-profile")
            ):
                report(problems, path, number, "locale-profile",
                       "key the rule on the locale profile (data-* on the root), not :lang(); "
                       "only the font-stack rule in shell.css names a language")
            if path.suffix == ".ts" and (LANG_READ.search(line) or locales.search(line)):
                report(problems, path, number, "locale-profile",
                       "read the locale profile (pageProfile(), shell.profile), not the language")
            if path.suffix == ".ts" and path != WORDS_MODULE and SPACE_SPLIT.search(line):
                report(problems, path, number, "locale-profile",
                       "split a line with units() from shell/words.ts, which reads the profile")
        if CJK.search(line) and not allowed(line, "prose"):
            report(problems, path, number, "prose",
                   "narrative text belongs in text/locales/, referenced by segment id")
        if ABSOLUTE.search(line) and not allowed(line, "absolute-path"):
            report(problems, path, number, "absolute-path",
                   "use a relative URL or import the asset through the bundler")
        if path.suffix == ".ts":
            # Only scene code is bound by this: the runtime is where scroll is read,
            # and a browser test drives the window on purpose.
            if is_scene_code(path) and SCROLL_READ.search(line) and not allowed(line, "scroll-read"):
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


ENGINE_RANGE = re.compile(r"^>=\s*(\d+)(?:\.\S+)?\s+<\s*(\d+)$")


def check_node_pin(problems: list[str]) -> None:
    """`.nvmrc` and `package.json` must name the same Node major.

    They are read by different tools that never compare notes: the local shell and
    GitHub Actions follow `.nvmrc`, while the hosts follow `engines`. If they drift,
    the version the gate runs on is not the version that builds the site, and nothing
    says so. The pin itself is a decision recorded in docs/deployment.md §5.
    """
    nvmrc = (REPO_ROOT / ".nvmrc").read_text(encoding="utf-8").strip()
    engines = json.loads((REPO_ROOT / "package.json").read_text(encoding="utf-8"))["engines"]["node"]
    match = ENGINE_RANGE.match(engines.strip())
    if match is None:
        problems.append(
            f"node-pin: package.json engines.node is {engines!r}; this project pins one "
            "major, written as '>=<major> <next major>'"
        )
        return
    low, high = int(match.group(1)), int(match.group(2))
    if high != low + 1:
        problems.append(
            f"node-pin: package.json engines.node {engines!r} spans more than one major"
        )
    pinned = nvmrc.lstrip("v").split(".")[0]
    if not pinned.isdigit() or int(pinned) != low:
        problems.append(
            f"node-pin: .nvmrc says {nvmrc!r} but package.json engines.node says {engines!r}"
        )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--quiet", action="store_true", help="print only problems")
    args = parser.parse_args()

    roots = [REPO_ROOT / name for name in ROOTS if (REPO_ROOT / name).exists()]

    ids = shot_and_beat_ids()
    locales = locale_literal()
    problems: list[str] = []
    check_node_pin(problems)
    files = [
        path
        for root in roots
        for path in root.rglob("*")
        # Generated pages are build output, derived from the mapping rather than a
        # second copy of it, so they are not hand-written code to police.
        if path.suffix in {".ts", ".css", ".html"} and path.is_file() and not is_generated(path)
    ]
    for path in sorted(files):
        check_code(path, path.read_text(encoding="utf-8"), ids, problems, locales)

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
