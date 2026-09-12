#!/usr/bin/env python3
"""Print one experience scene with its text resolved in a chosen language.

A development aid, and the simplest demonstration that the boundary works: the
scene file carries only ids, and the words come from the locale file.

Usage:
    python3 scripts/show-scene.py rabbit-hole --locale ja
"""

from __future__ import annotations

import argparse
import json
import signal
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("scene", help="scene id, as listed in experience/story.json")
    parser.add_argument("--locale", default="en-simple", help="locale directory under text/locales/")
    args = parser.parse_args()

    story = load(REPO_ROOT / "experience" / "story.json")
    entry = next((s for s in story["scenes"] if s["id"] == args.scene), None)
    if entry is None:
        print(f"unknown scene {args.scene!r}", file=sys.stderr)
        return 1

    scene = load(REPO_ROOT / entry["file"])
    chapter = f"ch{scene['chapter']:02d}"
    locale_path = REPO_ROOT / "text" / "locales" / args.locale / f"{chapter}.json"
    if not locale_path.exists():
        print(f"{args.locale} has no text for {chapter}", file=sys.stderr)
        return 1
    text = load(locale_path)["segments"]

    print(f"scene {scene['id']} · chapter {scene['chapter']} · {args.locale}")
    for shot in scene["shots"]:
        print(f"\n  shot {shot['id']} — {shot.get('devLabel', '')}")
        for beat in shot["beats"]:
            if not beat["segments"]:
                print(f"    beat {beat['id']}: (staging only, no text)")
                continue
            print(f"    beat {beat['id']}:")
            for segment_id in beat["segments"]:
                print(f"      {segment_id}  {text[segment_id]}")
    return 0


if __name__ == "__main__":
    # Allow piping into head without a BrokenPipeError traceback.
    signal.signal(signal.SIGPIPE, signal.SIG_DFL)
    sys.exit(main())
