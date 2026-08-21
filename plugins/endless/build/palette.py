"""Audit the contrast of the generated Endless theme stylesheets.

The generated CSS is the shipped artifact, so this intentionally reads it
instead of maintaining a second palette that can drift from the generator.
Pass one or more stylesheet paths to audit fixtures; with no arguments both
shipped themes are checked in light and dark mode.
"""

from __future__ import annotations

from pathlib import Path
import re
import sys


COMMENT = re.compile(r"/\*[\s\S]*?\*/")
BLOCK = re.compile(r"([^{}]+)\{([^{}]*)\}")
DECLARATION = re.compile(r"--([a-zA-Z0-9-]+)\s*:\s*([^;]+);")
VARIABLE = re.compile(r"var\(\s*--([a-zA-Z0-9-]+)(?:\s*,\s*(.+))?\s*\)")

LIGHT_SELECTORS = {":root", ".light", ":root:not(.dark)", "html:not(.dark)"}
DARK_SELECTORS = {".dark", ":root.dark", "html.dark"}

# role, foreground token, background token, required ratio
PAIRS = (
    ("body text on canvas", "foreground", "canvas", 4.5),
    ("muted text on canvas", "muted-foreground", "canvas", 4.5),
    ("readback text on canvas", "readback-foreground", "canvas", 4.5),
    ("subtle text on canvas", "subtle-foreground", "canvas", 4.5),
    ("body text on card", "foreground", "card", 4.5),
    ("body text on popover", "foreground", "popover", 4.5),
    ("subtle text on popover", "subtle-foreground", "popover", 4.5),
    ("body text on hover surface", "foreground", "accent", 4.5),
    ("subtle text on hover surface", "subtle-foreground", "accent", 4.5),
    ("body text on sidebar", "foreground", "sidebar", 4.5),
    ("subtle text on sidebar", "subtle-foreground", "sidebar", 4.5),
    ("body text in code well", "foreground", "surface-recessed-solid", 4.5),
    ("primary label on primary fill", "primary-foreground", "primary", 4.5),
    ("file path on canvas", "file-accent", "canvas", 4.5),
    ("destructive text on canvas", "destructive-text", "canvas", 4.5),
    ("success on canvas", "success", "canvas", 4.5),
    ("warning on canvas", "warning", "canvas", 4.5),
    ("merged on canvas", "pr-merged", "canvas", 4.5),
    ("focus ring on canvas", "ring", "canvas", 3.0),
    ("destructive fill on canvas", "destructive", "canvas", 3.0),
)


def modes_for(selector: str) -> tuple[str, ...]:
    parts = tuple(part.strip() for part in selector.split(",") if part.strip())
    if parts and all(part in LIGHT_SELECTORS for part in parts):
        return ("light",)
    if parts and all(part in DARK_SELECTORS for part in parts):
        return ("dark",)
    return ()


def parse_palettes(css: str) -> dict[str, dict[str, str]]:
    palettes: dict[str, dict[str, str]] = {"light": {}, "dark": {}}
    for block in BLOCK.finditer(COMMENT.sub("", css)):
        modes = modes_for(block.group(1).strip())
        if not modes:
            continue
        declarations = tuple(DECLARATION.findall(block.group(2)))
        for mode in modes:
            palettes[mode].update((name, value.strip()) for name, value in declarations)
    return palettes


def resolve_value(tokens: dict[str, str], name: str, seen: frozenset[str] = frozenset()) -> str:
    if name in seen:
        raise ValueError(f"cyclic var() reference at --{name}")
    value = tokens.get(name)
    if value is None:
        raise ValueError(f"missing --{name}")
    match = VARIABLE.fullmatch(value)
    if not match:
        return value
    referenced, fallback = match.groups()
    if referenced in tokens:
        return resolve_value(tokens, referenced, seen | {name})
    if fallback is not None:
        return fallback.strip()
    raise ValueError(f"missing --{referenced}, referenced by --{name}")


def channel(value: str) -> float:
    value = value.strip()
    if value.endswith("%"):
        return float(value[:-1]) * 2.55
    return float(value)


def alpha(value: str) -> float:
    value = value.strip()
    if value.endswith("%"):
        return float(value[:-1]) / 100
    return float(value)


def color(value: str) -> tuple[float, float, float, float]:
    value = value.strip().lower()
    if value.startswith("#"):
        digits = value[1:]
        if len(digits) in (3, 4):
            digits = "".join(character * 2 for character in digits)
        if len(digits) not in (6, 8):
            raise ValueError(f"unsupported hex color {value}")
        channels = tuple(int(digits[index : index + 2], 16) for index in (0, 2, 4))
        opacity = int(digits[6:8], 16) / 255 if len(digits) == 8 else 1.0
        return channels[0], channels[1], channels[2], opacity
    match = re.fullmatch(r"rgba?\(([^)]+)\)", value)
    if match:
        parts = [part.strip() for part in match.group(1).split(",")]
        if len(parts) not in (3, 4):
            raise ValueError(f"unsupported rgb color {value}")
        return channel(parts[0]), channel(parts[1]), channel(parts[2]), alpha(parts[3]) if len(parts) == 4 else 1.0
    raise ValueError(f"unsupported color {value}")


def composite(foreground: tuple[float, float, float, float], background: tuple[float, float, float, float]) -> tuple[float, float, float, float]:
    foreground_alpha = foreground[3]
    output_alpha = foreground_alpha + background[3] * (1 - foreground_alpha)
    if output_alpha == 0:
        return 0, 0, 0, 0
    channels = tuple(
        (foreground[index] * foreground_alpha + background[index] * background[3] * (1 - foreground_alpha)) / output_alpha
        for index in range(3)
    )
    return channels[0], channels[1], channels[2], output_alpha


def luminance(value: tuple[float, float, float, float]) -> float:
    def linear(channel_value: float) -> float:
        normalized = channel_value / 255
        return normalized / 12.92 if normalized <= 0.03928 else ((normalized + 0.055) / 1.055) ** 2.4

    return 0.2126 * linear(value[0]) + 0.7152 * linear(value[1]) + 0.0722 * linear(value[2])


def contrast(tokens: dict[str, str], foreground_name: str, background_name: str) -> float:
    canvas = color(resolve_value(tokens, "canvas"))
    background = color(resolve_value(tokens, background_name))
    if background[3] < 1:
        background = composite(background, canvas)
    foreground = composite(color(resolve_value(tokens, foreground_name)), background)
    foreground_luminance = luminance(foreground)
    background_luminance = luminance(background)
    return (max(foreground_luminance, background_luminance) + 0.05) / (min(foreground_luminance, background_luminance) + 0.05)


def audit(label: str, mode: str, tokens: dict[str, str]) -> list[str]:
    failures: list[str] = []
    print(f"\n=== {label} · {mode} ===")
    for role, foreground, background, required in PAIRS:
        try:
            ratio = contrast(tokens, foreground, background)
            passed = ratio >= required
            print(f"  {ratio:6.2f}:1  req {required:<3}  {'OK  ' if passed else 'FAIL'}  {role}")
            if not passed:
                failures.append(f"{label} {mode}: {role} is {ratio:.4f}:1; requires {required}:1")
        except ValueError as error:
            print(f"      n/a  req {required:<3}  FAIL  {role}: {error}")
            failures.append(f"{label} {mode}: {role}: {error}")
    return failures


def main(paths: list[str]) -> int:
    plugin_root = Path(__file__).resolve().parent.parent
    stylesheets = [Path(path) for path in paths] if paths else [
        plugin_root / "themes" / "endless.css",
        plugin_root / "themes" / "endless-color.css",
    ]
    failures: list[str] = []
    for stylesheet in stylesheets:
        palettes = parse_palettes(stylesheet.read_text(encoding="utf-8"))
        for mode in ("light", "dark"):
            failures.extend(audit(stylesheet.stem, mode, palettes[mode]))
    print(f"\nFAILURES: {len(failures)}")
    for failure in failures:
        print(f"  {failure}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
