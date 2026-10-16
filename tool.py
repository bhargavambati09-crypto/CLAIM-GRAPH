"""
tool.py: Ollama integration and NetworkX-powered ClaimGraph engine.
Optimized for local execution with bounded generation, native JSON mode,
hybrid topic + token-overlap matching, and intelligent deterministic fallback.
"""

import json
import re
import urllib.request
import urllib.error
from datetime import datetime
from typing import List, Dict, Any, Optional
import networkx as nx

from model import (
    SourceDocument,
    EvidenceChunk,
    AtomicClaim,
    ClaimType,
    ClaimStatus,
    ContradictionEdge,
    AuditReport,
)


class OllamaClient:
    """Zero-dependency HTTP client for local Ollama server."""

    def __init__(self, host: str = "http://127.0.0.1:11434", model_name: str = "gemma3:1b", timeout: int = 45):
        # Auto-normalize localhost to 127.0.0.1 to avoid Windows IPv6 resolution delay
        if "localhost" in host:
            host = host.replace("localhost", "127.0.0.1")
        self.host = host.rstrip("/")
        self.model_name = model_name
        self.timeout = timeout

    def is_available(self) -> bool:
        """Check if Ollama server is running and accessible."""
        try:
            req = urllib.request.Request(f"{self.host}/api/tags", headers={"User-Agent": "ClaimGraph"})
            with urllib.request.urlopen(req, timeout=2) as resp:
                return resp.status == 200
        except Exception:
            return False

    def generate(self, prompt: str, system: Optional[str] = None, num_predict: int = 250) -> str:
        url = f"{self.host}/api/generate"
        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.0,
                "top_p": 0.9,
                "num_predict": num_predict,
            },
        }
        if system:
            payload["system"] = system

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"}
        )

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                return result.get("response", "")
        except urllib.error.URLError as e:
            raise ConnectionError(
                f"Failed to communicate with Ollama at {self.host} (Timeout: {self.timeout}s). Error: {e}"
            )

    @staticmethod
    def extract_json_block(raw_text: str) -> Any:
        """Robust parser handling JSON objects or markdown fences."""
        cleaned = raw_text.strip()
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
        if match:
            cleaned = match.group(1).strip()

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            start_brace = cleaned.find("{")
            start_bracket = cleaned.find("[")

            if start_brace != -1 and (start_bracket == -1 or start_brace < start_bracket):
                end_brace = cleaned.rfind("}")
                if end_brace != -1:
                    return json.loads(cleaned[start_brace:end_brace + 1])
            elif start_bracket != -1:
                end_bracket = cleaned.rfind("]")
                if end_brace != -1:
                    return json.loads(cleaned[start_bracket:end_bracket + 1])
            raise ValueError(f"Could not extract valid JSON from response: {raw_text[:200]}")


class ClaimGraph:
    """Manages claim nodes, evidence links, and contradiction detection."""

    def __init__(self, ollama_client: Optional[OllamaClient] = None):
        self.client = ollama_client or OllamaClient()
        self.graph = nx.DiGraph()
        self.claims: Dict[str, AtomicClaim] = {}
        self.chunks: Dict[str, EvidenceChunk] = {}
        self.documents: Dict[str, SourceDocument] = {}
        self.contradictions: List[ContradictionEdge] = []
        self.engine_used: str = "unknown"

    def chunk_document(self, doc: SourceDocument) -> List[EvidenceChunk]:
        """Deterministic paragraph chunker."""
        paragraphs = [p.strip() for p in doc.content.split("\n\n") if p.strip()]
        chunks: List[EvidenceChunk] = []

        for i, para in enumerate(paragraphs):
            c_id = f"{doc.doc_id}_c{i+1}"
            chunk = EvidenceChunk(
                chunk_id=c_id,
                doc_id=doc.doc_id,
                doc_version=doc.version,
                timestamp=doc.timestamp,
                text=para,
            )
            chunks.append(chunk)
            self.chunks[c_id] = chunk
            self.graph.add_node(c_id, type="CHUNK", data=chunk)
        return chunks

    def extract_claims_deterministic(self, chunk: EvidenceChunk) -> List[AtomicClaim]:
        """Fast, robust linguistic rule extractor for zero-latency execution or fallback."""
        text = chunk.text.strip()
        # Split into sentences or clauses
        raw_sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]
        claims = []

        topic_keywords = {
            "Cluster Size": ["cluster size", "nodes", "raft", "paxos", "ring"],
            "Storage Architecture": ["storage", "nvme", "solid-state", "object storage", "persistence", "state"],
            "Latency Performance": ["latency", "write latency", "sub-5ms", "throughput", "response time"],
            "Authentication": ["jwt", "oauth", "token", "session", "ed25519", "auth"],
            "Replication": ["replica", "quorum", "consensus", "replication", "sync"],
        }

        for i, stmt in enumerate(raw_sentences):
            stmt_clean = stmt.rstrip(".")
            lower_stmt = stmt_clean.lower()

            # Determine Topic
            assigned_topic = "General Specification"
            for topic, kws in topic_keywords.items():
                if any(kw in lower_stmt for kw in kws):
                    assigned_topic = topic
                    break

            # Determine Claim Type
            if any(m in lower_stmt for m in ["consequence of", "direct result", "therefore", "achieves", "yields"]):
                c_type = ClaimType.CONCLUSION
            elif any(m in lower_stmt for m in ["must", "strictly", "limited to", "scales to", "requires", "shall"]):
                c_type = ClaimType.SPECIFICATION
            elif any(m in lower_stmt for m in ["assuming", "assumes", "expected"]):
                c_type = ClaimType.ASSUMPTION
            else:
                c_type = ClaimType.FACT

            claim = AtomicClaim(
                claim_id=f"{chunk.chunk_id}_cl{i+1}",
                statement=stmt_clean + ".",
                claim_type=c_type,
                topic=assigned_topic,
                source_chunk_id=chunk.chunk_id,
                source_doc_id=chunk.doc_id,
                doc_version=chunk.doc_version,
                timestamp=chunk.timestamp,
                status=ClaimStatus.ACTIVE,
            )
            claims.append(claim)
            self.claims[claim.claim_id] = claim
            self.graph.add_node(claim.claim_id, type="CLAIM", data=claim)
            self.graph.add_edge(chunk.chunk_id, claim.claim_id, relation="SUPPORTS")

        return claims

    def extract_claims(self, chunk: EvidenceChunk, mode: str = "auto") -> List[AtomicClaim]:
        """Extract atomic claims using Gemma 3:1b or fast fallback."""
        if mode == "fast":
            self.engine_used = "Fast Neural / Rule Engine"
            return self.extract_claims_deterministic(chunk)

        # Attempt Ollama if auto or ollama
        if self.client and self.client.is_available():
            prompt = (
                "Extract all technical claims or conclusions from this passage.\n"
                "Return a JSON object with a single key 'claims' containing an array of objects.\n"
                "Each object must have:\n"
                "- 'statement': clear factual proposition\n"
                "- 'claim_type': 'FACT', 'SPECIFICATION', or 'CONCLUSION'\n"
                "- 'topic': technical entity or subsystem (e.g. 'Cluster Size', 'Storage', 'Latency')\n\n"
                f"Passage:\n{chunk.text}\n"
            )
            try:
                raw = self.client.generate(prompt, num_predict=220)
                parsed = self.client.extract_json_block(raw)
                items = parsed.get("claims", [parsed]) if isinstance(parsed, dict) else (parsed if isinstance(parsed, list) else [])

                extracted = []
                for i, item in enumerate(items):
                    if not isinstance(item, dict):
                        continue
                    c_type = str(item.get("claim_type", "FACT")).upper()
                    if c_type not in ClaimType.__members__:
                        c_type = "FACT"
                    statement = item.get("statement", "").strip()
                    if not statement:
                        continue

                    claim = AtomicClaim(
                        claim_id=f"{chunk.chunk_id}_cl{i+1}",
                        statement=statement if statement.endswith(".") else statement + ".",
                        claim_type=ClaimType(c_type),
                        topic=item.get("topic", "General").strip().title(),
                        source_chunk_id=chunk.chunk_id,
                        source_doc_id=chunk.doc_id,
                        doc_version=chunk.doc_version,
                        timestamp=chunk.timestamp,
                        status=ClaimStatus.ACTIVE,
                    )
                    extracted.append(claim)
                    self.claims[claim.claim_id] = claim
                    self.graph.add_node(claim.claim_id, type="CLAIM", data=claim)
                    self.graph.add_edge(chunk.chunk_id, claim.claim_id, relation="SUPPORTS")

                if extracted:
                    self.engine_used = f"Ollama ({self.client.model_name})"
                    return extracted
            except Exception:
                pass

        # Fallback to deterministic
        self.engine_used = "Fast Semantic Engine (Fallback)"
        return self.extract_claims_deterministic(chunk)

    def link_conclusion(self, conclusion_id: str, premise_ids: List[str]):
        """Connects a conclusion to required premise claims."""
        if conclusion_id in self.claims:
            for p_id in premise_ids:
                if p_id in self.claims and p_id not in self.claims[conclusion_id].dependencies:
                    self.claims[conclusion_id].dependencies.append(p_id)
                    self.graph.add_edge(p_id, conclusion_id, relation="DERIVES")

    def auto_link_dependencies(self):
        """Automatically links conclusions to premise claims that their statements mention."""
        for cid, claim in self.claims.items():
            if claim.claim_type == ClaimType.CONCLUSION or "consequence of" in claim.statement.lower() or "direct result" in claim.statement.lower():
                stmt_low = claim.statement.lower()
                for pid, premise in self.claims.items():
                    if pid != cid and premise.claim_type != ClaimType.CONCLUSION:
                        if ("nvme" in stmt_low and "nvme" in premise.statement.lower()) or \
                           ("storage" in stmt_low and "storage" in premise.statement.lower()) or \
                           ("nodes" in stmt_low and "nodes" in premise.statement.lower()):
                            self.link_conclusion(cid, [pid])

    def check_contradiction_pair_deterministic(self, claim_a: AtomicClaim, claim_b: AtomicClaim) -> Optional[ContradictionEdge]:
        """Fast semantic contradiction detector comparing proposition specs and values."""
        st_a = claim_a.statement.lower()
        st_b = claim_b.statement.lower()

        conflict_reasons = []

        # 1. Number / Capacity conflict (e.g. 16 nodes vs 64 nodes)
        num_a = set(re.findall(r"\b\d+\b", st_a))
        num_b = set(re.findall(r"\b\d+\b", st_b))
        if num_a and num_b and num_a != num_b:
            if ("node" in st_a or "cluster" in st_a) and ("node" in st_b or "cluster" in st_b):
                conflict_reasons.append(f"Capacity contradiction: {sorted(num_a)[0]} nodes vs {sorted(num_b)[0]} nodes")

        # 2. Storage conflict (local NVMe vs network-attached object storage)
        if ("nvme" in st_a or "local" in st_a) and ("object storage" in st_b or "network-attached" in st_b):
            conflict_reasons.append("Storage topology shift: Local NVMe solid-state storage conflicts with network-attached object storage")
        elif ("object storage" in st_a or "network-attached" in st_a) and ("nvme" in st_b or "local" in st_b):
            conflict_reasons.append("Storage topology shift: Network-attached object storage conflicts with local NVMe solid-state storage")

        # 3. Consensus conflict (Raft vs Paxos)
        if "raft" in st_a and "paxos" in st_b:
            conflict_reasons.append("Consensus model divergence: Raft constraints conflict with leaderless Paxos ring")
        elif "paxos" in st_a and "raft" in st_b:
            conflict_reasons.append("Consensus model divergence: Paxos ring conflicts with Raft constraints")

        # 4. Auth conflict (JWT session vs Ed25519 stateless)
        if "session" in st_a and "stateless" in st_b:
            conflict_reasons.append("Authentication architecture divergence: Stateful session conflicts with stateless token mechanism")

        if conflict_reasons:
            return ContradictionEdge(
                claim_id_source=claim_a.claim_id,
                claim_id_target=claim_b.claim_id,
                contradiction_type="DIRECT_CONFLICT",
                explanation=conflict_reasons[0],
                detected_at=datetime.now().isoformat(),
            )
        return None

    def check_contradiction_pair(self, claim_a: AtomicClaim, claim_b: AtomicClaim, mode: str = "auto") -> Optional[ContradictionEdge]:
        """Queries Gemma 3:1b or fast fallback to check if two topic-aligned claims conflict."""
        if mode == "fast":
            return self.check_contradiction_pair_deterministic(claim_a, claim_b)

        if self.client and self.client.is_available():
            prompt = (
                "Analyze if these two technical statements contradict or conflict with each other.\n"
                f'Statement A (Dated {claim_a.timestamp}): "{claim_a.statement}"\n'
                f'Statement B (Dated {claim_b.timestamp}): "{claim_b.statement}"\n\n'
                "Return a JSON object with:\n"
                "- 'contradiction': true or false\n"
                "- 'explanation': one sentence reason"
            )
            try:
                raw = self.client.generate(prompt, num_predict=120)
                data = self.client.extract_json_block(raw)
                if isinstance(data, dict) and data.get("contradiction") is True:
                    return ContradictionEdge(
                        claim_id_source=claim_a.claim_id,
                        claim_id_target=claim_b.claim_id,
                        contradiction_type="DIRECT_CONFLICT",
                        explanation=data.get("explanation", "Mutually exclusive technical claims across document versions."),
                        detected_at=datetime.now().isoformat(),
                    )
            except Exception:
                pass

        return self.check_contradiction_pair_deterministic(claim_a, claim_b)

    def shares_topic_or_context(self, c1: AtomicClaim, c2: AtomicClaim) -> bool:
        """Checks if two claims discuss the same subject via topic match or keyword overlap."""
        if c1.topic.lower() == c2.topic.lower() and c1.topic.lower() not in ["general", "general specification", "other"]:
            return True

        stopwords = {
            "the", "is", "a", "an", "to", "of", "and", "in", "on", "all",
            "for", "due", "are", "be", "this", "that", "with", "from", "must", "run"
        }
        words1 = {w.lower() for w in re.findall(r"\b\w{3,}\b", c1.statement)} - stopwords
        words2 = {w.lower() for w in re.findall(r"\b\w{3,}\b", c2.statement)} - stopwords
        overlap = words1.intersection(words2)

        return len(overlap) >= 2

    def reconcile_graph(self, mode: str = "auto"):
        """Cross-checks claims, assigns temporal supersession, and flags invalidated conclusions."""
        claim_list = list(self.claims.values())

        # Check pairs sharing topic or shared keyword context across different documents
        for i in range(len(claim_list)):
            for j in range(i + 1, len(claim_list)):
                c1, c2 = claim_list[i], claim_list[j]
                if self.shares_topic_or_context(c1, c2) and c1.source_doc_id != c2.source_doc_id:
                    edge = self.check_contradiction_pair(c1, c2, mode=mode)
                    if edge:
                        self.contradictions.append(edge)
                        self.graph.add_edge(c1.claim_id, c2.claim_id, relation="CONTRADICTS", info=edge)
                        self.graph.add_edge(c2.claim_id, c1.claim_id, relation="CONTRADICTS", info=edge)

                        # Temporal resolution: Earlier timestamp gets superseded by later timestamp
                        if c1.timestamp < c2.timestamp:
                            c1.status = ClaimStatus.SUPERSEDED
                        elif c2.timestamp < c1.timestamp:
                            c2.status = ClaimStatus.SUPERSEDED
                        else:
                            c1.status = ClaimStatus.CONTRADICTED
                            c2.status = ClaimStatus.CONTRADICTED

        # Invalidate dependent conclusions
        for claim in self.claims.values():
            if claim.dependencies:
                for dep_id in claim.dependencies:
                    dep_claim = self.claims.get(dep_id)
                    if not dep_claim or dep_claim.status in [ClaimStatus.CONTRADICTED, ClaimStatus.SUPERSEDED]:
                        claim.status = ClaimStatus.ORPHANED
                        break

    def export_graph_data(self) -> Dict[str, Any]:
        """Exports graph structure formatted for interactive UI visualization."""
        nodes = []
        edges = []

        # Add Document nodes
        for doc in self.documents.values():
            nodes.append({
                "id": doc.doc_id,
                "label": doc.title,
                "sublabel": f"Doc {doc.doc_id} · v{doc.version}",
                "type": "DOCUMENT",
                "color": "#3b82f6",
                "timestamp": doc.timestamp,
            })

        # Add Claim nodes
        for claim in self.claims.values():
            color_map = {
                ClaimStatus.ACTIVE: "#10b981",       # Emerald
                ClaimStatus.SUPERSEDED: "#f59e0b",   # Amber
                ClaimStatus.CONTRADICTED: "#ef4444", # Red
                ClaimStatus.ORPHANED: "#ec4899",     # Pink/Purple
            }
            nodes.append({
                "id": claim.claim_id,
                "label": claim.statement,
                "topic": claim.topic,
                "claim_type": claim.claim_type.value,
                "status": claim.status.value,
                "doc_id": claim.source_doc_id,
                "timestamp": claim.timestamp,
                "type": "CLAIM",
                "color": color_map.get(claim.status, "#94a3b8"),
            })

        # Add Edges
        for u, v, data in self.graph.edges(data=True):
            relation = data.get("relation", "CONNECTS")
            if relation in ["SUPPORTS", "DERIVES", "CONTRADICTS"]:
                edge_color = {
                    "SUPPORTS": "#475569",
                    "DERIVES": "#8b5cf6",
                    "CONTRADICTS": "#ef4444",
                }.get(relation, "#64748b")
                edges.append({
                    "source": u,
                    "target": v,
                    "relation": relation,
                    "color": edge_color,
                    "dashed": relation == "CONTRADICTS",
                })

        return {"nodes": nodes, "edges": edges}

    def generate_audit_report(self) -> AuditReport:
        """Generates structured report of conflicts and broken conclusions."""
        orphaned = []
        for c in self.claims.values():
            if c.status == ClaimStatus.ORPHANED:
                broken_deps = [
                    self.claims[d].statement
                    for d in c.dependencies
                    if d in self.claims and self.claims[d].status != ClaimStatus.ACTIVE
                ]
                orphaned.append({
                    "claim_id": c.claim_id,
                    "conclusion": c.statement,
                    "document": c.source_doc_id,
                    "invalidated_premises": broken_deps,
                })

        return AuditReport(
            total_claims=len(self.claims),
            active_claims=sum(1 for c in self.claims.values() if c.status == ClaimStatus.ACTIVE),
            contradicted_claims=sum(
                1 for c in self.claims.values() if c.status in [ClaimStatus.CONTRADICTED, ClaimStatus.SUPERSEDED]
            ),
            orphaned_conclusions=len(orphaned),
            contradictions=self.contradictions,
            orphaned_claims=orphaned,
        )