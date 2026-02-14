# Tana - Project Knowledge

## Overview
Tana (棚 = "shelf" in Japanese) is a Flask web app for organizing manga/BD/comic collections (CBR, CBZ, PDF). Single-page app with vanilla JS frontend, no frameworks.

## Architecture

### Backend
- **`app.py`** — Single Flask file, all routes and logic. Runs on port 9045.
- **`config.json`** — Runtime config (destinations, templates, extensions, etc.)
- **`history.json`** — Action log (organize, delete, convert, fix_naming)
- **Python 3.10+** — Uses `Path.is_relative_to()`, `match` syntax, `dict | None` type hints
- **Dependencies**: Flask, rarfile, unidecode, Pillow, PyMuPDF (see `requirements.txt`)

### Frontend
- **`templates/index.html`** — Single page, 6 tabs: Dashboard, Fichiers, Audit, Convertir, Historique, Configuration
- **`static/app.js`** — All frontend logic, DOM manipulation, API calls
- **`static/i18n.js`** — FR/EN translations via `TRANSLATIONS` object and `t(key, params)` function
- **`static/style.css`** — Full styling with CSS custom properties for dark/light themes
- **`static/favicon.svg`** — SVG favicon (T-shelf with colored books, orange accent)

### Key Patterns
- **View switching**: `data-view` attribute on nav buttons, sections toggled via `id="view-{name}"`
- **i18n**: `data-i18n` attributes auto-translated by `applyI18n()`, JS uses `t("key", {params})`
- **Config lists**: `renderXxxList()` + delegated click handler for remove + add button (sources, destinations, extensions, rules)
- **Autocomplete**: Debounced fetch (200ms) with keyboard navigation (arrows, enter, escape)
- **Cache busting**: `?v=N` on script tags in index.html (currently v=18)
- **Display toggle**: Always use `style.display = "block"` not `""` to override CSS `display: none`

## CSS Theme Variables
- Dark: `--bg: #08090c`, `--bg-surface: #111318`, `--bg-elevated: #191c24`
- Light: `--bg: #f4f5f7`, `--bg-surface: #ffffff`, `--bg-elevated: #ebedf2`
- Accent: `--accent: #ff6b35` (orange)
- Fonts: Outfit (body), JetBrains Mono (code/paths)

## API Endpoints
- `GET /api/files` — List files from all source directories with match scoring
- `GET /api/config` / `POST /api/config` — Load/save configuration
- `GET /api/search-series?q=` — Search existing series
- `GET /api/series-folders?q=` — Series folders for convert autocomplete
- `POST /api/organize` — Move files to series folder
- `POST /api/organize-matched` — Batch organize auto-matched files
- `POST /api/delete` / `POST /api/undelete` — Soft delete (moves to .trash/)
- `GET /api/audit` — Full collection audit (naming, gaps, duplicates)
- `POST /api/audit/fix-naming` — Rename files to match templates
- `GET /api/dashboard` — Collection stats (series, volumes, size, formats)
- `GET /api/scan-cbr?path=` — Scan for CBR files (restricted to destinations)
- `POST /api/convert` — Convert CBR to CBZ (restricted to destinations)
- `GET /api/trash` — List trash files from all sources
- `POST /api/trash/restore` — Restore files from trash (items: [{name, source_dir}])
- `POST /api/trash/purge` — Permanently delete trash files (items: [{name, source_dir}])
- `GET /api/thumbnail/<filename>?source=` — Get file cover thumbnail (with optional source dir)
- `POST /api/upload` — Upload files to source directory
- `GET /api/history` — Action history
- `POST /api/undo/<id>` — Undo a reversible action
- `POST /api/template-preview` — Preview naming template

## Config Fields
- `sources` — List of incoming files directories (migrated from legacy `source_dir`)
- `destinations` — List of destination root folders
- `extensions` — File extensions to scan (default: .cbr, .cbz, .pdf)
- `template` / `template_no_tome` — Naming templates with variables: {series}, {tome:02d}, {title}, {ext}
- `template_rules` — Per-destination template overrides (filter substring match)
- `audit_case` — Case checking mode: "ignore", "first" (default), "title"
- `dashboard_enabled` — Show/hide dashboard tab (default: false)
- `thumbnails_enabled` — Show/hide cover thumbnails (default: true)
- `lang` — "fr" or "en"

## Key Functions (app.py)
- `get_sources(cfg)` — Returns list of source directories (with legacy `source_dir` fallback)
- `get_existing_series(ttl=30)` — Cached scan of all destination folders
- `detect_tome(filename)` / `detect_title(filename)` / `detect_series(filename)` — Filename parsing
- `find_best_match(guessed, existing)` — Fuzzy series matching with scoring
- `apply_template(template, series, tome, ext, template_no_tome, title)` — Generate filename from template
- `audit_collections()` — Full audit scan (naming, gaps, duplicates, empty)
- `_check_case(name, expected, mode)` — Configurable case verification
- `format_size(bytes)` — Human-readable size (o, Ko, Mo, Go, To)

## Security
- Convert scan/convert restricted to configured destinations via `Path.is_relative_to()`
- File operations validate paths with `is_safe_filename()` (no `..` traversal)
- Soft delete moves to `.trash/` subfolder (reversible)

## Git
- Author: druss
- Commit messages in French
- Co-authored with Claude
