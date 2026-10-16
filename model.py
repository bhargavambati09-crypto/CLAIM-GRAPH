"""
model.py: Data schemas and state representations for ClaimGraph.
"""

from __future__ import annotations
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ClaimType(str, Enum):
    FACT = "FACT"
    SPECIFICATION = "SPECIFICATION"
    CONCLUSION = "CONCLUSION"
    ASSUMPTION = "ASSUMPTION"


class ClaimStatus(str, Enum):
    ACTIVE = "ACTIVE"
    CONTRADICTED = "CONTRADICTED"
    ORPHANED = "ORPHANED"
    SUPERSEDED = "SUPERSEDED"


class SourceDocument(BaseModel):
    doc_id: str
    title: str
    version: str
    timestamp: str  # ISO-8601 string: YYYY-MM-DD
    content: str


class EvidenceChunk(BaseModel):
    chunk_id: str
    doc_id: str
    doc_version: str
    timestamp: str
    text: str


class AtomicClaim(BaseModel):
    claim_id: str
    statement: str = Field(description="Normalized atomic proposition")
    claim_type: ClaimType = ClaimType.FACT
    topic: str = Field(description="High-level subject entity")
    source_chunk_id: str
    source_doc_id: str
    doc_version: str
    timestamp: str
    status: ClaimStatus = ClaimStatus.ACTIVE
    dependencies: List[str] = Field(
        default_factory=list,
        description="IDs of prerequisite claims this conclusion depends on"
    )


class ContradictionEdge(BaseModel):
    claim_id_source: str
    claim_id_target: str
    contradiction_type: str = "DIRECT_CONFLICT"
    explanation: str
    detected_at: str


class AuditReport(BaseModel):
    total_claims: int
    active_claims: int
    contradicted_claims: int
    orphaned_conclusions: int
    contradictions: List[ContradictionEdge]
    orphaned_claims: List[Dict[str, Any]]