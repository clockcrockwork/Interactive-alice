#!/usr/bin/env python3
"""Validate the experience layer's references into the text layer.

The experience layer plans composition: Story -> Scene -> Shot -> Beat, where a
Beat names the narrative segments it carries. This checker guards the boundary
between the two layers rather than the staging itself:

  * every file matches its schema in schema/
  * every scene listed in experience/story.json exists and agrees on its id
  * when documents (parts) are declared, each scene belongs to exactly one, in order
  * shot and beat ids are unique inside a scene
  * every referenced segment id exists in some chapter structure
  * a segment is referenced at most once in the whole story
  * references never run backwards against the text's reading order, across
    scene boundaries as well as inside one scene
  * experience files carry no visible or localized text
  * text files carry no experience concepts, at any nesting level

Segments no scene stages are reported as todo lines, not errors: a beat may be
pure staging, and a chapter is mapped scene by scene.

Usage:
    python3 scripts/check-experience.py [--quiet]
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from jsonschema_lite import validate  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parent.parent
STORY_FILE = REPO_ROOT / "experience" / "story.json"
SCHEMA_DIR = REPO_ROOT / "schema"
STRUCTURE_DIR = REPO_ROOT / "text" / "story"
TEXT_DIR = REPO_ROOT / "text"

# Keys that would mean visible text had leaked into the experience layer.
TEXT_KEYS = {"text", "title", "caption", "locale", "translations", "strings"}
# Keys that would mean composition had leaked into the text layer.
EXPERIENCE_KEYS = {"scene", "scenes", "shot", "shots", "beat", "beats"}


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def chapter_of(segment_id: str) -> int:
    return int(segment_id[2:4])


def reading_order(chapter: int, cache: dict[int, list[str]], errors: list[str]) -> list[str]:
    """Segment ids of one chapter in reading order, loaded once."""
    if chapter not in cache:
        path = STRUCTURE_DIR / f"ch{chapter:02d}.structure.json"
        if not path.exists():
            errors.append(f"chapter {chapter} is referenced but has no structure file")
            cache[chapter] = []
        else:
            cache[chapter] = [segment["id"] for segment in load(path)["segments"]]
    return cache[chapter]


def forbidden_keys(value, forbidden: set[str], label: str, problems: list[str]) -> None:
    """Report forbidden keys anywhere in a document, not only at the top level."""
    if isinstance(value, dict):
        for key, child in value.items():
            if key in forbidden:
                problems.append(f"{label}: key {key!r} belongs to the other layer")
            forbidden_keys(child, forbidden, f"{label}.{key}", problems)
    elif isinstance(value, list):
        for index, item in enumerate(value):
            forbidden_keys(item, forbidden, f"{label}[{index}]", problems)


def check_text_layer(errors: list[str]) -> None:
    """The text layer must not know how anything is staged."""
    for path in sorted(STRUCTURE_DIR.glob("*.json")) + sorted(TEXT_DIR.glob("locales/*/*.json")):
        problems: list[str] = []
        forbidden_keys(load(path), EXPERIENCE_KEYS, path.relative_to(REPO_ROOT).as_posix(), problems)
        for problem in problems:
            errors.append(f"{problem}. Scene, shot and beat composition belongs in experience/.")


def check_parts(story: dict, errors: list[str]) -> None:
    """Documents group scenes. Flattened, they must be exactly the story's scenes, in order."""
    parts = story.get("parts")
    if not parts:
        # The schema requires parts; this only runs if schema validation was skipped.
        errors.append("story.json: parts are required, so every scene has a document")
        return

    order = [entry["id"] for entry in story["scenes"]]
    flattened = [scene_id for part in parts for scene_id in part["scenes"]]

    seen_parts: set[str] = set()
    for part in parts:
        if part["id"] in seen_parts:
            errors.append(f"story.json: duplicate part id {part['id']!r}")
        seen_parts.add(part["id"])

    # Specific diagnostics first, because "not equal" alone is hard to act on.
    for scene_id in flattened:
        if scene_id not in order:
            errors.append(f"story.json: parts name unknown scene {scene_id!r}")
    for scene_id in order:
        count = flattened.count(scene_id)
        if count == 0:
            errors.append(f"story.json: scene {scene_id!r} is in no part, so it has no page")
        elif count > 1:
            errors.append(f"story.json: scene {scene_id!r} is in {count} parts; it belongs to one")

    # Then the whole contract in one comparison: same scenes, same order, no extras.
    if flattened != order and not errors:
        errors.append(
            "story.json: the parts' scenes are not the story's scenes in order: "
            f"{flattened} against {order}"
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
    story_schema = load(SCHEMA_DIR / "experience-story.schema.json")
    scene_schema = load(SCHEMA_DIR / "experience-scene.schema.json")

    errors += validate(story, story_schema, "experience/story.json")
    if errors:
        # Later checks assume the file is shaped correctly.
        for error in errors:
            print(f"error: {error}", file=sys.stderr)
        return 1

    chapters: dict[int, list[str]] = {}
    owners: dict[str, str] = {}
    seen_scenes: set[str] = set()
    stream: list[tuple[tuple[int, int], str, str]] = []

    for entry in story["scenes"]:
        label = entry["file"]
        if entry["id"] in seen_scenes:
            errors.append(f"story.json: duplicate scene id {entry['id']!r}")
        seen_scenes.add(entry["id"])

        path = REPO_ROOT / label
        if not path.exists():
            errors.append(f"story.json lists a missing scene file: {label}")
            continue

        scene = load(path)
        scene_errors = validate(scene, scene_schema, label)
        forbidden_keys(scene, TEXT_KEYS, label, scene_errors)
        if scene_errors:
            errors += scene_errors
            continue

        if scene["id"] != entry["id"]:
            errors.append(f"{label}: scene id {scene['id']!r} does not match story.json entry {entry['id']!r}")

        shot_ids: set[str] = set()
        beat_ids: set[str] = set()

        for shot in scene["shots"]:
            if shot["id"] in shot_ids:
                errors.append(f"{label}: duplicate shot id {shot['id']!r}")
            shot_ids.add(shot["id"])

            for beat in shot["beats"]:
                where = f"{label} {shot['id']}/{beat['id']}"
                if beat["id"] in beat_ids:
                    errors.append(f"{label}: duplicate beat id {beat['id']!r}")
                beat_ids.add(beat["id"])

                for segment_id in beat["segments"]:
                    chapter = chapter_of(segment_id)
                    order = reading_order(chapter, chapters, errors)
                    if segment_id not in order:
                        errors.append(f"{where}: {segment_id} does not exist in the chapter structure")
                    elif segment_id in owners:
                        errors.append(
                            f"{where}: {segment_id} is already carried by {owners[segment_id]}; "
                            "a segment belongs to one beat"
                        )
                    else:
                        owners[segment_id] = where
                        stream.append(((chapter, order.index(segment_id)), segment_id, where))

        # Shot and beat ids share one namespace for anything that addresses a unit,
        # so a shot and a beat in the same scene must not answer to the same name.
        for clash in sorted(shot_ids & beat_ids):
            errors.append(
                f"{label}: {clash!r} is both a shot id and a beat id; "
                "give one of them another name"
            )

    # Reading order must hold across the whole story, in story.json scene order.
    for (earlier_key, earlier_id, _), (later_key, later_id, later_where) in zip(stream, stream[1:]):
        if later_key < earlier_key:
            errors.append(
                f"{later_where}: {later_id} is staged after {earlier_id} but comes earlier in the text"
            )

    check_parts(story, errors)
    check_text_layer(errors)

    for chapter in sorted(chapters):
        order = reading_order(chapter, chapters, errors)
        staged = [segment_id for segment_id in order if segment_id in owners]
        if not order:
            continue
        unstaged = len(order) - len(staged)
        notes.append(
            f"chapter {chapter}: {len(staged)} of {len(order)} segments staged"
            + (f", {unstaged} not in any scene yet" if unstaged else "")
        )

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
