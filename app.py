import json
import os
import re
import shutil
import tempfile
import time
import zipfile
from collections import Counter
from pathlib import Path

import rarfile
from flask import Flask, jsonify, render_template, request
from unidecode import unidecode

app = Flask(__name__)

CONFIG_PATH = Path(__file__).parent / "config.json"

DEFAULT_CONFIG = {
    "source_dir": "/path/to/incoming",
    "destinations": [],
    "template": "{series} - T{tome:02d}{ext}",
    "template_no_tome": "{series}{ext}",
    "template_rules": [],  # [{filter: "manga", template: "...", template_no_tome: "..."}]
}

EXTENSIONS = {".cbr", ".cbz", ".pdf"}

HISTORY_PATH = Path(__file__).parent / "history.json"
HISTORY_MAX_ENTRIES = 500


def load_config() -> dict:
    """Load configuration from config.json, creating it with defaults if missing."""
    if CONFIG_PATH.is_file():
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    save_config(DEFAULT_CONFIG)
    return dict(DEFAULT_CONFIG)


def save_config(cfg: dict) -> None:
    """Write configuration to config.json."""
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2, ensure_ascii=False)
        f.write("\n")


def normalize(name: str) -> str:
    """Normalize a series name for matching: lowercase, strip accents, articles, punctuation."""
    name = name.lower().strip()
    name = unidecode(name)  # é→e, à→a, ü→u
    name = re.sub(r"['\-:!?,./()&]", " ", name)  # punctuation → space
    name = re.sub(r"\b(l|le|la|les|the|d|de|du|des|un|une)\b", "", name)  # articles
    name = re.sub(r"\s+", " ", name).strip()
    return name


def detect_tome(filename: str) -> int | None:
    """Detect tome/volume number from a filename."""
    name = Path(filename).stem

    # Strip bracket/paren metadata before detection to avoid false positives
    # e.g. [Digital-1920px], (2025), [NEO RIP-Club]
    cleaned = re.sub(r"\[.*?\]", "", name)
    cleaned = re.sub(r"\(.*?\)", "", cleaned)
    # Remove "Digital-NNNN" patterns
    cleaned = re.sub(r"(?i)digital[- ]?\d+", "", cleaned)

    patterns = [
        r"(?i)\btome[\s._-]*(\d+)",        # Tome 12, Tome.12, Tome-12
        r"(?i)(?<![a-z])T[\s._-]?(\d{1,3})(?!\d)", # T12, T.12 (max 3 digits, not part of word)
        r"(?i)\bvol(?:ume)?[\s._-]*(\d+)",  # Vol.12, Vol 12, Volume 12
        r"(?i)\bv[\s._](\d+)",             # v12, v.12
        r"#(\d+)",                          # #12
        r"(?:^|[\s._\-])(\d{1,3})(?:[\s._\-]|$)",  # nombre isolé (max 3 digits)
    ]

    for pattern in patterns:
        match = re.search(pattern, cleaned)
        if match:
            return int(match.group(1))

    return None


def detect_series(filename: str) -> str:
    """Guess the series name from a filename."""
    name = Path(filename).stem

    # Strip BD.FR.- prefix
    name = re.sub(r"^BD\.FR\.\-\.?\s*", "", name)

    # Remove common bracket/paren blocks: (auteur), [Digital-xxx], [NEO RIP-Club], (année), (éditeur)
    name = re.sub(r"\[.*?\]", "", name)
    name = re.sub(r"\(.*?\)", "", name)

    # Remove known noise patterns
    name = re.sub(r"(?i)\b(digital|rip[- ]?club|prof\.?x|tch|neo|toner|pitoufos|seulementbd)\b", "", name)
    name = re.sub(r"\b\d{4}\b", "", name)  # years like 2024

    # Replace dots/underscores used as separators with spaces
    if "." in name and " " not in name.strip():
        name = name.replace(".", " ")
    name = name.replace("_", " ")

    # Remove tome/volume indicators and everything after
    # "T01", "T 01", "Tome 1", "Vol.1", "- 01 -", "- Tome 1"
    name = re.sub(r"(?i)[\s\-]+T\s?\d+.*$", "", name)
    name = re.sub(r"(?i)[\s\-]+Tome\s*\d+.*$", "", name)
    name = re.sub(r"(?i)[\s\-]+Vol(?:ume)?\.?\s*\d+.*$", "", name)
    name = re.sub(r"\s*-\s*\d{1,4}\s*-.*$", "", name)  # " - 01 - subtitle"
    name = re.sub(r"\s*-\s*\d{1,4}\s*$", "", name)      # trailing " - 01"
    # Standalone number in middle/end of name: "series 02 subtitle"
    name = re.sub(r"\s+\d{1,3}\s+.*$", "", name)
    name = re.sub(r"\s+\d{1,3}$", "", name)

    # Remove "OS" (one-shot marker)
    name = re.sub(r"\b-?\s*OS\s*-?\b", "", name)

    # Clean up trailing/leading separators and whitespace
    name = re.sub(r"[\s\-_.]+$", "", name)
    name = re.sub(r"^[\s\-_.]+", "", name)
    name = re.sub(r"\s{2,}", " ", name)

    return name.strip()


_series_cache: dict | None = None
_series_cache_time: float = 0
_norm_cache: dict[str, str] = {}  # series_key -> normalized_key


def get_existing_series(ttl: float = 30) -> dict[str, list[dict]]:
    """Scan all destination folders and return existing series with their location.

    Results are cached for `ttl` seconds to avoid repeated filesystem scans.
    Also pre-computes normalized keys for fast matching.
    """
    global _series_cache, _series_cache_time, _norm_cache
    now = time.time()
    if _series_cache is not None and (now - _series_cache_time) < ttl:
        return _series_cache

    series = {}
    norms = {}
    cfg = load_config()
    for dest in cfg["destinations"]:
        dest_path = Path(dest)
        if not dest_path.is_dir():
            continue
        dest_label = dest_path.name
        for d in dest_path.iterdir():
            if d.is_dir() and not d.name.startswith("@"):
                key = d.name.lower()
                if key not in series:
                    series[key] = []
                    norms[key] = normalize(key)
                series[key].append({
                    "name": d.name,
                    "destination": dest,
                    "dest_label": dest_label,
                })
    _series_cache = series
    _norm_cache = norms
    _series_cache_time = now
    return series


def get_norm_cache() -> dict[str, str]:
    """Return the pre-computed normalized keys (call after get_existing_series)."""
    return _norm_cache


def invalidate_series_cache():
    """Invalidate the series cache (call after organizing files)."""
    global _series_cache, _series_cache_time, _norm_cache
    _series_cache = None
    _norm_cache = {}
    _series_cache_time = 0


def _load_history() -> list:
    if HISTORY_PATH.is_file():
        try:
            with open(HISTORY_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return []
    return []


def _save_history(history: list) -> None:
    with open(HISTORY_PATH, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2, ensure_ascii=False)
        f.write("\n")


def log_action(action: str, details: dict) -> None:
    """Log an action to history.json."""
    history = _load_history()
    entry = {"timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"), "action": action, **details}
    history.insert(0, entry)
    if len(history) > HISTORY_MAX_ENTRIES:
        history = history[:HISTORY_MAX_ENTRIES]
    _save_history(history)


def search_series(query: str, existing: dict[str, list[dict]], limit: int = 10) -> list[dict]:
    """Search existing series by query string (normalized + raw substring)."""
    if not query:
        return []

    q = query.lower().strip()
    q_norm = normalize(query)
    results = []
    seen = set()
    norms = get_norm_cache()

    for series_key, entries in existing.items():
        key_norm = norms.get(series_key, normalize(series_key))
        if q in series_key or q_norm in key_norm:
            for entry in entries:
                uid = f"{entry['name']}|{entry['destination']}"
                if uid not in seen:
                    seen.add(uid)
                    results.append(entry)

    # Sort: exact prefix matches first, then by name
    results.sort(key=lambda e: (0 if normalize(e["name"]).startswith(q_norm) else 1, e["name"].lower()))
    return results[:limit]


def _token_overlap(a: str, b: str) -> float:
    """Return token overlap ratio between two normalized strings."""
    ta = set(a.split())
    tb = set(b.split())
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / max(len(ta), len(tb))


def score_match(guessed_name: str, series_key: str, g_norm: str = "", s_norm: str = "") -> float:
    """Score how well a guessed name matches an existing series key (0.0-1.0).

    g_norm/s_norm: pre-computed normalized strings (avoids redundant normalize calls).
    """
    key = guessed_name.lower().strip()
    # Exact raw match
    if key == series_key:
        return 1.0
    if not g_norm:
        g_norm = normalize(guessed_name)
    if not s_norm:
        s_norm = normalize(series_key)
    # Exact normalized match
    if g_norm == s_norm:
        return 0.95
    # Prefix match (one is prefix of the other)
    if g_norm.startswith(s_norm) or s_norm.startswith(g_norm):
        shorter = min(len(g_norm), len(s_norm))
        longer = max(len(g_norm), len(s_norm))
        if shorter > 0 and shorter / longer >= 0.5:
            return 0.7
    # Token overlap
    overlap = _token_overlap(g_norm, s_norm)
    if overlap >= 0.8:
        return 0.6 + overlap * 0.2  # 0.76-0.8
    return overlap * 0.5  # low score for poor overlap


def find_best_match(guessed_name: str, existing: dict[str, list[dict]], threshold: float = 0.6) -> tuple[dict | None, float]:
    """Find the best existing series match for a guessed name.

    Returns (match_entry, score) where score is 0.0-1.0.
    score >= 0.9: high confidence (auto-match)
    0.6 <= score < 0.9: suggestion (user confirms)
    score < threshold: no match returned
    """
    if not guessed_name:
        return None, 0.0

    best_entry = None
    best_score = 0.0
    g_norm = normalize(guessed_name)
    norms = get_norm_cache()

    for series_key, entries in existing.items():
        s_norm = norms.get(series_key, "")
        s = score_match(guessed_name, series_key, g_norm, s_norm)
        if s > best_score:
            best_score = s
            best_entry = entries[0]
        if s >= 1.0:
            break  # Perfect match, stop early

    if best_score >= threshold:
        return best_entry, best_score
    return None, 0.0


def list_files(source_dir: str) -> list[dict]:
    """List comic files in the source directory (recursive, skips .trash/)."""
    source = Path(source_dir)
    if not source.is_dir():
        return []

    existing = get_existing_series()

    files = []
    for f in sorted(source.rglob("*")):
        # Skip .trash directory and hidden folders
        try:
            rel = f.relative_to(source)
        except ValueError:
            continue
        if any(part.startswith(".") for part in rel.parts):
            continue
        if f.is_file() and f.suffix.lower() in EXTENSIONS:
            rel_name = str(rel) if len(rel.parts) > 1 else f.name
            guessed = detect_series(f.name)
            match, match_score = find_best_match(guessed, existing)
            size = f.stat().st_size
            files.append({
                "name": rel_name,
                "size": size,
                "size_human": format_size(size),
                "tome": detect_tome(f.name),
                "extension": f.suffix.lower(),
                "series_guess": guessed,
                "series_match": match,
                "match_score": round(match_score, 2),
            })
    return files


def is_safe_filename(filename: str, base_dir: str) -> bool:
    """Check that filename doesn't escape base_dir via path traversal."""
    if not filename or ".." in filename:
        return False
    resolved = (Path(base_dir) / filename).resolve()
    return resolved.is_relative_to(Path(base_dir).resolve())


def format_size(size_bytes: int) -> str:
    """Format bytes into human-readable size."""
    for unit in ["o", "Ko", "Mo", "Go"]:
        if size_bytes < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} To"


DEFAULT_TEMPLATE = "{series} - T{tome:02d}{ext}"
DEFAULT_TEMPLATE_NO_TOME = "{series}{ext}"


def get_template_for_dest(cfg: dict, destination: str) -> tuple[str, str]:
    """Return (template, template_no_tome) for a given destination path.

    Checks template_rules in order; first rule whose filter is found
    (case-insensitive substring) in the destination path wins.
    Falls back to the global template.
    """
    dest_lower = destination.lower()
    for rule in cfg.get("template_rules", []):
        filt = rule.get("filter", "").strip().lower()
        if filt and filt in dest_lower:
            return (
                rule.get("template", cfg.get("template", DEFAULT_TEMPLATE)),
                rule.get("template_no_tome", cfg.get("template_no_tome", DEFAULT_TEMPLATE_NO_TOME)),
            )
    return (
        cfg.get("template", DEFAULT_TEMPLATE),
        cfg.get("template_no_tome", DEFAULT_TEMPLATE_NO_TOME),
    )


def apply_template(template: str, series: str, tome: int | None, ext: str,
                    template_no_tome: str = "", title: str = "") -> str:
    """Apply a naming template to produce the final filename."""
    if tome is None:
        tpl = template_no_tome or DEFAULT_TEMPLATE_NO_TOME
        result = tpl.replace("{series}", series)
        result = result.replace("{title}", title)
        result = result.replace("{ext}", ext.lower())
        result = result.replace("{EXT}", ext.upper())
        return result

    result = template
    result = result.replace("{series}", series)
    result = result.replace("{tome:03d}", f"{tome:03d}")
    result = result.replace("{tome:02d}", f"{tome:02d}")
    result = result.replace("{tome}", str(tome))
    result = result.replace("{title}", title)
    result = result.replace("{ext}", ext.lower())
    result = result.replace("{EXT}", ext.upper())
    # Clean up dangling separators if title is empty
    if not title:
        result = re.sub(r"\s*-\s*-", " -", result)
        result = re.sub(r"\s*-\s*\.", ".", result)
    return result


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/files")
def api_files():
    cfg = load_config()
    source = request.args.get("source", cfg["source_dir"])
    files = list_files(source)
    return jsonify({"files": files, "source": source})


@app.route("/api/detect-tome", methods=["POST"])
def api_detect_tome():
    data = request.get_json()
    filename = data.get("filename", "")
    tome = detect_tome(filename)
    return jsonify({"filename": filename, "tome": tome})


@app.route("/api/search-series")
def api_search_series():
    q = request.args.get("q", "")
    existing = get_existing_series()
    results = search_series(q, existing)
    return jsonify({"results": results})


def _audit_series(series_name: str, dest: str, dest_label: str, files: list[dict],
                   template: str, template_no_tome: str) -> dict:
    """Audit a single series folder."""
    tomes = [f["tome"] for f in files if f["tome"] is not None]
    extensions = list(set(f["extension"] for f in files))

    # Missing tomes detection
    missing_tomes = []
    if len(tomes) >= 2:
        tomes_sorted = sorted(set(tomes))
        for i in range(tomes_sorted[0], tomes_sorted[-1] + 1):
            if i not in tomes_sorted:
                missing_tomes.append(i)

    # Duplicate tomes
    tome_counts = Counter(tomes)
    duplicate_tomes = [{"tome": t, "count": c} for t, c in tome_counts.items() if c > 1]

    # Naming issues
    naming_issues = []
    for f in files:
        expected = apply_template(template, series_name, f["tome"], f["extension"], template_no_tome)
        if f["name"] != expected:
            naming_issues.append({
                "current": f["name"],
                "expected": expected,
                "tome": f["tome"],
            })

    mixed_extensions = len(extensions) > 1

    return {
        "series_name": series_name,
        "destination": dest,
        "dest_label": dest_label,
        "file_count": len(files),
        "files": files,
        "tomes": sorted(set(tomes)),
        "missing_tomes": missing_tomes,
        "duplicate_tomes": duplicate_tomes,
        "naming_issues": naming_issues,
        "mixed_extensions": mixed_extensions,
        "extensions": extensions,
        "is_empty": len(files) == 0,
        "has_issues": bool(
            missing_tomes or duplicate_tomes or naming_issues
            or mixed_extensions or len(files) == 0 or len(files) == 1
        ),
    }


def audit_collections() -> dict:
    """Scan all destination folders and return quality audit results."""
    cfg = load_config()

    results: dict = {"series": [], "summary": {}}

    for dest in cfg["destinations"]:
        dest_path = Path(dest)
        if not dest_path.is_dir():
            continue
        dest_label = dest_path.name
        template, template_no_tome = get_template_for_dest(cfg, dest)

        for series_dir in sorted(dest_path.iterdir()):
            if not series_dir.is_dir() or series_dir.name.startswith((".", "@")):
                continue

            files = []
            for f in sorted(series_dir.iterdir()):
                if f.is_file() and f.suffix.lower() in EXTENSIONS:
                    tome = detect_tome(f.name)
                    size = f.stat().st_size
                    files.append({
                        "name": f.name,
                        "tome": tome,
                        "extension": f.suffix.lower(),
                        "size": size,
                        "size_human": format_size(size),
                    })

            entry = _audit_series(series_dir.name, dest, dest_label, files, template, template_no_tome)
            results["series"].append(entry)

    s = results["series"]
    results["summary"] = {
        "total_series": len(s),
        "series_with_gaps": sum(1 for x in s if x["missing_tomes"]),
        "series_with_naming_issues": sum(1 for x in s if x["naming_issues"]),
        "empty_folders": sum(1 for x in s if x["is_empty"]),
        "single_file_series": sum(1 for x in s if x["file_count"] == 1),
        "duplicate_tomes": sum(1 for x in s if x["duplicate_tomes"]),
    }
    return results


@app.route("/api/audit")
def api_audit():
    results = audit_collections()
    return jsonify(results)


@app.route("/api/audit/fix-naming", methods=["POST"])
def api_fix_naming():
    data = request.get_json()
    cfg = load_config()
    fixes = data.get("fixes", [])

    if not fixes:
        return jsonify({"error": "Aucun fichier à corriger"}), 400

    results = []
    for fix in fixes:
        dest = fix.get("destination", "")
        series_name = fix.get("series_name", "")
        current = fix.get("current", "")
        expected = fix.get("expected", "")

        if dest not in cfg["destinations"]:
            results.append({"current": current, "error": "Destination non autorisée"})
            continue

        series_dir = Path(dest) / series_name
        current_path = series_dir / current
        expected_path = series_dir / expected

        if not current_path.is_file():
            results.append({"current": current, "error": "Fichier introuvable"})
            continue
        if expected_path.exists() and expected_path != current_path:
            results.append({"current": current, "error": f"{expected} existe déjà"})
            continue

        try:
            current_path.rename(expected_path)
            results.append({"current": current, "expected": expected, "success": True})
            log_action("fix_naming", {"series": series_name, "current": current, "expected": expected})
        except Exception as e:
            results.append({"current": current, "error": str(e)})

    invalidate_series_cache()
    return jsonify({"results": results})


@app.route("/api/history")
def api_history():
    history = _load_history()
    action_filter = request.args.get("action", "")
    if action_filter:
        history = [h for h in history if h["action"] == action_filter]
    return jsonify({"history": history, "total": len(history)})


@app.route("/api/template-preview", methods=["POST"])
def api_template_preview():
    data = request.get_json()
    template = data.get("template", DEFAULT_TEMPLATE)
    series = data.get("series", "One Piece")
    tome = data.get("tome", 5)
    ext = data.get("ext", ".cbz")
    title = data.get("title", "Le voyage de Balaba")
    preview = apply_template(template, series, tome, ext, title=title)
    return jsonify({"preview": preview})


@app.route("/api/organize-matched", methods=["POST"])
def api_organize_matched():
    """Organize all auto-matched files in one batch."""
    data = request.get_json()
    cfg = load_config()
    source_dir = data.get("source_dir", cfg["source_dir"])
    items = data.get("items", [])  # [{source, series_name, destination, tome}]

    if not items:
        return jsonify({"error": "Aucun fichier à organiser"}), 400

    results = []
    for item in items:
        series_name = item.get("series_name", "").strip()
        destination = item.get("destination", "").strip()
        source_name = item.get("source", "")
        tome = item.get("tome")
        title = item.get("title", "").strip()

        if not is_safe_filename(source_name, source_dir):
            results.append({"source": source_name, "error": "Chemin non autorisé"})
            continue
        if not series_name or not destination:
            results.append({"source": source_name, "error": "Série ou destination manquante"})
            continue
        if destination not in cfg["destinations"]:
            results.append({"source": source_name, "error": "Destination non autorisée"})
            continue

        series_dir = Path(destination) / series_name
        series_dir.mkdir(parents=True, exist_ok=True)

        source_path = Path(source_dir) / source_name
        if not source_path.is_file():
            results.append({"source": source_name, "error": "Fichier introuvable"})
            continue

        ext = source_path.suffix.lower()
        tpl, tpl_no_tome = get_template_for_dest(cfg, destination)
        new_name = apply_template(tpl, series_name, int(tome) if tome is not None else None, ext, tpl_no_tome, title)

        dest_path = series_dir / new_name
        if dest_path.exists():
            results.append({"source": source_name, "error": f"{new_name} existe déjà"})
            continue

        try:
            shutil.move(str(source_path), str(dest_path))
        except Exception as e:
            results.append({"source": source_name, "error": str(e)})
            continue

        results.append({
            "source": source_name,
            "destination": str(dest_path),
            "new_name": new_name,
            "success": True,
        })
        log_action("organize_batch", {"source": source_name, "destination": str(dest_path), "new_name": new_name, "series": series_name})

    invalidate_series_cache()
    return jsonify({"results": results})


@app.route("/api/organize", methods=["POST"])
def api_organize():
    data = request.get_json()
    cfg = load_config()
    series_name = data.get("series_name", "").strip()
    destination = data.get("destination", "").strip()
    source_dir = data.get("source_dir", cfg["source_dir"])
    files = data.get("files", [])

    if not series_name:
        return jsonify({"error": "Nom de série requis"}), 400
    if not destination:
        return jsonify({"error": "Destination requise"}), 400
    if not files:
        return jsonify({"error": "Aucun fichier sélectionné"}), 400

    # Validate destination
    if destination not in cfg["destinations"]:
        return jsonify({"error": "Destination non autorisée"}), 400

    force = data.get("force", False)
    series_dir = Path(destination) / series_name

    # Warn if directory already exists (unless user confirmed)
    if series_dir.is_dir() and not force:
        existing = [f.name for f in series_dir.iterdir() if f.is_file()]
        return jsonify({
            "warning": f"Le dossier \"{series_name}\" existe déjà dans {destination.split('/')[-1]}",
            "existing_files": existing,
        }), 200

    # Create series directory
    series_dir.mkdir(parents=True, exist_ok=True)

    results = []
    for file_info in files:
        source_name = file_info.get("source", "")
        tome = file_info.get("tome")
        title = file_info.get("title", "").strip()

        if not is_safe_filename(source_name, source_dir):
            results.append({"source": source_name, "error": "Chemin non autorisé"})
            continue

        source_path = Path(source_dir) / source_name
        if not source_path.is_file():
            results.append({"source": source_name, "error": "Fichier introuvable"})
            continue

        ext = source_path.suffix.lower()
        tpl, tpl_no_tome = get_template_for_dest(cfg, destination)
        new_name = apply_template(tpl, series_name, int(tome) if tome is not None else None, ext, tpl_no_tome, title)

        dest_path = series_dir / new_name

        # Avoid overwriting
        if dest_path.exists():
            results.append({"source": source_name, "error": f"{new_name} existe déjà"})
            continue

        try:
            shutil.move(str(source_path), str(dest_path))
        except Exception as e:
            results.append({"source": source_name, "error": str(e)})
            continue

        results.append({
            "source": source_name,
            "destination": str(dest_path),
            "new_name": new_name,
            "success": True,
        })
        log_action("organize", {"source": source_name, "destination": str(dest_path), "new_name": new_name, "series": series_name})

    invalidate_series_cache()
    return jsonify({"results": results, "series_dir": str(series_dir)})


@app.route("/api/delete", methods=["POST"])
def api_delete():
    data = request.get_json()
    cfg = load_config()
    source_dir = data.get("source_dir", cfg["source_dir"])
    filename = data.get("filename", "").strip()

    if not filename or not is_safe_filename(filename, source_dir):
        return jsonify({"error": "Chemin non autorisé"}), 400

    file_path = Path(source_dir) / filename

    if not file_path.is_file():
        return jsonify({"error": "Fichier introuvable"}), 400

    # Soft delete: move to .trash/ subfolder (preserve subdirectory structure)
    trash_path = Path(source_dir) / ".trash" / filename
    trash_path.parent.mkdir(parents=True, exist_ok=True)
    if trash_path.exists():
        trash_path.unlink()
    shutil.move(str(file_path), str(trash_path))
    log_action("delete", {"filename": filename, "source_dir": source_dir})
    return jsonify({"success": True, "filename": filename})


@app.route("/api/undelete", methods=["POST"])
def api_undelete():
    data = request.get_json()
    cfg = load_config()
    source_dir = data.get("source_dir", cfg["source_dir"])
    filename = data.get("filename", "").strip()

    if not filename or not is_safe_filename(filename, source_dir):
        return jsonify({"error": "Chemin non autorisé"}), 400

    trash_path = Path(source_dir) / ".trash" / filename
    restore_path = Path(source_dir) / filename

    if not trash_path.is_file():
        return jsonify({"error": "Fichier introuvable dans la corbeille"}), 400

    restore_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(trash_path), str(restore_path))
    log_action("undelete", {"filename": filename, "source_dir": source_dir})
    return jsonify({"success": True, "filename": filename})


@app.route("/api/config")
def api_get_config():
    return jsonify(load_config())


@app.route("/api/config", methods=["POST"])
def api_save_config():
    data = request.get_json()
    source_dir = data.get("source_dir", "").strip()
    destinations = data.get("destinations", [])

    if not source_dir:
        return jsonify({"error": "Le dossier source est requis"}), 400
    if not isinstance(destinations, list) or len(destinations) == 0:
        return jsonify({"error": "Au moins une destination est requise"}), 400

    # Clean up: strip whitespace, remove empty entries
    destinations = [d.strip() for d in destinations if d.strip()]
    if not destinations:
        return jsonify({"error": "Au moins une destination est requise"}), 400

    template = data.get("template", DEFAULT_TEMPLATE).strip()
    template_no_tome = data.get("template_no_tome", DEFAULT_TEMPLATE_NO_TOME).strip()
    if "{series}" not in template or "{ext}" not in template.lower():
        return jsonify({"error": "Le template doit contenir {series} et {ext}"}), 400

    template_rules = data.get("template_rules", [])
    # Validate rules
    clean_rules = []
    for rule in template_rules:
        filt = rule.get("filter", "").strip()
        rtpl = rule.get("template", "").strip()
        rtpl_nt = rule.get("template_no_tome", "").strip()
        if not filt or not rtpl:
            continue
        if "{series}" not in rtpl or "{ext}" not in rtpl.lower():
            return jsonify({"error": f"Règle \"{filt}\" : le template doit contenir {{series}} et {{ext}}"}), 400
        clean_rules.append({"filter": filt, "template": rtpl, "template_no_tome": rtpl_nt or template_no_tome})

    cfg = {
        "source_dir": source_dir,
        "destinations": destinations,
        "template": template,
        "template_no_tome": template_no_tome,
        "template_rules": clean_rules,
    }
    save_config(cfg)
    invalidate_series_cache()
    return jsonify({"success": True, "config": cfg})


def convert_cbr_to_cbz(cbr_path: Path, delete_original: bool = False) -> Path:
    """Convert a .cbr (RAR) file to .cbz (ZIP). Returns the path of the created .cbz."""
    cbz_path = cbr_path.with_suffix(".cbz")
    if cbz_path.exists():
        raise FileExistsError(f"{cbz_path.name} existe déjà")

    with tempfile.TemporaryDirectory() as tmp:
        with rarfile.RarFile(str(cbr_path)) as rf:
            rf.extractall(tmp)

        with zipfile.ZipFile(str(cbz_path), "w", zipfile.ZIP_STORED) as zf:
            for root, _dirs, fnames in os.walk(tmp):
                for fname in sorted(fnames):
                    fpath = Path(root) / fname
                    arcname = str(fpath.relative_to(tmp))
                    zf.write(fpath, arcname)

        if delete_original:
            cbr_path.unlink()

    return cbz_path


@app.route("/api/scan-cbr")
def api_scan_cbr():
    scan_path = request.args.get("path", "").strip()
    if not scan_path:
        return jsonify({"error": "Chemin requis"}), 400

    base = Path(scan_path)
    if not base.is_dir():
        return jsonify({"error": "Dossier introuvable"}), 400

    groups: dict[str, dict] = {}
    for f in sorted(base.rglob("*.cbr")):
        if any(part.startswith(".") for part in f.relative_to(base).parts):
            continue
        parent = f.parent
        group_key = str(parent)
        if group_key not in groups:
            groups[group_key] = {
                "folder": str(parent),
                "series_name": parent.name if parent != base else "(racine)",
                "files": [],
            }
        cbz_sibling = f.with_suffix(".cbz")
        groups[group_key]["files"].append({
            "name": f.name,
            "path": str(f),
            "size": f.stat().st_size,
            "size_human": format_size(f.stat().st_size),
            "tome": detect_tome(f.name),
            "has_cbz": cbz_sibling.exists(),
        })

    return jsonify({"groups": list(groups.values())})


@app.route("/api/convert", methods=["POST"])
def api_convert():
    data = request.get_json()
    items = data.get("items", [])
    delete_original = data.get("delete_original", False)

    if not items:
        return jsonify({"error": "Aucun fichier sélectionné"}), 400

    results = []
    for item in items:
        cbr_path = Path(item.get("path", ""))
        if not cbr_path.is_file() or cbr_path.suffix.lower() != ".cbr":
            results.append({"source": str(cbr_path), "error": "Fichier CBR introuvable"})
            continue

        try:
            cbz_path = convert_cbr_to_cbz(cbr_path, delete_original)
            results.append({
                "source": cbr_path.name,
                "destination": cbz_path.name,
                "success": True,
            })
            log_action("convert", {
                "source": str(cbr_path),
                "destination": str(cbz_path),
                "deleted_original": delete_original,
            })
        except Exception as e:
            results.append({"source": cbr_path.name, "error": str(e)})

    return jsonify({"results": results})


if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "0").lower() in ("1", "true", "yes")
    app.run(host="0.0.0.0", port=9045, debug=debug)
