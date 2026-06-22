"""RAG layer — semantic search over the confession corpus using ChromaDB + Ollama embeddings."""

from pathlib import Path

import chromadb
import requests

CHROMA_DIR = Path(__file__).parent.parent / "chroma_db"
EMBED_MODEL = "nomic-embed-text"
OLLAMA_URL = "http://localhost:11434"
COLLECTION_NAME = "confessions"


def _embed(texts: list[str]) -> list[list[float]]:
    """Call Ollama nomic-embed-text for a batch of texts."""
    embeddings = []
    for text in texts:
        resp = requests.post(
            f"{OLLAMA_URL}/api/embeddings",
            json={"model": EMBED_MODEL, "prompt": text[:2000]},
            timeout=30,
        )
        resp.raise_for_status()
        embeddings.append(resp.json()["embedding"])
    return embeddings


def _get_collection() -> chromadb.Collection:
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )


def index_confessions(confessions) -> None:
    """Upsert all confessions into ChromaDB. Safe to call on every startup — idempotent."""
    if not confessions:
        return

    collection = _get_collection()
    existing_ids = set(collection.get(include=[])["ids"])

    to_add = [c for c in confessions if c.slug not in existing_ids]
    if not to_add:
        print(f"  RAG   {len(existing_ids)} confessions already indexed — nothing to add")
        return

    print(f"  RAG   indexing {len(to_add)} new confession(s)…")
    texts = [f"{c.title}\n\n{c.body}" for c in to_add]
    embeddings = _embed(texts)

    collection.upsert(
        ids=[c.slug for c in to_add],
        embeddings=embeddings,
        documents=texts,
        metadatas=[{"title": c.title, "slug": c.slug} for c in to_add],
    )
    print(f"  RAG   done — {len(existing_ids) + len(to_add)} total indexed")


def search(query: str, n: int = 5) -> list[str]:
    """Return up to n confession slugs ranked by semantic similarity to query."""
    collection = _get_collection()
    if collection.count() == 0:
        return []

    embedding = _embed([query])[0]
    results = collection.query(
        query_embeddings=[embedding],
        n_results=min(n, collection.count()),
        include=["metadatas", "distances"],
    )
    return [m["slug"] for m in results["metadatas"][0]]
