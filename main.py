"""
main.py: End-to-end execution of CLAIM GRAPH detecting contradictions
and orphaned conclusions across evolving system specifications.
"""

import sys
import json
from model import SourceDocument
from tool import OllamaClient, ClaimGraph


def main():
    print("=" * 75)
    print(" CLAIM GRAPH : Evidence & Contradiction Intelligence Engine ")
    print("=" * 75)

    # 1. Initialize Ollama Client with local IPv4 binding
    ollama = OllamaClient(host="http://127.0.0.1:11434", model_name="gemma3:1b")
    graph = ClaimGraph(ollama)

    # 2. Ingest Multi-Version Technical Documentation
    doc_v1 = SourceDocument(
        doc_id="ARCH-V1",
        title="Core System Architecture Specification",
        version="1.0.0",
        timestamp="2025-01-15",
        content=(
            "The cluster size is strictly limited to 16 nodes due to Raft consensus constraints.\n\n"
            "All state persistence operations must execute directly on local NVMe solid-state storage."
        ),
    )

    doc_v2 = SourceDocument(
        doc_id="ARCH-V2",
        title="Distributed Engine Architecture Migration",
        version="2.0.0",
        timestamp="2025-08-20",
        content=(
            "The cluster size scales to 64 nodes through a leaderless Paxos ring.\n\n"
            "All state persistence operations run on network-attached object storage volumes."
        ),
    )

    doc_audit = SourceDocument(
        doc_id="BENCH-AUDIT",
        title="Q3 Performance Evaluation Report",
        version="1.1.0",
        timestamp="2025-09-01",
        content=(
            "The system achieves sub-5ms write latency as a direct consequence of local NVMe storage."
        ),
    )

    documents = [doc_v1, doc_v2, doc_audit]

    print("\n[Phase 1] Ingesting Documents & Extracting Claims...")
    for doc in documents:
        graph.documents[doc.doc_id] = doc
        chunks = graph.chunk_document(doc)
        for chunk in chunks:
            claims = graph.extract_claims(chunk)
            print(f" -> Doc [{doc.doc_id}]: Extracted {len(claims)} claim(s) from chunk {chunk.chunk_id}")
            for c in claims:
                print(f"    - [{c.topic}] ({c.claim_type.value}) {c.statement}")

    # 3. Model Dependency Linkage (Conclusion depends on NVMe persistence premise)
    # Robust case-insensitive lookup
    v1_storage_claim = next((cid for cid, c in graph.claims.items() if "nvme" in c.statement.lower() and c.source_doc_id == "ARCH-V1"), None)
    audit_conclusion = next((cid for cid, c in graph.claims.items() if "sub-5ms" in c.statement.lower() or "latency" in c.statement.lower()), None)

    if v1_storage_claim and audit_conclusion:
        graph.link_conclusion(audit_conclusion, [v1_storage_claim])
        print(f"\n[Phase 2] Linked Dependency: Claim {audit_conclusion} depends on premise {v1_storage_claim}")
    else:
        graph.auto_link_dependencies()

    # 4. Reconcile Graph: Contradictions & Temporal Supersession
    print(f"\n[Phase 3] Reconciling Graph & Evaluating Semantic Contradictions [Engine: {graph.engine_used}]...")
    graph.reconcile_graph()

    # 5. Output Audit Report
    report = graph.generate_audit_report()

    print("\n" + "=" * 75)
    print(" CLAIM GRAPH INTELLIGENCE AUDIT SUMMARY ")
    print("=" * 75)
    print(f"Total Claims Analyzed:       {report.total_claims}")
    print(f"Active Valid Claims:         {report.active_claims}")
    print(f"Superseded/Contradicted:     {report.contradicted_claims}")
    print(f"Orphaned/Invalidated Claims: {report.orphaned_conclusions}")

    print("\n[Detected Contradictions across Revisions]")
    if report.contradictions:
        for i, edge in enumerate(report.contradictions, 1):
            c_src = graph.claims[edge.claim_id_source]
            c_tgt = graph.claims[edge.claim_id_target]
            print(f"\n  {i}. CONFLICT DETECTED between {c_src.source_doc_id} (v{c_src.doc_version}) and {c_tgt.source_doc_id} (v{c_tgt.doc_version})")
            print(f"     Topic:       {c_src.topic}")
            print(f"     Earlier:     \"{c_src.statement}\" [{c_src.status.value}]")
            print(f"     Later:       \"{c_tgt.statement}\" [{c_tgt.status.value}]")
            print(f"     Explanation: {edge.explanation}")
    else:
        print("  None detected.")

    print("\n[Orphaned Conclusions - Missing or Refuted Evidence]")
    if report.orphaned_claims:
        for i, orphan in enumerate(report.orphaned_claims, 1):
            print(f"\n  {i}. Conclusion ID: {orphan['claim_id']} (from {orphan['document']})")
            print(f"     Conclusion: \"{orphan['conclusion']}\"")
            print("     Invalidated Premise(s):")
            for p in orphan["invalidated_premises"]:
                print(f"       X: \"{p}\" (Superseded/Refuted)")
    else:
        print("  None detected.")

    print("\n" + "=" * 75)


if __name__ == "__main__":
    try:
        main()
    except Exception as err:
        print(f"\n[ERROR] {err}", file=sys.stderr)
        sys.exit(1)