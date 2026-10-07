#!/usr/bin/env python3
"""Validate the experience layer's references into the text layer.

The experience layer plans composition: Story -> Scene -> Shot -> Beat, where a
Beat names the narrative segments it carries. This checker guards the boundary
between the two layers rather than the staging itself:

  * every file matches its schema in schema/
  * every scene listed in experience/story.json exists and agrees on its id
  * when documents (parts) are declared, each scene belongs to exactly one, in order
  * shot and beat ids are unique inside their own namespace in a scene; a shot and a
    beat may share a name, since a beat is addressed as scene/shot/beat
  * only a shot with a following shot may declare an overlap to hand over to it
  * every referenced segment id exists in some chapter structure
  * a segment is referenced at most once in the whole story
  * references never run backwards against the text's reading order, across
    scene boundaries as well as inside one scene
  * experience files carry no visible or localized text
  * text files carry no experience concepts, at any nesting level, and no realia
    id names a demo
  * every concept demo file matches its schema; the segments its `reads` names are
    segments it stages, and its `realia` ids exist in the base locale's realia
  * the staging contract: in every locale that publishes a demo, each segment its
    `reads` names gives the stage what it reads, by that locale's profile in
    text/locales.json (a word set apart by the locale's own methods, a letter named
    as a letter, a moral after a colon, a noise of kind sound)

Segments no scene stages are reported as todo lines, not errors: a beat may be
pure staging, and a chapter is mapped scene by scene.

Usage:
    python3 scripts/check-experience.py [--quiet]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from jsonschema_lite import validate  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parent.parent
STORY_FILE = REPO_ROOT / "experience" / "story.json"
SCHEMA_DIR = REPO_ROOT / "schema"
STRUCTURE_DIR = REPO_ROOT / "text" / "story"
TEXT_DIR = REPO_ROOT / "text"
DEMO_DIR = REPO_ROOT / "experience" / "demos"

# Keys that would mean visible text had leaked into the experience layer.
TEXT_KEYS = {"text", "title", "caption", "locale", "translations", "strings"}
# Keys that would mean composition had leaked into the text layer.
EXPERIENCE_KEYS = {"scene", "scenes", "shot", "shots", "beat", "beats", "demo", "demos", "cue", "cues"}


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


def check_text_layer(errors: list[str], demo_ids: set[str]) -> None:
    """The text layer must not know how anything is staged.

    Realia name things a sentence is about, keyed by their own ids; an id that is a
    demo's id would be the text layer addressing a stage, which is the other way round.
    """
    for path in sorted(STRUCTURE_DIR.glob("*.json")) + sorted(TEXT_DIR.glob("locales/*/*.json")):
        problems: list[str] = []
        doc = load(path)
        label = path.relative_to(REPO_ROOT).as_posix()
        forbidden_keys(doc, EXPERIENCE_KEYS, label, problems)
        if path.name == "realia.json" and isinstance(doc.get("realia"), dict):
            for key in doc["realia"]:
                if key in demo_ids:
                    problems.append(f"{label}: realia id {key!r} is a demo's id")
        for problem in problems:
            errors.append(f"{problem}. Scene, shot and beat composition belongs in experience/.")


# --- The staging contract (docs/text-experience-binding.md, Language differences).
# The same rules as gateRuns and gateLetters in src/demos/shell/words.ts, which a
# unit test holds to this implementation. They are stricter than the stage's own
# readings on purpose, so that whatever passes here the stage finds.

OPEN = "「『“‘«‹„\""
CLOSE = "」』”’»›“\""


def quoted(text: str) -> list[str]:
    """Every run of words a sentence puts inside quotation marks, in order."""
    found: list[str] = []
    i = 0
    while i < len(text):
        which = OPEN.find(text[i])
        if which < 0:
            i += 1
            continue
        end = text.find(CLOSE[which], i + 1)
        if end < 0:
            i += 1
            continue
        inside = text[i + 1 : end].strip()
        if inside:
            found.append(inside)
        i = end + 1
    return found


def graphemes(text: str) -> int:
    """User-perceived characters, near enough: base characters, not their marks."""
    joiners = {"\u200d", "\ufe0e", "\ufe0f"}
    return sum(
        1 for char in text if not unicodedata.category(char).startswith("M") and char not in joiners
    )


# A maximal run of letters and digits: what \p{L}/\p{N} boundaries delimit.
WORD = re.compile(r"[^\W_]+")


def is_punctuation(char: str) -> bool:
    return unicodedata.category(char).startswith("P")


def gate_runs(text: str, methods: list[str]) -> list[str]:
    """Runs set apart by the locale's methods: any quoted run; for capitals, a word of
    capitals only (two letters or more), or a capitalised word of five letters or more
    that does not open the sentence."""
    runs: list[str] = []
    for method in methods:
        if method == "quotes":
            runs += quoted(text)
            continue
        words = list(WORD.finditer(text))
        opening = words[0].start() if words else -1
        for match in words:
            word = match.group()
            letters = [char for char in word if char.isalpha()]
            if len(letters) != len(word):
                continue
            if len(word) >= 2 and all(char.isupper() for char in word):
                runs.append(word)
            elif (
                len(word) >= 5
                and word[0].isupper()
                and all(char.islower() for char in word[1:])
                and match.start() != opening
            ):
                runs.append(word)
    return runs


def gate_letters(text: str, methods: list[str]) -> list[str]:
    """Letters named as letters: a quoted run of one grapheme; for capitals, a capital
    standing alone just before punctuation or the end ("with an M.")."""
    found: list[str] = []
    for method in methods:
        if method == "quotes":
            found += [run for run in quoted(text) if graphemes(run) == 1]
            continue
        for match in WORD.finditer(text):
            word = match.group()
            if len(word) != 1 or not word.isupper():
                continue
            rest = text[match.end() :].lstrip()
            if rest == "" or is_punctuation(rest[0]):
                found.append(word)
    return found


MORAL = re.compile(r"[:：]\s*\S")


def read_problem(kind: str, text: str, segment: dict, methods: list[str]) -> str | None:
    """Why a segment does not give the stage what its demo reads from it, or None."""
    if kind == "setApart" and not gate_runs(text, methods):
        return f"sets no word apart by its locale's methods ({', '.join(methods)})"
    if kind == "letter" and not gate_letters(text, methods):
        return f"names no single letter by its locale's methods ({', '.join(methods)})"
    if kind == "moral" and not MORAL.search(text):
        return "has no colon (of either width) followed by words"
    if kind == "sound":
        if segment.get("kind") != "sound":
            return f"is of kind {segment.get('kind')!r} in the structure, not 'sound'"
        if not text.strip():
            return "is empty"
    return None


def check_demos(errors: list[str], notes: list[str]) -> set[str]:
    """Every concept demo file, and its staging contract in every locale that publishes it.

    A demo is published in a locale when its title and every segment it stages have
    text there (isPublishable in build/demos.ts); a locale that does not publish it
    yet is a todo, not an error. Returns the demo ids, for the text-layer check.
    """
    schema = load(SCHEMA_DIR / "experience-demo.schema.json")
    registry = load(TEXT_DIR / "locales.json")
    base = registry["baseLocale"]
    base_realia_path = TEXT_DIR / "locales" / base / "realia.json"
    base_realia = load(base_realia_path)["realia"] if base_realia_path.exists() else {}
    structure: dict[str, dict] = {}
    for path in sorted(STRUCTURE_DIR.glob("ch*.structure.json")):
        for segment in load(path)["segments"]:
            structure[segment["id"]] = segment
    texts: dict[tuple[str, str], dict | None] = {}

    def chapter_text(locale: str, chapter: int) -> dict | None:
        key = (locale, f"ch{chapter:02d}")
        if key not in texts:
            path = TEXT_DIR / "locales" / locale / f"{key[1]}.json"
            texts[key] = load(path) if path.exists() else None
        return texts[key]

    ids: set[str] = set()
    for path in sorted(DEMO_DIR.glob("*.demo.json")):
        label = path.relative_to(REPO_ROOT).as_posix()
        demo = load(path)
        demo_errors = validate(demo, schema, label)
        forbidden_keys(demo, TEXT_KEYS, label, demo_errors)
        if demo_errors:
            errors += demo_errors
            continue
        ids.add(demo["id"])
        staged = [s for shot in demo["shots"] for beat in shot["beats"] for s in beat["segments"]]
        for segment_id in staged:
            if segment_id not in structure:
                errors.append(f"{label}: {segment_id} does not exist in the chapter structure")
        for realia_id in demo.get("realia", []):
            if realia_id not in base_realia:
                errors.append(
                    f"{label}: reads realia {realia_id!r}, which {base}/realia.json does not have"
                )
        reads = demo.get("reads", {})
        for kind, segment_ids in reads.items():
            for segment_id in segment_ids:
                if segment_id not in staged:
                    errors.append(
                        f"{label}: reads.{kind} names {segment_id}, which this demo does not stage"
                    )

        for locale, settings in registry["locales"].items():
            title_text = chapter_text(locale, demo["titleChapter"])
            if title_text is None:
                title = ""
            elif "titleSection" in demo:
                title = title_text["sections"].get(demo["titleSection"], "")
            else:
                title = title_text["title"]
            lines = {}
            for segment_id in staged:
                text = chapter_text(locale, chapter_of(segment_id))
                if text is not None and segment_id in text["segments"]:
                    lines[segment_id] = text["segments"][segment_id]
            if not title or len(lines) != len(staged):
                if reads:
                    notes.append(f"{locale}: {demo['id']} is not published yet, so its reads are unchecked")
                continue
            for kind, segment_ids in reads.items():
                for segment_id in segment_ids:
                    if segment_id not in lines or segment_id not in structure:
                        continue
                    problem = read_problem(
                        kind, lines[segment_id], structure[segment_id], settings["setApart"]
                    )
                    if problem:
                        errors.append(
                            f"{locale} {segment_id}: {demo['id']} reads it as {kind}, but it "
                            f"{problem}. Fix the text, or the demo's reads."
                        )
    return ids


def check_shots(scene: dict, label: str, errors: list[str]) -> None:
    """Rules about a scene's shots that a JSON Schema cannot state.

    The schema owns each field's type and range. What it cannot say is anything
    positional, and there is one such rule: an overlap is a handover, so the shot
    with nothing after it has nothing to hand over to and may not declare one at
    all. Not "may not declare a non-zero one": a mapping that says `"overlap": 0`
    there is saying something it cannot mean, and the build refuses it on the same
    terms.

    Separate from main() so the runtime's own tests can run this rule rather than
    restate it; see src/runtime/pacing.test.ts.
    """
    shot_ids: set[str] = set()
    last_shot = len(scene["shots"]) - 1

    for index, shot in enumerate(scene["shots"]):
        if shot["id"] in shot_ids:
            errors.append(f"{label}: duplicate shot id {shot['id']!r}")
        shot_ids.add(shot["id"])

        if index == last_shot and "overlap" in shot:
            errors.append(
                f"{label}: the last shot {shot['id']!r} declares an overlap, "
                "but it has no following shot to hand over to"
            )


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

        beat_ids: set[str] = set()
        check_shots(scene, label, errors)

        for shot in scene["shots"]:
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

    # Reading order must hold across the whole story, in story.json scene order.
    for (earlier_key, earlier_id, _), (later_key, later_id, later_where) in zip(stream, stream[1:]):
        if later_key < earlier_key:
            errors.append(
                f"{later_where}: {later_id} is staged after {earlier_id} but comes earlier in the text"
            )

    check_parts(story, errors)
    demo_ids = check_demos(errors, notes)
    check_text_layer(errors, demo_ids)

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
        print(
            f"ok: {len(seen_scenes)} scene(s), {len(owners)} segment reference(s), "
            f"{len(demo_ids)} demo(s) with their staging contracts"
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
