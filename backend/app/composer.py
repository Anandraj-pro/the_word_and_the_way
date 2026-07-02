"""Compose an extended, personal confession from a real-time need.

This is the *generation* half of the room's RAG. Given a struggle spoken plainly
("I am afraid for my job"), it:

    1. RETRIEVES the confessions on the Wall nearest that need (rag.search),
    2. AUGMENTS them with the actual Scripture text behind their references
       (bible.lookup — cached, offline-friendly),
    3. GENERATES a new declaration and prayer with a local model (Ollama qwen2.5),
       grounded in that inherited language and the Word itself.

The result is never written to the Wall — the Wall is inherited liturgy. It is shown
to be prayed, and kept (if it lands) as a *declared* Encounter on the spine.
"""
import json
import re

import requests
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import bible, rag
from .models import Confession
from .rag import OLLAMA_URL

# The scribe. Strong at following structure and holding a reverent register.
CHAT_MODEL = "qwen2.5:7b"

# Keep the prompt bounded for a 7B model: a few confessions, trimmed, and a handful
# of grounding verses.
MAX_CONFESSIONS = 3
MAX_BODY_CHARS = 1200
MAX_SCRIPTURES = 6

# Strip a trailing translation tag like " (AMP)" and collapse a multi-verse ref
# ("Ephesians 4:15,32") down to the first verse so bible-api can resolve it.
_TRANSLATION_TAG = re.compile(r"\s*\([^)]*\)\s*$")


class ComposerUnavailable(Exception):
    """The local model couldn't be reached — generation isn't possible right now."""


def _clean_ref(ref: str) -> str:
    """Best-effort normalize a corpus reference into something bible-api can look up."""
    ref = _TRANSLATION_TAG.sub("", ref).strip()
    ref = ref.split(",")[0].strip()  # "Ephesians 4:15,32" -> "Ephesians 4:15"
    return ref


def gather_scripture(db: Session, references: list[str]) -> list[dict]:
    """Fetch the real verse text for a list of references, best-effort.

    Serves from the Scripture cache when possible; silently skips any reference that
    can't be resolved or reached, so a missing verse never blocks a confession.
    """
    seen: set[str] = set()
    verses: list[dict] = []
    for raw in references:
        ref = _clean_ref(raw)
        if not ref or ref.lower() in seen:
            continue
        seen.add(ref.lower())
        try:
            hit = bible.lookup(db, ref)
        except bible.ScriptureUnavailable:
            continue
        if hit and hit.get("text"):
            verses.append({"reference": hit["reference"], "text": hit["text"]})
        if len(verses) >= MAX_SCRIPTURES:
            break
    return verses


_SYSTEM_PROMPT = (
    "You are a reverent scribe. A believer brings you a real struggle, and you turn it "
    "into a spoken confession of faith — words they can declare aloud over their own life, "
    "in the present tense, addressed as 'I' and 'my'. You draw on the inherited confessions "
    "and the Scripture you are given, and you may cite other well-known Bible references by "
    "chapter and verse. Stay grounded in Scripture; never quote a verse's text you were not "
    "given, only cite its reference.\n\n"
    "Respond with ONLY valid JSON, no prose around it, in exactly this shape:\n"
    '{"confession": "<several short paragraphs of first-person declaration>", '
    '"prayer": "<a short closing prayer>", '
    '"scriptures": ["<Book Chapter:Verse>", "..."]}'
)


def _build_user_prompt(problem: str, confessions: list[Confession], verses: list[dict]) -> str:
    parts = [f'THE BELIEVER\'S STRUGGLE:\n"{problem.strip()}"\n']

    parts.append("INHERITED CONFESSIONS TO DRAW FROM:")
    for c in confessions:
        body = c.body.strip()
        if len(body) > MAX_BODY_CHARS:
            body = body[:MAX_BODY_CHARS].rstrip() + "…"
        parts.append(f"\n## {c.title}\n{body}")

    if verses:
        parts.append("\nSCRIPTURE TO GROUND IT IN (use these words faithfully):")
        for v in verses:
            parts.append(f'- {v["reference"]}: "{v["text"]}"')

    parts.append(
        "\nNow write an extended, personal confession and a closing prayer for THIS "
        "struggle, in the believer's own voice. Return the JSON described above."
    )
    return "\n".join(parts)


def _chat(system: str, user: str, timeout: int = 180) -> str:
    """One turn with the local model, asking for a JSON reply."""
    try:
        resp = requests.post(
            f"{OLLAMA_URL}/api/chat",
            json={
                "model": CHAT_MODEL,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                "stream": False,
                "format": "json",
                "options": {"temperature": 0.7},
            },
            timeout=timeout,
        )
    except requests.RequestException as exc:
        raise ComposerUnavailable(str(exc)) from exc

    if resp.status_code != 200:
        raise ComposerUnavailable(f"ollama returned {resp.status_code}")
    return resp.json()["message"]["content"]


def compose(db: Session, problem: str, n: int = MAX_CONFESSIONS) -> dict:
    """Turn a real-time struggle into a grounded, extended confession.

    Returns {problem, confession, prayer, scriptures:[{reference,text}], sources:[Confession]}.
    Raises ComposerUnavailable if the local model can't be reached.
    """
    slugs = rag.search(problem, n=n)
    sources: list[Confession] = []
    if slugs:
        rows = db.scalars(select(Confession).where(Confession.slug.in_(slugs))).all()
        order = {slug: i for i, slug in enumerate(slugs)}
        sources = sorted(rows, key=lambda c: order.get(c.slug, 999))

    # Ground the model in the Word behind those confessions.
    grounding = gather_scripture(db, [ref for c in sources for ref in c.refs])

    user_prompt = _build_user_prompt(problem, sources, grounding)
    raw = _chat(_SYSTEM_PROMPT, user_prompt)

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        # The model ignored the JSON contract — still hand back what it wrote.
        parsed = {"confession": raw.strip(), "prayer": "", "scriptures": []}

    confession = (parsed.get("confession") or "").strip()
    prayer = (parsed.get("prayer") or "").strip()
    cited = parsed.get("scriptures") or []
    if isinstance(cited, str):
        cited = [cited]

    # Attach the real verse text for every reference the confession stands on:
    # the grounding verses plus any the model cited. This is the Word, embedded.
    all_refs = [v["reference"] for v in grounding] + [str(r) for r in cited]
    scriptures = gather_scripture(db, all_refs) if all_refs else []

    return {
        "problem": problem.strip(),
        "confession": confession,
        "prayer": prayer,
        "scriptures": scriptures,
        "sources": sources,
    }
