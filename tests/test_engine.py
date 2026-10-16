"""
tests/test_engine.py: Automated test suite for CLAIM GRAPH.
Tests atomic proposition extraction, temporal contradiction detection across
core benchmarks & industry case studies, and orphaned conclusion invalidation.
"""

import unittest
from model import SourceDocument, ClaimType, ClaimStatus
from tool import ClaimGraph, OllamaClient


class TestClaimGraphEngine(unittest.TestCase):
    def setUp(self):
        # Initialize engine in deterministic fast mode (zero latency, no external Ollama dependency)
        self.graph = ClaimGraph(OllamaClient(host="http://127.0.0.1:11434"))

    def test_atomic_claim_extraction(self):
        doc = SourceDocument(
            doc_id="TEST-1",
            title="Storage Spec",
            version="1.0.0",
            timestamp="2025-01-01",
            content="The cluster size is strictly limited to 16 nodes due to Raft consensus constraints.\n\nAll state persistence operations must execute directly on local NVMe solid-state storage."
        )
        chunks = self.graph.chunk_document(doc)
        self.assertEqual(len(chunks), 2)
        claims = []
        for chunk in chunks:
            claims.extend(self.graph.extract_claims(chunk, mode="fast"))
        self.assertEqual(len(claims), 2)
        self.assertTrue(any("16 nodes" in c.statement for c in claims))
        self.assertTrue(any("nvme" in c.statement.lower() for c in claims))

    def test_temporal_contradiction_resolution(self):
        doc1 = SourceDocument(
            doc_id="DOC-V1",
            title="Arch Baseline",
            version="1.0.0",
            timestamp="2025-01-15",
            content="All state persistence operations must execute directly on local NVMe solid-state storage."
        )
        doc2 = SourceDocument(
            doc_id="DOC-V2",
            title="Arch Migration",
            version="2.0.0",
            timestamp="2025-08-20",
            content="All state persistence operations run on network-attached object storage volumes."
        )
        for doc in [doc1, doc2]:
            for chunk in self.graph.chunk_document(doc):
                self.graph.extract_claims(chunk, mode="fast")

        self.graph.auto_link_dependencies()
        self.graph.reconcile_graph(mode="fast")
        self.assertGreaterEqual(len(self.graph.contradictions), 1)

        # Earlier specification must be marked SUPERSEDED
        v1_claim = [c for c in self.graph.claims.values() if c.source_doc_id == "DOC-V1"][0]
        v2_claim = [c for c in self.graph.claims.values() if c.source_doc_id == "DOC-V2"][0]
        self.assertEqual(v1_claim.status, ClaimStatus.SUPERSEDED)
        self.assertEqual(v2_claim.status, ClaimStatus.ACTIVE)

    def test_orphaned_conclusion_propagation(self):
        doc1 = SourceDocument(
            doc_id="ARCH-V1",
            title="Storage Spec V1",
            version="1.0.0",
            timestamp="2025-01-15",
            content="All state persistence operations must execute directly on local NVMe solid-state storage."
        )
        doc2 = SourceDocument(
            doc_id="ARCH-V2",
            title="Storage Spec V2",
            version="2.0.0",
            timestamp="2025-08-20",
            content="All state persistence operations run on network-attached object storage volumes."
        )
        doc3 = SourceDocument(
            doc_id="AUDIT-1",
            title="Performance SLA",
            version="1.1.0",
            timestamp="2025-09-01",
            content="The system achieves sub-5ms write latency as a direct consequence of local NVMe solid-state storage."
        )
        for doc in [doc1, doc2, doc3]:
            for chunk in self.graph.chunk_document(doc):
                self.graph.extract_claims(chunk, mode="fast")

        self.graph.auto_link_dependencies()
        self.graph.reconcile_graph(mode="fast")
        report = self.graph.generate_audit_report()

        self.assertGreaterEqual(report.contradicted_claims, 1)
        self.assertEqual(report.orphaned_conclusions, 1)
        orphaned = [c for c in self.graph.claims.values() if c.status == ClaimStatus.ORPHANED]
        self.assertEqual(len(orphaned), 1)
        self.assertIn("sub-5ms", orphaned[0].statement.lower())

    def test_industry_case_studies(self):
        from app import SCENARIOS
        for scenario_id in ["healthcare_hipaa", "drone_avionics", "fintech_ledger", "ai_quantization"]:
            g = ClaimGraph()
            docs = [SourceDocument(**d) for d in SCENARIOS[scenario_id]["documents"]]
            for d in docs:
                for c in g.chunk_document(d):
                    g.extract_claims(c, mode="fast")
            g.auto_link_dependencies()
            g.reconcile_graph(mode="fast")
            rep = g.generate_audit_report()
            self.assertGreaterEqual(rep.contradicted_claims, 1, f"Failed on {scenario_id}")
            self.assertEqual(rep.orphaned_conclusions, 1, f"Failed orphan check on {scenario_id}")


if __name__ == "__main__":
    unittest.main()
