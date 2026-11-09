#!/usr/bin/env python3
"""Validate the text layer: raw sources, chapter structures, and locale files.

Checks performed:
  * every registry, structure and locale file matches its schema in schema/
  * every locale has complete UI copy: the site's own words are never half translated
  * every locale has its realia (the things its sentences are about, which a stage
    draws or measures) with every id the base locale's has, in the same shape
  * every raw chapter file still matches the checksum recorded in its manifest
  * each chapter structure has unique, ascending segment ids, known sections, and
    speakers that exist in the character registry
  * each locale file covers exactly the structure's sections and segments
  * every line of visible text stays inside the locale's budget and ends a sentence

Segments holding more than one sentence are reported as todo rather than as
errors: a repeated cry is deliberately one segment, but a scene that animates
per sentence needs to know which ones they are.

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
CHARACTERS = REPO_ROOT / "text" / "characters.json"
SCHEMA_DIR = REPO_ROOT / "schema"

SEGMENT_ID = re.compile(r"^ch(\d{2})\.s(\d{4})$")
# A segment is one sentence, so terminal punctuation may only appear at the end.
SENTENCE_END = re.compile(r"[.!?。！？…]+[\"'’”）)]*$")
INTERNAL_END = re.compile(r"[.!?。！？](?=\s*\S)")
ABBREVIATION = re.compile(r"\b(Mr|Mrs|Ms|Dr|St)\.$")


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def check_registry(config: dict, errors: list[str]) -> None:
    """The registry's own integrity, beyond what the schema can say.

    The schema can require a `baseLocale` string and a `role` enum, but not that the
    two agree. Without this check a typo in `baseLocale` names a language that does
    not exist, and the rule that missing base text is a hard error quietly stops
    applying to anything.
    """
    locales = config["locales"]
    base = config["baseLocale"]
    if base not in locales:
        errors.append(
            f"text/locales.json: baseLocale {base!r} is not one of the locales "
            f"({', '.join(sorted(locales))})"
        )
    elif locales[base]["role"] != "base":
        errors.append(
            f"text/locales.json: baseLocale {base!r} has role "
            f"{locales[base]['role']!r}, not 'base'"
        )
    declared = sorted(name for name, settings in locales.items() if settings["role"] == "base")
    if len(declared) != 1:
        errors.append(
            "text/locales.json: exactly one locale may have role 'base', "
            f"but {len(declared)} do ({', '.join(declared) or 'none'})"
        )


def check_ui(config: dict, errors: list[str]) -> None:
    """Every locale's UI copy, in full.

    Chapter text may be behind; the words the site says about itself may not. A
    locale entry page exists for every registered language, and a page that cannot
    explain why a part is missing is worse than no page.
    """
    schema = load(SCHEMA_DIR / "ui-strings.schema.json")
    for locale, settings in config["locales"].items():
        path = LOCALES_DIR / locale / "ui.json"
        label = f"{locale}/ui.json"
        if not path.exists():
            errors.append(f"{label} is missing; every locale needs its UI copy")
            continue
        doc = load(path)
        schema_errors = validate(doc, schema, label)
        if schema_errors:
            errors += schema_errors
            continue
        if doc["locale"] != locale:
            errors.append(f"{label}: locale field says {doc['locale']!r}")
        budget = settings["maxChars"]
        for key, text in doc["strings"].items():
            # A label is not a sentence, so the sentence rules do not apply; the
            # per-locale budget still does, because it is a width budget.
            if len(text) > budget:
                errors.append(f"{label} {key}: {len(text)} characters, budget is {budget}")
            if text != text.strip():
                errors.append(f"{label} {key}: has leading or trailing space")


def shape(value) -> str:
    """A realia entry's shape, for comparing one locale's against the base locale's."""
    if isinstance(value, list):
        inner = sorted({key for item in value if isinstance(item, dict) for key in item})
        return f"a list of {{{', '.join(inner)}}}"
    if isinstance(value, dict):
        return f"{{{', '.join(sorted(value))}}}"
    return type(value).__name__


def check_realia(config: dict, errors: list[str]) -> None:
    """Every locale's realia, in full, shaped as the base locale's.

    Realia are the things a joke or a sentence is about (the thing the Cat hears
    instead of a pig, the things that begin with the sisters' letter, the measure of
    Alice's height), which a stage draws or measures. Like the UI copy they are
    required for every locale, because a stage that reads one must find it in every
    language: a list stays a list (its length is the language's own), an object keeps
    its keys, and every id the base locale defines is there.
    """
    schema = load(SCHEMA_DIR / "realia.schema.json")
    base = config["baseLocale"]
    docs: dict[str, dict] = {}
    for locale in config["locales"]:
        path = LOCALES_DIR / locale / "realia.json"
        label = f"{locale}/realia.json"
        if not path.exists():
            errors.append(f"{label} is missing; every locale needs its realia, like its UI copy")
            continue
        doc = load(path)
        schema_errors = validate(doc, schema, label)
        if schema_errors:
            errors += schema_errors
            continue
        if doc["locale"] != locale:
            errors.append(f"{label}: locale field says {doc['locale']!r}")
        docs[locale] = doc["realia"]
    reference = docs.get(base)
    if reference is None:
        return
    for locale, realia in docs.items():
        label = f"{locale}/realia.json"
        for key in reference:
            if key not in realia:
                errors.append(f"{label}: missing {key!r}, which {base} defines")
            elif shape(realia[key]) != shape(reference[key]):
                errors.append(
                    f"{label} {key}: is {shape(realia[key])}, but {base}'s is {shape(reference[key])}"
                )
        for key in realia:
            if key not in reference:
                errors.append(f"{label}: {key!r} is not an id {base} defines")
        marks = realia.get("marks")
        if isinstance(marks, dict) and marks.get("yes") == marks.get("no"):
            errors.append(f"{label} marks: yes and no are both {marks.get('yes')!r}; a reader "
                          "must tell them apart")


def check_profile(config: dict, errors: list[str]) -> None:
    """The locale profile's own integrity, beyond what the schema can say."""
    for locale, settings in config["locales"].items():
        methods = settings["setApart"]
        if len(set(methods)) != len(methods):
            errors.append(f"text/locales.json {locale}: setApart names a method twice")


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


def check_sentence(
    label: str,
    text: str,
    max_chars: int,
    errors: list[str],
    notes: list[str],
    sentence: bool = True,
) -> None:
    """Check one line of visible text; titles are phrases, so they skip the sentence rules."""
    if text != text.strip():
        errors.append(f"{label}: leading or trailing whitespace")
    if "  " in text:
        errors.append(f"{label}: double space; spacing inside a segment is content, so keep it single")
    if "\n" in text:
        errors.append(f"{label}: contains a line break; a segment is one line of text")
    if len(text) > max_chars:
        errors.append(f"{label}: {len(text)} characters exceeds the locale budget of {max_chars}")
    if not sentence:
        return
    if not SENTENCE_END.search(text):
        errors.append(f"{label}: does not end with sentence punctuation")
    internal = [m for m in INTERNAL_END.finditer(text) if not ABBREVIATION.search(text[: m.end()])]
    if internal:
        notes.append(f"{label}: holds {len(internal) + 1} sentences")


def check_chapter(
    structure_path: Path,
    config: dict,
    characters: set[str],
    errors: list[str],
    notes: list[str],
) -> None:
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
        if "speaker" in segment and segment["speaker"] not in characters:
            errors.append(
                f"{structure_path.name}: {segment['id']} names speaker {segment['speaker']!r}, "
                "which is not in text/characters.json"
            )

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
        check_sentence(f"{label} title", doc["title"], budget, errors, notes, sentence=False)
        for segment_id, text in doc["segments"].items():
            check_sentence(f"{label} {segment_id}", text, budget, errors, notes)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--quiet", action="store_true", help="print only problems")
    args = parser.parse_args()

    config = load(LOCALES_CONFIG)
    characters_doc = load(CHARACTERS)
    errors: list[str] = []
    notes: list[str] = []

    errors += validate(config, load(SCHEMA_DIR / "locales.schema.json"), "text/locales.json")
    errors += validate(characters_doc, load(SCHEMA_DIR / "characters.schema.json"), "text/characters.json")
    if errors:
        for error in errors:
            print(f"error: {error}", file=sys.stderr)
        return 1
    characters = {character["id"] for character in characters_doc["characters"]}

    check_registry(config, errors)
    check_ui(config, errors)
    check_profile(config, errors)
    check_realia(config, errors)
    check_raw(errors)

    structures = sorted(STORY_DIR.glob("ch*.structure.json"))
    if not structures:
        errors.append("no chapter structure files found in text/story/")
    for structure_path in structures:
        check_chapter(structure_path, config, characters, errors, notes)

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
            f"ok: {len(structures)} chapter(s), {len(config['locales'])} locale(s), "
            "UI copy and realia complete"
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
