# CLAIM GRAPH: Evidence & Contradiction Intelligence

An autonomous knowledge graph engine that deconstructs unstructured technical specifications and research documents into testable atomic propositions, tracks temporal contradictions across document revisions, and flags orphaned conclusions whose supporting evidence has fallen.

---

## 🌟 Key Features

- **Atomic Claim Extraction**: Parses unstructured document chunks into discrete, testable propositions classified as `FACT`, `SPECIFICATION`, `CONCLUSION`, or `ASSUMPTION`.
- **Temporal Contradiction Tracking**: Detects direct conflicts between specifications across document revisions and chronologically marks older claims as `SUPERSEDED` and same-date conflicts as `CONTRADICTED`.
- **Orphan & Invalidation Analysis**: Constructs directed dependency edges `(Premise) -[:DERIVES]-> (Conclusion)`. If a premise is superseded or contradicted, the dependent conclusion is automatically invalidated as `ORPHANED`.
- **Interactive Knowledge Graph Canvas**: Physics-simulated interactive visualization with zoom, pan, node inspection, and colored relationship edges.
- **Dual Inference Engine**:
  - **Local AI Mode**: Powered by `gemma3:1b` running locally via Ollama (`http://127.0.0.1:11434`).
  - **Fast Semantic / Rule Engine**: High-performance deterministic proposition extractor providing instant sub-second audits for web and public deployments.
- **Scenario Simulator & Conflict Sandbox**: Built-in industry scenarios (Distributed Consensus, Microservices Auth, Database Replication) and real-time arbitrary pair contradiction testing.

---

## 🛠️ Rectified Issues & Architecture Upgrades

1. **IPv6 Localhost Connection Delay on Windows (`tool.py` & `app.py`)**:
   - *Problem*: Windows systems resolve `localhost` to IPv6 `[::1]:11434`, whereas Ollama binds strictly to IPv4 `127.0.0.1:11434`. This caused connection hangs and timeouts.
   - *Resolution*: Bound all Ollama requests and client URLs explicitly to `http://127.0.0.1:11434` with auto-normalization.
2. **Public / Web Access Resilience (503 Service Unavailable)**:
   - *Problem*: When deployed over public URLs or when Ollama is offline/starting, the app returned a fatal 503 error.
   - *Resolution*: Implemented an intelligent dual-engine architecture with automatic fallback to high-throughput deterministic proposition extraction and conflict detection.
3. **Case-Insensitive & Semantic Premise Linkage**:
   - *Problem*: Strict case-sensitive matching (`"NVMe"`) could fail if the model generated lowercase or variations, missing broken premise links.
   - *Resolution*: Implemented normalized case-insensitive keyword and topic matching, plus automatic dependency deduction.
4. **Network & Public Tunnel Host Binding**:
   - *Problem*: The web server bound strictly to loopback `127.0.0.1`, preventing external reverse proxies and tunnels from routing traffic.
   - *Resolution*: Updated server host binding to `0.0.0.0` with CORS support for public accessibility.
5. **Interactive Physics Graph & Modern UI**:
   - *Problem*: The previous UI was a basic static list without visualization or custom scenario testing.
   - *Resolution*: Built a state-of-the-art glassmorphic dashboard with Canvas graph physics, scenario switching, and export capabilities.

---

## 🚀 Quick Start

### 1. Installation
```bash
pip install -r requirements.txt
```

### 2. Optional: Run Local AI (Ollama)
```bash
ollama run gemma3:1b
```

### 3. Launch Web Application
```bash
python app.py
```
Open **http://localhost:8000/** in your browser.

### 4. CLI Execution
```bash
python main.py
```

---

## 📊 API Reference

- `GET /`: CLAIM GRAPH Web Application
- `GET /health`: Health status & active inference engine
- `GET /api/scenarios`: Built-in benchmark scenarios
- `POST /api/run`: Execute claim audit on benchmark or custom documents
- `POST /api/verify-pair`: Test arbitrary statement pair for contradiction
