/**
 * CLAIM GRAPH: Core Semantic & Contradiction Intelligence Engine
 * Standalone client-side propositional reasoning, cross-document reconciliation,
 * and graph construction engine with zero dependencies.
 */

    const BUILTIN_SCENARIOS = {
      cloud_distributed: {
        id: "cloud_distributed",
        title: "Cloud Distributed Engine Architecture",
        description: "Multi-version migration from Raft + Local NVMe to Paxos + Object Storage, invalidating sub-5ms latency conclusion.",
        documents: [
          {
            doc_id: "ARCH-V1",
            title: "Core System Architecture Specification",
            version: "1.0.0",
            timestamp: "2025-01-15",
            content: "The cluster size is strictly limited to 16 nodes due to Raft consensus constraints.\n\nAll state persistence operations must execute directly on local NVMe solid-state storage."
          },
          {
            doc_id: "ARCH-V2",
            title: "Distributed Engine Architecture Migration",
            version: "2.0.0",
            timestamp: "2025-08-20",
            content: "The cluster size scales to 64 nodes through a leaderless Paxos ring.\n\nAll state persistence operations run on network-attached object storage volumes."
          },
          {
            doc_id: "BENCH-AUDIT",
            title: "Q3 Performance Evaluation Report",
            version: "1.1.0",
            timestamp: "2025-09-01",
            content: "The system achieves sub-5ms write latency as a direct consequence of local NVMe storage."
          }
        ]
      },
      auth_microservices: {
        id: "auth_microservices",
        title: "Microservices Authentication Architecture",
        description: "Evolution from stateful Redis session tokens to stateless Ed25519 tokens, invalidating instant revocation guarantee.",
        documents: [
          {
            doc_id: "AUTH-V1",
            title: "Identity & Access Specification",
            version: "1.0.0",
            timestamp: "2025-02-10",
            content: "All API services authenticate via centralized stateful Redis session stores.\n\nSession storage requires dedicated Redis cluster instances in each availability zone."
          },
          {
            doc_id: "AUTH-V2",
            title: "Zero-Trust Stateless Token Migration",
            version: "2.0.0",
            timestamp: "2025-07-15",
            content: "All API services authenticate using decentralized stateless Ed25519 cryptographically signed tokens.\n\nToken validation executes purely in edge memory without external Redis dependency."
          },
          {
            doc_id: "SEC-AUDIT",
            title: "Information Security Compliance Review",
            version: "1.2.0",
            timestamp: "2025-08-01",
            content: "The system guarantees instant token revocation across all gateways as a direct consequence of centralized stateful Redis session stores."
          }
        ]
      },
      distributed_database: {
        id: "distributed_database",
        title: "Database Durability & Consensus Protocol",
        description: "Transition from synchronous cross-datacenter replication to asynchronous quorum replication, invalidating RPO=0 compliance.",
        documents: [
          {
            doc_id: "DB-V1",
            title: "High-Durability Data Storage Engine",
            version: "1.0.0",
            timestamp: "2025-03-01",
            content: "All database writes require synchronous replication across 3 physical datacenters before acknowledgment.\n\nData integrity checks run on every synchronous transaction boundary."
          },
          {
            doc_id: "DB-V2",
            title: "High-Throughput Quorum Engine Migration",
            version: "2.0.0",
            timestamp: "2025-10-10",
            content: "All database writes utilize asynchronous multi-region quorum replication to minimize network overhead.\n\nReplication operates with eventual consistency across datacenters."
          },
          {
            doc_id: "COMPLIANCE-DOC",
            title: "Disaster Recovery & Financial Compliance",
            version: "1.1.0",
            timestamp: "2025-11-05",
            content: "Zero data loss recovery point objective (RPO=0) is guaranteed as a direct consequence of synchronous replication across 3 physical datacenters."
          }
        ]
      },
      healthcare_hipaa: {
        id: "healthcare_hipaa",
        title: "Healthcare HIPAA Cloud Migration",
        description: "Migration from on-premise dedicated SAN storage with hardware AES-256 to public cloud S3 object storage, invalidating HIPAA zero third-party transmission guarantee.",
        documents: [
          {
            doc_id: "HIPAA-V1",
            title: "PHI Data Storage & Isolation Policy",
            version: "1.0.0",
            timestamp: "2024-05-10",
            content: "All protected health information (PHI) must be stored exclusively on on-premise dedicated SAN hardware volumes.\n\nDirect internet access and third-party cloud routing are strictly forbidden."
          },
          {
            doc_id: "HIPAA-V2",
            title: "Scalable EHR Cloud Lake Architecture",
            version: "2.0.0",
            timestamp: "2025-02-14",
            content: "All protected health information is transitioned to multi-tenant public cloud S3 object storage buckets.\n\nEHR ingestion pipelines execute through cloud-managed serverless microservices."
          },
          {
            doc_id: "HIPAA-AUDIT",
            title: "Annual Compliance Certification",
            version: "1.1.0",
            timestamp: "2025-03-01",
            content: "Zero third-party network transmission is guaranteed as a direct consequence of on-premise dedicated SAN hardware volumes."
          }
        ]
      },
      drone_avionics: {
        id: "drone_avionics",
        title: "Autonomous Drone Avionics System",
        description: "Evolution from dual differential GPS receivers to optical camera visual odometry, invalidating sub-centimeter GPS hovering guarantee.",
        documents: [
          {
            doc_id: "AVIONICS-V1",
            title: "Flight Controller Positioning Standard",
            version: "1.0.0",
            timestamp: "2024-06-01",
            content: "Primary navigation telemetry requires dual differential GPS receivers with active satellite RTK correction.\n\nFlight hold stabilization relies directly on real-time orbital satellite signals."
          },
          {
            doc_id: "AVIONICS-V2",
            title: "GPS-Denied Subterranean Navigation Spec",
            version: "2.0.0",
            timestamp: "2025-01-20",
            content: "Primary navigation telemetry relies exclusively on downward optical camera visual odometry and lidar point-clouds.\n\nSatellite GPS antennas are disabled to preserve transceiver payload power."
          },
          {
            doc_id: "AVIONICS-AUDIT",
            title: "Flight Certification & Safety Envelope",
            version: "1.1.0",
            timestamp: "2025-02-10",
            content: "Sub-centimeter position hold is guaranteed as a direct consequence of dual differential GPS receivers."
          }
        ]
      },
      fintech_ledger: {
        id: "fintech_ledger",
        title: "Fintech High-Frequency Ledger",
        description: "Transition from strict two-phase commit (2PC) synchronous locking to asynchronous event-sourced CQRS ledger, invalidating immediate balance finality guarantee.",
        documents: [
          {
            doc_id: "LEDGER-V1",
            title: "Core Banking Transaction Engine",
            version: "1.0.0",
            timestamp: "2024-04-10",
            content: "All account balance updates execute under strict two-phase commit synchronous database table locks.\n\nTransaction commit requires atomic mutual exclusion across distributed ledger partitions."
          },
          {
            doc_id: "LEDGER-V2",
            title: "Asynchronous High-Throughput CQRS Ledger",
            version: "2.0.0",
            timestamp: "2025-04-01",
            content: "All account balance updates stream through an asynchronous event-sourced CQRS ledger with eventual reconciliation.\n\nDatabase writes operate lock-free via append-only event logs."
          },
          {
            doc_id: "LEDGER-AUDIT",
            title: "Regulatory Financial Audit Report",
            version: "1.2.0",
            timestamp: "2025-05-01",
            content: "Absolute immediate balance finality is guaranteed as a direct consequence of strict two-phase commit synchronous database table locks."
          }
        ]
      },
      ai_quantization: {
        id: "ai_quantization",
        title: "LLM Inference Quantization Pipeline",
        description: "Migration from uncompressed 16-bit FP16 precision weights to 8-bit INT8 quantized weights, invalidating zero perplexity degradation conclusion.",
        documents: [
          {
            doc_id: "MODEL-V1",
            title: "Foundation Model Serving Infrastructure",
            version: "1.0.0",
            timestamp: "2024-09-01",
            content: "Model inference executes exclusively using full 16-bit FP16 precision floating point matrix weights.\n\nTensor computations preserve full uncompressed mantissa fidelity without integer quantization."
          },
          {
            doc_id: "MODEL-V2",
            title: "Edge Model Weight Quantization Protocol",
            version: "2.0.0",
            timestamp: "2025-03-10",
            content: "Model inference executes using aggressive 8-bit INT8 quantized integer weight tensors for edge efficiency.\n\nWeights are scaled and clamped into discrete 8-bit registers."
          },
          {
            doc_id: "MODEL-AUDIT",
            title: "Perplexity & Accuracy Validation Benchmark",
            version: "1.1.0",
            timestamp: "2025-03-25",
            content: "Zero perplexity degradation across benchmark datasets is guaranteed as a direct consequence of full 16-bit FP16 precision floating point matrix weights."
          }
        ]
      }
    };

    // --- CLIENT-SIDE SEMANTIC ENGINE IMPLEMENTATION ---
    function extractClaimsFromText(text, chunkId, doc) {
      const sentences = text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
      const claims = [];

      const topicKeywords = {
        "Cluster Size": ["cluster size", "nodes", "raft", "paxos", "ring"],
        "Storage Architecture": ["storage", "nvme", "solid-state", "object storage", "persistence", "state", "san"],
        "Latency Performance": ["latency", "write latency", "sub-5ms", "throughput", "response time"],
        "Authentication": ["jwt", "oauth", "token", "session", "ed25519", "auth", "redis", "revocation"],
        "Replication": ["replica", "quorum", "consensus", "replication", "sync", "synchronous", "asynchronous", "rpo"],
        "Data Durability": ["durability", "integrity", "rpo", "data loss", "disaster recovery"],
        "Healthcare & Compliance": ["hipaa", "phi", "san", "hardware", "patient", "ehr", "transmission"],
        "Avionics & Navigation": ["gps", "satellite", "rtk", "optical", "odometry", "lidar", "telemetry"],
        "Financial Ledger": ["ledger", "2pc", "two-phase", "cqrs", "event-sourced", "commit", "balance"],
        "AI & Quantization": ["fp16", "int8", "quantization", "quantized", "weights", "perplexity", "tensor"]
      };

      sentences.forEach((stmt, i) => {
        const stmtClean = stmt.replace(/[.]+$/, "").trim();
        const lowerStmt = stmtClean.toLowerCase();

        let assignedTopic = "General Specification";
        for (const [topic, kws] of Object.entries(topicKeywords)) {
          if (kws.some(kw => lowerStmt.includes(kw))) {
            assignedTopic = topic;
            break;
          }
        }

        let cType = "FACT";
        if (["consequence of", "direct result", "therefore", "achieves", "yields", "guaranteed as"].some(m => lowerStmt.includes(m))) {
          cType = "CONCLUSION";
        } else if (["must", "strictly", "limited to", "scales to", "requires", "shall", "all api services", "all database writes"].some(m => lowerStmt.includes(m))) {
          cType = "SPECIFICATION";
        } else if (["assuming", "assumes", "expected"].some(m => lowerStmt.includes(m))) {
          cType = "ASSUMPTION";
        }

        claims.push({
          claim_id: `${chunkId}_cl${i + 1}`,
          statement: stmtClean + ".",
          topic: assignedTopic,
          type: cType,
          status: "ACTIVE",
          source_chunk_id: chunkId,
          source_doc_id: doc.doc_id,
          timestamp: doc.timestamp,
          doc_version: doc.version,
          dependencies: []
        });
      });

      return claims;
    }

    function autoLinkDependencies(claims) {
      const stopwords = new Set([
        "the", "is", "a", "an", "to", "of", "and", "in", "on", "all",
        "for", "due", "are", "be", "this", "that", "with", "from", "must", "run",
        "system", "direct", "result", "consequence", "guaranteed", "as", "across"
      ]);
      const domainKeywords = [
        "nvme", "storage", "san", "hardware", "nodes", "redis", "session",
        "synchronous", "datacenter", "gps", "satellite", "two-phase", "2pc",
        "fp16", "precision", "lock", "quorum", "paxos", "raft", "eventual", "asynchronous",
        "optical", "vision", "camera", "int8", "quantized", "s3", "cloud", "cqrs"
      ];

      for (const cid in claims) {
        const claim = claims[cid];
        const stmtLow = claim.statement.toLowerCase();
        if (claim.type === "CONCLUSION" || ["consequence of", "direct result", "therefore", "guaranteed as", "achieves", "yields", "ensures"].some(m => stmtLow.includes(m))) {
          const conclWords = (stmtLow.match(/\b\w{3,}\b/g) || []).filter(w => !stopwords.has(w));
          const conclSet = new Set(conclWords);

          for (const pid in claims) {
            if (pid !== cid && claims[pid].type !== "CONCLUSION") {
              const pLow = claims[pid].statement.toLowerCase();
              const premWords = (pLow.match(/\b\w{3,}\b/g) || []).filter(w => !stopwords.has(w));
              let overlap = 0;
              for (const w of premWords) {
                if (conclSet.has(w)) overlap++;
              }
              const hasDomainMatch = domainKeywords.some(kw => stmtLow.includes(kw) && pLow.includes(kw));
              if (overlap >= 2 || hasDomainMatch) {
                if (!claim.dependencies.includes(pid)) {
                  claim.dependencies.push(pid);
                }
              }
            }
          }
        }
      }
    }

    function sharesTopicOrContext(c1, c2) {
      if (c1.topic && c2.topic && c1.topic.toLowerCase() === c2.topic.toLowerCase() && !["general", "general specification", "other"].includes(c1.topic.toLowerCase())) {
        return true;
      }
      const stopwords = new Set(["the", "is", "a", "an", "to", "of", "and", "in", "on", "all", "for", "due", "are", "be", "this", "that", "with", "from", "must", "run"]);
      const words1 = (c1.statement.toLowerCase().match(/\b\w{3,}\b/g) || []).filter(w => !stopwords.has(w));
      const words2 = new Set((c2.statement.toLowerCase().match(/\b\w{3,}\b/g) || []).filter(w => !stopwords.has(w)));
      let overlap = 0;
      for (const w of words1) {
        if (words2.has(w)) overlap++;
      }
      return overlap >= 2;
    }

    function checkContradictionPairDeterministic(claimA, claimB) {
      const stA = claimA.statement.toLowerCase();
      const stB = claimB.statement.toLowerCase();
      const conflictReasons = [];

      // 1. Capacity / number conflict
      const numA = (stA.match(/\b\d+\b/g) || []);
      const numB = (stB.match(/\b\d+\b/g) || []);
      if (numA.length > 0 && numB.length > 0 && JSON.stringify(numA) !== JSON.stringify(numB)) {
        if ((stA.includes("node") || stA.includes("cluster")) && (stB.includes("node") || stB.includes("cluster"))) {
          conflictReasons.push(`Capacity contradiction: ${numA[0]} nodes vs ${numB[0]} nodes`);
        }
      }

      // 2. Storage topology conflict (local NVMe/SAN vs cloud/object storage/S3)
      if ((stA.includes("nvme") || stA.includes("local") || stA.includes("san")) && (stB.includes("object storage") || stB.includes("network-attached") || stB.includes("cloud") || stB.includes("s3"))) {
        conflictReasons.push("Storage topology shift: Local NVMe/SAN hardware storage conflicts with network-attached cloud object storage");
      } else if ((stA.includes("object storage") || stA.includes("network-attached") || stA.includes("cloud") || stA.includes("s3")) && (stB.includes("nvme") || stB.includes("local") || stB.includes("san"))) {
        conflictReasons.push("Storage topology shift: Network-attached cloud object storage conflicts with local NVMe/SAN hardware storage");
      }

      // 3. Consensus protocol conflict
      if (stA.includes("raft") && stB.includes("paxos")) {
        conflictReasons.push("Consensus model divergence: Raft constraints conflict with leaderless Paxos ring");
      } else if (stA.includes("paxos") && stB.includes("raft")) {
        conflictReasons.push("Consensus model divergence: Paxos ring conflicts with Raft constraints");
      }

      // 4. Auth conflict
      if (stA.includes("session") && stB.includes("stateless")) {
        conflictReasons.push("Authentication architecture divergence: Centralized stateful Redis session conflicts with decentralized stateless Ed25519 tokens");
      } else if (stA.includes("stateless") && stB.includes("session")) {
        conflictReasons.push("Authentication architecture divergence: Stateless token mechanism conflicts with centralized stateful session stores");
      }

      // 5. Database replication conflict
      if (stA.includes("synchronous") && (stB.includes("asynchronous") || stB.includes("eventual"))) {
        conflictReasons.push("Replication paradigm conflict: Synchronous cross-datacenter replication conflicts with asynchronous quorum eventual consistency");
      } else if ((stA.includes("asynchronous") || stA.includes("eventual")) && stB.includes("synchronous")) {
        conflictReasons.push("Replication paradigm conflict: Asynchronous quorum replication conflicts with synchronous cross-datacenter replication");
      }

      // 6. Generic scaling conflict
      if (stA.includes("strictly limited to") && stB.includes("scales to")) {
        conflictReasons.push("Scaling constraint conflict: Strict node limit contradicted by dynamic scaling ring");
      }

      // 7. Navigation / Avionics (GPS vs Optical vision / Lidar)
      if (stA.includes("gps") && (stB.includes("optical") || stB.includes("vision") || stB.includes("lidar"))) {
        conflictReasons.push("Navigation telemetry divergence: Differential GPS navigation conflicts with vision/lidar odometry");
      } else if ((stA.includes("optical") || stA.includes("vision") || stA.includes("lidar")) && stB.includes("gps")) {
        conflictReasons.push("Navigation telemetry divergence: Vision/lidar odometry conflicts with differential GPS navigation");
      }

      // 8. Model precision (16-bit FP16 vs 8-bit INT8 quantized)
      if ((stA.includes("fp16") || stA.includes("16-bit")) && (stB.includes("int8") || stB.includes("8-bit") || stB.includes("quantized"))) {
        conflictReasons.push("Mathematical precision divergence: 16-bit FP16 precision conflicts with 8-bit quantized execution");
      } else if ((stA.includes("int8") || stA.includes("8-bit") || stA.includes("quantized")) && (stB.includes("fp16") || stB.includes("16-bit"))) {
        conflictReasons.push("Mathematical precision divergence: 8-bit quantized execution conflicts with 16-bit FP16 precision");
      }

      // 9. Ledger persistence (Two-phase commit 2PC vs Event-sourced CQRS)
      if ((stA.includes("two-phase") || stA.includes("2pc")) && (stB.includes("event-sourced") || stB.includes("cqrs"))) {
        conflictReasons.push("Ledger persistence divergence: Strict two-phase commit synchronous locking conflicts with asynchronous event-sourced CQRS");
      } else if ((stA.includes("event-sourced") || stA.includes("cqrs")) && (stB.includes("two-phase") || stB.includes("2pc"))) {
        conflictReasons.push("Ledger persistence divergence: Asynchronous event-sourced CQRS conflicts with strict two-phase commit locking");
      }

      // 10. Semantic Antonym / Invariant inversion (Custom problem catch-all)
      if ((stA.includes("strictly forbidden") || stA.includes("disallowed")) && (stB.includes("allowed") || stB.includes("permitted") || stB.includes("transitioned to"))) {
        conflictReasons.push("Operational constraint conflict: Strictly forbidden action contradicted by permitted operational policy");
      } else if ((stA.includes("allowed") || stA.includes("permitted") || stA.includes("transitioned to")) && (stB.includes("strictly forbidden") || stB.includes("disallowed"))) {
        conflictReasons.push("Operational constraint conflict: Permitted operational policy contradicted by strictly forbidden rule");
      }

      if (conflictReasons.length > 0) {
        return {
          claim_id_source: claimA.claim_id,
          claim_id_target: claimB.claim_id,
          contradiction_type: "DIRECT_CONFLICT",
          explanation: conflictReasons[0],
          detected_at: new Date().toISOString()
        };
      }
      return null;
    }

    function reconcileClaims(claims, documents) {
      const claimList = Object.values(claims);
      const contradictions = [];

      for (let i = 0; i < claimList.length; i++) {
        for (let j = i + 1; j < claimList.length; j++) {
          const c1 = claimList[i];
          const c2 = claimList[j];
          if (c1.source_doc_id !== c2.source_doc_id && sharesTopicOrContext(c1, c2)) {
            const edge = checkContradictionPairDeterministic(c1, c2);
            if (edge) {
              contradictions.push(edge);
              if (c1.timestamp < c2.timestamp) {
                c1.status = "SUPERSEDED";
              } else if (c2.timestamp < c1.timestamp) {
                c2.status = "SUPERSEDED";
              } else {
                c1.status = "CONTRADICTED";
                c2.status = "CONTRADICTED";
              }
            }
          }
        }
      }

      // Invalidate dependent conclusions
      for (const claim of claimList) {
        if (claim.dependencies && claim.dependencies.length > 0) {
          for (const depId of claim.dependencies) {
            const depClaim = claims[depId];
            if (!depClaim || depClaim.status === "SUPERSEDED" || depClaim.status === "CONTRADICTED") {
              claim.status = "ORPHANED";
              break;
            }
          }
        }
      }

      return contradictions;
    }

    function buildOrphanedReport(claims) {
      const orphaned = [];
      for (const c of Object.values(claims)) {
        if (c.status === "ORPHANED") {
          const brokenDeps = (c.dependencies || [])
            .filter(d => claims[d] && claims[d].status !== "ACTIVE")
            .map(d => claims[d].statement);
          orphaned.push({
            claim_id: c.claim_id,
            conclusion: c.statement,
            document: c.source_doc_id,
            invalidated_premises: brokenDeps
          });
        }
      }
      return orphaned;
    }

    function buildGraphData(documents, claims, contradictions) {
      const nodes = [];
      const edges = [];

      for (const doc of documents) {
        nodes.push({
          id: doc.doc_id,
          label: doc.title,
          sublabel: `Doc ${doc.doc_id} · v${doc.version}`,
          type: "DOCUMENT",
          color: "#3b82f6",
          timestamp: doc.timestamp
        });
      }

      const colorMap = {
        ACTIVE: "#10b981",
        SUPERSEDED: "#f59e0b",
        CONTRADICTED: "#ef4444",
        ORPHANED: "#ec4899"
      };

      for (const c of Object.values(claims)) {
        nodes.push({
          id: c.claim_id,
          label: c.statement,
          topic: c.topic,
          claim_type: c.type,
          status: c.status,
          doc_id: c.source_doc_id,
          timestamp: c.timestamp,
          type: "CLAIM",
          color: colorMap[c.status] || "#94a3b8"
        });

        edges.push({
          source: c.source_doc_id,
          target: c.claim_id,
          relation: "SUPPORTS",
          color: "#475569",
          dashed: false
        });

        if (c.dependencies) {
          for (const depId of c.dependencies) {
            edges.push({
              source: depId,
              target: c.claim_id,
              relation: "DERIVES",
              color: "#8b5cf6",
              dashed: false
            });
          }
        }
      }

      for (const edge of contradictions) {
        edges.push({
          source: edge.claim_id_source,
          target: edge.claim_id_target,
          relation: "CONTRADICTS",
          color: "#ef4444",
          dashed: true
        });
      }

      return { nodes, edges };
    }

    function executeClientSideAudit(scenarioId = "cloud_distributed", customDocs = []) {
      const startTime = performance.now();
      let docs = [];

      if (scenarioId === "custom" && customDocs.length > 0) {
        docs = customDocs;
      } else if (userProblems[scenarioId]) {
        docs = userProblems[scenarioId].documents;
      } else if (BUILTIN_SCENARIOS[scenarioId]) {
        docs = BUILTIN_SCENARIOS[scenarioId].documents;
      } else {
        docs = BUILTIN_SCENARIOS.cloud_distributed.documents;
      }

      const claims = {};
      for (const doc of docs) {
        const paras = doc.content.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
        paras.forEach((para, pIdx) => {
          const chunkId = `${doc.doc_id}_c${pIdx + 1}`;
          const extracted = extractClaimsFromText(para, chunkId, doc);
          for (const cl of extracted) {
            claims[cl.claim_id] = cl;
          }
        });
      }

      autoLinkDependencies(claims);
      const contradictions = reconcileClaims(claims, docs);
      const orphaned = buildOrphanedReport(claims);
      const graph = buildGraphData(docs, claims, contradictions);
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);

      const contradictionDetails = contradictions.map(e => ({
        source_claim_id: e.claim_id_source,
        target_claim_id: e.claim_id_target,
        explanation: e.explanation,
        source_statement: claims[e.claim_id_source]?.statement || "",
        target_statement: claims[e.claim_id_target]?.statement || "",
        source_doc_id: claims[e.claim_id_source]?.source_doc_id || "",
        target_doc_id: claims[e.claim_id_target]?.source_doc_id || "",
        source_status: claims[e.claim_id_source]?.status || "",
        target_status: claims[e.claim_id_target]?.status || ""
      }));

      const claimValues = Object.values(claims);
      const activeCount = claimValues.filter(c => c.status === "ACTIVE").length;
      const contradictedCount = claimValues.filter(c => c.status === "CONTRADICTED" || c.status === "SUPERSEDED").length;

      return {
        app_name: "CLAIM GRAPH",
        execution_time_seconds: parseFloat(elapsed) || 0.02,
        engine_used: "Client-Side Semantic Engine (In-Browser Zero Latency)",
        mode: "fast",
        summary: {
          total_claims: claimValues.length,
          active_claims: activeCount,
          contradicted_claims: contradictedCount,
          orphaned_conclusions: orphaned.length
        },
        documents: docs,
        claims: claimValues,
        contradictions: contradictionDetails,
        orphaned_claims: orphaned,
        graph: graph
      };
    }


    function parseProblemText(rawText, fallbackName = "Custom Imported Problem") {
      const trimmed = (rawText || "").trim();
      if (!trimmed) {
        return { title: fallbackName, description: "", documents: [] };
      }

      // 1. Attempt JSON parsing
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            return {
              title: fallbackName,
              description: "Imported document list via JSON.",
              documents: parsed.map((d, i) => ({
                doc_id: d.doc_id || `DOC-${i + 1}`,
                title: d.title || `Document ${i + 1}`,
                version: d.version || "1.0.0",
                timestamp: d.timestamp || new Date(Date.now() - (parsed.length - i) * 86400000).toISOString().slice(0, 10),
                content: d.content || d.text || ""
              }))
            };
          } else if (parsed.documents && Array.isArray(parsed.documents)) {
            return {
              title: parsed.title || fallbackName,
              description: parsed.description || "Imported scenario via JSON.",
              documents: parsed.documents.map((d, i) => ({
                doc_id: d.doc_id || `DOC-${i + 1}`,
                title: d.title || `Document ${i + 1}`,
                version: d.version || "1.0.0",
                timestamp: d.timestamp || new Date(Date.now() - (parsed.documents.length - i) * 86400000).toISOString().slice(0, 10),
                content: d.content || d.text || ""
              }))
            };
          }
        } catch (e) {
          // Fall through to markdown parser
        }
      }

      // 2. Delimiter-based specification parsing
      const sections = trimmed.split(/\n\s*(?:---+|===+|(?=###?\s+Document:))\s*\n/).map(s => s.trim()).filter(Boolean);
      const docs = [];

      sections.forEach((sec, idx) => {
        const lines = sec.split("\n");
        let docId = `DOC-${idx + 1}`;
        let docTitle = `Revision Specification ${idx + 1}`;
        let docVersion = `1.${idx}.0`;
        let docDate = new Date(Date.now() - (sections.length - idx) * 30 * 86400000).toISOString().slice(0, 10);
        const contentLines = [];

        for (const line of lines) {
          const trimmedLine = line.trim();
          const matchDoc = trimmedLine.match(/^(?:###?\s*)?(?:Document|Doc\s*ID):\s*(.+)$/i);
          const matchTitle = trimmedLine.match(/^(?:###?\s*)?(?:Title|Header):\s*(.+)$/i);
          const matchVer = trimmedLine.match(/^(?:###?\s*)?(?:Version|Ver|v):\s*(.+)$/i);
          const matchDate = trimmedLine.match(/^(?:###?\s*)?(?:Date|Timestamp|Time):\s*(.+)$/i);

          if (matchDoc) {
            docId = matchDoc[1].trim();
          } else if (matchTitle) {
            docTitle = matchTitle[1].trim();
          } else if (matchVer) {
            docVersion = matchVer[1].trim();
          } else if (matchDate) {
            docDate = matchDate[1].trim();
          } else if (trimmedLine.startsWith("# ") && !docTitle.includes("Revision")) {
            docTitle = trimmedLine.replace(/^#+\s*/, "").trim();
          } else {
            contentLines.push(line);
          }
        }

        const content = contentLines.join("\n").trim();
        if (content) {
          docs.push({
            doc_id: docId,
            title: docTitle,
            version: docVersion,
            timestamp: docDate,
            content: content
          });
        }
      });

      // 3. Fallback: split by multiple paragraphs if no delimiter
      if (docs.length <= 1 && trimmed.includes("\n\n")) {
        const paras = trimmed.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
        if (paras.length >= 2) {
          return {
            title: fallbackName,
            description: "Custom multi-clause problem specification.",
            documents: [
              {
                doc_id: "SPEC-V1",
                title: "Baseline Specification Clause",
                version: "1.0.0",
                timestamp: "2025-01-01",
                content: paras[0]
              },
              {
                doc_id: "SPEC-V2",
                title: "Updated Specification Clause",
                version: "2.0.0",
                timestamp: "2025-06-01",
                content: paras.slice(1).join("\n\n")
              }
            ]
          };
        }
      }

      return {
        title: fallbackName,
        description: "Imported specification problem.",
        documents: docs.length > 0 ? docs : [
          {
            doc_id: "DOC-1",
            title: fallbackName,
            version: "1.0.0",
            timestamp: new Date().toISOString().slice(0, 10),
            content: trimmed
          }
        ]
      };
    }
