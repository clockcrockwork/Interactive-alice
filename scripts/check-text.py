#!/usr/bin/env python3
"""Validate the text layer: raw sources, chapter structures, and locale files.

Checks performed:
  * every structure and locale file matches its schema in schema/
  * every raw chapter file still matches the checksum recorded in its manifest
  * each chapter structure has unique, ascending segment ids and known sections
  * each locale file covers exactly the structure's sections and segments
  * every line of visible text is one short sentence within the locale's budget

Usage:
    python3 scripts/check-text.py [--quiet]
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from jsonschema_lite import validate  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = REPO_ROOT / "text" / "raw"
STORY_DIR = REPO_ROOT / "text" / "story"
LOCALES_DIR = REPO_ROOT / "text" / "locales"
LOCALES_CONFIG = REPO_ROOT / "text" / "locales.json"
SCHEMA_DIR = REPO_ROOT / "schema"

SEGMENT_ID = re.compile(r"^ch(\d{2})\.s(\d{4})$")
# A segment is one sentence, so terminal punctuation may only appear at the end.
SENTENCE_END = re.compile(r"[.!?。！？…]+[\"'’”）)]*$")
INTERNAL_END = re.compile(r"[.!?。！？](?=\s*\S)")
ABBREVIATION = re.compile(r"\b(Mr|Mrs|Ms|Dr|St)\.$")


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def check_raw(errors: list[str]) -> None:
    manifest_path = RAW_DIR / "manifest.json"
    if not manifest_path.exists():
        errors.append("text/raw/manifest.json is missing; run scripts/fetch-source-text.py")
        return
    manifest = load(manifest_path)
    for chapter in manifest["chapters"]:
        path = RAW_DIR / chapter["file"]
        if not path.exists():
            errors.append(f"raw chapter missing: {chapter['file']}")
            continue
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if digest != chapter["sha256"]:
            errors.append(
                f"raw chapter edited: {chapter['file']} no longer matches manifest.json. "
                "These files are read-only inputs; adapt the text in a locale file instead."
            )


def check_sentence(label: str, text: str, max_chars: int, errors: list[str], sentence: bool = True) -> None:
    """Check one line of visible text; titles are phrases, so they skip the sentence rules."""
    if text != text.strip():
        errors.append(f"{label}: leading or trailing whitespace")
    if "\n" in text:
        errors.append(f"{label}: contains a line break; one segment is one sentence")
    if len(text) > max_chars:
        errors.append(f"{label}: {len(text)} characters exceeds the locale budget of {max_chars}")
    if not sentence:
        return
    if not SENTENCE_END.search(text):
        errors.append(f"{label}: does not end with sentence punctuation")
    internal = [m for m in INTERNAL_END.finditer(text) if not ABBREVIATION.search(text[: m.end()])]
    if internal:
        # Repeated exclamations of the same short cry are allowed ("Thump! Thump!").
        if len(text) > 40:
            errors.append(f"{label}: looks like more than one sentence; split it into two segments")


def check_chapter(structure_path: Path, config: dict, errors: list[str], notes: list[str]) -> None:
    structure = load(structure_path)
    schema_errors = validate(
        structure, load(SCHEMA_DIR / "chapter-structure.schema.json"), structure_path.name
    )
    if schema_errors:
        # The checks below assume the file is shaped correctly.
        errors += schema_errors
        return
    chapter = structure["chapter"]
    prefix = f"ch{chapter:02d}"

    section_ids = [section["id"] for section in structure["sections"]]
    if len(set(section_ids)) != len(section_ids):
        errors.append(f"{structure_path.name}: duplicate section ids")

    seen: list[int] = []
    for segment in structure["segments"]:
        match = SEGMENT_ID.match(segment["id"])
        if not match or match.group(1) != f"{chapter:02d}":
            errors.append(f"{structure_path.name}: bad segment id {segment['id']!r}")
            continue
        number = int(match.group(2))
        if seen and number <= seen[-1]:
            errors.append(f"{structure_path.name}: segment {segment['id']} is out of order")
        seen.append(number)
        if segment["section"] not in section_ids:
            errors.append(f"{structure_path.name}: {segment['id']} names unknown section {segment['section']!r}")
        if segment["kind"] in ("dialogue", "thought") and "speaker" not in segment:
            errors.append(f"{structure_path.name}: {segment['id']} is {segment['kind']} but has no speaker")

    structure_segments = [segment["id"] for segment in structure["segments"]]

    for locale, settings in config["locales"].items():
        path = LOCALES_DIR / locale / f"{prefix}.json"
        if not path.exists():
            notes.append(f"{locale}: {prefix} not translated yet")
            continue
        doc = load(path)
        label = f"{locale}/{prefix}.json"
        schema_errors = validate(doc, load(SCHEMA_DIR / "locale-chapter.schema.json"), label)
        if schema_errors:
            errors += schema_errors
            continue
        if doc["locale"] != locale:
            errors.append(f"{label}: locale field says {doc['locale']!r}")
        if doc["chapter"] != chapter:
            errors.append(f"{label}: chapter field says {doc['chapter']!r}")

        for section in (s for s in section_ids if s not in doc["sections"]):
            errors.append(f"{label}: missing section title {section}")
        for section in (s for s in doc["sections"] if s not in section_ids):
            errors.append(f"{label}: unknown section {section}")

        missing = [s for s in structure_segments if s not in doc["segments"]]
        extra = [s for s in doc["segments"] if s not in structure_segments]
        if missing:
            errors.append(f"{label}: {len(missing)} untranslated segments, first is {missing[0]}")
        for segment_id in extra:
            errors.append(f"{label}: {segment_id} is not in the chapter structure")

        if list(doc["segments"]) != [s for s in structure_segments if s in doc["segments"]]:
            errors.append(f"{label}: segments are not in structure order")

        budget = settings["maxChars"]
        check_sentence(f"{label} title", doc["title"], budget, errors, sentence=False)
        for segment_id, text in doc["segments"].items():
            check_sentence(f"{label} {segment_id}", text, budget, errors)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--quiet", action="store_true", help="print only problems")
    args = parser.parse_args()

    config = load(LOCALES_CONFIG)
    errors: list[str] = []
    notes: list[str] = []

    check_raw(errors)

    structures = sorted(STORY_DIR.glob("ch*.structure.json"))
    if not structures:
        errors.append("no chapter structure files found in text/story/")
    for structure_path in structures:
        check_chapter(structure_path, config, errors, notes)

    for note in notes:
        if not args.quiet:
            print(f"todo: {note}")
    for error in errors:
        print(f"error: {error}", file=sys.stderr)

    if errors:
        print(f"\n{len(errors)} problem(s) found", file=sys.stderr)
        return 1
    if not args.quiet:
        print(f"ok: {len(structures)} chapter(s), {len(config['locales'])} locale(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
