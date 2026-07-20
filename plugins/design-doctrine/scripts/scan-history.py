#!/usr/bin/env python3
"""Read new user feedback from bb history using a small persistent cursor."""

from __future__ import annotations

import argparse
import fcntl
import json
import os
import sqlite3
import subprocess
import sys
import tempfile
import time
import uuid
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_STATE = ROOT / "maintenance" / "state.json"
DEFAULT_LEASE_SECONDS = 6 * 60 * 60


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


def lock_path_for(state_path: Path) -> Path:
    return state_path.with_suffix(state_path.suffix + ".lock")


def active_lease(state: dict[str, Any], now: int) -> dict[str, Any] | None:
    lease = state.get("lease")
    if not isinstance(lease, dict):
        return None
    lease_id = lease.get("id")
    if not isinstance(lease_id, str) or not lease_id:
        raise ValueError("state contains an invalid maintenance lease id")
    try:
        expires_at = int(lease.get("expires_at", 0))
    except (TypeError, ValueError) as error:
        raise ValueError("state contains an invalid maintenance lease expiry") from error
    if expires_at <= now:
        return None
    return lease


def ensure_clean_rules(plugin_root: Path) -> None:
    result = subprocess.run(
        [
            "git",
            "-C",
            str(plugin_root),
            "status",
            "--porcelain=v1",
            "--untracked-files=all",
            "--",
            "rules",
        ],
        check=True,
        capture_output=True,
    )
    if result.stdout:
        raise ValueError(
            "rules tree has pre-existing work; commit, stash, or move it before scanning"
        )


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
    plugin_root = Path(args.repository_root).expanduser().resolve()
    lock_path = lock_path_for(state_path)
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    with lock_path.open("a+", encoding="utf-8") as lock:
        fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
        ensure_clean_rules(plugin_root)
        state = read_state(state_path)
        now = int(time.time())
        lease = active_lease(state, now)
        if lease:
            raise ValueError(
                f"maintenance lease {lease['id']} is active until {lease['expires_at']}"
            )
        state.pop("lease", None)
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
                write_state(state_path, state)
                print(json.dumps({"cursor_before": state.get("cursor"), "cursor_commit": state.get("cursor"), "lease_id": None, "messages": []}, indent=2))
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

        lease_id = None
        if commit != state.get("cursor"):
            lease_id = uuid.uuid4().hex
            state["lease"] = {
                "id": lease_id,
                "acquired_at": now,
                "expires_at": now + args.lease_seconds,
                "cursor_before": state.get("cursor"),
                "cursor_commit": commit,
            }
        write_state(state_path, state)

    result = {
        "cursor_before": state.get("cursor"),
        "cursor_commit": commit,
        "lease_id": lease_id,
        "lease_expires_at": state.get("lease", {}).get("expires_at"),
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
    lock_path = lock_path_for(state_path)
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    with lock_path.open("a+", encoding="utf-8") as lock:
        fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
        state = read_state(state_path)
        lease = active_lease(state, int(time.time()))
        if not lease:
            raise ValueError("no active maintenance lease; run scan first")
        if args.lease_id != lease.get("id"):
            raise ValueError("maintenance lease does not match this run")
        current = cursor_tuple(state.get("cursor"))
        requested = (args.created_at, args.segment_id)
        if requested < current:
            raise ValueError("cursor cannot move backward")
        if requested != cursor_tuple(lease.get("cursor_commit")):
            raise ValueError("cursor must match the leased scan result")
        state["version"] = 1
        state["cursor"] = {"created_at": requested[0], "segment_id": requested[1]}
        state.pop("lease", None)
        write_state(state_path, state)
    print(json.dumps(state["cursor"]))
    return 0


def release(args: argparse.Namespace) -> int:
    state_path = Path(args.state).expanduser().resolve()
    lock_path = lock_path_for(state_path)
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    with lock_path.open("a+", encoding="utf-8") as lock:
        fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
        state = read_state(state_path)
        lease = state.get("lease")
        if not isinstance(lease, dict) or args.lease_id != lease.get("id"):
            raise ValueError("maintenance lease does not match this run")
        state.pop("lease", None)
        write_state(state_path, state)
    print(json.dumps({"released": args.lease_id}))
    return 0


def verify_staged(args: argparse.Namespace) -> int:
    plugin_root = Path(args.repository_root).expanduser().resolve()
    repository_root = Path(
        subprocess.run(
            ["git", "-C", str(plugin_root), "rev-parse", "--show-toplevel"],
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()
    ).resolve()
    result = subprocess.run(
        ["git", "-C", str(repository_root), "diff", "--cached", "--name-only", "-z"],
        check=True,
        capture_output=True,
    )
    rules_root = (plugin_root / "rules").resolve()
    unexpected: list[str] = []
    for raw_path in result.stdout.split(b"\0"):
        if not raw_path:
            continue
        relative_path = raw_path.decode("utf-8", errors="surrogateescape")
        staged_path = (repository_root / relative_path).resolve()
        if not staged_path.is_relative_to(rules_root):
            unexpected.append(relative_path)
    if unexpected:
        print("scan-history: refusing maintenance commit; staged files outside rules:", file=sys.stderr)
        for path in unexpected:
            print(f"  {path}", file=sys.stderr)
        return 1
    print(json.dumps({"staged_scope": str(rules_root), "unexpected": []}))
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
    scan_command.add_argument("--lease-seconds", type=int, default=DEFAULT_LEASE_SECONDS, choices=range(60, 86_401), metavar="60..86400")
    scan_command.add_argument("--repository-root", default=str(ROOT), help=argparse.SUPPRESS)
    scan_command.set_defaults(run=scan)

    advance_command = commands.add_parser("advance", help="commit a cursor after a successful update")
    advance_command.add_argument("--created-at", required=True, type=int)
    advance_command.add_argument("--segment-id", required=True)
    advance_command.add_argument("--lease-id", required=True)
    advance_command.set_defaults(run=advance)

    release_command = commands.add_parser("release", help="release a failed run without advancing")
    release_command.add_argument("--lease-id", required=True)
    release_command.set_defaults(run=release)

    staged_command = commands.add_parser("verify-staged", help="refuse staged files outside this plugin's rules")
    staged_command.add_argument("--repository-root", default=str(ROOT), help=argparse.SUPPRESS)
    staged_command.set_defaults(run=verify_staged)
    return root


def main() -> int:
    args = parser().parse_args()
    if args.command == "scan" and args.max_message_bytes > args.max_bytes:
        raise ValueError("--max-message-bytes cannot exceed --max-bytes")
    return args.run(args)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (
        OSError,
        sqlite3.Error,
        subprocess.SubprocessError,
        ValueError,
        json.JSONDecodeError,
    ) as error:
        print(f"scan-history: {error}", file=sys.stderr)
        raise SystemExit(1)
