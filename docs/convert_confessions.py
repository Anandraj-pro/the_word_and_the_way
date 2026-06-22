#!/usr/bin/env python3
"""Convert confession files (DOC, DOCX, PDF, JPG) to Markdown using Ollama."""

import os
import subprocess
import base64
import json
from pathlib import Path

import requests

RAW_DIR = Path(__file__).parent / "confessions_raw"
MD_DIR  = Path(__file__).parent / "confessions_md"
OLLAMA  = "http://localhost:11434"

SKIP_FORMATS = {".pmd", ".p65"}
VISION_MODEL = "llava:7b"
TEXT_MODEL   = "qwen2.5:7b"


# ── extractors ───────────────────────────────────────────────────────────────

def extract_doc(path: Path) -> str:
    """Use macOS textutil to read legacy .doc / .DOC files."""
    result = subprocess.run(
        ["textutil", "-convert", "txt", "-stdout", str(path)],
        capture_output=True, text=True, timeout=30
    )
    return result.stdout.strip() if result.returncode == 0 else ""


def extract_docx(path: Path) -> str:
    from docx import Document
    doc = Document(str(path))
    parts = []
    for para in doc.paragraphs:
        text = para.text.strip()
        if text:
            parts.append(text)
    return "\n\n".join(parts)


def extract_pdf(path: Path) -> str:
    import pdfplumber
    parts = []
    with pdfplumber.open(str(path)) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                parts.append(text.strip())
    return "\n\n".join(parts)


def extract_image(path: Path) -> str:
    """OCR a JPG using Ollama llava:7b."""
    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()

    resp = requests.post(
        f"{OLLAMA}/api/generate",
        json={
            "model": VISION_MODEL,
            "prompt": (
                "This is a Christian prayer or confession document. "
                "Transcribe ALL text visible in this image exactly as written. "
                "Preserve headings and paragraph breaks. "
                "Output only the transcribed text — no commentary."
            ),
            "images": [b64],
            "stream": False,
        },
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json().get("response", "").strip()


# ── formatter ────────────────────────────────────────────────────────────────

def format_as_markdown(title: str, raw: str) -> str:
    """Ask qwen2.5:7b to format extracted text as clean Markdown."""
    # Truncate to avoid exceeding context window for very long docs
    body = raw[:4000]

    prompt = (
        f"Convert this Christian prayer/confession text into clean Markdown.\n\n"
        f"Rules:\n"
        f"- First line must be: # {title}\n"
        f"- Use ## for section headings (lines that are all-caps or clearly titled)\n"
        f"- Preserve every word of the prayer text exactly\n"
        f"- Italicise scripture references like *John 3:16*\n"
        f"- Keep numbered lists as numbered lists\n"
        f"- Separate paragraphs with a blank line\n"
        f"- Output only the Markdown — no explanation\n\n"
        f"Text:\n{body}"
    )

    resp = requests.post(
        f"{OLLAMA}/api/generate",
        json={"model": TEXT_MODEL, "prompt": prompt, "stream": False},
        timeout=120,
    )
    resp.raise_for_status()
    result = resp.json().get("response", "").strip()
    return result if result else f"# {title}\n\n{raw}"


# ── main ─────────────────────────────────────────────────────────────────────

def convert(path: Path) -> None:
    suffix = path.suffix.lower()

    if suffix in SKIP_FORMATS:
        print(f"  SKIP  {path.name}  (unsupported PageMaker format)")
        return

    out_check = MD_DIR / (path.stem + ".md")
    if out_check.exists():
        print(f"  DONE  {path.name}  (already converted)")
        return

    print(f"  ···   {path.name}")

    try:
        if suffix in (".doc",):
            raw = extract_doc(path)
        elif suffix == ".docx":
            raw = extract_docx(path)
        elif suffix == ".pdf":
            raw = extract_pdf(path)
        elif suffix in (".jpg", ".jpeg"):
            raw = extract_image(path)
        else:
            print(f"  SKIP  {path.name}  (unknown format)")
            return
    except Exception as exc:
        print(f"  ERROR extracting {path.name}: {exc}")
        raw = ""

    if not raw.strip():
        print(f"  WARN  {path.name}  — no text extracted")
        out = MD_DIR / (path.stem + ".md")
        out.write_text(f"# {path.stem}\n\n*No text could be extracted from this file.*\n")
        return

    title = path.stem.replace("_", " ").replace("-", " ").title()

    try:
        md = format_as_markdown(title, raw)
    except Exception as exc:
        print(f"  WARN  formatting failed for {path.name}: {exc} — saving raw text")
        md = f"# {title}\n\n{raw}"

    out = MD_DIR / (path.stem + ".md")
    out.write_text(md, encoding="utf-8")
    print(f"  OK    {out.name}")


def main():
    MD_DIR.mkdir(parents=True, exist_ok=True)
    files = sorted(RAW_DIR.iterdir())
    total = sum(1 for f in files if f.is_file() and f.suffix.lower() not in SKIP_FORMATS)
    skipped_fmt = sum(1 for f in files if f.is_file() and f.suffix.lower() in SKIP_FORMATS)

    print(f"\nConfession Converter")
    print(f"  Source : {RAW_DIR}")
    print(f"  Output : {MD_DIR}")
    print(f"  Files  : {total} to convert, {skipped_fmt} PageMaker files will be skipped\n")

    for f in files:
        if f.is_file():
            convert(f)

    done = list(MD_DIR.glob("*.md"))
    print(f"\nDone — {len(done)} markdown files written to {MD_DIR}")


if __name__ == "__main__":
    main()
