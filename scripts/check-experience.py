#!/usr/bin/env python3
"""Validate the experience layer's references into the text layer.

The experience layer plans composition: Story -> Scene -> Shot -> Beat, where a
Beat names the narrative segments it carries. This checker guards the boundary
between the two layers rather than the staging itself:

  * every scene listed in experience/story.json exists and agrees on its id
  * shot and beat ids are unique inside a scene
  * every referenced segment id exists in the chapter structure
  * a segment is referenced at most once in the whole story
  * references never run backwards against the text's reading order
  * experience files carry no visible or localized text
  * text files carry no experience concepts

Segments a scene skips are reported as todo lines, not errors: a beat may be
pure staging, and a chapter is mapped scene by scene.

Usage:
    python3 scripts/check-experience.py [--quiet]
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
STORY_FILE = REPO_ROOT / "experience" / "story.json"
STRUCTURE_DIR = REPO_ROOT / "text" / "story"
TEXT_DIR = REPO_ROOT / "text"

SCENE_KEYS = {"id", "devLabel", "chapter", "shots"}
SHOT_KEYS = {"id", "devLabel", "beats"}
BEAT_KEYS = {"id", "devLabel", "segments"}
# Keys that would mean visible text had leaked into the experience layer.
TEXT_KEYS = {"text", "title", "label", "caption", "locale", "translations", "strings"}
# Keys that would mean composition had leaked into the text layer.
EXPERIENCE_KEYS = {"scene", "scenes", "shot", "shots", "beat", "beats"}


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def structure_order(chapter: int, errors: list[str]) -> list[str]:
    path = STRUCTURE_DIR / f"ch{chapter:02d}.structure.json"
    if not path.exists():
        errors.append(f"chapter {chapter} has no structure file at {path.relative_to(REPO_ROOT)}")
        return []
    return [segment["id"] for segment in load(path)["segments"]]


def check_keys(label: str, obj: dict, allowed: set[str], errors: list[str]) -> None:
    for key in obj:
        if key in TEXT_KEYS:
            errors.append(
                f"{label}: key {key!r} looks like visible text. "
                "The experience layer references segment ids; text lives in text/locales/."
            )
        elif key not in allowed:
            errors.append(f"{label}: unexpected key {key!r}")
    if "devLabel" in obj and not obj["devLabel"].isascii():
        errors.append(f"{label}: devLabel must stay ASCII; it is a debug label, not translated text")


def check_text_layer(errors: list[str]) -> None:
    """The text layer must not know how anything is staged."""
    for path in sorted(STRUCTURE_DIR.glob("*.json")) + sorted(TEXT_DIR.glob("locales/*/*.json")):
        for key in EXPERIENCE_KEYS & set(load(path)):
            errors.append(
                f"{path.relative_to(REPO_ROOT)}: key {key!r} is an experience concept. "
                "Scene, shot and beat composition belongs in experience/."
            )


def check_scene(entry: dict, owners: dict[str, str], errors: list[str], notes: list[str]) -> None:
    path = REPO_ROOT / entry["file"]
    if not path.exists():
        errors.append(f"story.json lists a missing scene file: {entry['file']}")
        return

    scene = load(path)
    label = entry["file"]
    check_keys(label, scene, SCENE_KEYS, errors)

    if scene.get("id") != entry["id"]:
        errors.append(f"{label}: scene id {scene.get('id')!r} does not match story.json entry {entry['id']!r}")

    chapter = scene["chapter"]
    order = structure_order(chapter, errors)
    position = {segment_id: index for index, segment_id in enumerate(order)}
    prefix = f"ch{chapter:02d}."

    shot_ids: set[str] = set()
    beat_ids: set[str] = set()
    referenced: list[str] = []

    for shot in scene["shots"]:
        check_keys(f"{label} shot {shot.get('id')}", shot, SHOT_KEYS, errors)
        if shot["id"] in shot_ids:
            errors.append(f"{label}: duplicate shot id {shot['id']!r}")
        shot_ids.add(shot["id"])

        for beat in shot["beats"]:
            beat_label = f"{label} {shot['id']}/{beat.get('id')}"
            check_keys(beat_label, beat, BEAT_KEYS, errors)
            if beat["id"] in beat_ids:
                errors.append(f"{label}: duplicate beat id {beat['id']!r}")
            beat_ids.add(beat["id"])

            for segment_id in beat["segments"]:
                if not segment_id.startswith(prefix):
                    errors.append(f"{beat_label}: {segment_id} is not from chapter {chapter}")
                elif segment_id not in position:
                    errors.append(f"{beat_label}: {segment_id} does not exist in the chapter structure")
                elif segment_id in owners:
                    errors.append(
                        f"{beat_label}: {segment_id} is already carried by {owners[segment_id]}; "
                        "a segment belongs to one beat"
                    )
                else:
                    owners[segment_id] = beat_label
                    referenced.append(segment_id)

    indexes = [position[segment_id] for segment_id in referenced]
    for earlier, later in zip(indexes, indexes[1:]):
        if later < earlier:
            errors.append(
                f"{label}: {order[later]} is staged after {order[earlier]} but comes earlier in the text"
            )

    if indexes:
        skipped = [
            order[index]
            for index in range(min(indexes), max(indexes) + 1)
            if index not in set(indexes)
        ]
        if skipped:
            notes.append(f"{label}: {len(skipped)} segment(s) inside its range are unstaged, first is {skipped[0]}")
        notes.append(
            f"{label}: stages {len(indexes)} segment(s), {order[min(indexes)]} to {order[max(indexes)]}"
        )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--quiet", action="store_true", help="print only problems")
    args = parser.parse_args()

    errors: list[str] = []
    notes: list[str] = []

    if not STORY_FILE.exists():
        print(f"error: {STORY_FILE.relative_to(REPO_ROOT)} is missing", file=sys.stderr)
        return 1

    story = load(STORY_FILE)
    seen_scenes: set[str] = set()
    owners: dict[str, str] = {}

    for entry in story["scenes"]:
        if entry["id"] in seen_scenes:
            errors.append(f"story.json: duplicate scene id {entry['id']!r}")
        seen_scenes.add(entry["id"])
        check_scene(entry, owners, errors, notes)

    check_text_layer(errors)

    for note in notes:
        if not args.quiet:
            print(f"todo: {note}")
    for error in errors:
        print(f"error: {error}", file=sys.stderr)

    if errors:
        print(f"\n{len(errors)} problem(s) found", file=sys.stderr)
        return 1
    if not args.quiet:
        print(f"ok: {len(seen_scenes)} scene(s), {len(owners)} segment reference(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
