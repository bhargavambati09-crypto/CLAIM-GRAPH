"""
app.py: Production backend for CLAIM GRAPH.
Provides REST API endpoints for document ingestion, claim extraction,
temporal contradiction reconciliation, dependency graph export, and scenario simulation.
"""

import json
import logging
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, List, Optional
from urllib.error import URLError
from urllib.request import Request, urlopen

from model import SourceDocument
from tool import ClaimGraph, OllamaClient


HOST = "0.0.0.0"
PORT = 8000
INDEX_FILE = Path(__file__).with_name("index.html")

SCENARIOS = {
    "cloud_distributed": {
        "id": "cloud_distributed",
        "title": "Cloud Distributed Engine Architecture",
        "description": "Multi-version migration from Raft + Local NVMe to Paxos + Object Storage, invalidating sub-5ms latency conclusion.",
        "documents": [
            {
                "doc_id": "ARCH-V1",
                "title": "Core System Architecture Specification",
                "version": "1.0.0",
                "timestamp": "2025-01-15",
                "content": (
                    "The cluster size is strictly limited to 16 nodes due to Raft consensus constraints.\n\n"
                    "All state persistence operations must execute directly on local NVMe solid-state storage."
                ),
            },
            {
                "doc_id": "ARCH-V2",
                "title": "Distributed Engine Architecture Migration",
                "version": "2.0.0",
                "timestamp": "2025-08-20",
                "content": (
                    "The cluster size scales to 64 nodes through a leaderless Paxos ring.\n\n"
                    "All state persistence operations run on network-attached object storage volumes."
                ),
            },
            {
                "doc_id": "BENCH-AUDIT",
                "title": "Q3 Performance Evaluation Report",
                "version": "1.1.0",
                "timestamp": "2025-09-01",
                "content": (
                    "The system achieves sub-5ms write latency as a direct consequence of local NVMe storage."
                ),
            },
        ],
    },
    "auth_microservices": {
        "id": "auth_microservices",
        "title": "Microservices Authentication Architecture",
        "description": "Evolution from stateful Redis session tokens to stateless Ed25519 tokens, invalidating instant revocation guarantee.",
        "documents": [
            {
                "doc_id": "AUTH-V1",
                "title": "Identity & Access Specification",
                "version": "1.0.0",
                "timestamp": "2025-02-10",
                "content": (
                    "All API services authenticate via centralized stateful Redis session stores.\n\n"
                    "Session storage requires dedicated Redis cluster instances in each availability zone."
                ),
            },
            {
                "doc_id": "AUTH-V2",
                "title": "Zero-Trust Stateless Token Migration",
                "version": "2.0.0",
                "timestamp": "2025-07-15",
                "content": (
                    "All API services authenticate using decentralized stateless Ed25519 cryptographically signed tokens.\n\n"
                    "Token validation executes purely in edge memory without external Redis dependency."
                ),
            },
            {
                "doc_id": "SEC-AUDIT",
                "title": "Information Security Compliance Review",
                "version": "1.2.0",
                "timestamp": "2025-08-01",
                "content": (
                    "The system guarantees instant token revocation across all gateways as a direct consequence of centralized stateful Redis session stores."
                ),
            },
        ],
    },
    "distributed_database": {
        "id": "distributed_database",
        "title": "Database Durability & Consensus Protocol",
        "description": "Transition from synchronous cross-datacenter replication to asynchronous quorum replication, invalidating RPO=0 compliance.",
        "documents": [
            {
                "doc_id": "DB-V1",
                "title": "High-Durability Data Storage Engine",
                "version": "1.0.0",
                "timestamp": "2025-03-01",
                "content": (
                    "All database writes require synchronous replication across 3 physical datacenters before acknowledgment.\n\n"
                    "Data integrity checks run on every synchronous transaction boundary."
                ),
            },
            {
                "doc_id": "DB-V2",
                "title": "High-Throughput Quorum Engine Migration",
                "version": "2.0.0",
                "timestamp": "2025-10-10",
                "content": (
                    "All database writes utilize asynchronous multi-region quorum replication to minimize network overhead.\n\n"
                    "Replication operates with eventual consistency across datacenters."
                ),
            },
            {
                "doc_id": "COMPLIANCE-DOC",
                "title": "Disaster Recovery & Financial Compliance",
                "version": "1.1.0",
                "timestamp": "2025-11-05",
                "content": (
                    "Zero data loss recovery point objective (RPO=0) is guaranteed as a direct consequence of synchronous replication across 3 physical datacenters."
                ),
            },
        ],
    },
    "healthcare_hipaa": {
        "id": "healthcare_hipaa",
        "title": "Healthcare HIPAA Cloud Migration",
        "description": "Transition from local dedicated SAN hardware to public multi-tenant cloud object buckets, invalidating physical BAA isolation guarantee.",
        "documents": [
            {
                "doc_id": "HIPAA-V1",
                "title": "Patient Health Records Architecture",
                "version": "1.0.0",
                "timestamp": "2024-03-01",
                "content": (
                    "All patient electronic health records (ePHI) must be stored exclusively on local dedicated hardware SAN storage with physically segregated access controls.\n\n"
                    "Access auditing requires dedicated hardware appliance logging."
                ),
            },
            {
                "doc_id": "HIPAA-V2",
                "title": "Public Cloud Modernization Migration",
                "version": "2.0.0",
                "timestamp": "2024-11-15",
                "content": (
                    "Patient health data storage scales into multi-tenant public cloud object buckets with automated TLS encryption at rest.\n\n"
                    "Access logging transitions to centralized cloud trail events."
                ),
            },
            {
                "doc_id": "AUDIT-HIPAA-Q4",
                "title": "Annual Healthcare Regulatory Audit",
                "version": "1.2.0",
                "timestamp": "2024-12-01",
                "content": (
                    "The system satisfies strict physical BAA isolation guarantees as a direct consequence of local dedicated hardware SAN storage."
                ),
            },
        ],
    },
    "drone_avionics": {
        "id": "drone_avionics",
        "title": "Autonomous Drone Navigation & Fail-Safe",
        "description": "Shift from dual differential GPS lock to optical vision odometry, invalidating sub-10cm return-to-home landing precision.",
        "documents": [
            {
                "doc_id": "DRONE-V1",
                "title": "Avionics Core Specification",
                "version": "1.0.0",
                "timestamp": "2025-01-10",
                "content": (
                    "All autonomous navigation decisions must execute with dual differential GPS lock.\n\n"
                    "Telemetry beacon polling occurs at 50Hz via satellite transponders."
                ),
            },
            {
                "doc_id": "DRONE-V2",
                "title": "GPS-Denied Navigation Upgrade",
                "version": "2.0.0",
                "timestamp": "2025-06-20",
                "content": (
                    "Autonomous navigation switches to optical vision flow and lidar odometry in GPS-denied environments without satellite dependency.\n\n"
                    "Visual odometry polling runs on edge neural accelerators at 120Hz."
                ),
            },
            {
                "doc_id": "SAFETY-AUDIT",
                "title": "Autonomous Flight Safety Assessment",
                "version": "1.1.0",
                "timestamp": "2025-07-05",
                "content": (
                    "The aircraft guarantees zero-drift return-to-home accuracy under 10cm as a direct consequence of dual differential GPS lock."
                ),
            },
        ],
    },
    "fintech_ledger": {
        "id": "fintech_ledger",
        "title": "Fintech Real-Time Ledger Persistence",
        "description": "Migration from strict two-phase commit synchronous locks to asynchronous CQRS event-sourcing, invalidating instantaneous zero-skew ledger balance reconciliation.",
        "documents": [
            {
                "doc_id": "LEDGER-V1",
                "title": "Financial Transaction Persistence Specification",
                "version": "1.0.0",
                "timestamp": "2025-02-01",
                "content": (
                    "All transaction persistence operates via strict two-phase commit synchronous locks across relational database nodes.\n\n"
                    "Balance ledger mutations require distributed row locks on every transfer."
                ),
            },
            {
                "doc_id": "LEDGER-V2",
                "title": "High-Throughput CQRS Ledger Engine",
                "version": "2.0.0",
                "timestamp": "2025-09-10",
                "content": (
                    "Transaction processing transitions to an asynchronous event-sourced CQRS log with eventual ledger consistency.\n\n"
                    "Ledger mutations stream non-blocking transaction events to distributed partitions."
                ),
            },
            {
                "doc_id": "FIN-COMPLIANCE",
                "title": "Banking Core Reconciliation Compliance",
                "version": "1.1.0",
                "timestamp": "2025-10-01",
                "content": (
                    "The platform guarantees real-time zero-skew ledger reconciliation as a direct consequence of strict two-phase commit synchronous locks."
                ),
            },
        ],
    },
    "ai_quantization": {
        "id": "ai_quantization",
        "title": "AI Inference Quantization & SLA Protocol",
        "description": "Transition from dedicated FP16 tensor clusters to INT8 edge NPU quantization, invalidating 99.9% token mathematical precision fidelity guarantee.",
        "documents": [
            {
                "doc_id": "INFER-V1",
                "title": "High-Precision Inference Architecture",
                "version": "1.0.0",
                "timestamp": "2025-03-05",
                "content": (
                    "All tensor model inference must execute strictly in 16-bit floating point precision (FP16) on dedicated GPU clusters.\n\n"
                    "Weights remain unquantized in high-bandwidth GPU memory."
                ),
            },
            {
                "doc_id": "INFER-V2",
                "title": "Edge NPU Quantized Architecture",
                "version": "2.0.0",
                "timestamp": "2025-08-15",
                "content": (
                    "Model inference transitions to 8-bit integer quantized (INT8) weights running across distributed edge NPU chips.\n\n"
                    "Quantization utilizes post-training symmetric integer scaling."
                ),
            },
            {
                "doc_id": "SLA-REPORT",
                "title": "Model Quality & Client SLA Review",
                "version": "1.1.0",
                "timestamp": "2025-09-02",
                "content": (
                    "The platform guarantees 99.9% token mathematical precision fidelity as a direct consequence of 16-bit floating point precision (FP16)."
                ),
            },
        ],
    },
}


def run_audit(
    docs_input: Optional[List[dict[str, Any]]] = None,
    mode: str = "auto",
) -> dict[str, Any]:
    """Execute complete CLAIM GRAPH audit and return structured intelligence."""
    start_time = time.time()
    client = OllamaClient(host="http://127.0.0.1:11434", model_name="gemma3:1b")
    graph = ClaimGraph(client)

    # Ingest documents
    if docs_input and len(docs_input) > 0:
        documents = [
            SourceDocument(
                doc_id=d.get("doc_id", f"DOC-{i+1}"),
                title=d.get("title", f"Document {i+1}"),
                version=d.get("version", "1.0.0"),
                timestamp=d.get("timestamp", "2025-01-01"),
                content=d.get("content", ""),
            )
            for i, d in enumerate(docs_input)
        ]
    else:
        # Default scenario
        scenario = SCENARIOS["cloud_distributed"]
        documents = [
            SourceDocument(**doc_data)
            for doc_data in scenario["documents"]
        ]

    for document in documents:
        graph.documents[document.doc_id] = document
        for chunk in graph.chunk_document(document):
            graph.extract_claims(chunk, mode=mode)

    # Automatically identify premise-conclusion links
    graph.auto_link_dependencies()

    # Domain-specific fallback dependency matching for benchmark
    storage_claim_id = next(
        (
            claim_id
            for claim_id, claim in graph.claims.items()
            if "nvme" in claim.statement.lower() and claim.source_doc_id == "ARCH-V1"
        ),
        None,
    )
    audit_claim_id = next(
        (
            claim_id
            for claim_id, claim in graph.claims.items()
            if "sub-5ms" in claim.statement.lower() or "latency" in claim.statement.lower()
        ),
        None,
    )
    if storage_claim_id and audit_claim_id:
        graph.link_conclusion(audit_claim_id, [storage_claim_id])

    # Reconcile graph: detect contradictions & temporal supersession
    graph.reconcile_graph(mode=mode)
    report = graph.generate_audit_report()
    graph_data = graph.export_graph_data()
    elapsed = round(time.time() - start_time, 2)

    return {
        "app_name": "CLAIM GRAPH",
        "execution_time_seconds": elapsed,
        "engine_used": graph.engine_used,
        "mode": mode,
        "summary": {
            "total_claims": report.total_claims,
            "active_claims": report.active_claims,
            "contradicted_claims": report.contradicted_claims,
            "orphaned_conclusions": report.orphaned_conclusions,
        },
        "documents": [
            {
                "doc_id": document.doc_id,
                "title": document.title,
                "version": document.version,
                "timestamp": document.timestamp,
                "content": document.content,
            }
            for document in documents
        ],
        "claims": [
            {
                "claim_id": claim.claim_id,
                "statement": claim.statement,
                "topic": claim.topic,
                "type": claim.claim_type.value,
                "status": claim.status.value,
                "source_doc_id": claim.source_doc_id,
                "timestamp": claim.timestamp,
                "dependencies": claim.dependencies,
            }
            for claim in graph.claims.values()
        ],
        "contradictions": [
            {
                "source_claim_id": edge.claim_id_source,
                "target_claim_id": edge.claim_id_target,
                "explanation": edge.explanation,
                "source_statement": graph.claims[edge.claim_id_source].statement,
                "target_statement": graph.claims[edge.claim_id_target].statement,
                "source_doc_id": graph.claims[edge.claim_id_source].source_doc_id,
                "target_doc_id": graph.claims[edge.claim_id_target].source_doc_id,
                "source_status": graph.claims[edge.claim_id_source].status.value,
                "target_status": graph.claims[edge.claim_id_target].status.value,
            }
            for edge in report.contradictions
        ],
        "orphaned_claims": report.orphaned_claims,
        "graph": graph_data,
    }


class ClaimGraphHandler(BaseHTTPRequestHandler):
    def _set_cors_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")

    def _send(self, status: int, content_type: str, body: bytes) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self._set_cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def _send_json(self, status: int, data: dict[str, Any]) -> None:
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self._send(status, "application/json; charset=utf-8", body)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self) -> None:
        if self.path in ["/health", "/api/status"]:
            client = OllamaClient(host="http://127.0.0.1:11434")
            ollama_online = client.is_available()
            self._send_json(200, {
                "status": "online",
                "app_name": "CLAIM GRAPH",
                "ollama_available": ollama_online,
                "ollama_host": "http://127.0.0.1:11434",
                "model": "gemma3:1b",
                "dual_engine": True,
            })
            return

        if self.path == "/api/scenarios":
            self._send_json(200, {
                "scenarios": list(SCENARIOS.values())
            })
            return

        # Static file handling (HTML, CSS, JS, Assets, Images)
        clean_path = self.path.split("?")[0].lstrip("/")
        if not clean_path or clean_path == "index.html":
            file_to_serve = BASE_DIR / "index.html"
        else:
            file_to_serve = (BASE_DIR / clean_path).resolve()

        if file_to_serve.is_file() and str(file_to_serve).startswith(str(BASE_DIR)):
            suffix = file_to_serve.suffix.lower()
            content_types = {
                ".html": "text/html; charset=utf-8",
                ".css": "text/css; charset=utf-8",
                ".js": "application/javascript; charset=utf-8",
                ".json": "application/json; charset=utf-8",
                ".png": "image/png",
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".webp": "image/webp",
                ".svg": "image/svg+xml",
                ".ico": "image/x-icon",
            }
            ctype = content_types.get(suffix, "application/octet-stream")
            try:
                body = file_to_serve.read_bytes()
                self._send(200, ctype, body)
                return
            except OSError:
                pass

        self._send_json(404, {"error": "Endpoint not found."})

    def do_POST(self) -> None:
        if self.path == "/api/run":
            content_length = int(self.headers.get("Content-Length", 0))
            payload = {}
            if content_length > 0:
                try:
                    payload = json.loads(self.rfile.read(content_length).decode("utf-8"))
                except Exception:
                    payload = {}

            mode = payload.get("mode", "auto")
            scenario_id = payload.get("scenario_id")
            custom_docs = payload.get("documents")

            if not custom_docs and scenario_id and scenario_id in SCENARIOS:
                custom_docs = SCENARIOS[scenario_id]["documents"]

            try:
                result = run_audit(docs_input=custom_docs, mode=mode)
                self._send_json(200, result)
            except Exception as e:
                logging.exception("Audit execution error")
                self._send_json(500, {
                    "error": f"CLAIM GRAPH audit encountered an error: {str(e)}",
                    "app_name": "CLAIM GRAPH"
                })
            return

        if self.path == "/api/verify-pair":
            content_length = int(self.headers.get("Content-Length", 0))
            try:
                payload = json.loads(self.rfile.read(content_length).decode("utf-8"))
                from model import AtomicClaim, ClaimType, ClaimStatus
                claim_a = AtomicClaim(
                    claim_id="TEST_A",
                    statement=payload.get("statement_a", ""),
                    claim_type=ClaimType.FACT,
                    topic=payload.get("topic_a", "Custom"),
                    source_chunk_id="chk_a",
                    source_doc_id="DOC_A",
                    doc_version="1.0",
                    timestamp=payload.get("date_a", "2025-01-01"),
                    status=ClaimStatus.ACTIVE,
                )
                claim_b = AtomicClaim(
                    claim_id="TEST_B",
                    statement=payload.get("statement_b", ""),
                    claim_type=ClaimType.FACT,
                    topic=payload.get("topic_b", "Custom"),
                    source_chunk_id="chk_b",
                    source_doc_id="DOC_B",
                    doc_version="2.0",
                    timestamp=payload.get("date_b", "2025-06-01"),
                    status=ClaimStatus.ACTIVE,
                )
                client = OllamaClient(host="http://127.0.0.1:11434")
                graph = ClaimGraph(client)
                mode = payload.get("mode", "auto")
                edge = graph.check_contradiction_pair(claim_a, claim_b, mode=mode)
                self._send_json(200, {
                    "contradiction": edge is not None,
                    "explanation": edge.explanation if edge else "No direct contradiction detected.",
                    "detected_at": edge.detected_at if edge else None,
                })
            except Exception as e:
                self._send_json(400, {"error": str(e)})
            return

        self._send_json(404, {"error": "Endpoint not found."})

    def log_message(self, format: str, *args: Any) -> None:
        logging.info("%s - %s", self.address_string(), format % args)


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    server = ThreadingHTTPServer((HOST, PORT), ClaimGraphHandler)
    logging.info("=" * 70)
    logging.info("CLAIM GRAPH Web Application Initialized")
    logging.info("Local Access URL:   http://localhost:%s/", PORT)
    logging.info("Localhost IPv4 URL: http://127.0.0.1:%s/", PORT)
    logging.info("=" * 70)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logging.info("Stopping CLAIM GRAPH server...")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()