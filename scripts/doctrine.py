#!/usr/bin/env python3
"""Validate, build, query, mine, and operate the personal design doctrine."""

from __future__ import annotations

import argparse
import datetime as dt
import fcntl
import functools
import hashlib
import json
import os
import re
import sqlite3
import subprocess
import sys
import tempfile
import uuid
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Iterable


SKILL_DIR = Path(
    os.environ.get(
        "DESIGN_DOCTRINE_SKILL_DIR",
        str(Path(__file__).resolve().parent.parent),
    )
)
RULES_DIR = SKILL_DIR / "rules"
SCHEMA_PATH = SKILL_DIR / "schema" / "rule.schema.json"
TAXONOMY_SCHEMA_PATH = SKILL_DIR / "schema" / "taxonomy.schema.json"
TAXONOMY_PATH = SKILL_DIR / "taxonomy.json"
STATE_PATH = Path(
    os.environ.get(
        "DESIGN_DOCTRINE_STATE_PATH",
        str(SKILL_DIR / "maintenance" / "state.json"),
    )
)
LEASE_RECEIPT_PATH = Path(
    os.environ.get(
        "DESIGN_DOCTRINE_LEASE_RECEIPT_PATH",
        str(SKILL_DIR / "maintenance" / ".runtime" / "lease-receipt.json"),
    )
)
GENERATED_DIR = SKILL_DIR / "generated"
CATALOG_PATH = GENERATED_DIR / "DOCTRINE.md"
INDEX_PATH = GENERATED_DIR / "index.jsonl"
BROWSE_TEMPLATE_PATH = SKILL_DIR / "templates" / "browse.html"
BROWSE_PATH = GENERATED_DIR / "browse.html"
MANIFEST_PATH = GENERATED_DIR / "manifest.json"
RETRIEVAL_EVALS_PATH = SKILL_DIR / "evals" / "retrieval.json"
DEFAULT_DB_PATH = Path(
    os.environ.get(
        "BB_DB_PATH",
        str(Path(os.environ.get("BB_DATA_DIR", str(Path.home() / ".bb"))) / "bb.db"),
    )
)
LOCKED_MAINTENANCE_PATHS = (
    SKILL_DIR / "skills" / "design-doctrine" / "SKILL.md",
    SKILL_DIR / "governance.md",
    SCHEMA_PATH,
    TAXONOMY_SCHEMA_PATH,
    TAXONOMY_PATH,
    SKILL_DIR / "maintenance" / "automation-prompt.md",
    SKILL_DIR / "scripts" / "doctrine.py",
    BROWSE_TEMPLATE_PATH,
    RETRIEVAL_EVALS_PATH,
)

ACTIVE_STATUS = "active"
OPERATIVE_STATUSES = {ACTIVE_STATUS}
ALL_STATUSES = {
    "candidate",
    "active",
    "contested",
    "rejected",
    "superseded",
    "deprecated",
}
KINDS = {"principle", "standard", "guideline", "taste", "anti_pattern"}
STRENGTHS = {"required", "default", "preference", "warning"}
RELATION_TYPES = {
    "supports",
    "qualifies",
    "tensions_with",
    "depends_on",
    "supersedes",
}
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
RULE_ID_RE = re.compile(r"^ddr_\d{3,}$")
EVIDENCE_ID_RE = re.compile(r"^ev_[A-Za-z0-9_-]+$")
TOKEN_RE = re.compile(r"[a-z0-9][a-z0-9-]*")
DESIGN_TERMS = {
    "accessibility",
    "action",
    "affordance",
    "alignment",
    "animation",
    "badge",
    "border",
    "breadcrumb",
    "button",
    "card",
    "color",
    "component",
    "contrast",
    "control",
    "density",
    "dialog",
    "disabled",
    "drawer",
    "editing",
    "empty",
    "error",
    "focus",
    "font",
    "form",
    "header",
    "hierarchy",
    "hover",
    "icon",
    "input",
    "label",
    "layout",
    "loading",
    "menu",
    "modal",
    "navigation",
    "panel",
    "popover",
    "responsive",
    "row",
    "shadow",
    "sidebar",
    "spacing",
    "state",
    "tab",
    "toast",
    "tooltip",
    "typography",
    "visual",
    "workflow",
}
NORMATIVE_TERMS = {
    "always",
    "default",
    "don’t",
    "dont",
    "must",
    "never",
    "prefer",
    "remove",
    "reserve",
    "should",
    "shouldn’t",
    "shouldnt",
    "use",
}


class DoctrineError(Exception):
    """Expected validation or operational error."""


def state_locked(function: Any) -> Any:
    @functools.wraps(function)
    def wrapped(*args: Any, **kwargs: Any) -> Any:
        lock_path = STATE_PATH.with_suffix(STATE_PATH.suffix + ".lock")
        lock_path.parent.mkdir(parents=True, exist_ok=True)
        with lock_path.open("a+", encoding="utf-8") as handle:
            try:
                fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError as exc:
                raise DoctrineError(
                    "Another doctrine state operation is in progress."
                ) from exc
            return function(*args, **kwargs)

    return wrapped


def load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise DoctrineError(f"Missing required file: {path}") from exc
    except json.JSONDecodeError as exc:
        raise DoctrineError(f"Invalid JSON in {path}: {exc}") from exc


def default_state() -> dict[str, Any]:
    return {
        "version": 1,
        "cursor": None,
        "excluded_projects": [],
        "excluded_threads": [],
        "automation": None,
        "last_run": None,
        "corpus_sha256": None,
    }


def load_state() -> dict[str, Any]:
    if not STATE_PATH.exists():
        return default_state()
    value = load_json(STATE_PATH)
    if not isinstance(value, dict):
        raise DoctrineError("Maintenance state must be a JSON object.")
    return value


def atomic_write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    rendered = json.dumps(value, indent=2, ensure_ascii=False) + "\n"
    with tempfile.NamedTemporaryFile(
        mode="w",
        encoding="utf-8",
        dir=path.parent,
        prefix=f".{path.name}.",
        suffix=".tmp",
        delete=False,
    ) as handle:
        handle.write(rendered)
        temp_path = Path(handle.name)
    temp_path.replace(path)


def atomic_write_cli_state(path: Path, value: Any) -> None:
    """Write CLI-owned maintenance state and make casual direct edits fail."""
    atomic_write_json(path, value)
    path.chmod(0o400)


def load_lease_receipt() -> dict[str, Any] | None:
    if not LEASE_RECEIPT_PATH.exists():
        return None
    value = load_json(LEASE_RECEIPT_PATH)
    if not isinstance(value, dict):
        raise DoctrineError("Maintenance lease receipt must be a JSON object.")
    return value


def write_lease_receipt(value: dict[str, Any]) -> None:
    LEASE_RECEIPT_PATH.parent.mkdir(parents=True, exist_ok=True)
    LEASE_RECEIPT_PATH.parent.chmod(0o700)
    atomic_write_cli_state(LEASE_RECEIPT_PATH, value)


def clear_lease_receipt() -> None:
    try:
        LEASE_RECEIPT_PATH.unlink()
    except FileNotFoundError:
        pass


def atomic_write_text(path: Path, value: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        mode="w",
        encoding="utf-8",
        dir=path.parent,
        prefix=f".{path.name}.",
        suffix=".tmp",
        delete=False,
    ) as handle:
        handle.write(value)
        temp_path = Path(handle.name)
    temp_path.replace(path)


def canonical_json_bytes(value: Any) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def deterministic_episode_id(evidence: dict[str, Any]) -> str | None:
    source = evidence.get("source", {})
    thread_id = source.get("thread_id")
    episode_source_keys = evidence.get("episode_source_keys")
    if (
        not isinstance(thread_id, str)
        or not thread_id
        or not isinstance(episode_source_keys, list)
        or not episode_source_keys
        or not all(isinstance(value, str) for value in episode_source_keys)
    ):
        return None
    digest = sha256_bytes(
        canonical_json_bytes(
            {
                "source_keys": episode_source_keys,
                "thread_id": thread_id,
            }
        )
    )[:16]
    return f"bb:{thread_id}:{digest}"


def derived_confidence_basis(rule: dict[str, Any]) -> dict[str, int]:
    independent_support = [
        item
        for item in rule.get("evidence", [])
        if item.get("stance") == "supports"
        and item.get("doctrine_version_seen") in {"pre-doctrine", "unseen"}
    ]
    independent_challenges = [
        item
        for item in rule.get("evidence", [])
        if item.get("stance") == "challenges"
        and item.get("doctrine_version_seen") in {"pre-doctrine", "unseen"}
    ]
    explicit_signals = {
        "explicit_instruction",
        "explicit_correction",
        "approval",
        "rejection",
    }
    return {
        "explicit_user_signals": sum(
            len(item.get("source", {}).get("source_keys", []))
            for item in rule.get("evidence", [])
            if item.get("signal") in explicit_signals
            and item.get("doctrine_version_seen") in {"pre-doctrine", "unseen"}
        ),
        "supporting_episodes": len(
            {
                item.get("episode_id")
                for item in independent_support
                if item.get("episode_id")
            }
        ),
        "challenging_episodes": len(
            {
                item.get("episode_id")
                for item in independent_challenges
                if item.get("episode_id")
            }
        ),
        "distinct_threads": len(
            {
                item.get("source", {}).get("thread_id")
                for item in independent_support
                if item.get("source", {}).get("thread_id")
            }
        ),
        "distinct_projects": len(
            {
                item.get("source", {}).get("project_id")
                for item in independent_support
                if item.get("source", {}).get("project_id")
            }
        ),
    }


def rule_paths() -> list[Path]:
    if not RULES_DIR.exists():
        return []
    return sorted(path for path in RULES_DIR.rglob("*.json") if path.is_file())


def load_rules() -> list[tuple[Path, dict[str, Any]]]:
    loaded: list[tuple[Path, dict[str, Any]]] = []
    for path in rule_paths():
        value = load_json(path)
        if not isinstance(value, dict):
            raise DoctrineError(f"Rule must be a JSON object: {path}")
        loaded.append((path, value))
    return loaded


def taxonomy_sets() -> dict[str, Any]:
    taxonomy = load_json(TAXONOMY_PATH)
    leaves = {
        leaf["id"]
        for root in taxonomy.get("roots", [])
        for leaf in root.get("leaves", [])
    }
    return {
        "leaves": leaves,
        "pattern_categories": set(taxonomy.get("pattern_categories", [])),
        "products": {item["id"] for item in taxonomy.get("products", [])},
        "activities": set(taxonomy.get("activities", [])),
        "artifacts": set(taxonomy.get("artifacts", [])),
        "aliases": {
            item["alias"]: item["canonical_id"]
            for item in taxonomy.get("id_aliases", [])
        },
        "deprecated": {
            item["id"]: set(item.get("successor_ids", []))
            for item in taxonomy.get("deprecations", [])
        },
    }


def semantic_taxonomy_validation(taxonomy: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    root_ids: set[str] = set()
    leaf_ids: set[str] = set()
    for root in taxonomy.get("roots", []):
        root_id = root.get("id")
        if root_id in root_ids:
            errors.append(f"taxonomy: duplicate root id {root_id!r}")
        root_ids.add(root_id)
        for leaf in root.get("leaves", []):
            leaf_id = leaf.get("id")
            if leaf_id in leaf_ids:
                errors.append(f"taxonomy: duplicate leaf id {leaf_id!r}")
            if isinstance(leaf_id, str) and not leaf_id.startswith(f"{root_id}."):
                errors.append(
                    f"taxonomy: leaf {leaf_id!r} must belong to root {root_id!r}"
                )
            leaf_ids.add(leaf_id)
    aliases: set[str] = set()
    for item in taxonomy.get("id_aliases", []):
        alias = item.get("alias")
        canonical_id = item.get("canonical_id")
        if alias in aliases or alias in leaf_ids:
            errors.append(f"taxonomy: duplicate or active alias id {alias!r}")
        aliases.add(alias)
        if canonical_id not in leaf_ids:
            errors.append(
                f"taxonomy: alias target {canonical_id!r} is not an active leaf"
            )
    deprecated_ids: set[str] = set()
    for item in taxonomy.get("deprecations", []):
        deprecated_id = item.get("id")
        if deprecated_id in deprecated_ids or deprecated_id in leaf_ids:
            errors.append(
                f"taxonomy: deprecated id {deprecated_id!r} must be unique and retired"
            )
        deprecated_ids.add(deprecated_id)
        for successor_id in item.get("successor_ids", []):
            if successor_id not in leaf_ids:
                errors.append(
                    f"taxonomy: successor {successor_id!r} is not an active leaf"
                )
    if aliases & deprecated_ids:
        errors.append("taxonomy: an id cannot be both an alias and deprecated")
    return errors


def type_matches(value: Any, expected: str) -> bool:
    if expected == "object":
        return isinstance(value, dict)
    if expected == "array":
        return isinstance(value, list)
    if expected == "string":
        return isinstance(value, str)
    if expected == "integer":
        return isinstance(value, int) and not isinstance(value, bool)
    if expected == "number":
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    if expected == "boolean":
        return isinstance(value, bool)
    if expected == "null":
        return value is None
    return True


def resolve_ref(schema: dict[str, Any], ref: str) -> dict[str, Any]:
    if not ref.startswith("#/"):
        raise DoctrineError(f"Unsupported schema reference: {ref}")
    node: Any = schema
    for part in ref[2:].split("/"):
        node = node[part.replace("~1", "/").replace("~0", "~")]
    if not isinstance(node, dict):
        raise DoctrineError(f"Schema reference does not resolve to an object: {ref}")
    return node


def validate_schema_node(
    value: Any,
    node: dict[str, Any],
    root_schema: dict[str, Any],
    location: str,
    errors: list[str],
) -> None:
    if "$ref" in node:
        validate_schema_node(
            value,
            resolve_ref(root_schema, node["$ref"]),
            root_schema,
            location,
            errors,
        )
        return

    if "const" in node and value != node["const"]:
        errors.append(f"{location}: expected constant {node['const']!r}")
    if "enum" in node and value not in node["enum"]:
        errors.append(f"{location}: {value!r} is not one of {node['enum']!r}")

    expected_type = node.get("type")
    if expected_type is not None:
        options = expected_type if isinstance(expected_type, list) else [expected_type]
        if not any(type_matches(value, option) for option in options):
            errors.append(f"{location}: expected type {options}, got {type(value).__name__}")
            return

    if isinstance(value, dict):
        required = node.get("required", [])
        for key in required:
            if key not in value:
                errors.append(f"{location}: missing required property {key!r}")
        properties = node.get("properties", {})
        if node.get("additionalProperties") is False:
            for key in value:
                if key not in properties:
                    errors.append(f"{location}: unexpected property {key!r}")
        for key, child in properties.items():
            if key in value:
                validate_schema_node(
                    value[key],
                    child,
                    root_schema,
                    f"{location}.{key}",
                    errors,
                )
    elif isinstance(value, list):
        if "minItems" in node and len(value) < node["minItems"]:
            errors.append(f"{location}: expected at least {node['minItems']} items")
        if "maxItems" in node and len(value) > node["maxItems"]:
            errors.append(f"{location}: expected at most {node['maxItems']} items")
        if node.get("uniqueItems"):
            seen: set[bytes] = set()
            for item in value:
                key = canonical_json_bytes(item)
                if key in seen:
                    errors.append(f"{location}: duplicate array item {item!r}")
                seen.add(key)
        if isinstance(node.get("items"), dict):
            for index, item in enumerate(value):
                validate_schema_node(
                    item,
                    node["items"],
                    root_schema,
                    f"{location}[{index}]",
                    errors,
                )
    elif isinstance(value, str):
        if "minLength" in node and len(value) < node["minLength"]:
            errors.append(f"{location}: string is shorter than {node['minLength']}")
        if "maxLength" in node and len(value) > node["maxLength"]:
            errors.append(f"{location}: string is longer than {node['maxLength']}")
        if "pattern" in node and re.search(node["pattern"], value) is None:
            errors.append(f"{location}: {value!r} does not match {node['pattern']!r}")
        if node.get("format") == "date" and not DATE_RE.fullmatch(value):
            errors.append(f"{location}: expected YYYY-MM-DD date")
        elif node.get("format") == "date" and DATE_RE.fullmatch(value):
            try:
                dt.date.fromisoformat(value)
            except ValueError:
                errors.append(f"{location}: invalid calendar date {value!r}")
    elif isinstance(value, int) and not isinstance(value, bool):
        if "minimum" in node and value < node["minimum"]:
            errors.append(f"{location}: {value} is below minimum {node['minimum']}")


def graph_has_cycle(edges: dict[str, set[str]]) -> bool:
    visiting: set[str] = set()
    visited: set[str] = set()

    def visit(node: str) -> bool:
        if node in visiting:
            return True
        if node in visited:
            return False
        visiting.add(node)
        for target in edges.get(node, set()):
            if visit(target):
                return True
        visiting.remove(node)
        visited.add(node)
        return False

    return any(visit(node) for node in edges)


def semantic_validation(
    loaded_rules: list[tuple[Path, dict[str, Any]]],
) -> list[str]:
    errors: list[str] = []
    tax = taxonomy_sets()
    ids: set[str] = set()
    rules_by_id: dict[str, dict[str, Any]] = {}
    dependency_edges: dict[str, set[str]] = defaultdict(set)
    supersession_edges: dict[str, set[str]] = defaultdict(set)
    incoming_supersession: dict[str, set[str]] = defaultdict(set)

    for path, rule in loaded_rules:
        rule_id = rule.get("id")
        if rule_id in ids:
            errors.append(f"{path}: duplicate rule id {rule_id}")
        if isinstance(rule_id, str):
            ids.add(rule_id)
            rules_by_id[rule_id] = rule
            if path.stem != rule_id:
                errors.append(f"{path}: filename must match rule id {rule_id}.json")
        if rule.get("kind") not in KINDS:
            errors.append(f"{path}: unknown kind {rule.get('kind')!r}")
        if rule.get("strength") not in STRENGTHS:
            errors.append(f"{path}: unknown strength {rule.get('strength')!r}")
        lifecycle = rule.get("lifecycle", {})
        status = lifecycle.get("status")
        if status not in ALL_STATUSES:
            errors.append(f"{path}: unknown lifecycle status {status!r}")
        if status == ACTIVE_STATUS:
            if not lifecycle.get("approved_by"):
                errors.append(f"{path}: active rule requires approved_by")
            if not lifecycle.get("activated_at"):
                errors.append(f"{path}: active rule requires activated_at")
        if status == "candidate":
            if lifecycle.get("approved_by") is not None:
                errors.append(f"{path}: candidate rule cannot have approved_by")
            if lifecycle.get("activated_at") is not None:
                errors.append(f"{path}: candidate rule cannot have activated_at")
        if rule.get("strength") == "required":
            if rule.get("kind") != "standard":
                errors.append(f"{path}: required strength is only valid for standards")
            checks = rule.get("verification", {}).get("checks", [])
            if not checks:
                errors.append(f"{path}: required standard needs verification checks")
        if rule.get("kind") == "anti_pattern" and rule.get("strength") != "warning":
            errors.append(f"{path}: anti_pattern must use warning strength")

        classification = rule.get("classification", {})
        primary = classification.get("primary")
        if primary not in tax["leaves"]:
            errors.append(f"{path}: unknown primary taxonomy id {primary!r}")
        for secondary in classification.get("secondary", []):
            if secondary not in tax["leaves"]:
                errors.append(f"{path}: unknown secondary taxonomy id {secondary!r}")
        for category in classification.get("pattern_categories", []):
            if category not in tax["pattern_categories"]:
                errors.append(f"{path}: unknown Pattern Atlas category {category!r}")

        applicability = rule.get("applicability", {})
        for product in applicability.get("products", []):
            if product not in tax["products"]:
                errors.append(f"{path}: unknown product id {product!r}")
        for activity in applicability.get("activities", []):
            if activity not in tax["activities"]:
                errors.append(f"{path}: unknown activity {activity!r}")
        for artifact in applicability.get("artifacts", []):
            if artifact not in tax["artifacts"]:
                errors.append(f"{path}: unknown artifact {artifact!r}")

        evidence_ids: set[str] = set()
        evidence_locators: set[tuple[str | None, tuple[str, ...], str]] = set()
        episode_by_source_key: dict[tuple[str, str], str] = {}
        for item in rule.get("evidence", []):
            evidence_id = item.get("id")
            if evidence_id in evidence_ids:
                errors.append(f"{path}: duplicate evidence id {evidence_id!r}")
            if isinstance(evidence_id, str):
                evidence_ids.add(evidence_id)
            source = item.get("source", {})
            locator = (
                source.get("thread_id"),
                tuple(source.get("source_keys", [])),
                item.get("content_sha256", ""),
            )
            if locator in evidence_locators:
                errors.append(f"{path}: duplicate evidence locator/content hash")
            evidence_locators.add(locator)
            source_type = source.get("type")
            episode_source_keys = item.get("episode_source_keys", [])
            source_keys = source.get("source_keys", [])
            if source_type in {"bb_task_episode", "current_user_instruction"}:
                expected_episode_id = deterministic_episode_id(item)
                if item.get("episode_id") != expected_episode_id:
                    errors.append(
                        f"{path}: {evidence_id} episode_id must be derived from "
                        "its bb thread and complete episode source span"
                    )
                if not set(source_keys).issubset(set(episode_source_keys)):
                    errors.append(
                        f"{path}: {evidence_id} evidence source keys must be "
                        "contained in its episode source span"
                    )
                thread_id = source.get("thread_id")
                if isinstance(thread_id, str):
                    for source_key in episode_source_keys:
                        span_key = (thread_id, source_key)
                        previous_episode_id = episode_by_source_key.get(span_key)
                        if (
                            previous_episode_id is not None
                            and previous_episode_id != item.get("episode_id")
                        ):
                            errors.append(
                                f"{path}: overlapping bb source spans must share "
                                f"one episode identity ({thread_id}/{source_key})"
                            )
                        episode_by_source_key[span_key] = item.get("episode_id")
            excerpt = item.get("excerpt")
            if isinstance(excerpt, str) and len(excerpt) > 360:
                errors.append(f"{path}: evidence excerpt exceeds 360 characters")

        confidence_basis = rule.get("confidence", {}).get("basis", {})
        if confidence_basis != derived_confidence_basis(rule):
            errors.append(
                f"{path}: confidence basis must exactly match the values derived "
                "from independent typed evidence"
            )

        if (
            status == ACTIVE_STATUS
            and lifecycle.get("approved_by") == "owner-direct-history-bootstrap"
        ):
            bootstrap_threads = {
                item.get("source", {}).get("thread_id")
                for item in rule.get("evidence", [])
                if item.get("stance") == "supports"
                and item.get("signal") in {"explicit_instruction", "explicit_correction"}
                and item.get("source", {}).get("thread_id")
            }
            if len(bootstrap_threads) < 2:
                errors.append(
                    f"{path}: history-bootstrap activation requires direct support "
                    "from at least two independent threads"
                )
        if status == "contested" and not any(
            item.get("stance") == "challenges" for item in rule.get("evidence", [])
        ):
            errors.append(f"{path}: contested rule requires challenging evidence")

        for exception in rule.get("exceptions", []):
            for evidence_ref in exception.get("evidence_refs", []):
                if evidence_ref not in evidence_ids:
                    errors.append(
                        f"{path}: exception references missing evidence {evidence_ref}"
                    )

        for relation in rule.get("relationships", []):
            relation_type = relation.get("type")
            target_id = relation.get("target_id")
            if relation_type not in RELATION_TYPES:
                errors.append(f"{path}: unknown relationship type {relation_type!r}")
            if target_id == rule_id:
                errors.append(f"{path}: rule cannot relate to itself")
            if relation_type == "depends_on":
                dependency_edges[str(rule_id)].add(str(target_id))
            if relation_type == "supersedes":
                supersession_edges[str(rule_id)].add(str(target_id))
                incoming_supersession[str(target_id)].add(str(rule_id))
                if status != ACTIVE_STATUS:
                    errors.append(
                        f"{path}: only an active rule may supersede another rule"
                    )
            if relation_type == "tensions_with" and status == ACTIVE_STATUS:
                if not relation.get("resolution"):
                    errors.append(
                        f"{path}: active tension requires an explicit resolution boundary"
                    )

    for path, rule in loaded_rules:
        for relation in rule.get("relationships", []):
            target_id = relation.get("target_id")
            if target_id not in ids:
                errors.append(
                    f"{path}: dangling relationship target {target_id!r}"
                )
                continue
            if relation.get("type") == "supersedes":
                target_status = rules_by_id[target_id]["lifecycle"]["status"]
                if target_status != "superseded":
                    errors.append(
                        f"{path}: supersedes target {target_id} must be superseded"
                    )
                if target_status == ACTIVE_STATUS:
                    errors.append(
                        f"{path}: an active rule cannot be a supersedes target"
                    )
        if (
            rule.get("lifecycle", {}).get("status") == "superseded"
            and not incoming_supersession.get(rule["id"])
        ):
            errors.append(
                f"{path}: superseded rule requires an incoming supersedes relationship"
            )

    if graph_has_cycle(dependency_edges):
        errors.append("Doctrine dependency graph contains a cycle")
    if graph_has_cycle(supersession_edges):
        errors.append("Doctrine supersession graph contains a cycle")
    return errors


def validate() -> tuple[list[tuple[Path, dict[str, Any]]], list[str]]:
    schema = load_json(SCHEMA_PATH)
    taxonomy_schema = load_json(TAXONOMY_SCHEMA_PATH)
    taxonomy = load_json(TAXONOMY_PATH)
    loaded_rules = load_rules()
    errors: list[str] = []
    validate_schema_node(
        taxonomy,
        taxonomy_schema,
        taxonomy_schema,
        str(TAXONOMY_PATH),
        errors,
    )
    errors.extend(semantic_taxonomy_validation(taxonomy))
    for path, rule in loaded_rules:
        validate_schema_node(rule, schema, schema, str(path), errors)
    errors.extend(semantic_validation(loaded_rules))
    return loaded_rules, errors


def corpus_hash(loaded_rules: list[tuple[Path, dict[str, Any]]] | None = None) -> str:
    loaded_rules = loaded_rules if loaded_rules is not None else load_rules()
    payload = {
        "schema": load_json(SCHEMA_PATH),
        "taxonomy_schema": load_json(TAXONOMY_SCHEMA_PATH),
        "taxonomy": load_json(TAXONOMY_PATH),
        "rules": [rule for _, rule in sorted(loaded_rules, key=lambda item: str(item[0]))],
    }
    return sha256_bytes(canonical_json_bytes(payload))


def active_authority_hash(
    loaded_rules: list[tuple[Path, dict[str, Any]]] | None = None,
) -> str:
    loaded_rules = loaded_rules if loaded_rules is not None else load_rules()
    protected = []
    for _, rule in sorted(loaded_rules, key=lambda item: item[1]["id"]):
        if rule.get("lifecycle", {}).get("status") != ACTIVE_STATUS:
            continue
        protected_rule = {
            key: value for key, value in rule.items() if key != "evidence"
        }
        confidence = dict(rule.get("confidence", {}))
        confidence.pop("basis", None)
        protected_rule["confidence"] = confidence
        protected.append(protected_rule)
    return sha256_bytes(canonical_json_bytes(protected))


def locked_maintenance_hashes() -> dict[str, str]:
    hashes: dict[str, str] = {}
    for path in LOCKED_MAINTENANCE_PATHS:
        if not path.exists():
            raise DoctrineError(f"Missing locked maintenance file: {path}")
        hashes[str(path.relative_to(SKILL_DIR))] = sha256_bytes(path.read_bytes())
    return hashes


def rule_file_hashes(
    loaded_rules: list[tuple[Path, dict[str, Any]]] | None = None,
) -> dict[str, str]:
    loaded_rules = loaded_rules if loaded_rules is not None else load_rules()
    return {
        rule["id"]: sha256_bytes(canonical_json_bytes(rule))
        for _, rule in sorted(loaded_rules, key=lambda item: item[1]["id"])
    }


def active_evidence_snapshot(
    loaded_rules: list[tuple[Path, dict[str, Any]]] | None = None,
) -> dict[str, list[dict[str, Any]]]:
    loaded_rules = loaded_rules if loaded_rules is not None else load_rules()
    return {
        rule["id"]: rule["evidence"]
        for _, rule in sorted(loaded_rules, key=lambda item: item[1]["id"])
        if rule.get("lifecycle", {}).get("status") == ACTIVE_STATUS
    }


def rule_evidence_snapshot(
    loaded_rules: list[tuple[Path, dict[str, Any]]] | None = None,
) -> dict[str, list[dict[str, Any]]]:
    loaded_rules = loaded_rules if loaded_rules is not None else load_rules()
    return {
        rule["id"]: rule["evidence"]
        for _, rule in sorted(loaded_rules, key=lambda item: item[1]["id"])
    }


def relative_rule_path(path: Path) -> str:
    return str(path.relative_to(SKILL_DIR))


def evidence_count(rule: dict[str, Any]) -> tuple[int, int]:
    evidence = rule.get("evidence", [])
    threads = {
        item.get("source", {}).get("thread_id")
        for item in evidence
        if item.get("source", {}).get("thread_id")
    }
    return len(evidence), len(threads)


def compact_index_row(path: Path, rule: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": rule["id"],
        "title": rule["title"],
        "statement": rule["statement"],
        "kind": rule["kind"],
        "strength": rule["strength"],
        "status": rule["lifecycle"]["status"],
        "confidence": rule["confidence"]["level"],
        "primary": rule["classification"]["primary"],
        "secondary": rule["classification"]["secondary"],
        "pattern_categories": rule["classification"]["pattern_categories"],
        "products": rule["applicability"]["products"],
        "activities": rule["applicability"]["activities"],
        "artifacts": rule["applicability"]["artifacts"],
        "surfaces": rule["applicability"]["surfaces"],
        "contexts": rule["applicability"]["contexts"],
        "when": rule["applicability"]["when"],
        "not_when": rule["applicability"]["not_when"],
        "prefer": rule["guidance"]["prefer"],
        "avoid": rule["guidance"]["avoid"],
        "exceptions": [
            " ".join(
                [
                    item["condition"],
                    item["use_instead"],
                    item["rationale"],
                ]
            )
            for item in rule["exceptions"]
        ],
        "checks": rule["verification"]["checks"],
        "keywords": rule["retrieval"]["keywords"],
        "aliases": rule["retrieval"]["aliases"],
        "path": relative_rule_path(path),
    }


def markdown_list(items: Iterable[str]) -> list[str]:
    values = [item for item in items if item]
    return [f"- {item}" for item in values] if values else ["- None recorded."]


def build_catalog(
    loaded_rules: list[tuple[Path, dict[str, Any]]],
    digest: str,
    generated_at: str,
) -> str:
    taxonomy = load_json(TAXONOMY_PATH)
    root_order = {root["id"]: index for index, root in enumerate(taxonomy["roots"])}
    root_names = {root["id"]: root["name"] for root in taxonomy["roots"]}
    sorted_rules = sorted(
        loaded_rules,
        key=lambda item: (
            root_order.get(item[1]["classification"]["primary"].split(".")[0], 999),
            item[1]["classification"]["primary"],
            item[1]["title"].lower(),
        ),
    )
    statuses = Counter(rule["lifecycle"]["status"] for _, rule in sorted_rules)
    lines = [
        "# Design Doctrine",
        "",
        "This is the generated, human-readable catalog of the personal design doctrine. "
        "Canonical records live under `rules/`; do not edit this file directly.",
        "",
        f"> Corpus `{digest[:12]}` · {len(sorted_rules)} rules · generated {generated_at}",
        "",
        "## At A Glance",
        "",
        "| Status | Rules | Operative? |",
        "| --- | ---: | --- |",
    ]
    status_order = [
        "active",
        "candidate",
        "contested",
        "rejected",
        "superseded",
        "deprecated",
    ]
    for status in status_order:
        lines.append(
            f"| `{status}` | {statuses.get(status, 0)} | "
            f"{'Yes' if status in OPERATIVE_STATUSES else 'No'} |"
        )
    lines.extend(
        [
            "",
            "## Browse By Domain",
            "",
            "| Domain | Active | Candidate | Other |",
            "| --- | ---: | ---: | ---: |",
        ]
    )
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for _, rule in sorted_rules:
        root = rule["classification"]["primary"].split(".")[0]
        grouped[root].append(rule)
    for root in taxonomy["roots"]:
        group = grouped.get(root["id"], [])
        active = sum(rule["lifecycle"]["status"] == "active" for rule in group)
        candidate = sum(rule["lifecycle"]["status"] == "candidate" for rule in group)
        lines.append(
            f"| [{root['name']}](#{root['name'].lower().replace(' ', '-')}) | "
            f"{active} | {candidate} | {len(group) - active - candidate} |"
        )

    for root in taxonomy["roots"]:
        group_entries = [
            (path, rule)
            for path, rule in sorted_rules
            if rule["classification"]["primary"].split(".")[0] == root["id"]
        ]
        if not group_entries:
            continue
        lines.extend(["", f"## {root['name']}", "", root["definition"]])
        for path, rule in group_entries:
            status = rule["lifecycle"]["status"]
            evidence_total, evidence_threads = evidence_count(rule)
            basis = rule["confidence"]["basis"]
            lifecycle = rule["lifecycle"]
            decision_note = lifecycle["decision_note"].replace("|", "\\|")
            lines.extend(
                [
                    "",
                    f"### {rule['id']} — {rule['title']}",
                    "",
                    rule["statement"],
                    "",
                    "| Attribute | Value |",
                    "| --- | --- |",
                    f"| Status | `{status}`{' — operative' if status == 'active' else ' — not operative'} |",
                    f"| Kind / strength | `{rule['kind']}` / `{rule['strength']}` |",
                    f"| Confidence | `{rule['confidence']['level']}` |",
                    "| Confidence basis | "
                    f"{basis['supporting_episodes']} supporting / "
                    f"{basis['challenging_episodes']} challenging episodes · "
                    f"{basis['distinct_threads']} threads · "
                    f"{basis['distinct_projects']} projects |",
                    f"| Classification | `{rule['classification']['primary']}`"
                    + (
                        " · "
                        + ", ".join(
                            f"`{value}`"
                            for value in rule["classification"]["secondary"]
                        )
                        if rule["classification"]["secondary"]
                        else ""
                    )
                    + " |",
                    f"| Products | {', '.join(f'`{value}`' for value in rule['applicability']['products'])} |",
                    f"| Evidence | {evidence_total} records across {evidence_threads} referenced threads |",
                    f"| Approval | `{lifecycle['approved_by'] or 'none'}` |",
                    "| Review | "
                    f"last `{lifecycle['last_reviewed_at'] or 'none'}` · "
                    f"next `{lifecycle['review_after'] or 'none'}` |",
                    f"| Decision | {decision_note} |",
                    f"| Source | `{relative_rule_path(path)}` |",
                    "",
                    "#### Why",
                    "",
                    rule["rationale"],
                    "",
                    "#### Prefer",
                    "",
                    *markdown_list(rule["guidance"]["prefer"]),
                    "",
                    "#### Avoid",
                    "",
                    *markdown_list(rule["guidance"]["avoid"]),
                    "",
                    "#### Applies When",
                    "",
                    *markdown_list(rule["applicability"]["when"]),
                ]
            )
            if rule["applicability"]["not_when"]:
                lines.extend(
                    [
                        "",
                        "#### Does Not Apply When",
                        "",
                        *markdown_list(rule["applicability"]["not_when"]),
                    ]
                )
            if rule["exceptions"]:
                lines.extend(["", "#### Exceptions", ""])
                for exception in rule["exceptions"]:
                    lines.extend(
                        [
                            f"- **{exception['id']}** — {exception['condition']} "
                            f"Use instead: {exception['use_instead']} "
                            f"Why: {exception['rationale']}",
                        ]
                    )
            if rule["relationships"]:
                lines.extend(["", "#### Relationships", ""])
                for relation in rule["relationships"]:
                    suffix = (
                        f" — {relation['resolution']}"
                        if relation.get("resolution")
                        else ""
                    )
                    lines.append(
                        f"- `{relation['type']}` → `{relation['target_id']}`{suffix}"
                    )
            lines.extend(["", "#### Evidence", ""])
            for evidence in rule["evidence"]:
                source = evidence["source"]
                if source.get("type") == "published_summary":
                    lines.append(
                        f"- `{evidence['id']}` · `{evidence['stance']}` · "
                        f"`{evidence['signal']}` — {evidence['summary']} "
                        "Source: published evidence summary"
                    )
                else:
                    locator = (
                        f"{source['thread_id'] or 'external'}/"
                        + ",".join(source["source_keys"])
                    )
                    lines.append(
                        f"- `{evidence['id']}` · `{evidence['stance']}` · "
                        f"`{evidence['signal']}` · episode "
                        f"`{evidence['episode_id']}` — {evidence['summary']} "
                        f"Source: `{locator}` · doctrine: "
                        f"`{evidence['doctrine_version_seen']}` · "
                        f"`{evidence['content_sha256']}`"
                    )
            lines.extend(
                [
                    "",
                    "#### Review Checks",
                    "",
                    *markdown_list(rule["verification"]["checks"]),
                ]
            )
    lines.append("")
    return "\n".join(lines)


def build_browse_view(
    loaded_rules: list[tuple[Path, dict[str, Any]]],
    digest: str,
    generated_at: str,
) -> str:
    try:
        template = BROWSE_TEMPLATE_PATH.read_text(encoding="utf-8")
    except FileNotFoundError as exc:
        raise DoctrineError(
            f"Missing browsable-library template: {BROWSE_TEMPLATE_PATH}"
        ) from exc
    placeholder = "__DOCTRINE_DATA__"
    if template.count(placeholder) != 1:
        raise DoctrineError(
            "Browsable-library template must contain exactly one data placeholder."
        )
    payload = {
        "meta": {
            "corpus_sha256": digest,
            "generated_at": generated_at,
            "rule_count": len(loaded_rules),
            "status_counts": dict(
                sorted(
                    Counter(
                        rule["lifecycle"]["status"] for _, rule in loaded_rules
                    ).items()
                )
            ),
        },
        "taxonomy": load_json(TAXONOMY_PATH),
        "rules": [
            {**rule, "canonical_path": relative_rule_path(path)}
            for path, rule in sorted(
                loaded_rules,
                key=lambda item: (
                    item[1]["classification"]["primary"],
                    item[1]["title"].lower(),
                ),
            )
        ],
    }
    rendered_data = json.dumps(
        payload,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).replace("</", "<\\/")
    return template.replace(placeholder, rendered_data)


def command_validate(_: argparse.Namespace) -> int:
    loaded_rules, errors = validate()
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        print(
            f"Validation failed: {len(errors)} error(s) across {len(loaded_rules)} rule(s).",
            file=sys.stderr,
        )
        return 1
    print(f"Validation passed: {len(loaded_rules)} rule(s).")
    return 0


def command_episode_id(args: argparse.Namespace) -> int:
    evidence = {
        "source": {"thread_id": args.thread_id},
        "episode_source_keys": args.source_key,
    }
    episode_id = deterministic_episode_id(evidence)
    if episode_id is None:
        raise DoctrineError("A thread ID and at least one source key are required.")
    print(episode_id)
    return 0


def command_basis(args: argparse.Namespace) -> int:
    for _, rule in load_rules():
        if rule.get("id") == args.rule_id:
            print(json.dumps(derived_confidence_basis(rule), indent=2))
            return 0
    raise DoctrineError(f"Unknown rule ID: {args.rule_id}")


def command_build(_: argparse.Namespace) -> int:
    loaded_rules, errors = validate()
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        raise DoctrineError("Cannot build generated views until validation passes.")
    digest = corpus_hash(loaded_rules)
    generated_at = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    catalog_text = build_catalog(loaded_rules, digest, generated_at)
    browse_text = build_browse_view(loaded_rules, digest, generated_at)
    index_rows = [compact_index_row(path, rule) for path, rule in loaded_rules]
    index_text = "".join(
        json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n"
        for row in sorted(index_rows, key=lambda row: row["id"])
    )
    atomic_write_text(CATALOG_PATH, catalog_text)
    atomic_write_text(INDEX_PATH, index_text)
    atomic_write_text(BROWSE_PATH, browse_text)
    manifest = {
        "schema_version": 1,
        "generated_at": generated_at,
        "corpus_sha256": digest,
        "rule_count": len(loaded_rules),
        "status_counts": dict(
            sorted(
                Counter(
                    rule["lifecycle"]["status"] for _, rule in loaded_rules
                ).items()
            )
        ),
        "canonical_files": [
            str(SCHEMA_PATH.relative_to(SKILL_DIR)),
            str(TAXONOMY_SCHEMA_PATH.relative_to(SKILL_DIR)),
            str(TAXONOMY_PATH.relative_to(SKILL_DIR)),
            *[relative_rule_path(path) for path, _ in loaded_rules],
        ],
        "generated_files": [
            str(CATALOG_PATH.relative_to(SKILL_DIR)),
            str(INDEX_PATH.relative_to(SKILL_DIR)),
            str(BROWSE_PATH.relative_to(SKILL_DIR)),
            str(MANIFEST_PATH.relative_to(SKILL_DIR)),
        ],
        "view_source_sha256": {
            str(BROWSE_TEMPLATE_PATH.relative_to(SKILL_DIR)): sha256_bytes(
                BROWSE_TEMPLATE_PATH.read_bytes()
            ),
        },
        "generated_sha256": {
            str(CATALOG_PATH.relative_to(SKILL_DIR)): sha256_bytes(
                catalog_text.encode("utf-8")
            ),
            str(INDEX_PATH.relative_to(SKILL_DIR)): sha256_bytes(
                index_text.encode("utf-8")
            ),
            str(BROWSE_PATH.relative_to(SKILL_DIR)): sha256_bytes(
                browse_text.encode("utf-8")
            ),
        },
    }
    atomic_write_json(MANIFEST_PATH, manifest)
    if not getattr(_, "quiet", False):
        print(
            f"Built {len(loaded_rules)} rule(s) into {GENERATED_DIR} "
            f"(corpus {digest[:12]})."
        )
    return 0


def tokenize(text: str) -> set[str]:
    normalized: set[str] = set()
    for token in TOKEN_RE.findall(text.lower()):
        if (
            len(token) > 3
            and token.endswith("s")
            and not token.endswith(("ss", "us", "is"))
        ):
            normalized.add(token[:-1])
        else:
            normalized.add(token)
    return normalized


def query_score(
    row: dict[str, Any],
    terms: set[str],
    product: str | None,
    domain: str | None,
    activity: str | None,
    artifact: str | None,
    surface: str | None,
) -> int:
    title_tokens = tokenize(row["title"])
    statement_tokens = tokenize(row["statement"])
    keyword_tokens = tokenize(" ".join(row["keywords"] + row["aliases"]))
    surface_tokens = tokenize(
        " ".join(
            row["surfaces"]
            + row["contexts"]
            + row["activities"]
            + row["artifacts"]
        )
    )
    applicability_tokens = tokenize(" ".join(row["when"] + row["not_when"]))
    guidance_tokens = tokenize(
        " ".join(row["prefer"] + row["avoid"] + row["exceptions"] + row["checks"])
    )
    all_tokens = (
        title_tokens
        | statement_tokens
        | keyword_tokens
        | surface_tokens
        | applicability_tokens
        | guidance_tokens
    )
    if terms:
        minimum_matches = 1 if len(terms) <= 2 else 2
        if len(terms & all_tokens) < minimum_matches:
            return -1
    term_score = 0
    term_score += 10 * len(terms & title_tokens)
    term_score += 7 * len(terms & keyword_tokens)
    term_score += 5 * len(terms & statement_tokens)
    term_score += 3 * len(terms & surface_tokens)
    term_score += 2 * len(terms & applicability_tokens)
    term_score += len(terms & guidance_tokens)
    if terms and term_score == 0:
        return -1
    score = term_score
    if product and product in row["products"]:
        score += 8
    if product and "global" in row["products"]:
        score += 3
    if domain and (
        row["primary"] == domain
        or row["primary"].startswith(domain + ".")
        or domain in row["secondary"]
    ):
        score += 8
    if activity and activity in row["activities"]:
        score += 6
    if artifact and artifact in row["artifacts"]:
        score += 6
    if surface and tokenize(surface) & tokenize(" ".join(row["surfaces"])):
        score += 6
    score += {"required": 4, "default": 3, "preference": 2, "warning": 2}.get(
        row["strength"], 0
    )
    score += {"high": 3, "medium": 2, "low": 1}.get(row["confidence"], 0)
    return score


def index_rows() -> list[dict[str, Any]]:
    if not INDEX_PATH.exists():
        command_build(argparse.Namespace(quiet=True))
    else:
        current, _, _ = manifest_is_current()
        if not current:
            command_build(argparse.Namespace(quiet=True))
    rows: list[dict[str, Any]] = []
    for line in INDEX_PATH.read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def select_query_rows(
    *,
    text: str,
    product: str | None,
    domain: str | None,
    activity: str | None,
    artifact: str | None,
    surface: str | None,
    status: str | None,
    all_statuses: bool,
    limit: int,
) -> list[tuple[int, dict[str, Any]]]:
    taxonomy = taxonomy_sets()
    if domain in taxonomy["aliases"]:
        domain = taxonomy["aliases"][domain]
    if domain in taxonomy["deprecated"]:
        successors = sorted(taxonomy["deprecated"][domain])
        raise DoctrineError(
            f"Taxonomy id {domain!r} is deprecated; use "
            + (", ".join(successors) if successors else "an active taxonomy id")
            + "."
        )
    terms = tokenize(text)
    rows = index_rows()
    selected: list[tuple[int, dict[str, Any]]] = []
    for row in rows:
        if not all_statuses and status is None and row["status"] != ACTIVE_STATUS:
            continue
        if status and row["status"] != status:
            continue
        if product and not (
            product in row["products"] or "global" in row["products"]
        ):
            continue
        if domain and not (
            row["primary"] == domain
            or row["primary"].startswith(domain + ".")
            or domain in row["secondary"]
        ):
            continue
        if activity and activity not in row["activities"]:
            continue
        if artifact and artifact not in row["artifacts"]:
            continue
        if surface and not (
            tokenize(surface) & tokenize(" ".join(row["surfaces"]))
        ):
            continue
        score = query_score(
            row,
            terms,
            product,
            domain,
            activity,
            artifact,
            surface,
        )
        if terms and score <= 0:
            continue
        selected.append((score, row))
    selected.sort(key=lambda item: (-item[0], item[1]["id"]))
    return selected[:limit]


def command_query(args: argparse.Namespace) -> int:
    if args.limit < 1 or args.limit > 100:
        raise DoctrineError("Query limit must be between 1 and 100.")
    selected = select_query_rows(
        text=args.text or "",
        product=args.product,
        domain=args.domain,
        activity=args.activity,
        artifact=args.artifact,
        surface=args.surface,
        status=args.status,
        all_statuses=args.all_statuses,
        limit=args.limit,
    )
    if args.json:
        print(json.dumps([row | {"score": score} for score, row in selected], indent=2))
        return 0
    if not selected:
        print("No applicable doctrine rules found.")
        return 0
    print("| Score | Rule | Status | Strength | Statement |")
    print("| ---: | --- | --- | --- | --- |")
    for score, row in selected:
        statement = row["statement"].replace("|", "\\|").replace("\n", " ")
        print(
            f"| {score} | `{row['id']}` {row['title']} | `{row['status']}` | "
            f"`{row['strength']}` | {statement} |"
        )
    return 0


def command_test(_: argparse.Namespace) -> int:
    payload = load_json(RETRIEVAL_EVALS_PATH)
    if not isinstance(payload, dict) or not isinstance(payload.get("cases"), list):
        raise DoctrineError(
            f"Retrieval evals must contain a cases array: {RETRIEVAL_EVALS_PATH}"
        )
    failures: list[str] = []
    for case in payload["cases"]:
        if not isinstance(case, dict) or not isinstance(case.get("id"), str):
            raise DoctrineError("Each retrieval eval must be an object with a string id.")
        selected = select_query_rows(
            text=str(case.get("text", "")),
            product=case.get("product"),
            domain=case.get("domain"),
            activity=case.get("activity"),
            artifact=case.get("artifact"),
            surface=case.get("surface"),
            status=case.get("status"),
            all_statuses=bool(case.get("all_statuses", False)),
            limit=int(case.get("limit", 12)),
        )
        ids = [row["id"] for _, row in selected]
        expected_first = case.get("expected_first")
        expected_contains = set(case.get("expected_contains", []))
        expected_excludes = set(case.get("expected_excludes", []))
        max_results = case.get("max_results")
        case_failures: list[str] = []
        if expected_first is not None and (not ids or ids[0] != expected_first):
            case_failures.append(
                f"expected first {expected_first}, got {ids[0] if ids else 'none'}"
            )
        missing = sorted(expected_contains - set(ids))
        if missing:
            case_failures.append(f"missing {', '.join(missing)}")
        present = sorted(expected_excludes & set(ids))
        if present:
            case_failures.append(f"unexpected {', '.join(present)}")
        if max_results is not None and len(ids) > int(max_results):
            case_failures.append(
                f"expected at most {int(max_results)} result(s), got {len(ids)}"
            )
        if case_failures:
            failures.append(f"{case['id']}: {'; '.join(case_failures)}")
            print(f"FAIL {case['id']}: {', '.join(ids) or 'no results'}")
        else:
            print(f"PASS {case['id']}: {', '.join(ids) or 'no results'}")
    if failures:
        print("\nRetrieval eval failures:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1
    print(f"Retrieval evals passed: {len(payload['cases'])} case(s).")
    return 0


def evidence_verification(
    db_path: Path,
    loaded_rules: list[tuple[Path, dict[str, Any]]] | None = None,
) -> tuple[list[str], int, int, int]:
    if not db_path.exists():
        raise DoctrineError(f"bb database not found: {db_path}")
    connection = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    errors: list[str] = []
    record_count = 0
    locator_count = 0
    published_count = 0
    try:
        for path, rule in (
            loaded_rules if loaded_rules is not None else load_rules()
        ):
            for evidence in rule["evidence"]:
                source = evidence["source"]
                if source.get("type") == "published_summary":
                    published_count += 1
                    continue
                thread_id = source.get("thread_id")
                source_keys = source.get("source_keys", [])
                if not thread_id or not source_keys:
                    continue
                record_count += 1
                texts: list[str] = []
                for source_key in source_keys:
                    rows = connection.execute(
                        """
                        SELECT s.text, s.source_kind, t.project_id
                        FROM thread_search_segments s
                        JOIN threads t ON t.id = s.thread_id
                        WHERE s.thread_id = ? AND s.source_key = ?
                        """,
                        (thread_id, source_key),
                    ).fetchall()
                    locator_count += 1
                    if len(rows) != 1:
                        errors.append(
                            f"{path}: {evidence['id']} locator "
                            f"{thread_id}/{source_key} resolved {len(rows)} rows"
                        )
                        continue
                    row = rows[0]
                    if row["source_kind"] != "user_message":
                        errors.append(
                            f"{path}: {evidence['id']} locator is not a user message"
                        )
                    if (
                        source.get("project_id") is not None
                        and row["project_id"] != source["project_id"]
                    ):
                        errors.append(
                            f"{path}: {evidence['id']} project id does not match source"
                        )
                    texts.append(row["text"])
                if len(texts) == len(source_keys):
                    resolved_hash = "sha256:" + sha256_bytes(
                        "\n\n".join(texts).encode("utf-8")
                    )
                    if resolved_hash != evidence["content_sha256"]:
                        errors.append(
                            f"{path}: {evidence['id']} content hash mismatch"
                        )
                for episode_source_key in (
                    set(evidence.get("episode_source_keys", [])) - set(source_keys)
                ):
                    rows = connection.execute(
                        """
                        SELECT s.source_kind, t.project_id
                        FROM thread_search_segments s
                        JOIN threads t ON t.id = s.thread_id
                        WHERE s.thread_id = ? AND s.source_key = ?
                        """,
                        (thread_id, episode_source_key),
                    ).fetchall()
                    locator_count += 1
                    if len(rows) != 1:
                        errors.append(
                            f"{path}: {evidence['id']} episode locator "
                            f"{thread_id}/{episode_source_key} resolved {len(rows)} rows"
                        )
                        continue
                    row = rows[0]
                    if row["source_kind"] != "user_message":
                        errors.append(
                            f"{path}: {evidence['id']} episode locator is not "
                            "a user message"
                        )
                    if (
                        source.get("project_id") is not None
                        and row["project_id"] != source["project_id"]
                    ):
                        errors.append(
                            f"{path}: {evidence['id']} episode locator project "
                            "does not match source"
                        )
    finally:
        connection.close()
    return errors, record_count, locator_count, published_count


def command_verify_evidence(args: argparse.Namespace) -> int:
    errors, record_count, locator_count, published_count = evidence_verification(
        Path(args.db)
    )
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        print(
            f"Evidence verification failed: {len(errors)} error(s).",
            file=sys.stderr,
        )
        return 1
    print(
        f"Evidence verified: {record_count} record(s), "
        f"{locator_count} direct user-message locator(s), "
        f"{published_count} published summary record(s)."
    )
    return 0


def is_relay(text: str) -> bool:
    stripped = text.lstrip().lower()
    return stripped.startswith("[bb system]") or stripped.startswith("[bb message")


def signal_score(text: str) -> int:
    tokens = tokenize(text)
    return 2 * len(tokens & DESIGN_TERMS) + len(tokens & NORMATIVE_TERMS)


def truncate_utf8(text: str, max_bytes: int) -> tuple[str, bool]:
    encoded = text.encode("utf-8")
    if len(encoded) <= max_bytes:
        return text, False
    marker = "…".encode("utf-8")
    clipped = encoded[: max(0, max_bytes - len(marker))]
    return clipped.decode("utf-8", errors="ignore") + marker.decode("utf-8"), True


@state_locked
def command_scan(args: argparse.Namespace) -> int:
    if args.limit < 1 or args.limit > 1000:
        raise DoctrineError("Scan limit must be between 1 and 1000.")
    if args.max_bytes < 16_384 or args.max_bytes > 4_194_304:
        raise DoctrineError("Scan byte limit must be between 16384 and 4194304.")
    if args.max_message_bytes < 1_024 or args.max_message_bytes > args.max_bytes:
        raise DoctrineError(
            "Per-message byte limit must be between 1024 and the scan byte limit."
        )
    state = load_state()
    cursor = state.get("cursor") or {}
    lease = load_lease_receipt() or {}
    lease_high_water = lease.get("high_water") or {}
    cursor_created_at = cursor.get("created_at")
    cursor_segment_id = cursor.get("segment_id")
    db_path = Path(args.db)
    if not db_path.exists():
        raise DoctrineError(f"bb database not found: {db_path}")
    excluded_projects = set(state.get("excluded_projects", []))
    excluded_threads = set(state.get("excluded_threads", []))
    connection = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    try:
        high_water = connection.execute(
            """
            SELECT created_at, id
            FROM thread_search_segments
            WHERE source_kind = 'user_message'
            ORDER BY created_at DESC, id DESC
            LIMIT 1
            """
        ).fetchone()
        effective_high_water = (
            {
                "created_at": lease_high_water["created_at"],
                "segment_id": lease_high_water["segment_id"],
            }
            if lease_high_water.get("created_at") is not None
            and lease_high_water.get("segment_id") is not None
            else (
                {
                    "created_at": high_water["created_at"],
                    "segment_id": high_water["id"],
                }
                if high_water
                else None
            )
        )
        clauses = ["s.source_kind = 'user_message'"]
        params: list[Any] = []
        if cursor_created_at is not None and cursor_segment_id is not None:
            clauses.append("(s.created_at > ? OR (s.created_at = ? AND s.id > ?))")
            params.extend([cursor_created_at, cursor_created_at, cursor_segment_id])
        if effective_high_water:
            clauses.append("(s.created_at < ? OR (s.created_at = ? AND s.id <= ?))")
            params.extend(
                [
                    effective_high_water["created_at"],
                    effective_high_water["created_at"],
                    effective_high_water["segment_id"],
                ]
            )
        if excluded_projects:
            marks = ",".join("?" for _ in excluded_projects)
            clauses.append(f"t.project_id NOT IN ({marks})")
            params.extend(sorted(excluded_projects))
        if excluded_threads:
            marks = ",".join("?" for _ in excluded_threads)
            clauses.append(f"t.id NOT IN ({marks})")
            params.extend(sorted(excluded_threads))
        params.append(args.limit)
        rows = connection.execute(
            f"""
            SELECT s.id AS segment_id,
                   s.thread_id,
                   s.source_key,
                   s.source_seq,
                   s.text,
                   s.created_at,
                   t.project_id,
                   COALESCE(t.title, t.title_fallback) AS thread_title
            FROM thread_search_segments s
            JOIN threads t ON t.id = s.thread_id
            WHERE {' AND '.join(clauses)}
            ORDER BY s.created_at, s.id
            LIMIT ?
            """,
            params,
        ).fetchall()
    finally:
        connection.close()

    def assemble_payload(selected_rows: list[sqlite3.Row]) -> dict[str, Any]:
        messages = []
        for row in selected_rows:
            relay = is_relay(row["text"])
            if relay and not args.include_relays:
                continue
            text_value, text_truncated = truncate_utf8(
                row["text"], args.max_message_bytes
            )
            messages.append(
                {
                    "segment_id": row["segment_id"],
                    "thread_id": row["thread_id"],
                    "source_key": row["source_key"],
                    "source_seq": row["source_seq"],
                    "project_id": row["project_id"],
                    "thread_title": row["thread_title"],
                    "created_at": row["created_at"],
                    "is_relay": relay,
                    "design_signal_score": signal_score(row["text"]),
                    "text_truncated": text_truncated,
                    "text": text_value,
                }
            )
        window_end = (
            {
                "created_at": selected_rows[-1]["created_at"],
                "segment_id": selected_rows[-1]["segment_id"],
            }
            if selected_rows
            else None
        )
        cursor_commit = window_end or {
            "created_at": cursor_created_at,
            "segment_id": cursor_segment_id,
        }
        scan_fingerprint = [
            {
                "segment_id": row["segment_id"],
                "created_at": row["created_at"],
                "content_sha256": sha256_bytes(row["text"].encode("utf-8")),
            }
            for row in selected_rows
        ]
        return {
            "cursor_before": {
                "created_at": cursor_created_at,
                "segment_id": cursor_segment_id,
            },
            "high_water": effective_high_water,
            "window_end": window_end,
            "cursor_commit": cursor_commit,
            "evidence_sha256": sha256_bytes(
                canonical_json_bytes(scan_fingerprint)
            ),
            "selected_row_count": len(selected_rows),
            "returned_message_count": len(messages),
            "byte_limit": args.max_bytes,
            "per_message_byte_limit": args.max_message_bytes,
            "messages": messages,
        }

    candidate_rows = list(rows)
    low = 0
    high = len(candidate_rows)
    while low < high:
        midpoint = (low + high + 1) // 2
        candidate_payload = assemble_payload(candidate_rows[:midpoint])
        rendered_size = len(
            json.dumps(
                candidate_payload,
                indent=2,
                ensure_ascii=False,
            ).encode("utf-8")
        )
        if rendered_size <= args.max_bytes:
            low = midpoint
        else:
            high = midpoint - 1
    if candidate_rows and low == 0:
        raise DoctrineError(
            "The first scan row cannot fit within the configured byte limit."
        )
    rows = candidate_rows[:low]
    payload = assemble_payload(rows)
    rendered = json.dumps(payload, indent=2, ensure_ascii=False)
    if len(rendered.encode("utf-8")) > args.max_bytes:
        raise DoctrineError("Internal error: rendered scan exceeds its byte limit.")
    if lease:
        lease["scan"] = {
            "window_end": payload["window_end"],
            "cursor_commit": payload["cursor_commit"],
            "evidence_sha256": payload["evidence_sha256"],
            "selected_row_count": payload["selected_row_count"],
            "returned_message_count": payload["returned_message_count"],
            "include_relays": bool(args.include_relays),
            "byte_limit": args.max_bytes,
            "per_message_byte_limit": args.max_message_bytes,
        }
        write_lease_receipt(lease)
    print(rendered)
    return 0


def current_manifest_hash() -> str:
    loaded_rules, errors = validate()
    if errors:
        raise DoctrineError("Doctrine is invalid; cannot compute trusted corpus hash.")
    return corpus_hash(loaded_rules)


@state_locked
def command_begin_run(args: argparse.Namespace) -> int:
    state = load_state()
    existing = load_lease_receipt()
    now = dt.datetime.now(dt.timezone.utc).replace(microsecond=0)
    if existing and not args.replace_stale:
        started_at = existing.get("started_at")
        try:
            started = dt.datetime.fromisoformat(started_at)
        except (TypeError, ValueError):
            started = now
        age = now - started
        if age < dt.timedelta(hours=6):
            raise DoctrineError(
                f"Maintenance lease {existing.get('id')} is still active "
                f"({age.total_seconds() / 60:.0f} minutes old)."
            )
        raise DoctrineError(
            "A stale maintenance lease exists. Re-run begin-run with "
            "--replace-stale after inspecting the previous run."
        )
    db_path = Path(args.db)
    if not db_path.exists():
        raise DoctrineError(f"bb database not found: {db_path}")
    connection = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    try:
        high_water = connection.execute(
            """
            SELECT created_at, id
            FROM thread_search_segments
            WHERE source_kind = 'user_message'
            ORDER BY created_at DESC, id DESC
            LIMIT 1
            """
        ).fetchone()
    finally:
        connection.close()
    loaded_rules, errors = validate()
    if errors:
        raise DoctrineError("Doctrine is invalid; refusing to begin maintenance.")
    lease = {
        "id": "lease_" + uuid.uuid4().hex[:16],
        "started_at": now.isoformat(),
        "cursor_before": state.get("cursor"),
        "high_water": (
            {
                "created_at": high_water["created_at"],
                "segment_id": high_water["id"],
            }
            if high_water
            else None
        ),
        "corpus_sha256": corpus_hash(loaded_rules),
        "active_authority_sha256": active_authority_hash(loaded_rules),
        "active_evidence": active_evidence_snapshot(loaded_rules),
        "rule_evidence": rule_evidence_snapshot(loaded_rules),
        "locked_files_sha256": locked_maintenance_hashes(),
        "rule_files_sha256": rule_file_hashes(loaded_rules),
        "rule_statuses": {
            rule["id"]: rule["lifecycle"]["status"] for _, rule in loaded_rules
        },
        "scan": None,
    }
    write_lease_receipt(lease)
    print(json.dumps(lease, indent=2))
    return 0


def cursor_key(cursor: dict[str, Any] | None) -> tuple[int, str] | None:
    if not cursor:
        return None
    created_at = cursor.get("created_at")
    segment_id = cursor.get("segment_id")
    if not isinstance(created_at, int) or not isinstance(segment_id, str):
        return None
    return created_at, segment_id


@state_locked
def command_record_run(args: argparse.Namespace) -> int:
    state = load_state()
    lease = load_lease_receipt()
    if not lease or lease.get("id") != args.lease_id:
        raise DoctrineError(
            "Maintenance lease does not match; refusing to record or advance state."
        )
    loaded_rules, errors = validate()
    if errors:
        raise DoctrineError("Doctrine is invalid; refusing to record maintenance.")
    trusted_hash = corpus_hash(loaded_rules)
    if active_authority_hash(loaded_rules) != lease.get("active_authority_sha256"):
        raise DoctrineError(
            "Active rule authority changed during maintenance; refusing to record."
        )
    if locked_maintenance_hashes() != lease.get("locked_files_sha256"):
        raise DoctrineError(
            "Locked doctrine files changed during maintenance; refusing to record."
        )
    previous_rule_hashes = lease.get("rule_files_sha256")
    if not isinstance(previous_rule_hashes, dict):
        raise DoctrineError("Lease is missing its canonical rule snapshot.")
    current_rule_hashes = rule_file_hashes(loaded_rules)
    actual_changed_ids = {
        rule_id
        for rule_id in set(previous_rule_hashes) | set(current_rule_hashes)
        if previous_rule_hashes.get(rule_id) != current_rule_hashes.get(rule_id)
    }
    requested_changed_ids = set(args.changed_rule_id)
    if actual_changed_ids != requested_changed_ids:
        raise DoctrineError(
            "Declared changed rule IDs do not match the leased canonical diff."
        )
    if len(actual_changed_ids) > 5:
        raise DoctrineError("A maintenance run may change at most five rule files.")
    previous_statuses = lease.get("rule_statuses")
    if not isinstance(previous_statuses, dict):
        raise DoctrineError("Lease is missing its canonical lifecycle snapshot.")
    current_by_id = {rule["id"]: rule for _, rule in loaded_rules}
    previous_active_evidence = lease.get("active_evidence")
    if not isinstance(previous_active_evidence, dict):
        raise DoctrineError("Lease is missing its active evidence snapshot.")
    for rule_id, previous_items in previous_active_evidence.items():
        current_rule = current_by_id.get(rule_id)
        if current_rule is None:
            raise DoctrineError("Automated maintenance may not delete active rules.")
        current_items = {
            item.get("id"): item for item in current_rule.get("evidence", [])
        }
        for previous_item in previous_items:
            evidence_id = previous_item.get("id")
            if current_items.get(evidence_id) != previous_item:
                raise DoctrineError(
                    "Active-rule evidence is append-only; existing provenance "
                    f"changed or disappeared for {rule_id}/{evidence_id}."
                )
    previous_rule_evidence = lease.get("rule_evidence")
    if not isinstance(previous_rule_evidence, dict):
        raise DoctrineError("Lease is missing its complete evidence snapshot.")
    for rule_id in sorted(actual_changed_ids):
        if rule_id not in current_by_id:
            raise DoctrineError("Automated maintenance may not delete rule files.")
        current_rule = current_by_id[rule_id]
        previous_items = {
            item.get("id"): item
            for item in previous_rule_evidence.get(rule_id, [])
        }
        for evidence in current_rule.get("evidence", []):
            source = evidence.get("source", {})
            if source.get("type") == "published_summary":
                if previous_items.get(evidence.get("id")) != evidence:
                    raise DoctrineError(
                        "Published evidence summaries are human-reviewed and may "
                        "not be added or changed by automated maintenance."
                    )
                continue
            if (
                source.get("type")
                not in {"bb_task_episode", "current_user_instruction"}
                or not source.get("thread_id")
                or not source.get("source_keys")
            ):
                raise DoctrineError(
                    "Automated maintenance may only change rules whose evidence "
                    "resolves to direct bb user messages; unverifiable evidence "
                    "requires explicit human review."
                )
        current_status = current_rule["lifecycle"]["status"]
        if rule_id not in previous_rule_hashes:
            if current_status != "candidate":
                raise DoctrineError("New automated rules must start as candidates.")
            continue
        previous_status = previous_statuses.get(rule_id)
        if previous_status == ACTIVE_STATUS and current_status == ACTIVE_STATUS:
            continue
        if previous_status == "candidate" and current_status == "candidate":
            continue
        raise DoctrineError(
            "Automated maintenance may only edit candidates or evidence on "
            "still-active rules."
        )
    if args.result == "no-change" and actual_changed_ids:
        raise DoctrineError("A no-change run cannot contain canonical rule changes.")
    if args.result == "updated" and not actual_changed_ids:
        raise DoctrineError("An updated run must declare a canonical rule change.")
    if args.result == "failed" and actual_changed_ids:
        raise DoctrineError(
            "Revert canonical rule changes before recording a failed run."
        )
    if args.contested:
        raise DoctrineError("Automated maintenance may not contest rules.")
    if args.expected_corpus_hash and args.expected_corpus_hash != trusted_hash:
        raise DoctrineError(
            "Corpus changed since the run began; refusing to advance maintenance state."
        )
    if args.result in {"updated", "no-change"}:
        if not args.expected_corpus_hash:
            raise DoctrineError("Successful runs require expected-corpus-hash.")
        scan = lease.get("scan")
        if not isinstance(scan, dict):
            raise DoctrineError("Successful runs require a leased scan.")
        if scan.get("include_relays"):
            raise DoctrineError(
                "Automated maintenance cannot commit a relay-inclusive scan."
            )
        expected_cursor = cursor_key(scan.get("cursor_commit"))
        supplied_cursor = cursor_key(
            {
                "created_at": args.cursor_created_at,
                "segment_id": args.cursor_segment_id,
            }
        )
        if expected_cursor is None or supplied_cursor != expected_cursor:
            raise DoctrineError(
                "Cursor must exactly match the leased scan cursor_commit."
            )
        before_cursor = cursor_key(lease.get("cursor_before"))
        high_water = cursor_key(lease.get("high_water"))
        if before_cursor and supplied_cursor < before_cursor:
            raise DoctrineError("Maintenance cursor cannot move backward.")
        if high_water and supplied_cursor > high_water:
            raise DoctrineError("Maintenance cursor cannot exceed lease high-water.")
        if args.evidence_hash != scan.get("evidence_sha256"):
            raise DoctrineError(
                "Evidence hash must exactly match the leased scan fingerprint."
            )
        if args.scanned != scan.get("selected_row_count"):
            raise DoctrineError(
                "Scanned count must match the leased scan selected-row count."
            )
        added_ids = actual_changed_ids - set(previous_rule_hashes)
        updated_ids = actual_changed_ids & set(previous_rule_hashes)
        if args.added != len(added_ids) or args.updated != len(updated_ids):
            raise DoctrineError(
                "Added and updated counts must match the canonical rule diff."
            )
        evidence_errors, _, _, _ = evidence_verification(
            Path(args.db), loaded_rules
        )
        if evidence_errors:
            raise DoctrineError(
                "Evidence verification failed; refusing to advance state: "
                + evidence_errors[0]
            )
    elif args.cursor_created_at is not None or args.cursor_segment_id is not None:
        raise DoctrineError("Failed runs cannot advance the maintenance cursor.")
    now = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()
    last_run = {
        "completed_at": now,
        "result": args.result,
        "scanned": args.scanned,
        "added": args.added,
        "updated": args.updated,
        "contested": args.contested,
        "evidence_sha256": args.evidence_hash,
        "corpus_sha256": trusted_hash,
        "note": args.note,
    }
    state["last_run"] = last_run
    state.pop("lease", None)
    state["corpus_sha256"] = trusted_hash
    if args.result in {"updated", "no-change"}:
        if args.cursor_created_at is None or args.cursor_segment_id is None:
            raise DoctrineError("Successful runs require both cursor fields.")
        state["cursor"] = {
            "created_at": args.cursor_created_at,
            "segment_id": args.cursor_segment_id,
        }
    atomic_write_cli_state(STATE_PATH, state)
    clear_lease_receipt()
    print(
        f"Recorded {args.result} run at {now}; "
        f"cursor {'advanced' if args.result in {'updated', 'no-change'} else 'preserved'}."
    )
    return 0


def manifest_is_current() -> tuple[bool, str | None, str]:
    current = current_manifest_hash()
    if not MANIFEST_PATH.exists():
        return False, None, current
    manifest = load_json(MANIFEST_PATH)
    built = manifest.get("corpus_sha256")
    if built != current:
        return False, built, current
    generated_hashes = manifest.get("generated_sha256")
    if not isinstance(generated_hashes, dict):
        return False, built, current
    view_source_hashes = manifest.get("view_source_sha256")
    template_relative_path = str(BROWSE_TEMPLATE_PATH.relative_to(SKILL_DIR))
    if (
        not isinstance(view_source_hashes, dict)
        or view_source_hashes.get(template_relative_path)
        != sha256_bytes(BROWSE_TEMPLATE_PATH.read_bytes())
    ):
        return False, built, current
    for relative_path in (
        str(CATALOG_PATH.relative_to(SKILL_DIR)),
        str(INDEX_PATH.relative_to(SKILL_DIR)),
        str(BROWSE_PATH.relative_to(SKILL_DIR)),
    ):
        expected = generated_hashes.get(relative_path)
        path = SKILL_DIR / relative_path
        if (
            not isinstance(expected, str)
            or not path.exists()
            or sha256_bytes(path.read_bytes()) != expected
        ):
            return False, built, current
    return True, built, current


def command_status(_: argparse.Namespace) -> int:
    loaded_rules, errors = validate()
    if errors:
        print(f"Doctrine invalid: {len(errors)} error(s).")
        for error in errors[:20]:
            print(f"- {error}")
        return 1
    counts = Counter(rule["lifecycle"]["status"] for _, rule in loaded_rules)
    current, built_hash, corpus = manifest_is_current()
    state = load_state()
    print(f"Rules: {len(loaded_rules)}")
    for status in sorted(ALL_STATUSES):
        print(f"  {status}: {counts.get(status, 0)}")
    print(f"Corpus: sha256:{corpus}")
    print(
        "Generated views: "
        + ("current" if current else f"stale or missing (built {built_hash or 'none'})")
    )
    cursor = state.get("cursor") or {}
    print(
        "Cursor: "
        f"{cursor.get('created_at') or 'uninitialized'} / "
        f"{cursor.get('segment_id') or 'uninitialized'}"
    )
    lease = load_lease_receipt()
    print(
        "Maintenance lease: "
        + (
            f"{lease.get('id')} since {lease.get('started_at')}"
            if lease
            else "none"
        )
    )
    automation = state.get("automation") or {}
    print(
        f"Automation: {automation.get('id') or 'not configured'} "
        f"({automation.get('name') or 'unnamed'})"
    )
    if state.get("last_run"):
        print(
            f"Last maintenance: {state['last_run'].get('result')} at "
            f"{state['last_run'].get('completed_at')}"
        )
    else:
        print("Last maintenance: none")
    return 0


def run_bb(args: list[str], capture: bool = False) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["bb", *args],
        check=False,
        text=True,
        capture_output=capture,
    )


def automation_identity() -> tuple[str, str]:
    state = load_state()
    automation = state.get("automation") or {}
    automation_id = automation.get("id")
    project_id = automation.get("project_id")
    if not automation_id or not project_id:
        raise DoctrineError(
            "Automation is not configured in maintenance/state.json."
        )
    return automation_id, project_id


@state_locked
def command_configure_automation(args: argparse.Namespace) -> int:
    state = load_state()
    state["automation"] = {
        "id": args.automation_id,
        "name": args.name,
        "project_id": args.project_id,
    }
    atomic_write_cli_state(STATE_PATH, state)
    print(
        f"Configured automation {args.automation_id} for project {args.project_id}."
    )
    return 0


def command_automation_status(_: argparse.Namespace) -> int:
    automation_id, project_id = automation_identity()
    result = run_bb(
        [
            "plugin",
            "run",
            "automations",
            "show",
            automation_id,
            "--project",
            project_id,
            "--json",
        ]
    )
    if result.returncode != 0:
        raise DoctrineError("Unable to inspect doctrine automation.")
    return 0


def command_run_now(args: argparse.Namespace) -> int:
    automation_id, project_id = automation_identity()
    key = args.idempotency_key or (
        "design-doctrine-"
        + dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    )
    result = run_bb(
        [
            "plugin",
            "run",
            "automations",
            "run",
            automation_id,
            "--project",
            project_id,
            "--idempotency-key",
            key,
            "--json",
        ]
    )
    if result.returncode != 0:
        raise DoctrineError("Unable to start doctrine automation.")
    return 0


def command_last_output(_: argparse.Namespace) -> int:
    automation_id, project_id = automation_identity()
    result = run_bb(
        [
            "plugin",
            "run",
            "automations",
            "runs",
            automation_id,
            "--project",
            project_id,
            "--limit",
            "20",
            "--json",
        ],
        capture=True,
    )
    if result.returncode != 0:
        raise DoctrineError(result.stderr.strip() or "Unable to list automation runs.")
    payload = json.loads(result.stdout)
    runs = payload.get("runs", payload if isinstance(payload, list) else [])
    if not runs:
        print("No doctrine automation runs found.")
        return 0
    latest = runs[0]
    thread_id = latest.get("threadId") or latest.get("thread_id")
    if thread_id:
        output = run_bb(["thread", "output", thread_id])
        return output.returncode
    print(json.dumps(latest, indent=2))
    return 0


def command_open(_: argparse.Namespace) -> int:
    current, _, _ = manifest_is_current()
    if not current:
        command_build(argparse.Namespace())
    result = run_bb(["thread", "open", str(BROWSE_PATH)], capture=True)
    if result.returncode == 0:
        return 0
    fallback = subprocess.run(
        ["open", str(BROWSE_PATH)],
        capture_output=True,
        text=True,
        check=False,
    )
    if fallback.returncode == 0:
        return 0
    print(str(BROWSE_PATH))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Operate the personal design doctrine."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    validate_parser = subparsers.add_parser("validate", help="Validate all rules.")
    validate_parser.set_defaults(func=command_validate)

    episode_parser = subparsers.add_parser(
        "episode-id", help="Derive an episode ID from a bb source span."
    )
    episode_parser.add_argument("--thread-id", required=True)
    episode_parser.add_argument(
        "--source-key", action="append", required=True
    )
    episode_parser.set_defaults(func=command_episode_id)

    basis_parser = subparsers.add_parser(
        "basis", help="Print the exact derived confidence basis for a rule."
    )
    basis_parser.add_argument("--rule-id", required=True)
    basis_parser.set_defaults(func=command_basis)

    build_parser_ = subparsers.add_parser(
        "build", help="Regenerate catalog, browsable library, index, and manifest."
    )
    build_parser_.set_defaults(func=command_build)

    query_parser = subparsers.add_parser("query", help="Find applicable rules.")
    query_parser.add_argument("--text", default="")
    query_parser.add_argument("--product")
    query_parser.add_argument("--domain")
    query_parser.add_argument("--activity")
    query_parser.add_argument("--artifact")
    query_parser.add_argument("--surface")
    query_parser.add_argument("--status", choices=sorted(ALL_STATUSES))
    query_parser.add_argument("--all-statuses", action="store_true")
    query_parser.add_argument("--limit", type=int, default=12)
    query_parser.add_argument("--json", action="store_true")
    query_parser.set_defaults(func=command_query)

    test_parser = subparsers.add_parser(
        "test", help="Run deterministic doctrine retrieval and authority evals."
    )
    test_parser.set_defaults(func=command_test)

    evidence_parser = subparsers.add_parser(
        "verify-evidence",
        help="Resolve canonical evidence locators and verify source hashes.",
    )
    evidence_parser.add_argument("--db", default=str(DEFAULT_DB_PATH))
    evidence_parser.set_defaults(func=command_verify_evidence)

    scan_parser = subparsers.add_parser(
        "scan", help="Emit incremental user-message evidence."
    )
    scan_parser.add_argument("--db", default=str(DEFAULT_DB_PATH))
    scan_parser.add_argument("--limit", type=int, default=200)
    scan_parser.add_argument("--max-bytes", type=int, default=524_288)
    scan_parser.add_argument("--max-message-bytes", type=int, default=32_768)
    scan_parser.add_argument("--include-relays", action="store_true")
    scan_parser.set_defaults(func=command_scan)

    begin_parser = subparsers.add_parser(
        "begin-run", help="Acquire a bounded maintenance lease."
    )
    begin_parser.add_argument("--db", default=str(DEFAULT_DB_PATH))
    begin_parser.add_argument("--replace-stale", action="store_true")
    begin_parser.set_defaults(func=command_begin_run)

    record_parser = subparsers.add_parser(
        "record-run", help="Atomically record a completed maintenance run."
    )
    record_parser.add_argument("--lease-id", required=True)
    record_parser.add_argument(
        "--result", choices=["updated", "no-change", "failed"], required=True
    )
    record_parser.add_argument("--cursor-created-at", type=int)
    record_parser.add_argument("--cursor-segment-id")
    record_parser.add_argument("--scanned", type=int, default=0)
    record_parser.add_argument("--added", type=int, default=0)
    record_parser.add_argument("--updated", type=int, default=0)
    record_parser.add_argument("--contested", type=int, default=0)
    record_parser.add_argument("--evidence-hash")
    record_parser.add_argument("--expected-corpus-hash")
    record_parser.add_argument("--db", default=str(DEFAULT_DB_PATH))
    record_parser.add_argument(
        "--changed-rule-id",
        action="append",
        default=[],
        help="Canonical rule ID changed by this run; repeat for each changed rule.",
    )
    record_parser.add_argument("--note", default="")
    record_parser.set_defaults(func=command_record_run)

    status_parser = subparsers.add_parser("status", help="Show corpus health.")
    status_parser.set_defaults(func=command_status)

    configure_parser = subparsers.add_parser(
        "configure-automation",
        help="Store the bb automation and project used by maintenance controls.",
    )
    configure_parser.add_argument("--automation-id", required=True)
    configure_parser.add_argument("--project-id", required=True)
    configure_parser.add_argument(
        "--name", default="Design doctrine maintainer"
    )
    configure_parser.set_defaults(func=command_configure_automation)

    automation_parser = subparsers.add_parser(
        "automation-status", help="Inspect the scheduled maintainer."
    )
    automation_parser.set_defaults(func=command_automation_status)

    run_parser = subparsers.add_parser("run-now", help="Run or retry maintenance.")
    run_parser.add_argument("--idempotency-key")
    run_parser.set_defaults(func=command_run_now)

    output_parser = subparsers.add_parser(
        "last-output", help="Show the latest maintainer result."
    )
    output_parser.set_defaults(func=command_last_output)

    open_parser = subparsers.add_parser(
        "open", help="Open the generated browsable library."
    )
    open_parser.set_defaults(func=command_open)
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    try:
        return int(args.func(args))
    except DoctrineError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        print("Interrupted.", file=sys.stderr)
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
