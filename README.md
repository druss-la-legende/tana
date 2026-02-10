# Tana - File Organizer (CBZ/CBR/PDF)

> **Tana** (棚) signifie "étagère" en japonais. Comme son nom l'indique, Tana range vos fichiers sur la bonne étagère.

Outil web pour organiser automatiquement une collection de manga et BD (CBR, CBZ, PDF) depuis un dossier d'import vers des destinations catégorisées.

## Aperçu

![Vue principale - Liste des fichiers avec détection automatique des séries et matching](9H6M59DpPH.png)
*Vue principale : les fichiers sont analysés automatiquement. Tana détecte le nom de série, propose un matching avec les séries existantes, et permet de rechercher manuellement une correspondance.*

![Panneau d'organisation - Groupement par série et aperçu du renommage](YPRM8emGso.png)
*Organisation : les fichiers sont groupés par série détectée. Le panneau du bas permet de choisir le nom de série, la destination, et affiche un aperçu du renommage avant validation.*

## Fonctionnalités

### Organisation

- **Détection automatique** du nom de série et du numéro de tome (supporte `Tome 12`, `T12`, `Vol.12`, `v12`, `#12`)
- **Nettoyage intelligent** des noms de fichiers (préfixes BD.FR, métadonnées entre crochets, marqueurs scene…)
- **Matching intelligent** avec les séries existantes (normalisation accents/articles, scoring multi-critères)
- **Organisation batch** : un clic pour ranger tous les fichiers auto-matchés
- **Organisation rapide** fichier par fichier via le bouton "Ajouter à"
- **Groupement visuel** par série détectée avec sélection de groupe
- **Tri et filtres** par nom, taille, tome, statut de match
- **Recherche** dans les séries existantes avec autocomplétion et navigation clavier
- **Suppression avec corbeille** : les fichiers supprimés vont dans `.trash/` avec possibilité d'annuler
- **Scan récursif** du dossier source (sous-dossiers inclus)
- **Liens externes** vers Nautiljon et Manga-News pour vérification

### Templates de nommage

- **Templates personnalisables** avec variables : `{series}`, `{tome}`, `{tome:02d}`, `{tome:03d}`, `{title}`, `{ext}`, `{EXT}`
- **Template par défaut** : `{series} - T{tome:02d}{ext}` (ex: `One Piece - T05.cbz`)
- **Template sans tome** : utilisé quand aucun numéro de tome n'est détecté
- **Règles par destination** : appliquer un template différent selon le chemin (ex: un format pour `manga/`, un autre pour `bd/`)
- **Aperçu en temps réel** du renommage dans la configuration

### Audit de collection

- **Détection des tomes manquants** dans une série (gaps entre le premier et le dernier tome)
- **Vérification du nommage** : compare chaque fichier au template attendu et signale les incohérences
- **Détection des doublons** : tomes présents en plusieurs exemplaires
- **Extensions mixtes** : signale les séries mélangeant CBR, CBZ et PDF
- **Dossiers vides et séries à fichier unique**
- **Correction automatique** du nommage en un clic ("Corriger tout")
- **Filtres et recherche** : par type de problème, par nom de série

### Conversion CBR → CBZ

- **Conversion de fichiers** CBR (RAR) en CBZ (ZIP)
- **Scan de dossier** avec champ libre et suggestions des destinations configurées
- **Affichage groupé** par série avec sélection individuelle ou globale
- **Détection des CBZ existants** : fichiers déjà convertis grisés automatiquement
- **Option de suppression** des CBR originaux après conversion

### Historique

- **Traçabilité complète** de toutes les actions : organisation, suppression, restauration, correction de nommage, conversion
- **Filtrage par type** d'action
- **Stockage local** dans `history.json` (auto-pruning à 500 entrées)

### Interface

- **Thème** dark / light
- **Page de configuration** pour gérer le dossier source, les destinations et les templates depuis l'interface
- **5 onglets** : Fichiers, Audit, Historique, Convertir, Configuration

## Stack

- **Backend** : Python / Flask
- **Frontend** : Vanilla JS + HTML + CSS (pas de framework)
- **Base de données** : aucune (filesystem uniquement)
- **Conversion CBR** : `rarfile` + `unrar` (système)

## Installation

```bash
# Dépendance système pour la conversion CBR → CBZ
sudo apt install unrar  # Debian/Ubuntu

python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Configuration

La configuration est stockée dans `config.json` à la racine du projet (créé automatiquement au premier lancement avec des valeurs par défaut) :

```json
{
  "source_dir": "/chemin/vers/dossier/incoming",
  "destinations": [
    "/chemin/vers/bd",
    "/chemin/vers/manga"
  ],
  "template": "{series} - T{tome:02d}{ext}",
  "template_no_tome": "{series}{ext}",
  "template_rules": [
    {
      "filter": "manga",
      "template": "{series} - T{tome:02d}{ext}",
      "template_no_tome": "{series}{ext}"
    }
  ]
}
```

Elle est aussi modifiable directement depuis l'onglet **Configuration** dans l'interface web.

## Lancement

```bash
python app.py
```

L'interface est accessible sur `http://localhost:9045`.

## Matching

Le système de matching utilise un scoring multi-critères :

| Score | Niveau | Description |
|-------|--------|-------------|
| 1.0 | Exact | Nom identique (case-insensitive) |
| 0.95 | Normalisé | Identique après suppression accents, articles, ponctuation |
| 0.7 | Préfixe | Un nom est préfixe de l'autre (ex: "Dragon Ball" / "Dragon Ball Super") |
| 0.6-0.8 | Tokens | 80%+ des mots en commun |

- Score >= 0.9 : match automatique (badge vert)
- Score 0.6-0.9 : suggestion (badge jaune, confirmation manuelle)
- Score < 0.6 : pas de match

## Formats supportés

`.cbr` `.cbz` `.pdf`
