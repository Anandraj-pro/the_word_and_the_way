"""Scripture lookup for the Desk — fetches a passage from bible-api.com, cached locally.

The room is offline-first, so we keep every verse we fetch: a reference looked up once
reads again with no network. A miss against the live API simply raises ScriptureUnavailable.
"""
import json
import re
from urllib.parse import quote

import requests
from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import ScriptureCache

BIBLE_API = "https://bible-api.com"
DEFAULT_TRANSLATION = "web"


class ScriptureUnavailable(Exception):
    """The verse source couldn't be reached (offline / API down) and it wasn't cached."""


def _key(reference: str, translation: str) -> str:
    return f"{reference.strip().lower()}|{translation.lower()}"


def lookup(db: Session, reference: str, translation: str = DEFAULT_TRANSLATION) -> dict | None:
    """Return {reference, text, translation} for a reference, or None if no such verse.

    Serves from the local cache when possible; otherwise fetches and caches. Raises
    ScriptureUnavailable when the reference is uncached and the API can't be reached.
    """
    reference = reference.strip()
    if not reference:
        return None

    key = _key(reference, translation)
    cached = db.scalar(select(ScriptureCache).where(ScriptureCache.reference == key))
    if cached is not None:
        return {
            "reference": cached.display_reference or reference,
            "text": cached.text,
            "translation": cached.translation,
        }

    try:
        resp = requests.get(
            f"{BIBLE_API}/{quote(reference)}",
            params={"translation": translation},
            timeout=10,
        )
    except requests.RequestException as exc:
        raise ScriptureUnavailable(str(exc)) from exc

    if resp.status_code == 404:
        return None  # genuine "no such reference"
    if resp.status_code != 200:
        raise ScriptureUnavailable(f"bible-api returned {resp.status_code}")

    data = resp.json()
    text = " ".join((data.get("text") or "").split())  # collapse the API's line breaks
    if not text:
        return None

    record = ScriptureCache(
        reference=key,
        display_reference=data.get("reference") or reference,
        text=text,
        verses_json=json.dumps(_verses_from_data(data)),
        translation=data.get("translation_id") or translation,
    )
    db.add(record)
    db.commit()

    return {
        "reference": record.display_reference,
        "text": text,
        "translation": record.translation,
    }


def _verses_from_data(data: dict) -> list[dict]:
    """Pull a clean [{verse, text}, …] list out of a bible-api response."""
    verses = []
    for v in data.get("verses") or []:
        verses.append(
            {"verse": v.get("verse"), "text": " ".join((v.get("text") or "").split())}
        )
    return verses


# Splits a chapter reference into book + chapter, e.g. "John 1" -> ("John", 1).
_CHAPTER_RE = re.compile(r"^\s*(.+?)\s+(\d+)\s*$")


def chapter_neighbors(reference: str) -> tuple[str | None, str | None]:
    """Previous/next chapter references for a whole-chapter reference like 'John 1'.

    Stays within the book (the reading plan never crosses one). Returns (prev, next);
    `prev` is None at chapter 1. `next` is always offered — the caller learns the book
    has ended when that lookup 404s.
    """
    m = _CHAPTER_RE.match(reference or "")
    if not m or ":" in (reference or ""):
        return None, None
    book, chapter = m.group(1), int(m.group(2))
    prev_ref = f"{book} {chapter - 1}" if chapter > 1 else None
    return prev_ref, f"{book} {chapter + 1}"


def lookup_passage(db: Session, reference: str, translation: str = DEFAULT_TRANSLATION) -> dict | None:
    """Like lookup(), but returns the passage broken into numbered verses for the reader."""
    reference = reference.strip()
    if not reference:
        return None

    key = _key(reference, translation)
    cached = db.scalar(select(ScriptureCache).where(ScriptureCache.reference == key))
    if cached is not None and cached.verses_json:
        verses = json.loads(cached.verses_json)
        prev_ref, next_ref = chapter_neighbors(cached.display_reference or reference)
        return {
            "reference": cached.display_reference or reference,
            "translation": cached.translation,
            "verses": verses,
            "previous_reference": prev_ref,
            "next_reference": next_ref,
        }

    try:
        resp = requests.get(
            f"{BIBLE_API}/{quote(reference)}",
            params={"translation": translation},
            timeout=10,
        )
    except requests.RequestException as exc:
        raise ScriptureUnavailable(str(exc)) from exc

    if resp.status_code == 404:
        return None
    if resp.status_code != 200:
        raise ScriptureUnavailable(f"bible-api returned {resp.status_code}")

    data = resp.json()
    verses = _verses_from_data(data)
    if not verses:
        return None
    display = data.get("reference") or reference

    if cached is not None:  # backfill verses onto an older text-only cache row
        cached.verses_json = json.dumps(verses)
    else:
        db.add(
            ScriptureCache(
                reference=key,
                display_reference=display,
                text=" ".join((data.get("text") or "").split()),
                verses_json=json.dumps(verses),
                translation=data.get("translation_id") or translation,
            )
        )
    db.commit()

    prev_ref, next_ref = chapter_neighbors(display)
    return {
        "reference": display,
        "translation": data.get("translation_id") or translation,
        "verses": verses,
        "previous_reference": prev_ref,
        "next_reference": next_ref,
    }
