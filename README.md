# Tana - File Organizer (CBZ/CBR/PDF)

**Langue / Language:** [Francais](#francais) | [English](#english)

---

<a id="francais"></a>

> **Tana** (棚) signifie "etagere" en japonais. Comme son nom l'indique, Tana range vos fichiers sur la bonne etagere.

Outil web pour organiser automatiquement une collection de manga et BD (CBR, CBZ, PDF) depuis un dossier d'import vers des destinations categorisees.

## Apercu

![Vue principale - Liste des fichiers avec detection automatique des series et matching](docs/screenshot-files.png)
*Vue principale : les fichiers sont analyses automatiquement. Tana detecte le nom de serie, propose un matching avec les series existantes, et permet de rechercher manuellement une correspondance.*

![Panneau d'organisation - Groupement par serie et apercu du renommage](docs/screenshot-organize.png)
*Organisation : les fichiers sont groupes par serie detectee. Le panneau du bas permet de choisir le nom de serie, la destination, et affiche un apercu du renommage avant validation.*

## Fonctionnalites

### Organisation

- **Detection automatique** du nom de serie et du numero de tome (supporte `Tome 12`, `T12`, `Vol.12`, `v12`, `#12`)
- **Nettoyage intelligent** des noms de fichiers (prefixes BD.FR, metadonnees entre crochets, marqueurs scene...)
- **Matching intelligent** avec les series existantes (normalisation accents/articles, scoring multi-criteres)
- **Organisation batch** : un clic pour ranger tous les fichiers auto-matches
- **Organisation rapide** fichier par fichier via le bouton "Ajouter a"
- **Groupement visuel** par serie detectee avec selection de groupe
- **Tri et filtres** par nom, taille, tome, statut de match
- **Recherche** dans les series existantes avec autocompletion et navigation clavier
- **Suppression avec corbeille** : les fichiers supprimes vont dans `.trash/` avec possibilite d'annuler
- **Scan recursif** du dossier source (sous-dossiers inclus)
- **Liens externes** vers Nautiljon et Manga-News pour verification

### Templates de nommage

- **Templates personnalisables** avec variables : `{series}`, `{tome}`, `{tome:02d}`, `{tome:03d}`, `{title}`, `{ext}`, `{EXT}`
- **Template par defaut** : `{series} - T{tome:02d}{ext}` (ex: `One Piece - T05.cbz`)
- **Template sans tome** : utilise quand aucun numero de tome n'est detecte
- **Regles par destination** : appliquer un template different selon le chemin (ex: un format pour `manga/`, un autre pour `bd/`)
- **Apercu en temps reel** du renommage dans la configuration

### Audit de collection

- **Detection des tomes manquants** dans une serie (gaps entre le premier et le dernier tome)
- **Verification du nommage** : compare chaque fichier au template attendu et signale les incoherences
- **Detection des doublons** : tomes presents en plusieurs exemplaires
- **Extensions mixtes** : signale les series melangeant CBR, CBZ et PDF
- **Dossiers vides et series a fichier unique**
- **Correction automatique** du nommage en un clic ("Corriger tout")
- **Filtres et recherche** : par type de probleme, par nom de serie

### Conversion CBR vers CBZ

- **Conversion de fichiers** CBR (RAR) en CBZ (ZIP)
- **Scan de dossier** avec recherche de serie par nom et autocompletion
- **Affichage groupe** par serie avec selection individuelle ou globale
- **Detection des CBZ existants** : fichiers deja convertis grises automatiquement
- **Option de suppression** des CBR originaux apres conversion

### Historique

- **Tracabilite complete** de toutes les actions : organisation, suppression, restauration, correction de nommage, conversion
- **Filtrage par type** d'action
- **Stockage local** dans `history.json` (auto-pruning a 500 entrees)

### Interface

- **Bilingue** : francais et anglais (choix dans la configuration)
- **Theme** dark / light
- **Page de configuration** pour gerer le dossier source, les destinations, les formats de fichiers et les templates depuis l'interface
- **5 onglets** : Fichiers, Audit, Historique, Convertir, Configuration

## Stack

- **Backend** : Python / Flask
- **Frontend** : Vanilla JS + HTML + CSS (pas de framework)
- **Base de donnees** : aucune (filesystem uniquement)
- **Conversion CBR** : `rarfile` + `unrar` (systeme)

## Installation

```bash
# Dependance systeme pour la conversion CBR vers CBZ
sudo apt install unrar  # Debian/Ubuntu

python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Configuration

La configuration est stockee dans `config.json` a la racine du projet (cree automatiquement au premier lancement avec des valeurs par defaut). Voir [`config.example.json`](config.example.json) pour un exemple.

Elle est aussi modifiable directement depuis l'onglet **Configuration** dans l'interface web.

## Lancement

```bash
python app.py
```

L'interface est accessible sur `http://localhost:9045`.

Variables d'environnement optionnelles :
- `TANA_HOST` : adresse d'ecoute (defaut: `0.0.0.0`)
- `TANA_PORT` : port (defaut: `9045`)
- `FLASK_DEBUG` : mode debug (`1` / `true` / `yes`)

## Matching

Le systeme de matching utilise un scoring multi-criteres :

| Score | Niveau | Description |
|-------|--------|-------------|
| 1.0 | Exact | Nom identique (case-insensitive) |
| 0.95 | Normalise | Identique apres suppression accents, articles, ponctuation |
| 0.7 | Prefixe | Un nom est prefixe de l'autre (ex: "Dragon Ball" / "Dragon Ball Super") |
| 0.6-0.8 | Tokens | 80%+ des mots en commun |

- Score >= 0.9 : match automatique (badge vert)
- Score 0.6-0.9 : suggestion (badge jaune, confirmation manuelle)
- Score < 0.6 : pas de match

## Tests

```bash
pip install pytest
python -m pytest tests/ -v
```

## Formats supportes

Par defaut : `.cbr` `.cbz` `.pdf`

Les formats sont configurables depuis l'onglet **Configuration**.

---

<a id="english"></a>

# English

> **Tana** (棚) means "shelf" in Japanese. As the name suggests, Tana puts your files on the right shelf.

A web tool for automatically organizing manga and comic book collections (CBR, CBZ, PDF) from an import folder to categorized destinations.

## Preview

![Main view - File list with automatic series detection and matching](docs/screenshot-files.png)
*Main view: files are analyzed automatically. Tana detects the series name, suggests matches with existing series, and allows manual search.*

![Organization panel - Grouping by series with rename preview](docs/screenshot-organize.png)
*Organization: files are grouped by detected series. The bottom panel lets you choose the series name, destination, and shows a rename preview before confirmation.*

## Features

### Organization

- **Automatic detection** of series name and volume number (supports `Tome 12`, `T12`, `Vol.12`, `v12`, `#12`)
- **Smart filename cleaning** (BD.FR prefixes, bracket metadata, scene markers...)
- **Intelligent matching** with existing series (accent/article normalization, multi-criteria scoring)
- **Batch organization**: one click to organize all auto-matched files
- **Quick organization** file by file via the "Add to" button
- **Visual grouping** by detected series with group selection
- **Sorting and filters** by name, size, volume, match status
- **Search** existing series with autocomplete and keyboard navigation
- **Soft delete**: deleted files go to `.trash/` with undo support
- **Recursive scan** of source folder (subfolders included)
- **External links** to Nautiljon and Manga-News for verification

### Naming Templates

- **Customizable templates** with variables: `{series}`, `{tome}`, `{tome:02d}`, `{tome:03d}`, `{title}`, `{ext}`, `{EXT}`
- **Default template**: `{series} - T{tome:02d}{ext}` (e.g., `One Piece - T05.cbz`)
- **No-volume template**: used when no volume number is detected
- **Per-destination rules**: apply different templates based on path (e.g., one format for `manga/`, another for `bd/`)
- **Real-time preview** of renaming in settings

### Collection Audit

- **Missing volume detection** in a series (gaps between first and last volume)
- **Naming verification**: compares each file to the expected template and flags inconsistencies
- **Duplicate detection**: volumes present in multiple copies
- **Mixed extensions**: flags series mixing CBR, CBZ and PDF
- **Empty folders and single-file series**
- **Auto-fix naming** with one click ("Fix all")
- **Filters and search**: by issue type, by series name

### CBR to CBZ Conversion

- **File conversion** from CBR (RAR) to CBZ (ZIP)
- **Folder scanning** with series search by name and autocomplete
- **Grouped display** by series with individual or global selection
- **Existing CBZ detection**: already converted files are grayed out
- **Option to delete** original CBR files after conversion

### History

- **Full traceability** of all actions: organization, deletion, restoration, naming fixes, conversion
- **Filtering by action** type
- **Local storage** in `history.json` (auto-pruning at 500 entries)

### Interface

- **Bilingual**: French and English (configurable in settings)
- **Dark / light theme**
- **Settings page** to manage source folder, destinations, file formats and templates from the UI
- **5 tabs**: Files, Audit, History, Convert, Settings

## Stack

- **Backend**: Python / Flask
- **Frontend**: Vanilla JS + HTML + CSS (no framework)
- **Database**: none (filesystem only)
- **CBR conversion**: `rarfile` + `unrar` (system)

## Installation

```bash
# System dependency for CBR to CBZ conversion
sudo apt install unrar  # Debian/Ubuntu

python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Configuration

Configuration is stored in `config.json` at the project root (automatically created on first launch with default values). See [`config.example.json`](config.example.json) for an example.

It can also be edited directly from the **Settings** tab in the web interface.

## Running

```bash
python app.py
```

The interface is available at `http://localhost:9045`.

Optional environment variables:
- `TANA_HOST`: listen address (default: `0.0.0.0`)
- `TANA_PORT`: port (default: `9045`)
- `FLASK_DEBUG`: debug mode (`1` / `true` / `yes`)

## Matching

The matching system uses multi-criteria scoring:

| Score | Level | Description |
|-------|-------|-------------|
| 1.0 | Exact | Identical name (case-insensitive) |
| 0.95 | Normalized | Identical after stripping accents, articles, punctuation |
| 0.7 | Prefix | One name is a prefix of the other (e.g., "Dragon Ball" / "Dragon Ball Super") |
| 0.6-0.8 | Tokens | 80%+ words in common |

- Score >= 0.9: automatic match (green badge)
- Score 0.6-0.9: suggestion (yellow badge, manual confirmation)
- Score < 0.6: no match

## Tests

```bash
pip install pytest
python -m pytest tests/ -v
```

## Supported Formats

Default: `.cbr` `.cbz` `.pdf`

Formats are configurable from the **Settings** tab.
