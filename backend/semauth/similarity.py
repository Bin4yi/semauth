"""Cosine similarity layer — intentionally shown failing on CVIC inputs."""

import os
import numpy as np
from openai import OpenAI

THRESHOLD = float(os.getenv("SEMAUTH_SIMILARITY_THRESHOLD", "0.75"))
_client = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _client


def _embed(text: str) -> list[float]:
    resp = _get_client().embeddings.create(model="text-embedding-3-small", input=text)
    return resp.data[0].embedding


def compute_similarity(text1: str, text2: str) -> float:
    e1 = np.array(_embed(text1))
    e2 = np.array(_embed(text2))
    cos = float(np.dot(e1, e2) / (np.linalg.norm(e1) * np.linalg.norm(e2)))
    return round(cos, 4)
