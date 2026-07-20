#!/usr/bin/env python3
"""Read new user feedback from bb history using a small persistent cursor."""

from __future__ import annotations

import argparse
import fcntl
import json
import os
import sqlite3
import sys
import tempfile
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_STATE = ROOT / "maintenance" / "state.json"


def default_db() -> Path:
    explicit = os.environ.get("BB_DB_PATH")
    if explicit:
        return Path(explicit).expanduser()
    data_dir = os.environ.get("BB_DATA_DIR")
    if data_dir:
        return Path(data_dir).expanduser() / "bb.db"
    return Path.home() / ".bb" / "bb.db"


def read_state(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {"version": 1, "cursor": None}
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError("state must be a JSON object")
    return value


def cursor_tuple(cursor: Any) -> tuple[int, str]:
    if cursor is None:
        return (0, "")
    if not isinstance(cursor, dict):
        raise ValueError("cursor must be null or an object")
    return (int(cursor["created_at"]), str(cursor["segment_id"]))


def cursor_json(row: sqlite3.Row) -> dict[str, Any]:
    return {"created_at": row["created_at"], "segment_id": row["id"]}


def is_direct_feedback(text: str) -> bool:
    stripped = text.lstrip()
    return not (
        stripped.startswith("[bb system]")
        or stripped.startswith("[bb message")
        or stripped.startswith("<bb system")
    )


def scan(args: argparse.Namespace) -> int:
    state_path = Path(args.state).expanduser().resolve()
    db_path = Path(args.db).expanduser().resolve()
    state = read_state(state_path)
    before = cursor_tuple(state.get("cursor"))

    connection = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    try:
        high_water_row = connection.execute(
            """
            SELECT id, created_at
            FROM thread_search_segments
            WHERE source_kind = 'user_message'
            ORDER BY created_at DESC, id DESC
            LIMIT 1
            """
        ).fetchone()
        if high_water_row is None:
            print(json.dumps({"cursor_before": state.get("cursor"), "cursor_commit": state.get("cursor"), "messages": []}, indent=2))
            return 0
        high_water = (int(high_water_row["created_at"]), str(high_water_row["id"]))
        rows = connection.execute(
            """
            SELECT s.id, s.thread_id, s.source_key, s.created_at, s.text,
                   t.project_id, COALESCE(t.title, t.title_fallback, '') AS title
            FROM thread_search_segments AS s
            JOIN threads AS t ON t.id = s.thread_id
            WHERE s.source_kind = 'user_message'
              AND (s.created_at > ? OR (s.created_at = ? AND s.id > ?))
              AND (s.created_at < ? OR (s.created_at = ? AND s.id <= ?))
            ORDER BY s.created_at, s.id
            LIMIT ?
            """,
            (before[0], before[0], before[1], high_water[0], high_water[0], high_water[1], args.limit),
        ).fetchall()
    finally:
        connection.close()

    messages: list[dict[str, Any]] = []
    used_bytes = 0
    commit = state.get("cursor")
    for row in rows:
        original = str(row["text"])
        encoded = original.encode("utf-8")
        clipped = encoded[: args.max_message_bytes]
        while True:
            try:
                text = clipped.decode("utf-8")
                break
            except UnicodeDecodeError as error:
                clipped = clipped[: error.start]
        if used_bytes + len(clipped) > args.max_bytes:
            break
        commit = cursor_json(row)
        if not is_direct_feedback(original):
            continue
        used_bytes += len(clipped)
        messages.append(
            {
                "thread_id": row["thread_id"],
                "source_key": row["source_key"],
                "project_id": row["project_id"],
                "title": row["title"],
                "created_at": row["created_at"],
                "text": text,
                "truncated": len(clipped) < len(encoded),
            }
        )

    result = {
        "cursor_before": state.get("cursor"),
        "cursor_commit": commit,
        "high_water": {"created_at": high_water[0], "segment_id": high_water[1]},
        "messages": messages,
        "message_count": len(messages),
        "message_bytes": used_bytes,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


def write_state(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as handle:
        json.dump(value, handle, indent=2)
        handle.write("\n")
        temporary = Path(handle.name)
    os.replace(temporary, path)


def advance(args: argparse.Namespace) -> int:
    state_path = Path(args.state).expanduser().resolve()
    lock_path = state_path.with_suffix(state_path.suffix + ".lock")
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    with lock_path.open("a+", encoding="utf-8") as lock:
        fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
        state = read_state(state_path)
        current = cursor_tuple(state.get("cursor"))
        requested = (args.created_at, args.segment_id)
        if requested < current:
            raise ValueError("cursor cannot move backward")
        state["version"] = 1
        state["cursor"] = {"created_at": requested[0], "segment_id": requested[1]}
        write_state(state_path, state)
    print(json.dumps(state["cursor"]))
    return 0


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description=__doc__)
    root.add_argument("--db", default=str(default_db()))
    root.add_argument("--state", default=str(DEFAULT_STATE))
    commands = root.add_subparsers(dest="command", required=True)

    scan_command = commands.add_parser("scan", help="print new direct user messages")
    scan_command.add_argument("--limit", type=int, default=200, choices=range(1, 1001), metavar="1..1000")
    scan_command.add_argument("--max-bytes", type=int, default=262_144)
    scan_command.add_argument("--max-message-bytes", type=int, default=8_192)
    scan_command.set_defaults(run=scan)

    advance_command = commands.add_parser("advance", help="commit a cursor after a successful update")
    advance_command.add_argument("--created-at", required=True, type=int)
    advance_command.add_argument("--segment-id", required=True)
    advance_command.set_defaults(run=advance)
    return root


def main() -> int:
    args = parser().parse_args()
    if args.command == "scan" and args.max_message_bytes > args.max_bytes:
        raise ValueError("--max-message-bytes cannot exceed --max-bytes")
    return args.run(args)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, sqlite3.Error, ValueError, json.JSONDecodeError) as error:
        print(f"scan-history: {error}", file=sys.stderr)
        raise SystemExit(1)
