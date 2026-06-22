"""Load the confessions corpus (docs/confessions_md/) onto the Wall.

The corpus is inherited liturgy, not personal Encounters. Each file is one confession:

    # Title
    <body paragraphs...>
    ## SCRIPTURE REFERENCES
    - Ref
    - Ref

We parse those three parts, skip files with no real text, and upsert by slug so the
Wall stays in sync with disk on every startup without duplicating.
"""
import re
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Confession

# repo_root/docs/confessions_md  (this file is repo_root/backend/app/confessions_loader.py)
CORPUS_DIR = Path(__file__).resolve().parent.parent.parent / "docs" / "confessions_md"

# Marks a file the extractor couldn't read — there is nothing to declare.
_EMPTY_MARKER = "No text could be extracted"
_REFS_HEADING = re.compile(r"^##\s+scripture\s+references", re.IGNORECASE)


def _slugify(stem: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", stem.lower()).strip("-")
    return slug or "confession"


def parse_confession(text: str, fallback_title: str) -> dict | None:
    """Split one markdown file into title, body, and scripture references.

    Returns None if the file has no usable confession text.
    """
    lines = text.splitlines()

    title = fallback_title
    start = 0
    for i, line in enumerate(lines):
        if line.startswith("# "):
            title = line[2:].strip()
            start = i + 1
            break

    body_lines: list[str] = []
    ref_lines: list[str] = []
    in_refs = False
    for line in lines[start:]:
        if _REFS_HEADING.match(line.strip()):
            in_refs = True
            continue
        if in_refs:
            ref = line.lstrip("-* \t").strip()
            if ref:
                ref_lines.append(ref)
        else:
            body_lines.append(line)

    body = "\n".join(body_lines).strip()
    if not body or _EMPTY_MARKER.lower() in body.lower():
        return None

    return {
        "title": title,
        "body": body,
        "scripture_refs": "\n".join(ref_lines) or None,
    }


def load_confessions(db: Session) -> int:
    """Sync the corpus from disk into the Confession table. Returns the count loaded.

    Idempotent: existing confessions are updated in place (matched by slug), new ones
    inserted. Untouched if the corpus directory is missing.
    """
    if not CORPUS_DIR.is_dir():
        return 0

    existing = {c.slug: c for c in db.scalars(select(Confession)).all()}
    count = 0
    for path in sorted(CORPUS_DIR.glob("*.md")):
        parsed = parse_confession(path.read_text(encoding="utf-8"), path.stem)
        if parsed is None:
            continue
        slug = _slugify(path.stem)
        record = existing.get(slug)
        if record is None:
            db.add(Confession(slug=slug, **parsed))
        else:
            record.title = parsed["title"]
            record.body = parsed["body"]
            record.scripture_refs = parsed["scripture_refs"]
        count += 1

    db.commit()
    return count
