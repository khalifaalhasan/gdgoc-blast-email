import pytest

from src.infrastructure.google_drive import AmbiguousFileMatch, match_file, name_key


def files(*names):
    return [{'id': f'id-{i}', 'name': n} for i, n in enumerate(names)]


def picked(items, target, **kwargs):
    result = match_file(items, target, **kwargs)
    return result['name'] if result else None


def test_exact_name_wins_over_longer_names():
    items = files("Muhammad Rizki.pdf", "Muhammad Rizki Pratama.pdf")
    assert picked(items, "Muhammad Rizki") == "Muhammad Rizki.pdf"


def test_full_name_picks_the_right_person_when_first_two_words_collide():
    items = files("Muhammad Rizki Akbar.pdf", "Muhammad Rizki Baskara.pdf")
    assert picked(items, "Muhammad Rizki Baskara") == "Muhammad Rizki Baskara.pdf"


def test_partial_match_never_guesses_between_two_people():
    items = files("Muhammad Rizki Akbar.pdf", "Muhammad Rizki Baskara.pdf")
    with pytest.raises(AmbiguousFileMatch):
        match_file(items, "Muhammad Rizki Cahyo")


def test_require_full_name_blocks_other_persons_certificate():
    # Sertifikat milik "Muhammad Rizki Cahyo" belum diupload; jangan kirim punya Akbar.
    items = files("Muhammad Rizki Akbar.pdf")
    assert picked(items, "Muhammad Rizki Cahyo", require_full_name=True) is None


def test_partial_match_still_allowed_for_unique_short_filename():
    items = files("Riza Aqilah_pembicara.pdf")
    assert picked(items, "Riza Aqilah Nashifah") == "Riza Aqilah_pembicara.pdf"


def test_suffix_in_filename_is_ignored():
    items = files("Riza Aqilah Nashifah - WL2.pdf")
    assert picked(items, "Riza Aqilah Nashifah") == "Riza Aqilah Nashifah - WL2.pdf"


def test_spacing_difference_in_filename():
    items = files("khalifa al hasan_pembicara.pdf")
    assert picked(items, "Khalifa Alhasan") == "khalifa al hasan_pembicara.pdf"


def test_merged_match_does_not_cut_inside_a_word():
    items = files("Muhammad Rizkiansyah.pdf")
    assert picked(items, "Muhammad Rizki") is None


def test_abbreviation_matches_full_word():
    items = files("Muhammad Ahmad.pdf")
    assert picked(items, "M. Ahmad") == "Muhammad Ahmad.pdf"


def test_duplicate_files_for_same_person_are_reported():
    items = files("Budi Santoso.pdf", "Budi Santoso (1).pdf")
    # "(1)" membuat nama berbeda; exact tetap memilih file aslinya
    assert picked(items, "Budi Santoso") == "Budi Santoso.pdf"

    items = files("Budi Santoso.pdf", "budi santoso.PDF")
    with pytest.raises(AmbiguousFileMatch):
        match_file(items, "Budi Santoso")


def test_no_match_returns_none():
    assert picked(files("Siti Aminah.pdf"), "Budi Santoso") is None


def test_name_key_uses_first_two_words():
    assert name_key("Muhammad Rizki Akbar") == name_key("muhammad  RIZKI baskara") == "muhammad rizki"
