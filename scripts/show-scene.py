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

    python3 scripts/show-scene.py rabbit-hole --plan --json
        the same plan as JSON, one entry per locale, including beat spans. This is
        the golden fixture the runtime's unit test compares itself against; see
        docs/testing.md.
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


def spans(costs: list[tuple[str, float]], whole: float) -> list[dict]:
    """Cumulative normalized spans, in order."""
    out = []
    start = 0.0
    for unit_id, cost in costs:
        end = start + cost / whole
        out.append({"id": unit_id, "start": start, "end": end})
        start = end
    return out


def plan(scene: dict, locale: str) -> dict:
    """The scene's plan for one locale: shot spans, beat spans, and text statistics."""
    text = locale_text(locale, chapters_of(scene))
    staged = [
        segment_id
        for shot in scene["shots"]
        for beat in shot["beats"]
        for segment_id in beat["segments"]
    ]
    characters = sum(len(text[segment_id]) for segment_id in staged)
    # One segment-equivalent is the average staged sentence in this language, so
    # the shape of the plan stays comparable between languages. Character counts
    # are not comparable across writing systems, so they never leave this ratio.
    mean = characters / len(staged)

    shot_costs: list[tuple[str, float]] = []
    beat_costs: list[tuple[str, float]] = []
    for shot in scene["shots"]:
        shot_weight = shot.get("weight", 1.0)
        total = 0.0
        for beat in shot["beats"]:
            load = sum(len(text[segment_id]) for segment_id in beat["segments"]) / mean
            cost = beat.get("weight", 1.0) * max(load, MINIMUM_HOLD)
            total += cost
            # A beat divides its own shot's span, so it carries the shot's weight too.
            beat_costs.append((beat["id"], cost * shot_weight))
        shot_costs.append((shot["id"], shot_weight * total))

    whole = sum(cost for _, cost in shot_costs)
    return {
        "scene": scene["id"],
        "locale": locale,
        "shots": spans(shot_costs, whole),
        "beats": spans(beat_costs, whole),
        "characters": characters,
        "mean": mean,
    }


def show_plan(scene: dict, as_json: bool) -> None:
    locales = list(load(REPO_ROOT / "text" / "locales.json")["locales"])
    plans = {locale: plan(scene, locale) for locale in locales}

    if as_json:
        print(json.dumps([plans[locale] for locale in locales], indent=2))
        return

    print(f"scene {scene['id']} \u00b7 progress ranges by locale\n")
    print("  shot".ljust(18) + "".join(locale.ljust(22) for locale in locales))
    for index, shot in enumerate(scene["shots"]):
        row = f"  {shot['id']}".ljust(18)
        for locale in locales:
            span = plans[locale]["shots"][index]
            row += f"{span['start']:.3f} \u2013 {span['end']:.3f}".ljust(22)
        print(row)
    print()
    for locale in locales:
        entry = plans[locale]
        print(
            f"  {locale}: {entry['characters']} characters staged, "
            f"{entry['mean']:.1f} per segment on average"
        )
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
    parser.add_argument("--json", action="store_true", help="with --plan, emit JSON for the fixture")
    args = parser.parse_args()

    scene = find_scene(args.scene)
    if args.plan:
        show_plan(scene, args.json)
    else:
        show(scene, args.locale)
    return 0


if __name__ == "__main__":
    # Allow piping into head without a BrokenPipeError traceback.
    signal.signal(signal.SIGPIPE, signal.SIG_DFL)
    sys.exit(main())
