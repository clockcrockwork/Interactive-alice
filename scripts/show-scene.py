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
        the same plan as JSON, one entry per locale, including beat spans.

    python3 scripts/show-scene.py --all --plan --json
        every scene in experience/story.json, for every locale that has text for the
        chapters it stages. This is the golden fixture the runtime's unit test compares
        itself against, and it covers scenes that cross a chapter boundary; see
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


def has_text(locale: str, chapters: set[int]) -> bool:
    """Whether this language has been translated as far as these chapters."""
    return all(
        (REPO_ROOT / "text" / "locales" / locale / f"ch{chapter:02d}.json").exists()
        for chapter in chapters
    )


def every_scene() -> list[dict]:
    """Scene files in story order, so nothing keeps a second list of scenes."""
    story = load(REPO_ROOT / "experience" / "story.json")
    return [load(REPO_ROOT / entry["file"]) for entry in story["scenes"]]


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
    # A scene may stage no text at all: it then has no mean, and every beat falls
    # back to the minimum hold below.
    mean = characters / len(staged) if staged else None

    shot_costs: list[tuple[str, float]] = []
    beat_costs: list[tuple[str, float]] = []
    for shot in scene["shots"]:
        shot_weight = shot.get("weight", 1.0)
        total = 0.0
        for beat in shot["beats"]:
            load = (
                0.0
                if mean is None
                else sum(len(text[segment_id]) for segment_id in beat["segments"]) / mean
            )
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


def plans_for(scenes: list[dict]) -> list[dict]:
    """Every scene and locale pair that can be planned today, in a stable order."""
    locales = list(load(REPO_ROOT / "text" / "locales.json")["locales"])
    out = []
    for scene in scenes:
        chapters = chapters_of(scene)
        for locale in locales:
            if has_text(locale, chapters):
                out.append(plan(scene, locale))
    return out


def available_locales(scene: dict) -> tuple[list[str], list[str]]:
    """Locales that can be planned for this scene today, and those that cannot."""
    locales = list(load(REPO_ROOT / "text" / "locales.json")["locales"])
    chapters = chapters_of(scene)
    ready = [locale for locale in locales if has_text(locale, chapters)]
    waiting = [locale for locale in locales if locale not in ready]
    return ready, waiting


def show_plan(scene: dict, as_json: bool, locale: str | None) -> None:
    """Plan one scene.

    Without --locale this plans every language that has text for the chapters the
    scene stages, and names the ones it skipped: a translation being behind is
    normal, and an inspection tool must not die of it. With --locale the language is
    a deliberate choice, so an untranslated one fails loudly instead.
    """
    if locale is not None:
        locales = [locale]
        waiting: list[str] = []
    else:
        locales, waiting = available_locales(scene)
    if not locales:
        raise SystemExit(f"no locale has text for scene {scene['id']!r} yet")
    plans = {locale: plan(scene, locale) for locale in locales}

    if as_json:
        print(json.dumps([plans[locale] for locale in locales], indent=2))
        return

    print(f"scene {scene['id']} \u00b7 progress ranges by locale\n")
    print("  shot".ljust(18) + "".join(locale.ljust(22) for locale in locales) + "overlap")
    for index, shot in enumerate(scene["shots"]):
        row = f"  {shot['id']}".ljust(18)
        for locale in locales:
            span = plans[locale]["shots"][index]
            row += f"{span['start']:.3f} \u2013 {span['end']:.3f}".ljust(22)
        # Overlap is progress-neutral, so it is not part of a plan; it is shown
        # beside one because this is the tool someone tuning a transition reaches
        # for, and the handovers are otherwise only visible in the JSON.
        overlap = shot.get("overlap")
        row += "\u2013" if overlap is None else f"{overlap:.2f} of the next shot"
        print(row)
    print()
    for locale in locales:
        entry = plans[locale]
        if entry["mean"] is None:
            print(f"  {locale}: no staged text; every beat holds for the minimum")
            continue
        print(
            f"  {locale}: {entry['characters']} characters staged, "
            f"{entry['mean']:.1f} per segment on average"
        )
    for locale in waiting:
        print(f"  {locale}: not translated this far yet, so it has no plan")
    print("\n  Character counts are an authoring statistic, not a reading-time unit:")
    print("  they are not comparable between writing systems, so they only ever")
    print("  appear as a ratio against this locale's own mean.")
    print("  Total scroll distance for the scene is art-directed and runtime-owned,")
    print("  one base distance shared by every locale. See docs/text-experience-binding.md.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "scene", nargs="?", help="scene id, as listed in experience/story.json"
    )
    parser.add_argument("--all", action="store_true", help="every scene in story order")
    parser.add_argument(
        "--locale",
        default=None,
        help=(
            "locale directory under text/locales/; defaults to the registry's "
            "baseLocale for text, and to every translated locale for --plan"
        ),
    )
    parser.add_argument("--plan", action="store_true", help="print progress ranges instead of text")
    parser.add_argument("--json", action="store_true", help="with --plan, emit JSON for the fixture")
    args = parser.parse_args()

    if args.all:
        if not args.plan:
            raise SystemExit("--all is for plans: pass --plan, and usually --json")
        plans = plans_for(every_scene())
        print(json.dumps(plans, indent=2) if args.json else plans)
        return 0

    if not args.scene:
        raise SystemExit("name a scene, or pass --all --plan --json")

    scene = find_scene(args.scene)
    if args.plan:
        show_plan(scene, args.json, args.locale)
    else:
        base = load(REPO_ROOT / "text" / "locales.json")["baseLocale"]
        show(scene, args.locale or base)
    return 0


if __name__ == "__main__":
    # Allow piping into head without a BrokenPipeError traceback.
    signal.signal(signal.SIGPIPE, signal.SIG_DFL)
    sys.exit(main())
