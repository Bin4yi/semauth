"""Cosine similarity layer — intentionally shown failing on CVIC inputs."""

import os
from sentence_transformers import SentenceTransformer, util

THRESHOLD = float(os.getenv("SEMAUTH_SIMILARITY_THRESHOLD", "0.75"))
_model = None


def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def compute_similarity(text1: str, text2: str) -> float:
    model = get_model()
    emb = model.encode([text1, text2])
    return round(float(util.cos_sim(emb[0], emb[1])), 4)
