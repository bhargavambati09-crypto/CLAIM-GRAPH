# CLAIM GRAPH: Evidence & Contradiction Intelligence Skill

## Description
CLAIM GRAPH extracts atomic claims from unstructured technical specifications and research documents, aligns them inside a directed property graph via NetworkX, checks for temporal contradictions across document revisions, and identifies orphaned conclusions whose supporting evidence has been refuted or superseded.

## Execution Model
- **Dual Engine Architecture**:
  - **Local AI Engine**: `gemma3:1b` running locally via Ollama (`http://127.0.0.1:11434`).
  - **Fast Semantic / Rule Engine**: High-throughput zero-latency deterministic proposition extractor and temporal conflict detector for instant audits and web access.
- **Prompt Strategy**: Few-shot, zero-temperature structured JSON prompting with strict regex fallback parsing to guarantee reliability on 1B parameter models.

## Core Capabilities
1. **Atomic Claim Extraction**:
   - Parses text blocks into discrete, testable propositions.
   - Categorizes statements into `FACT`, `SPECIFICATION`, `CONCLUSION`, or `ASSUMPTION`.
   - Normalizes topics to allow clustering across varying document vocabularies.

2. **Temporal Source Verification**:
   - Maintains exact provenance pointers (`doc_id`, `chunk_id`, `timestamp`, `version`).
   - Resolves conflicts chronologically: older conflicting claims transition to `SUPERSEDED`, while mutually conflicting claims of the same date become `CONTRADICTED`.

3. **Orphan & Invalidation Analysis**:
   - Builds directed dependency edges `(Premise) -[:DERIVES]-> (Conclusion)`.
   - If a premise transitions to `SUPERSEDED` or `CONTRADICTED`, the dependent conclusion transitions to `ORPHANED`.

4. **Interactive Graph Visualization**:
   - Real-time physics-based canvas visualization of claims, evidence chunks, contradiction edges, and dependency trees.

## API & CLI Reference

### Requirements
```bash
pip install -r requirements.txt
ollama pull gemma3:1b
```

### Running CLAIM GRAPH Locally
Start Ollama (optional), then run the web interface:

```bash
python app.py
```

Open <http://localhost:8000/> in your web browser.