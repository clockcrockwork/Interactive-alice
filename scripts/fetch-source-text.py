#!/usr/bin/env python3
"""Fetch Alice's Adventures in Wonderland from Project Gutenberg and split it
into one plain-text file per chapter under text/raw/.

The underlying 1865 work by Lewis Carroll is in the public domain. The
Project Gutenberg header and footer are trademark/licence boilerplate and are
stripped, so the generated files contain only public-domain prose.

Usage:
    python3 scripts/fetch-source-text.py [--source FILE]

See text/raw/SOURCE.md for provenance details.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import urllib.request
from datetime import date
from pathlib import Path

SOURCE_URL = "https://www.gutenberg.org/files/11/11-0.txt"
GUTENBERG_ID = 11
REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = REPO_ROOT / "text" / "raw"

START_MARKER = re.compile(r"^\*\*\* START OF THE PROJECT GUTENBERG EBOOK")
END_MARKER = re.compile(r"^\*\*\* END OF THE PROJECT GUTENBERG EBOOK")
CHAPTER_HEADING = re.compile(r"^CHAPTER ([IVXLC]+)\.\s*$")
THE_END = re.compile(r"^THE END\s*$")

ROMAN = {
    "I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6,
    "VII": 7, "VIII": 8, "IX": 9, "X": 10, "XI": 11, "XII": 12,
}


def slugify(title: str) -> str:
    """Turn a chapter title into an ASCII filename slug."""
    folded = (
        title.replace("’", "")
        .replace("‘", "")
        .replace("—", "-")
        .replace("–", "-")
    )
    slug = re.sub(r"[^a-z0-9]+", "-", folded.lower())
    return slug.strip("-")


def fetch(source: str | None) -> str:
    if source:
        return Path(source).read_text(encoding="utf-8")
    with urllib.request.urlopen(SOURCE_URL) as response:
        return response.read().decode("utf-8")


def body_lines(text: str) -> list[str]:
    """Return the ebook body with the Gutenberg header and footer removed."""
    lines = text.replace("\r\n", "\n").split("\n")
    start = next(i for i, line in enumerate(lines) if START_MARKER.match(line))
    end = next(i for i, line in enumerate(lines) if END_MARKER.match(line))
    return lines[start + 1 : end]


def split_chapters(lines: list[str]) -> list[dict]:
    """Split the body into chapters, skipping the front-matter table of contents."""
    starts: list[tuple[int, int]] = []
    for index, line in enumerate(lines):
        match = CHAPTER_HEADING.match(line)
        if match:
            starts.append((index, ROMAN[match.group(1)]))

    if [number for _, number in starts] != list(range(1, 13)):
        raise SystemExit(f"unexpected chapter sequence: {[n for _, n in starts]}")

    chapters = []
    for position, (line_index, number) in enumerate(starts):
        stop = starts[position + 1][0] if position + 1 < len(starts) else len(lines)
        block = lines[line_index + 1 : stop]

        title = next(line.strip() for line in block if line.strip())
        rest = block[block.index(next(l for l in block if l.strip())) + 1 :]
        rest = [line for line in rest if not THE_END.match(line)]
        prose = "\n".join(rest).strip("\n")

        chapters.append(
            {
                "number": number,
                "roman": [r for r, n in ROMAN.items() if n == number][0],
                "title": title,
                "slug": slugify(title),
                "text": prose,
            }
        )
    return chapters


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", help="read from a local copy instead of the network")
    args = parser.parse_args()

    raw = fetch(args.source)
    chapters = split_chapters(body_lines(raw))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for existing in OUT_DIR.glob("ch*.txt"):
        existing.unlink()

    entries = []
    for chapter in chapters:
        name = f"ch{chapter['number']:02d}-{chapter['slug']}.txt"
        content = f"CHAPTER {chapter['roman']}.\n{chapter['title']}\n\n{chapter['text']}\n"
        (OUT_DIR / name).write_text(content, encoding="utf-8")
        entries.append(
            {
                "number": chapter["number"],
                "roman": chapter["roman"],
                "title": chapter["title"],
                "file": name,
                "characters": len(chapter["text"]),
                "sha256": hashlib.sha256(content.encode("utf-8")).hexdigest(),
            }
        )

    manifest = {
        "work": "Alice's Adventures in Wonderland",
        "author": "Lewis Carroll",
        "firstPublished": 1865,
        "edition": "The Millennium Fulcrum Edition 3.0",
        "source": {
            "name": "Project Gutenberg",
            "ebookId": GUTENBERG_ID,
            "url": SOURCE_URL,
            "landingPage": f"https://www.gutenberg.org/ebooks/{GUTENBERG_ID}",
        },
        "language": "en",
        "retrievedOn": date.today().isoformat(),
        "processing": "Project Gutenberg header and footer removed; split per chapter; text otherwise unmodified.",
        "sourceSha256": hashlib.sha256(raw.encode("utf-8")).hexdigest(),
        "chapters": entries,
    }
    (OUT_DIR / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    print(f"wrote {len(entries)} chapters to {OUT_DIR.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
