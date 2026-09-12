"""A very small JSON Schema validator, enough for this repository's schemas.

The project's data files are hand-authored JSON and their shapes are declared in
schema/. Those declarations were documentation only until now, which let the
Python checkers drift from them. This module closes that gap without adding a
dependency: it implements the keyword subset the repository actually uses.

If the real `jsonschema` package is installed, `validate` defers to it, so a
developer who has it gets full-strength validation and everyone else still gets
the structural guarantees.

Supported keywords: type, required, properties, additionalProperties (false or a
schema), propertyNames.pattern, items, enum, pattern, minItems, maxItems,
minLength, minimum, maximum, exclusiveMinimum.
"""

from __future__ import annotations

import re
from typing import Any

TYPES: dict[str, type | tuple[type, ...]] = {
    "object": dict,
    "array": list,
    "string": str,
    "boolean": bool,
    "number": (int, float),
    "integer": int,
}


def validate(document: Any, schema: dict, label: str) -> list[str]:
    """Return a list of human-readable problems, empty when the document is valid."""
    try:
        import jsonschema  # noqa: PLC0415
    except ModuleNotFoundError:
        return _walk(document, schema, label)

    validator = jsonschema.Draft202012Validator(schema)
    return [
        f"{label}{_join(error.absolute_path)}: {error.message}"
        for error in sorted(validator.iter_errors(document), key=lambda e: list(e.absolute_path))
    ]


def _join(path) -> str:
    return "".join(f"[{part!r}]" if isinstance(part, str) else f"[{part}]" for part in path)


def _walk(value: Any, schema: dict, label: str) -> list[str]:
    problems: list[str] = []

    expected = schema.get("type")
    if expected:
        python_type = TYPES[expected]
        # bool is an int in Python; never accept it as a number.
        if isinstance(value, bool) != (expected == "boolean") or not isinstance(value, python_type):
            return [f"{label}: expected {expected}, found {type(value).__name__}"]

    if "enum" in schema and value not in schema["enum"]:
        problems.append(f"{label}: {value!r} is not one of {schema['enum']}")

    if isinstance(value, str):
        if "pattern" in schema and not re.search(schema["pattern"], value):
            problems.append(f"{label}: {value!r} does not match {schema['pattern']}")
        if len(value) < schema.get("minLength", 0):
            problems.append(f"{label}: must not be empty")

    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if "minimum" in schema and value < schema["minimum"]:
            problems.append(f"{label}: {value} is below the minimum {schema['minimum']}")
        if "maximum" in schema and value > schema["maximum"]:
            problems.append(f"{label}: {value} is above the maximum {schema['maximum']}")
        if "exclusiveMinimum" in schema and value <= schema["exclusiveMinimum"]:
            problems.append(f"{label}: {value} must be greater than {schema['exclusiveMinimum']}")

    if isinstance(value, list):
        if len(value) < schema.get("minItems", 0):
            problems.append(f"{label}: needs at least {schema['minItems']} item(s), found {len(value)}")
        if "maxItems" in schema and len(value) > schema["maxItems"]:
            problems.append(f"{label}: has more than {schema['maxItems']} items")
        item_schema = schema.get("items")
        if item_schema:
            for index, item in enumerate(value):
                problems += _walk(item, item_schema, f"{label}[{index}]")

    if isinstance(value, dict):
        properties = schema.get("properties", {})
        for key in schema.get("required", []):
            if key not in value:
                problems.append(f"{label}: missing required key {key!r}")
        names = schema.get("propertyNames", {}).get("pattern")
        extra = schema.get("additionalProperties", True)
        for key, child in value.items():
            if names and not re.search(names, key):
                problems.append(f"{label}: key {key!r} does not match {names}")
            if key in properties:
                problems += _walk(child, properties[key], f"{label}.{key}")
            elif extra is False:
                problems.append(f"{label}: unexpected key {key!r}")
            elif isinstance(extra, dict):
                problems += _walk(child, extra, f"{label}.{key}")

    return problems
