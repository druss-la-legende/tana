# Tana - File Organizer (CBZ/CBR/PDF)

**Langue / Language:** [Francais](#francais) | [English](#english)

---

<a id="francais"></a>

> **Tana** (棚) signifie "etagere" en japonais. Tana range vos fichiers sur la bonne etagere.

Outil web pour organiser une collection de manga/BD (CBR, CBZ, PDF) depuis un dossier d'import vers des destinations categorisees. Se place entre le telechargement et un lecteur type Komga/Kavita.

## Fonctionnalites

### Organisation
- Detection automatique du nom de serie et du numero de tome (`Tome 12`, `T12`, `Vol.12`, `v12`, `#12`)
- Nettoyage des noms de fichiers (prefixes BD.FR, metadonnees entre crochets, marqueurs scene)
- Matching avec les series existantes (normalisation accents/articles, scoring multi-criteres)
- Organisation batch ou fichier par fichier via le bouton "Ajouter a"
- Mode triage rapide avec raccourcis clavier (fleches, entree, suppr)
- Groupement visuel par serie, tri et filtres par nom/taille/tome/statut
- Recherche dans les series existantes avec autocompletion
- Liens externes vers Nautiljon et Manga-News
- Drag & drop et import de fichiers

### Miniatures
- Apercu de la couverture (1ere image) dans la liste des fichiers et le mode triage
- Support CBZ, CBR et PDF
- Cache disque dans `.thumbnails/` (invalidation automatique)
- Activable/desactivable dans la configuration

### Templates de nommage
- Variables : `{series}`, `{tome}`, `{tome:02d}`, `{tome:03d}`, `{title}`, `{ext}`, `{EXT}`
- Template par defaut : `{series} - T{tome:02d}{ext}`
- Template sans tome pour les one-shots
- Regles par destination (ex: un format pour `manga/`, un autre pour `bd/`)
- Apercu en temps reel

### Audit
- Detection des tomes manquants (gaps)
- Verification du nommage par rapport au template
- Detection des doublons, extensions mixtes, dossiers vides, series a fichier unique
- Correction automatique du nommage en un clic
- Filtres et recherche par type de probleme

### Conversion CBR/PDF vers CBZ
- CBR (RAR) vers CBZ (ZIP)
- PDF vers CBZ (rendu page par page, DPI et qualite configurables)
- Scan de dossier avec detection des CBZ deja existants
- Verification d'integrite post-conversion
- Option de suppression des originaux

### Corbeille
- Suppression douce (`.trash/`) avec restauration
- Purge selective ou totale
- Badge compteur dans la navigation

### Historique
- Log de toutes les actions (organisation, suppression, conversion, correction, import)
- Annulation des actions reversibles (organisation, nommage, conversion sans suppression)
- Filtrage par type, auto-pruning a 500 entrees

### Dashboard
- Statistiques : nombre de series, volumes, taille totale, activite recente
- Repartition par destination et par format
- Activable dans la configuration

### Interface
- Bilingue francais / anglais
- Theme dark / light
- Configuration complete depuis l'interface (source, destinations, formats, templates, regles)

## Stack
- **Backend** : Python 3.10+ / Flask
- **Frontend** : Vanilla JS, pas de framework
- **Donnees** : filesystem uniquement, pas de base de donnees
- **Deps** : `rarfile`, `unidecode`, `PyMuPDF`, `Pillow`
- **Systeme** : `unrar` requis pour la conversion CBR

## Installation

```bash
sudo apt install unrar  # Debian/Ubuntu

python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Lancement

```bash
python app.py
```

Accessible sur `http://localhost:9045`.

Variables d'environnement :
- `TANA_HOST` : adresse d'ecoute (defaut `0.0.0.0`)
- `TANA_PORT` : port (defaut `9045`)
- `FLASK_DEBUG` : mode debug (`1` / `true` / `yes`)

## Configuration

Stockee dans `config.json` (cree automatiquement au premier lancement). Modifiable depuis l'onglet Configuration.

## Matching

Le scoring va de 0 a 1 :
- `1.0` : nom identique (case-insensitive)
- `0.95` : identique apres normalisation (accents, articles, ponctuation)
- `0.7` : prefixe (ex: "Dragon Ball" / "Dragon Ball Super")
- `0.6-0.8` : 80%+ des mots en commun

Seuils : >= 0.9 match auto (vert), 0.6-0.9 suggestion (jaune), < 0.6 pas de match.

## Tests

```bash
pip install pytest
python -m pytest tests/ -v
```

## Formats

Par defaut : `.cbr` `.cbz` `.pdf` — configurable depuis l'interface.

---

<a id="english"></a>

# English

> **Tana** (棚) means "shelf" in Japanese. Tana puts your files on the right shelf.

Web tool for organizing manga/comic collections (CBR, CBZ, PDF) from an import folder to categorized destinations. Sits between downloading and a reader like Komga/Kavita.

## Features

### Organization
- Automatic series name and volume number detection (`Tome 12`, `T12`, `Vol.12`, `v12`, `#12`)
- Filename cleaning (BD.FR prefixes, bracket metadata, scene markers)
- Matching with existing series (accent/article normalization, multi-criteria scoring)
- Batch or file-by-file organization via "Add to" button
- Quick triage mode with keyboard shortcuts (arrows, enter, delete)
- Visual grouping by series, sorting and filters by name/size/volume/status
- Existing series search with autocomplete
- External links to Nautiljon and Manga-News
- Drag & drop and file import

### Thumbnails
- Cover preview (first image) in the file list and triage mode
- CBZ, CBR and PDF support
- Disk cache in `.thumbnails/` (automatic invalidation)
- Can be enabled/disabled in settings

### Naming Templates
- Variables: `{series}`, `{tome}`, `{tome:02d}`, `{tome:03d}`, `{title}`, `{ext}`, `{EXT}`
- Default template: `{series} - T{tome:02d}{ext}`
- No-volume template for one-shots
- Per-destination rules (e.g., one format for `manga/`, another for `bd/`)
- Real-time preview

### Audit
- Missing volume detection (gaps)
- Naming verification against template
- Duplicate detection, mixed extensions, empty folders, single-file series
- One-click auto-fix naming
- Filters and search by issue type

### CBR/PDF to CBZ Conversion
- CBR (RAR) to CBZ (ZIP)
- PDF to CBZ (page-by-page rendering, configurable DPI and quality)
- Folder scan with existing CBZ detection
- Post-conversion integrity check
- Option to delete originals

### Trash
- Soft delete (`.trash/`) with restore
- Selective or full purge
- Badge counter in navigation

### History
- Logs all actions (organize, delete, convert, fix naming, import)
- Undo for reversible actions (organize, naming, conversion without deletion)
- Filter by type, auto-pruning at 500 entries

### Dashboard
- Stats: series count, volumes, total size, recent activity
- Breakdown by destination and format
- Can be enabled in settings

### Interface
- Bilingual French / English
- Dark / light theme
- Full settings from the UI (source, destinations, formats, templates, rules)

## Stack
- **Backend**: Python 3.10+ / Flask
- **Frontend**: Vanilla JS, no framework
- **Data**: filesystem only, no database
- **Deps**: `rarfile`, `unidecode`, `PyMuPDF`, `Pillow`
- **System**: `unrar` required for CBR conversion

## Installation

```bash
sudo apt install unrar  # Debian/Ubuntu

python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Running

```bash
python app.py
```

Available at `http://localhost:9045`.

Environment variables:
- `TANA_HOST`: listen address (default `0.0.0.0`)
- `TANA_PORT`: port (default `9045`)
- `FLASK_DEBUG`: debug mode (`1` / `true` / `yes`)

## Configuration

Stored in `config.json` (auto-created on first launch). Editable from the Settings tab.

## Matching

Scoring from 0 to 1:
- `1.0`: identical name (case-insensitive)
- `0.95`: identical after normalization (accents, articles, punctuation)
- `0.7`: prefix (e.g., "Dragon Ball" / "Dragon Ball Super")
- `0.6-0.8`: 80%+ words in common

Thresholds: >= 0.9 auto-match (green), 0.6-0.9 suggestion (yellow), < 0.6 no match.

## Tests

```bash
pip install pytest
python -m pytest tests/ -v
```

## Formats

Default: `.cbr` `.cbz` `.pdf` — configurable from the UI.
