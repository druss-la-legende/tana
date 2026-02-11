"""Unit tests for Tana core functions."""

import sys
from pathlib import Path

# Add project root to path so we can import app module
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import (
    apply_template,
    detect_series,
    detect_tome,
    format_size,
    normalize,
    score_match,
    get_template_for_dest,
    is_safe_filename,
)


# ---------------------------------------------------------------------------
# detect_tome
# ---------------------------------------------------------------------------

class TestDetectTome:
    def test_tome_keyword(self):
        assert detect_tome("Naruto Tome 12.cbz") == 12

    def test_tome_keyword_lowercase(self):
        assert detect_tome("naruto tome 5.cbz") == 5

    def test_tome_with_dash(self):
        assert detect_tome("Naruto-Tome-03.cbz") == 3

    def test_tome_with_dot(self):
        assert detect_tome("Naruto.Tome.07.cbz") == 7

    def test_t_prefix(self):
        assert detect_tome("One Piece - T01.cbz") == 1

    def test_t_prefix_no_space(self):
        assert detect_tome("One Piece T42.cbz") == 42

    def test_volume(self):
        assert detect_tome("Dragon Ball Volume 3.cbz") == 3

    def test_vol_abbreviation(self):
        assert detect_tome("Dragon Ball Vol.15.cbz") == 15

    def test_vol_with_space(self):
        assert detect_tome("Dragon Ball Vol 8.cbz") == 8

    def test_hash_number(self):
        assert detect_tome("Spider-Man #123.cbz") == 123

    def test_standalone_number(self):
        assert detect_tome("Bleach 42.cbz") == 42

    def test_no_tome(self):
        assert detect_tome("One Shot Special.cbz") is None

    def test_bracket_metadata_ignored(self):
        """Numbers inside brackets should not be detected as tome."""
        assert detect_tome("Naruto [Digital-1234] T05.cbz") == 5

    def test_paren_metadata_ignored(self):
        """Numbers inside parentheses should not be detected as tome."""
        assert detect_tome("Naruto (2020) Tome 3.cbz") == 3

    def test_digital_noise_ignored(self):
        assert detect_tome("Naruto Digital-567 T10.cbz") == 10

    def test_tome_zero(self):
        assert detect_tome("Prequel T00.cbz") == 0

    def test_v_prefix(self):
        assert detect_tome("Manga v 3.cbz") == 3


# ---------------------------------------------------------------------------
# detect_series
# ---------------------------------------------------------------------------

class TestDetectSeries:
    def test_simple_name_with_tome(self):
        assert detect_series("Naruto T01.cbz") == "Naruto"

    def test_name_with_tome_keyword(self):
        assert detect_series("One Piece Tome 42.cbz") == "One Piece"

    def test_bd_fr_prefix_removed(self):
        assert detect_series("BD.FR.- Asterix T01.cbz") == "Asterix"

    def test_brackets_removed(self):
        assert detect_series("Naruto [Digital-1234] T05.cbz") == "Naruto"

    def test_parens_removed(self):
        assert detect_series("Naruto (2020) Tome 3.cbz") == "Naruto"

    def test_dots_as_separators(self):
        assert detect_series("One.Piece.T01.cbz") == "One Piece"

    def test_underscores_replaced(self):
        assert detect_series("One_Piece_T01.cbz") == "One Piece"

    def test_volume_removed(self):
        assert detect_series("Dragon Ball Vol.15.cbz") == "Dragon Ball"

    def test_dash_number(self):
        assert detect_series("Bleach - 05.cbz") == "Bleach"

    def test_trailing_number(self):
        assert detect_series("Bleach 42.cbz") == "Bleach"

    def test_year_removed(self):
        assert detect_series("Batman 2024 T01.cbz") == "Batman"

    def test_noise_keywords_removed(self):
        assert detect_series("Naruto [NEO RIP-Club] T03.cbz") == "Naruto"

    def test_os_marker_removed(self):
        assert detect_series("Special Story OS.cbz") == "Special Story"

    def test_complex_name(self):
        result = detect_series("BD.FR.- Les Aventures de Tintin Tome 05 (2021) [Digital].cbz")
        assert result == "Les Aventures de Tintin"

    def test_dash_tome_subtitle(self):
        """Pattern: 'Series - 01 - Subtitle'"""
        assert detect_series("Lucky Luke - 03 - Arizona.cbz") == "Lucky Luke"


# ---------------------------------------------------------------------------
# normalize
# ---------------------------------------------------------------------------

class TestNormalize:
    def test_lowercase(self):
        assert normalize("NARUTO") == "naruto"

    def test_strip_accents(self):
        result = normalize("Les Cites Obscures")
        # "les" is an article and gets removed
        assert "cites" in result
        assert "obscures" in result

    def test_accented_characters(self):
        result = normalize("Astérix")
        assert result == "asterix"

    def test_articles_removed_fr(self):
        result = normalize("Le Chat")
        assert "le" not in result.split()
        assert "chat" in result

    def test_articles_removed_en(self):
        result = normalize("The Walking Dead")
        assert "the" not in result.split()
        assert "walking" in result

    def test_punctuation_replaced(self):
        result = normalize("One-Punch Man: Hero")
        assert "-" not in result
        assert ":" not in result

    def test_multiple_spaces_collapsed(self):
        result = normalize("Too   Many   Spaces")
        assert "  " not in result

    def test_empty_string(self):
        assert normalize("") == ""

    def test_only_articles(self):
        result = normalize("Le La Les")
        assert result.strip() == ""


# ---------------------------------------------------------------------------
# apply_template
# ---------------------------------------------------------------------------

class TestApplyTemplate:
    def test_default_template_with_tome(self):
        result = apply_template("{series} - T{tome:02d}{ext}", "Naruto", 5, ".cbz")
        assert result == "Naruto - T05.cbz"

    def test_default_template_no_tome(self):
        result = apply_template(
            "{series} - T{tome:02d}{ext}", "Naruto", None, ".cbz",
            template_no_tome="{series}{ext}"
        )
        assert result == "Naruto.cbz"

    def test_tome_03d_format(self):
        result = apply_template("{series} - T{tome:03d}{ext}", "Bleach", 7, ".cbz")
        assert result == "Bleach - T007.cbz"

    def test_tome_no_padding(self):
        result = apply_template("{series} T{tome}{ext}", "Bleach", 42, ".cbz")
        assert result == "Bleach T42.cbz"

    def test_ext_lowercase(self):
        result = apply_template("{series}{ext}", "Test", 1, ".CBZ")
        assert result == "Test.cbz"

    def test_ext_uppercase(self):
        result = apply_template("{series}{EXT}", "Test", 1, ".cbz")
        assert result == "Test.CBZ"

    def test_title_variable(self):
        result = apply_template(
            "{series} - T{tome:02d} - {title}{ext}", "Naruto", 1, ".cbz",
            title="Le debut"
        )
        assert result == "Naruto - T01 - Le debut.cbz"

    def test_title_empty_cleanup(self):
        """When title is empty, dangling separators should be cleaned."""
        result = apply_template(
            "{series} - T{tome:02d} - {title}{ext}", "Naruto", 1, ".cbz",
            title=""
        )
        # Should not have " - - " or " - ."
        assert " - - " not in result
        assert " - ." not in result

    def test_no_tome_uses_fallback_template(self):
        result = apply_template(
            "{series} - T{tome:02d}{ext}", "One Shot", None, ".pdf",
            template_no_tome="{series}{ext}"
        )
        assert result == "One Shot.pdf"

    def test_no_tome_default_fallback(self):
        """When template_no_tome is empty, use DEFAULT_TEMPLATE_NO_TOME."""
        result = apply_template(
            "{series} - T{tome:02d}{ext}", "One Shot", None, ".cbz",
            template_no_tome=""
        )
        assert result == "One Shot.cbz"


# ---------------------------------------------------------------------------
# score_match
# ---------------------------------------------------------------------------

class TestScoreMatch:
    def test_exact_match(self):
        score = score_match("naruto", "naruto")
        assert score == 1.0

    def test_exact_match_case_insensitive(self):
        score = score_match("Naruto", "naruto")
        assert score == 1.0

    def test_normalized_match(self):
        """Accents/articles differ but normalize to the same."""
        score = score_match("L'Attaque des Titans", "l'attaque des titans")
        assert score >= 0.9

    def test_prefix_match(self):
        score = score_match("Dragon Ball", "dragon ball super")
        assert 0.6 <= score <= 0.8

    def test_no_match(self):
        score = score_match("Naruto", "one piece")
        assert score < 0.5

    def test_empty_guessed(self):
        _, score = None, 0.0
        # score_match with empty returns low score
        result = score_match("", "naruto")
        assert result < 0.5

    def test_high_token_overlap(self):
        score = score_match("Dragon Ball Z", "dragon ball z kai")
        assert score >= 0.5


# ---------------------------------------------------------------------------
# format_size
# ---------------------------------------------------------------------------

class TestFormatSize:
    def test_bytes(self):
        assert format_size(500) == "500.0 o"

    def test_kilobytes(self):
        result = format_size(2048)
        assert "Ko" in result

    def test_megabytes(self):
        result = format_size(5 * 1024 * 1024)
        assert "Mo" in result

    def test_gigabytes(self):
        result = format_size(2 * 1024 ** 3)
        assert "Go" in result

    def test_zero(self):
        assert format_size(0) == "0.0 o"


# ---------------------------------------------------------------------------
# get_template_for_dest
# ---------------------------------------------------------------------------

class TestGetTemplateForDest:
    def test_no_rules_returns_global(self):
        cfg = {
            "template": "{series} - T{tome:02d}{ext}",
            "template_no_tome": "{series}{ext}",
            "template_rules": [],
        }
        tpl, tpl_nt = get_template_for_dest(cfg, "/data/manga")
        assert tpl == "{series} - T{tome:02d}{ext}"
        assert tpl_nt == "{series}{ext}"

    def test_matching_rule(self):
        cfg = {
            "template": "{series} - T{tome:02d}{ext}",
            "template_no_tome": "{series}{ext}",
            "template_rules": [
                {"filter": "manga", "template": "{series} T{tome:03d}{ext}", "template_no_tome": "{series}{ext}"}
            ],
        }
        tpl, tpl_nt = get_template_for_dest(cfg, "/data/manga/shonen")
        assert tpl == "{series} T{tome:03d}{ext}"

    def test_no_matching_rule_returns_global(self):
        cfg = {
            "template": "{series} - T{tome:02d}{ext}",
            "template_no_tome": "{series}{ext}",
            "template_rules": [
                {"filter": "manga", "template": "{series} T{tome:03d}{ext}", "template_no_tome": "{series}{ext}"}
            ],
        }
        tpl, _ = get_template_for_dest(cfg, "/data/bd/franco-belge")
        assert tpl == "{series} - T{tome:02d}{ext}"

    def test_first_matching_rule_wins(self):
        cfg = {
            "template": "global{ext}",
            "template_no_tome": "global{ext}",
            "template_rules": [
                {"filter": "manga", "template": "first{ext}", "template_no_tome": "first{ext}"},
                {"filter": "manga", "template": "second{ext}", "template_no_tome": "second{ext}"},
            ],
        }
        tpl, _ = get_template_for_dest(cfg, "/data/manga")
        assert tpl == "first{ext}"


# ---------------------------------------------------------------------------
# is_safe_filename
# ---------------------------------------------------------------------------

class TestIsSafeFilename:
    def test_normal_filename(self):
        assert is_safe_filename("Naruto T01.cbz", "/data/incoming") is True

    def test_subdirectory_file(self):
        assert is_safe_filename("subdir/file.cbz", "/data/incoming") is True

    def test_path_traversal_rejected(self):
        assert is_safe_filename("../etc/passwd", "/data/incoming") is False

    def test_double_dot_in_name(self):
        assert is_safe_filename("file..cbz", "/data/incoming") is False

    def test_empty_filename(self):
        assert is_safe_filename("", "/data/incoming") is False
