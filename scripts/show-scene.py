#!/usr/bin/env python3
"""Inspect one experience scene: its text in a language, or its pacing plan.

Two modes, both development aids:

    python3 scripts/show-scene.py rabbit-hole --locale ja
        prints the scene's shots, beats and resolved sentences. The scene file
        holds only segment ids, so this also demonstrates that the boundary works.

    python3 scripts/show-scene.py rabbit-hole --plan
        prints the progress ranges each shot would receive, per locale, using the
        staging weights in the scene file and the reading load of the text. The
        formula is documented in docs/text-experience-binding.md; this script is
        the reference implementation a Scene runtime should match.
"""

from __future__ import annotations

import argparse
import json
import signal
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

# A beat is held for at least this much, measured in segment-equivalents, so a
# beat with one short sentence or no text at all still gets screen time.
MINIMUM_HOLD = 1.0


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def find_scene(scene_id: str) -> dict:
    story = load(REPO_ROOT / "experience" / "story.json")
    entry = next((s for s in story["scenes"] if s["id"] == scene_id), None)
    if entry is None:
        raise SystemExit(f"unknown scene {scene_id!r}")
    return load(REPO_ROOT / entry["file"])


def chapters_of(scene: dict) -> set[int]:
    return {
        int(segment_id[2:4])
        for shot in scene["shots"]
        for beat in shot["beats"]
        for segment_id in beat["segments"]
    }


def locale_text(locale: str, chapters: set[int]) -> dict[str, str]:
    """Every segment of the given chapters in one language."""
    text: dict[str, str] = {}
    for chapter in sorted(chapters):
        path = REPO_ROOT / "text" / "locales" / locale / f"ch{chapter:02d}.json"
        if not path.exists():
            raise SystemExit(f"{locale} has no text for chapter {chapter}")
        text.update(load(path)["segments"])
    return text


def show(scene: dict, locale: str) -> None:
    text = locale_text(locale, chapters_of(scene))
    print(f"scene {scene['id']} · {locale}")
    for shot in scene["shots"]:
        print(f"\n  shot {shot['id']} — {shot.get('devLabel', '')}")
        for beat in shot["beats"]:
            if not beat["segments"]:
                print(f"    beat {beat['id']}: (staging only, no text)")
                continue
            print(f"    beat {beat['id']}:")
            for segment_id in beat["segments"]:
                print(f"      {segment_id}  {text[segment_id]}")


def plan(scene: dict, locale: str) -> tuple[list[tuple[str, float, float]], int, float]:
    """Shot progress ranges for one locale, plus its total and mean text length."""
    text = locale_text(locale, chapters_of(scene))
    staged = [
        segment_id
        for shot in scene["shots"]
        for beat in shot["beats"]
        for segment_id in beat["segments"]
    ]
    # One segment-equivalent is the average staged sentence in this language, so
    # the shape of the plan stays comparable between languages. Character counts
    # are not comparable across writing systems, so they never leave this ratio.
    mean = sum(len(text[segment_id]) for segment_id in staged) / len(staged)

    costs: list[float] = []
    for shot in scene["shots"]:
        total = 0.0
        for beat in shot["beats"]:
            load_ = sum(len(text[segment_id]) for segment_id in beat["segments"]) / mean
            total += beat.get("weight", 1.0) * max(load_, MINIMUM_HOLD)
        costs.append(shot.get("weight", 1.0) * total)

    whole = sum(costs)
    ranges: list[tuple[str, float, float]] = []
    start = 0.0
    for shot, cost in zip(scene["shots"], costs):
        end = start + cost / whole
        ranges.append((shot["id"], start, end))
        start = end
    return ranges, sum(len(text[segment_id]) for segment_id in staged), mean


def show_plan(scene: dict) -> None:
    locales = list(load(REPO_ROOT / "text" / "locales.json")["locales"])
    plans = {locale: plan(scene, locale) for locale in locales}

    print(f"scene {scene['id']} · progress ranges by locale\n")
    header = "  shot".ljust(18) + "".join(locale.ljust(22) for locale in locales)
    print(header)
    for index, shot in enumerate(scene["shots"]):
        row = f"  {shot['id']}".ljust(18)
        for locale in locales:
            _, start, end = plans[locale][0][index]
            row += f"{start:.3f} – {end:.3f}".ljust(22)
        print(row)
    print()
    for locale in locales:
        _, total, mean = plans[locale]
        print(f"  {locale}: {total} characters staged, {mean:.1f} per segment on average")
    print("\n  Character counts are an authoring statistic, not a reading-time unit:")
    print("  they are not comparable between writing systems, so they only ever")
    print("  appear as a ratio against this locale's own mean.")
    print("  Total scroll distance for the scene is art-directed and runtime-owned,")
    print("  one base distance shared by every locale. See docs/text-experience-binding.md.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("scene", help="scene id, as listed in experience/story.json")
    parser.add_argument("--locale", default="en-simple", help="locale directory under text/locales/")
    parser.add_argument("--plan", action="store_true", help="print progress ranges instead of text")
    args = parser.parse_args()

    scene = find_scene(args.scene)
    if args.plan:
        show_plan(scene)
    else:
        show(scene, args.locale)
    return 0


if __name__ == "__main__":
    # Allow piping into head without a BrokenPipeError traceback.
    signal.signal(signal.SIGPIPE, signal.SIG_DFL)
    sys.exit(main())
