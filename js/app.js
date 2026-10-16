/**
 * CLAIM GRAPH: Interactive Web Application & Visualizer Controller
 * Manages reactive UI state, physics graph simulation, modal workflows,
 * and multi-format problem importing.
 */


    // State
    let currentAuditData = null;
    let customDocuments = [];
    let activeFilter = "ALL";
    let activeSearch = "";
    let backendAvailable = false;
    let customApiBaseUrl = localStorage.getItem("claimgraph_api_url") || "";

    // Built-in Benchmark Scenarios

    // User-Imported Problems Persistence
    let userProblems = {};
    try {
      const savedProbs = localStorage.getItem("claimgraph_user_problems");
      if (savedProbs) userProblems = JSON.parse(savedProbs);
    } catch (e) {
      console.warn("Could not load user problems from localStorage:", e);
    }

    // DOM Elements
    const runAuditBtn = document.getElementById("runAuditBtn");
    const runBtnLabel = document.getElementById("runBtnLabel");
    const scenarioSelect = document.getElementById("scenarioSelect");
    const modeSelect = document.getElementById("modeSelect");
    const statusMessage = document.getElementById("statusMessage");
    const executionTime = document.getElementById("executionTime");
    const engineStatusText = document.getElementById("engineStatusText");
    const exportReportBtn = document.getElementById("exportReportBtn");
    const publicUrlLink = document.getElementById("publicUrlLink");
    const engineDot = document.getElementById("engineDot");
    const apiBackendText = document.getElementById("apiBackendText");
    const backendBadge = document.getElementById("backendBadge");
    const engineStatusBadge = document.getElementById("engineStatusBadge");

    // Metrics elements
    const statTotalClaims = document.getElementById("statTotalClaims");
    const statActiveClaims = document.getElementById("statActiveClaims");
    const statConflicts = document.getElementById("statConflicts");
    const statOrphans = document.getElementById("statOrphans");

    // Badges
    const conflictsBadge = document.getElementById("conflictsBadge");
    const orphansBadge = document.getElementById("orphansBadge");
    const claimsBadge = document.getElementById("claimsBadge");

    // Lists
    const conflictsList = document.getElementById("conflictsList");
    const orphansList = document.getElementById("orphansList");
    const claimsList = document.getElementById("claimsList");
    const docsList = document.getElementById("docsList");

    // Problem Import Hub & Solution Banner Elements
    const importProblemBtn = document.getElementById("importProblemBtn");
    const docsImportProblemBtn = document.getElementById("docsImportProblemBtn");
    const importProblemModal = document.getElementById("importProblemModal");
    const closeImportModalBtn = document.getElementById("closeImportModalBtn");
    const cancelImportProblemBtn = document.getElementById("cancelImportProblemBtn");
    const executeImportAndSolveBtn = document.getElementById("executeImportAndSolveBtn");
    const importProblemTitleInput = document.getElementById("importProblemTitleInput");
    const importProblemIdInput = document.getElementById("importProblemIdInput");
    const importProblemStatus = document.getElementById("importProblemStatus");
    const userProblemsGroup = document.getElementById("userProblemsGroup");
    const solutionBanner = document.getElementById("solutionBanner");
    const solutionBannerTitle = document.getElementById("solutionBannerTitle");
    const solutionBannerDesc = document.getElementById("solutionBannerDesc");
    const solutionConflictsPill = document.getElementById("solutionConflictsPill");
    const solutionOrphansPill = document.getElementById("solutionOrphansPill");
    const viewSolutionConflictsBtn = document.getElementById("viewSolutionConflictsBtn");
    const viewSolutionOrphansBtn = document.getElementById("viewSolutionOrphansBtn");
    const problemDropZone = document.getElementById("problemDropZone");
    const problemFileInput = document.getElementById("problemFileInput");
    const fileUploadPreview = document.getElementById("fileUploadPreview");
    const fileUploadSummary = document.getElementById("fileUploadSummary");
    const fileUploadContentPreview = document.getElementById("fileUploadContentPreview");
    const pasteSpecTextarea = document.getElementById("pasteSpecTextarea");
    const loadSamplePasteBtn = document.getElementById("loadSamplePasteBtn");
    const addBuilderDocCardBtn = document.getElementById("addBuilderDocCardBtn");
    const builderDocCards = document.getElementById("builderDocCards");

    // Canvas
    const canvas = document.getElementById("graphCanvas");
    const ctx = canvas.getContext("2d");
    let nodes = [];
    let edges = [];
    let simulationRunning = false;
    let zoom = 1;
    let panX = 0;
    let panY = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let draggedNode = null;

    // Modal elements
    const apiConfigModal = document.getElementById("apiConfigModal");
    const closeApiModalBtn = document.getElementById("closeApiModalBtn");
    const saveApiUrlBtn = document.getElementById("saveApiUrlBtn");
    const resetApiStandaloneBtn = document.getElementById("resetApiStandaloneBtn");
    const apiUrlInput = document.getElementById("apiUrlInput");
    const apiModalStatus = document.getElementById("apiModalStatus");

    // Custom Document elements
    const addNewDocBtn = document.getElementById("addNewDocBtn");
    const customDocForm = document.getElementById("customDocForm");
    const cancelAddDocBtn = document.getElementById("cancelAddDocBtn");
    const saveAddDocBtn = document.getElementById("saveAddDocBtn");


    // --- HEALTH CHECK & BACKEND STATUS ---
    async function checkHealth() {
      const targetBase = customApiBaseUrl ? customApiBaseUrl.replace(/\/$/, "") : "";
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const shouldProbe = targetBase || isLocal;

      if (shouldProbe) {
        try {
          const res = await fetch(`${targetBase}/health`, { signal: AbortSignal.timeout(2000) });
          const ct = res.headers.get("content-type") || "";
          if (res.ok && ct.includes("application/json")) {
            const data = await res.json();
            backendAvailable = true;
            if (data.ollama_available) {
              engineStatusText.textContent = `Ollama (${data.model}) Ready`;
              engineStatusText.style.color = "var(--emerald)";
            } else {
              engineStatusText.textContent = `Fast Neural Backend (Ollama Standby)`;
              engineStatusText.style.color = "var(--cyan)";
            }
            if (engineDot) engineDot.style.background = "var(--emerald)";
            if (apiBackendText) apiBackendText.textContent = targetBase ? new URL(targetBase).host : "localhost:8000";
            return;
          }
        } catch (e) {
          // Probe failed
        }
      }

      // Standalone In-Browser engine
      backendAvailable = false;
      engineStatusText.textContent = "Client-Side Semantic Engine";
      engineStatusText.style.color = "var(--emerald)";
      if (engineDot) engineDot.style.background = "var(--emerald)";
      if (apiBackendText) apiBackendText.textContent = "In-Browser (Standalone)";

      // Update public url
      const currentHost = window.location.host;
      if (currentHost && !currentHost.includes("localhost") && !currentHost.includes("127.0.0.1")) {
        publicUrlLink.href = window.location.href;
        publicUrlLink.textContent = currentHost;
      } else {
        publicUrlLink.href = "https://claim-graph.netlify.app";
        publicUrlLink.textContent = "claim-graph.netlify.app";
      }
    }

    // --- TABS ---
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        const tabId = btn.getAttribute("data-tab");
        document.getElementById(tabId).classList.add("active");
        if (tabId === "graphTab") {
          resizeCanvas();
        }
      });
    });

    // --- RUN AUDIT ---
    async function runAudit() {
      runAuditBtn.disabled = true;
      runBtnLabel.textContent = "Extracting & Reconciling...";
      runAuditBtn.insertAdjacentHTML("afterbegin", '<span class="spinner" id="activeSpinner"></span>');
      statusMessage.textContent = "Parsing documents, extracting atomic claims, checking temporal conflicts...";
      statusMessage.style.color = "var(--cyan)";

      const scenario = scenarioSelect.value;
      const mode = modeSelect.value;
      const payload = { mode };

      if (userProblems[scenario]) {
        payload.documents = userProblems[scenario].documents;
      } else if (scenario !== "custom") {
        payload.scenario_id = scenario;
      } else if (customDocuments.length > 0) {
        payload.documents = customDocuments;
      }

      let auditData = null;

      // Try backend if connected
      if (backendAvailable && mode !== "fast") {
        try {
          const targetBase = customApiBaseUrl ? customApiBaseUrl.replace(/\/$/, "") : "";
          const res = await fetch(`${targetBase}/api/run`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(8000)
          });
          const ct = res.headers.get("content-type") || "";
          if (res.ok && ct.includes("application/json")) {
            auditData = await res.json();
          }
        } catch (e) {
          console.warn("Backend request failed, falling back to client-side engine:", e);
        }
      }

      // Fall back to Client-Side Semantic Engine
      if (!auditData) {
        auditData = executeClientSideAudit(scenario, customDocuments);
      }

      currentAuditData = auditData;
      renderResults(auditData);

      // Update Problem Solution Banner
      const activeProblem = userProblems[scenario] || BUILTIN_SCENARIOS[scenario];
      if (activeProblem && solutionBanner) {
        solutionBanner.style.display = "flex";
        solutionBannerTitle.textContent = `Problem Solved: ${activeProblem.title}`;
        solutionBannerDesc.textContent = `${auditData.summary.total_claims} atomic propositions deconstructed. Found ${auditData.summary.contradicted_claims} temporal contradictions across revisions and ${auditData.summary.orphaned_conclusions} broken dependency chains.`;
        solutionConflictsPill.textContent = `${auditData.summary.contradicted_claims} Contradictions`;
        solutionOrphansPill.textContent = `${auditData.summary.orphaned_conclusions} Orphaned Conclusions`;
      } else if (solutionBanner) {
        solutionBanner.style.display = "none";
      }

      statusMessage.textContent = `Audit completed successfully via ${auditData.engine_used}.`;
      statusMessage.style.color = "var(--emerald)";
      executionTime.textContent = `Execution time: ${auditData.execution_time_seconds}s`;

      runAuditBtn.disabled = false;
      runBtnLabel.textContent = "Run Intelligence Audit";
      const spinner = document.getElementById("activeSpinner");
      if (spinner) spinner.remove();
    }

    runAuditBtn.addEventListener("click", runAudit);

    // Scenario Switcher auto-audit
    scenarioSelect.addEventListener("change", () => {
      if (scenarioSelect.value === "custom") {
        if (customDocuments.length === 0) {
          customDocuments = [
            {
              doc_id: "SPEC-A",
              title: "Edge Storage Policy V1",
              version: "1.0.0",
              timestamp: "2025-01-01",
              content: "All edge nodes must retain transaction state on local NVMe solid-state storage.\n\nCluster replication interval is strictly locked to 500ms."
            },
            {
              doc_id: "SPEC-B",
              title: "Edge Storage Policy V2",
              version: "2.0.0",
              timestamp: "2025-06-01",
              content: "All edge nodes run persistence on network-attached object storage volumes.\n\nReplication interval operates with eventual consistency."
            },
            {
              doc_id: "AUDIT-C",
              title: "Latency Guarantee Audit",
              version: "1.0.0",
              timestamp: "2025-07-01",
              content: "System achieves sub-5ms write latency as a direct consequence of local NVMe solid-state storage."
            }
          ];
        }
      }
      runAudit();
    });

    modeSelect.addEventListener("change", runAudit);

    // --- RENDER AUDIT RESULTS ---
    function renderResults(data) {
      // 1. Stats
      statTotalClaims.textContent = data.summary.total_claims;
      statActiveClaims.textContent = data.summary.active_claims;
      statConflicts.textContent = data.summary.contradicted_claims;
      statOrphans.textContent = data.summary.orphaned_conclusions;

      conflictsBadge.textContent = data.contradictions.length;
      orphansBadge.textContent = data.orphaned_claims.length;
      claimsBadge.textContent = data.claims.length;

      // 2. Contradictions List
      if (data.contradictions.length === 0) {
        conflictsList.innerHTML = `<div class="empty-state"><div class="empty-icon">✓</div><p>No direct contradictions detected across the documents.</p></div>`;
      } else {
        conflictsList.innerHTML = data.contradictions.map(c => `
          <div class="conflict-card">
            <div class="conflict-header">
              <span class="conflict-tag">Temporal Contradiction</span>
              <span style="font-family: var(--font-mono); font-size: 12px; color: var(--text-dim);">${escapeHtml(c.source_doc_id)} ⟷ ${escapeHtml(c.target_doc_id)}</span>
            </div>
            <div class="conflict-comparison">
              <div class="comparison-col">
                <span class="col-header">Earlier Statement [Status: ${escapeHtml(c.source_status)}]</span>
                <p class="comparison-stmt">"${escapeHtml(c.source_statement)}"</p>
              </div>
              <div class="comparison-col">
                <span class="col-header">Later Superseding Statement [Status: ${escapeHtml(c.target_status)}]</span>
                <p class="comparison-stmt">"${escapeHtml(c.target_statement)}"</p>
              </div>
            </div>
            <div class="conflict-explanation">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg>
              <span><strong>Conflict Reason:</strong> ${escapeHtml(c.explanation)}</span>
            </div>
          </div>
        `).join("");
      }

      // 3. Orphaned Conclusions
      if (data.orphaned_claims.length === 0) {
        orphansList.innerHTML = `<div class="empty-state"><div class="empty-icon">✓</div><p>All conclusions are supported by active valid premises.</p></div>`;
      } else {
        orphansList.innerHTML = data.orphaned_claims.map(o => `
          <div class="orphan-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span class="pill ORPHANED">Orphaned Conclusion · ${escapeHtml(o.document)}</span>
              <span style="font-family: var(--font-mono); font-size: 11px; color: var(--text-dim);">ID: ${escapeHtml(o.claim_id)}</span>
            </div>
            <div class="orphan-conclusion-box">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #f472b6;">Asserted Conclusion:</span>
              <p style="font-size: 15px; font-weight: 600; margin-top: 4px;">"${escapeHtml(o.conclusion)}"</p>
            </div>
            <div class="broken-evidence-box">
              <strong>Broken/Refuted Foundations:</strong>
              <ul style="margin-top: 6px; padding-left: 18px;">
                ${o.invalidated_premises.map(p => `<li>"${escapeHtml(p)}" (Refuted / Superseded by later spec)</li>`).join("")}
              </ul>
            </div>
          </div>
        `).join("");
      }

      // 4. Claims Directory
      renderClaims();

      // 5. Source Documents
      renderDocuments(data.documents);

      // 6. Interactive Graph
      initGraph(data.graph);
    }

    // Filter Chips
    document.querySelectorAll(".filter-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        activeFilter = chip.getAttribute("data-filter");
        renderClaims();
      });
    });

    document.getElementById("claimsSearchInput").addEventListener("input", (e) => {
      activeSearch = e.target.value.toLowerCase();
      renderClaims();
    });

    function renderClaims() {
      if (!currentAuditData) return;
      let claims = currentAuditData.claims;

      if (activeFilter !== "ALL") {
        claims = claims.filter(c => c.status === activeFilter);
      }
      if (activeSearch) {
        claims = claims.filter(c => c.statement.toLowerCase().includes(activeSearch) || c.topic.toLowerCase().includes(activeSearch));
      }

      if (claims.length === 0) {
        claimsList.innerHTML = `<div class="empty-state"><p>No claims match the active filter criteria.</p></div>`;
        return;
      }

      claimsList.innerHTML = claims.map(c => `
        <div class="claim-item" onclick="openClaimDrawer('${c.claim_id}')" style="cursor: pointer;">
          <div class="claim-content">
            <div class="claim-badges">
              <span class="pill ${escapeHtml(c.status)}">${escapeHtml(c.status)}</span>
              <span class="pill topic">${escapeHtml(c.topic)}</span>
              <span style="font-size: 11px; color: var(--text-dim); text-transform: uppercase; font-weight: 600;">${escapeHtml(c.type)}</span>
            </div>
            <p class="claim-statement">"${escapeHtml(c.statement)}"</p>
            <div class="claim-meta">
              <span>Source: ${escapeHtml(c.source_doc_id)}</span> · <span>Date: ${escapeHtml(c.timestamp)}</span> · <span>ID: ${escapeHtml(c.claim_id)}</span>
            </div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--text-dim);"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>
      `).join("");
    }

    function renderDocuments(docs) {
      if (!docs || docs.length === 0) {
        docsList.innerHTML = `<div class="empty-state"><p>No documents currently loaded.</p></div>`;
        return;
      }

      docsList.innerHTML = docs.map(doc => {
        const isCustom = customDocuments.some(cd => cd.doc_id === doc.doc_id);
        return `
        <div class="doc-editor-card">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <h3 style="font-size: 16px; font-weight: 700;">${escapeHtml(doc.title)}</h3>
              ${isCustom ? '<span class="pill" style="background: rgba(6,182,212,0.15); color: var(--cyan); font-size: 11px;">Custom</span>' : ''}
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-family: var(--font-mono); font-size: 12px; color: var(--cyan);">${escapeHtml(doc.doc_id)} · v${escapeHtml(doc.version)} · ${escapeHtml(doc.timestamp)}</span>
              ${isCustom ? `<button onclick="deleteCustomDoc('${doc.doc_id}')" class="btn btn-secondary" style="padding: 2px 8px; font-size: 11px; color: var(--rose); border-color: rgba(244,63,94,0.3);">Remove</button>` : ''}
            </div>
          </div>
          <div style="background: rgba(8, 12, 20, 0.7); border-radius: 6px; padding: 14px; font-size: 13px; font-family: var(--font-mono); white-space: pre-wrap; color: var(--text-muted); border: 1px solid var(--border);">${escapeHtml(doc.content)}</div>
        </div>
      `;
      }).join("");
    }

    window.deleteCustomDoc = function(docId) {
      customDocuments = customDocuments.filter(d => d.doc_id !== docId);
      runAudit();
    };

    // Custom Document Form handlers
    addNewDocBtn.addEventListener("click", () => {
      customDocForm.style.display = customDocForm.style.display === "none" ? "block" : "none";
      if (customDocForm.style.display === "block") {
        document.getElementById("newDocId").value = `DOC-CUSTOM-${customDocuments.length + 1}`;
        document.getElementById("newDocDate").value = new Date().toISOString().slice(0, 10);
      }
    });

    cancelAddDocBtn.addEventListener("click", () => {
      customDocForm.style.display = "none";
    });

    saveAddDocBtn.addEventListener("click", () => {
      const docId = document.getElementById("newDocId").value.trim() || `DOC-CUSTOM-${customDocuments.length + 1}`;
      const title = document.getElementById("newDocTitle").value.trim() || "Custom Technical Specification";
      const version = document.getElementById("newDocVersion").value.trim() || "1.0.0";
      const timestamp = document.getElementById("newDocDate").value.trim() || new Date().toISOString().slice(0, 10);
      const content = document.getElementById("newDocContent").value.trim();

      if (!content) {
        alert("Please enter specification content.");
        return;
      }

      customDocuments.push({ doc_id: docId, title, version, timestamp, content });
      scenarioSelect.value = "custom";
      customDocForm.style.display = "none";
      document.getElementById("newDocContent").value = "";
      runAudit();
    });

    // --- GRAPH VISUALIZATION ENGINE ---
    function resizeCanvas() {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      drawGraph();
    }
    window.addEventListener("resize", resizeCanvas);

    function initGraph(graphData) {
      if (!graphData || !graphData.nodes) return;
      resizeCanvas();

      const rect = canvas.parentElement.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      const total = graphData.nodes.length;
      nodes = graphData.nodes.map((n, i) => {
        const angle = (i / total) * 2 * Math.PI;
        const radius = Math.min(width, height) * 0.35;
        return {
          ...n,
          x: width / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 40,
          y: height / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 40,
          vx: 0,
          vy: 0,
          radius: n.type === "DOCUMENT" ? 22 : 14,
        };
      });

      const nodeMap = new Map(nodes.map(n => [n.id, n]));
      edges = graphData.edges.map(e => ({
        ...e,
        sourceNode: nodeMap.get(e.source),
        targetNode: nodeMap.get(e.target),
      })).filter(e => e.sourceNode && e.targetNode);

      panX = 0;
      panY = 0;
      zoom = 1;
      simulatePhysics();
    }

    function simulatePhysics() {
      let iter = 0;
      simulationRunning = true;
      function step() {
        if (!simulationRunning) return;
        iter++;
        
        // Repulsion
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[j].x - nodes[i].x;
            const dy = nodes[j].y - nodes[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            if (dist < 220) {
              const force = (220 - dist) / dist * 0.04;
              nodes[i].x -= dx * force;
              nodes[i].y -= dy * force;
              nodes[j].x += dx * force;
              nodes[j].y += dy * force;
            }
          }
        }

        // Edge attraction
        edges.forEach(e => {
          const dx = e.targetNode.x - e.sourceNode.x;
          const dy = e.targetNode.y - e.sourceNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDist = e.relation === "CONTRADICTS" ? 180 : 110;
          const force = (dist - targetDist) * 0.02;
          e.sourceNode.x += (dx / dist) * force;
          e.sourceNode.y += (dy / dist) * force;
          e.targetNode.x -= (dx / dist) * force;
          e.targetNode.y -= (dy / dist) * force;
        });

        drawGraph();
        if (iter < 120) {
          requestAnimationFrame(step);
        } else {
          simulationRunning = false;
        }
      }
      step();
    }

    function drawGraph() {
      const rect = canvas.parentElement.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(width / 2 + panX, height / 2 + panY);
      ctx.scale(zoom, zoom);
      ctx.translate(-width / 2, -height / 2);

      // Draw Edges
      edges.forEach(e => {
        ctx.beginPath();
        ctx.strokeStyle = e.color || "#64748b";
        ctx.lineWidth = e.relation === "CONTRADICTS" ? 2.5 : 1.5;
        if (e.dashed) {
          ctx.setLineDash([6, 6]);
        } else {
          ctx.setLineDash([]);
        }
        ctx.moveTo(e.sourceNode.x, e.sourceNode.y);
        ctx.lineTo(e.targetNode.x, e.targetNode.y);
        ctx.stroke();

        if (e.relation === "CONTRADICTS") {
          const midX = (e.sourceNode.x + e.targetNode.x) / 2;
          const midY = (e.sourceNode.y + e.targetNode.y) / 2;
          ctx.fillStyle = "#ef4444";
          ctx.font = "bold 10px JetBrains Mono";
          ctx.fillText("CONFLICT", midX - 24, midY - 6);
        }
      });
      ctx.setLineDash([]);

      // Draw Nodes
      nodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius + 4, 0, 2 * Math.PI);
        ctx.fillStyle = n.color + "33";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, 2 * Math.PI);
        ctx.fillStyle = n.color;
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = "#f8fafc";
        ctx.font = n.type === "DOCUMENT" ? "bold 12px Outfit" : "500 11px Inter";
        const labelText = n.type === "DOCUMENT" ? n.id : (n.topic || "Claim");
        ctx.fillText(labelText, n.x - ctx.measureText(labelText).width / 2, n.y + n.radius + 14);
      });

      ctx.restore();
    }

    // Graph Interactivity
    canvas.addEventListener("mousedown", (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - (rect.width / 2 + panX)) / zoom + rect.width / 2;
      const mouseY = (e.clientY - rect.top - (rect.height / 2 + panY)) / zoom + rect.height / 2;

      for (const n of nodes) {
        const dx = mouseX - n.x;
        const dy = mouseY - n.y;
        if (Math.sqrt(dx * dx + dy * dy) <= n.radius + 4) {
          draggedNode = n;
          openClaimDrawer(n.id);
          return;
        }
      }

      isDragging = true;
      dragStartX = e.clientX - panX;
      dragStartY = e.clientY - panY;
    });

    window.addEventListener("mousemove", (e) => {
      if (draggedNode) {
        const rect = canvas.getBoundingClientRect();
        draggedNode.x = (e.clientX - rect.left - (rect.width / 2 + panX)) / zoom + rect.width / 2;
        draggedNode.y = (e.clientY - rect.top - (rect.height / 2 + panY)) / zoom + rect.height / 2;
        drawGraph();
      } else if (isDragging) {
        panX = e.clientX - dragStartX;
        panY = e.clientY - dragStartY;
        drawGraph();
      }
    });

    window.addEventListener("mouseup", () => {
      isDragging = false;
      draggedNode = null;
    });

    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      zoom = Math.max(0.4, Math.min(3, zoom * zoomFactor));
      drawGraph();
    });

    document.getElementById("zoomInBtn").addEventListener("click", () => { zoom = Math.min(3, zoom * 1.2); drawGraph(); });
    document.getElementById("zoomOutBtn").addEventListener("click", () => { zoom = Math.max(0.4, zoom * 0.8); drawGraph(); });
    document.getElementById("resetGraphBtn").addEventListener("click", () => { zoom = 1; panX = 0; panY = 0; drawGraph(); });

    // Node Drawer
    const nodeDrawer = document.getElementById("nodeDrawer");
    const drawerTitle = document.getElementById("drawerTitle");
    const drawerBody = document.getElementById("drawerBody");
    document.getElementById("closeDrawerBtn").addEventListener("click", () => nodeDrawer.classList.remove("open"));

    window.openClaimDrawer = function(id) {
      if (!currentAuditData) return;
      const claim = currentAuditData.claims.find(c => c.claim_id === id);
      const doc = currentAuditData.documents.find(d => d.doc_id === id);

      if (claim) {
        drawerTitle.textContent = `Claim ${claim.claim_id}`;
        drawerBody.innerHTML = `
          <div style="margin-bottom: 16px;">
            <span class="pill ${escapeHtml(claim.status)}">${escapeHtml(claim.status)}</span>
            <span class="pill topic">${escapeHtml(claim.topic)}</span>
            <span class="pill">${escapeHtml(claim.type)}</span>
          </div>
          <div style="background: rgba(8, 12, 20, 0.8); border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 18px;">
            <h4 style="font-size: 11px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 6px;">Proposition Statement</h4>
            <p style="font-size: 15px; font-weight: 600; line-height: 1.5;">"${escapeHtml(claim.statement)}"</p>
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px;">
            <div><strong style="color: var(--text-dim);">Source Document:</strong> ${escapeHtml(claim.source_doc_id)}</div>
            <div><strong style="color: var(--text-dim);">Document Timestamp:</strong> ${escapeHtml(claim.timestamp)}</div>
            <div><strong style="color: var(--text-dim);">Prerequisite Dependencies:</strong> ${claim.dependencies && claim.dependencies.length ? claim.dependencies.join(", ") : "None (Root proposition)"}</div>
          </div>
        `;
        nodeDrawer.classList.add("open");
      } else if (doc) {
        drawerTitle.textContent = `Document ${doc.doc_id}`;
        drawerBody.innerHTML = `
          <h3 style="font-size: 18px; margin-bottom: 8px;">${escapeHtml(doc.title)}</h3>
          <div style="font-size: 12px; color: var(--cyan); font-family: var(--font-mono); margin-bottom: 16px;">Version ${escapeHtml(doc.version)} · Timestamp ${escapeHtml(doc.timestamp)}</div>
          <div style="background: rgba(8, 12, 20, 0.8); border: 1px solid var(--border); border-radius: 8px; padding: 14px; font-size: 13px; font-family: var(--font-mono); white-space: pre-wrap;">${escapeHtml(doc.content)}</div>
        `;
        nodeDrawer.classList.add("open");
      }
    };

    // --- PAIR CONFLICT SANDBOX ---
    document.getElementById("verifyPairBtn").addEventListener("click", async () => {
      const stmtA = document.getElementById("sandboxA").value.trim();
      const dateA = document.getElementById("sandboxDateA").value.trim();
      const topicA = document.getElementById("sandboxTopicA").value.trim();

      const stmtB = document.getElementById("sandboxB").value.trim();
      const dateB = document.getElementById("sandboxDateB").value.trim();
      const topicB = document.getElementById("sandboxTopicB").value.trim();

      const mode = modeSelect.value;
      const pairResult = document.getElementById("pairResult");
      pairResult.hidden = false;
      pairResult.innerHTML = '<div style="color: var(--cyan);"><span class="spinner" style="display: inline-block; vertical-align: middle; margin-right: 8px;"></span> Analyzing semantic divergence...</div>';

      function renderPairResult(data) {
        if (data.contradiction) {
          pairResult.innerHTML = `
            <div style="background: rgba(244, 63, 94, 0.12); border: 1px solid rgba(244, 63, 94, 0.4); border-radius: 8px; padding: 16px;">
              <strong style="color: #fda4af;">⚠ DIRECT CONTRADICTION DETECTED</strong>
              <p style="margin-top: 6px; font-size: 14px; color: var(--text-main);">${escapeHtml(data.explanation)}</p>
            </div>
          `;
        } else {
          pairResult.innerHTML = `
            <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 8px; padding: 16px;">
              <strong style="color: #6ee7b7;">✓ NO MUTUAL CONFLICT</strong>
              <p style="margin-top: 6px; font-size: 14px; color: var(--text-main);">${escapeHtml(data.explanation)}</p>
            </div>
          `;
        }
      }

      // Try server if available
      if (backendAvailable && mode !== "fast") {
        try {
          const targetBase = customApiBaseUrl ? customApiBaseUrl.replace(/\/$/, "") : "";
          const res = await fetch(`${targetBase}/api/verify-pair`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ statement_a: stmtA, date_a: dateA, topic_a: topicA, statement_b: stmtB, date_b: dateB, topic_b: topicB, mode }),
            signal: AbortSignal.timeout(5000)
          });
          const ct = res.headers.get("content-type") || "";
          if (res.ok && ct.includes("application/json")) {
            const data = await res.json();
            renderPairResult(data);
            return;
          }
        } catch (e) {
          // Fall through to client verification
        }
      }

      // Client verification
      const claimA = { claim_id: "SANDBOX-A", statement: stmtA, timestamp: dateA, topic: topicA };
      const claimB = { claim_id: "SANDBOX-B", statement: stmtB, timestamp: dateB, topic: topicB };
      const conflict = checkContradictionPairDeterministic(claimA, claimB);

      if (conflict) {
        renderPairResult({ contradiction: true, explanation: conflict.explanation });
      } else {
        const sharesTopic = sharesTopicOrContext(claimA, claimB);
        const reason = sharesTopic
          ? "Both propositions align on technical domain without mutual contradiction or conflicting constraints."
          : "Propositions discuss distinct architectural concepts with no direct operational conflict.";
        renderPairResult({ contradiction: false, explanation: reason });
      }
    });

    // --- API CONFIG MODAL LOGIC ---
    function openApiModal() {
      apiConfigModal.style.display = "flex";
      apiUrlInput.value = customApiBaseUrl;
      apiModalStatus.hidden = true;
    }

    function closeApiModal() {
      apiConfigModal.style.display = "none";
    }

    if (backendBadge) backendBadge.addEventListener("click", openApiModal);
    if (engineStatusBadge) engineStatusBadge.addEventListener("click", openApiModal);
    if (closeApiModalBtn) closeApiModalBtn.addEventListener("click", closeApiModal);
    if (apiConfigModal) {
      apiConfigModal.addEventListener("click", (e) => {
        if (e.target === apiConfigModal) closeApiModal();
      });
    }

    if (resetApiStandaloneBtn) {
      resetApiStandaloneBtn.addEventListener("click", () => {
        customApiBaseUrl = "";
        localStorage.removeItem("claimgraph_api_url");
        if (apiBackendText) apiBackendText.textContent = "In-Browser (Standalone)";
        backendAvailable = false;
        closeApiModal();
        checkHealth();
        runAudit();
      });
    }

    if (saveApiUrlBtn) {
      saveApiUrlBtn.addEventListener("click", async () => {
        const url = apiUrlInput.value.trim().replace(/\/$/, "");
        apiModalStatus.hidden = false;
        apiModalStatus.innerHTML = '<span class="spinner" style="display:inline-block; vertical-align:middle; margin-right:6px;"></span> Testing connection...';
        apiModalStatus.style.color = "var(--cyan)";

        try {
          const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(3000) });
          const ct = res.headers.get("content-type") || "";
          if (res.ok && ct.includes("application/json")) {
            const data = await res.json();
            customApiBaseUrl = url;
            localStorage.setItem("claimgraph_api_url", url);
            if (apiBackendText) apiBackendText.textContent = `Remote API (${new URL(url).host})`;
            backendAvailable = true;
            apiModalStatus.textContent = `✓ Successfully connected to ${data.model || "CLAIM GRAPH"} backend!`;
            apiModalStatus.style.color = "var(--emerald)";
            setTimeout(() => {
              closeApiModal();
              checkHealth();
              runAudit();
            }, 800);
            return;
          }
          throw new Error("Endpoint did not return valid JSON health response");
        } catch (err) {
          apiModalStatus.textContent = `Connection failed: ${err.message}. Using client-side engine.`;
          apiModalStatus.style.color = "var(--rose)";
        }
      });
    }

    // --- EXPORT REPORT ---
    exportReportBtn.addEventListener("click", () => {
      if (!currentAuditData) {
        alert("Please run an intelligence audit first before exporting.");
        return;
      }
      const blob = new Blob([JSON.stringify(currentAuditData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `claim-graph-audit-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // --- MAIN TAB HELPER ---
    function switchMainTab(tabId) {
      const targetBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
      if (targetBtn) targetBtn.click();
    }
    if (viewSolutionConflictsBtn) {
      viewSolutionConflictsBtn.addEventListener("click", () => switchMainTab("conflictsTab"));
    }
    if (viewSolutionOrphansBtn) {
      viewSolutionOrphansBtn.addEventListener("click", () => switchMainTab("orphansTab"));
    }

    // --- POPULATE USER PROBLEMS IN SCENARIO SELECTOR ---
    function updateScenarioSelect(selectedId = null) {
      if (!userProblemsGroup) return;
      userProblemsGroup.innerHTML = "";
      const ids = Object.keys(userProblems);

      if (ids.length === 0) {
        userProblemsGroup.style.display = "none";
      } else {
        userProblemsGroup.style.display = "";
        ids.forEach((id, idx) => {
          const prob = userProblems[id];
          const opt = document.createElement("option");
          opt.value = id;
          opt.textContent = `★ ${prob.title || "Custom Problem " + (idx + 1)}`;
          userProblemsGroup.appendChild(opt);
        });
      }

      if (selectedId) {
        scenarioSelect.value = selectedId;
      }
    }

    // --- CUSTOM PROBLEM IMPORT HUB LOGIC ---
    let activeImportTab = "uploadTab";
    let importedFileDocuments = null;
    let selectedTemplateId = null;

    function openImportModal(preferredTab = "uploadTab") {
      if (!importProblemModal) return;
      importProblemModal.style.display = "flex";
      importProblemStatus.textContent = "";

      // Switch to preferred tab
      const tabBtn = document.querySelector(`.import-tab-btn[data-tab="${preferredTab}"]`);
      if (tabBtn) tabBtn.click();

      // Ensure builder cards are seeded
      if (builderDocCards && builderDocCards.children.length === 0) {
        initBuilderCards();
      }

      if (!importProblemIdInput.value) {
        importProblemIdInput.value = `custom_prob_${Date.now().toString().slice(-6)}`;
      }
    }

    function closeImportModal() {
      if (importProblemModal) importProblemModal.style.display = "none";
    }

    if (importProblemBtn) importProblemBtn.addEventListener("click", () => openImportModal("uploadTab"));
    if (docsImportProblemBtn) docsImportProblemBtn.addEventListener("click", () => openImportModal("builderTab"));
    if (closeImportModalBtn) closeImportModalBtn.addEventListener("click", closeImportModal);
    if (cancelImportProblemBtn) cancelImportProblemBtn.addEventListener("click", closeImportModal);

    if (importProblemModal) {
      importProblemModal.addEventListener("click", (e) => {
        if (e.target === importProblemModal) closeImportModal();
      });
    }

    // Modal Tabs Navigation
    document.querySelectorAll(".import-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".import-tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".import-tab-pane").forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        const tabId = btn.getAttribute("data-tab");
        activeImportTab = tabId;
        const targetPane = document.getElementById(tabId);
        if (targetPane) targetPane.classList.add("active");
      });
    });

    // Parse problem text / markdown into structured documents


    // --- FILE UPLOAD & DROP ZONE ---
    function handleFileSelected(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const result = parseProblemText(text, file.name.replace(/\.[^/.]+$/, ""));
        importedFileDocuments = result;

        if (fileUploadPreview && fileUploadSummary && fileUploadContentPreview) {
          fileUploadPreview.style.display = "block";
          fileUploadSummary.textContent = `✓ Ingested "${file.name}" · Extracted ${result.documents.length} document revisions`;
          fileUploadContentPreview.textContent = JSON.stringify(result.documents, null, 2);
        }

        if (!importProblemTitleInput.value || importProblemTitleInput.value.startsWith("custom_")) {
          importProblemTitleInput.value = result.title;
        }
        if (!importProblemIdInput.value || importProblemIdInput.value.startsWith("custom_")) {
          importProblemIdInput.value = result.title.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 24);
        }
      };
      reader.readAsText(file);
    }

    if (problemDropZone) {
      problemDropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        problemDropZone.classList.add("dragover");
      });
      problemDropZone.addEventListener("dragleave", () => {
        problemDropZone.classList.remove("dragover");
      });
      problemDropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        problemDropZone.classList.remove("dragover");
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFileSelected(e.dataTransfer.files[0]);
        }
      });
    }

    if (problemFileInput) {
      problemFileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleFileSelected(e.target.files[0]);
        }
      });
    }

    // --- SAMPLE PASTE LOADER ---
    if (loadSamplePasteBtn && pasteSpecTextarea) {
      loadSamplePasteBtn.addEventListener("click", () => {
        pasteSpecTextarea.value = [
          "Document: ARCH-V1",
          "Version: 1.0.0",
          "Date: 2025-01-15",
          "Title: Distributed In-Memory Cache Standard",
          "All edge nodes must retain transaction state on local NVMe solid-state storage.",
          "Replication cluster size is strictly limited to 16 nodes due to Raft constraints.",
          "",
          "---",
          "",
          "Document: ARCH-V2",
          "Version: 2.0.0",
          "Date: 2025-07-20",
          "Title: Elastic Cloud Object Store Migration",
          "All edge nodes run persistence on network-attached object storage volumes.",
          "Cluster size scales dynamically to 64 nodes through a leaderless Paxos ring.",
          "",
          "---",
          "",
          "Document: PERF-AUDIT",
          "Version: 1.1.0",
          "Date: 2025-08-01",
          "Title: Critical Latency SLA Guarantee",
          "The system achieves sub-5ms write latency as a direct consequence of local NVMe solid-state storage."
        ].join("\n");

        importProblemTitleInput.value = "Edge Cache Storage & Node Invalidation";
        importProblemIdInput.value = "edge_cache_invalidation";
        importProblemStatus.textContent = "✓ Sample specification loaded into paste editor.";
        importProblemStatus.style.color = "var(--emerald)";
      });
    }

    // --- INTERACTIVE DOCUMENT BUILDER ---
    function createBuilderDocCard(doc = {}) {
      const card = document.createElement("div");
      card.className = "builder-doc-item";
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="font-weight: 600; font-size: 13px; color: var(--cyan); display: flex; align-items: center; gap: 6px;">
            <span>📄</span> <span class="doc-item-num">Document Revision</span>
          </div>
          <button class="btn btn-secondary remove-builder-card-btn" type="button" style="padding: 2px 8px; font-size: 11px; color: var(--rose); border-color: rgba(239, 68, 68, 0.3);">Remove</button>
        </div>
        <div style="display: grid; grid-template-columns: 120px 1fr 100px 130px; gap: 8px; margin-bottom: 8px;">
          <div>
            <label style="font-size: 10px; text-transform: uppercase; color: var(--text-dim); display: block; margin-bottom: 2px;">Doc ID</label>
            <input type="text" class="card-doc-id" value="${escapeHtml(doc.doc_id || 'DOC-' + (builderDocCards.children.length + 1))}" style="width: 100%; font-size: 12px; padding: 5px 8px;">
          </div>
          <div>
            <label style="font-size: 10px; text-transform: uppercase; color: var(--text-dim); display: block; margin-bottom: 2px;">Title</label>
            <input type="text" class="card-title" value="${escapeHtml(doc.title || 'Architecture Specification')}" style="width: 100%; font-size: 12px; padding: 5px 8px;">
          </div>
          <div>
            <label style="font-size: 10px; text-transform: uppercase; color: var(--text-dim); display: block; margin-bottom: 2px;">Version</label>
            <input type="text" class="card-version" value="${escapeHtml(doc.version || '1.0.0')}" style="width: 100%; font-size: 12px; padding: 5px 8px;">
          </div>
          <div>
            <label style="font-size: 10px; text-transform: uppercase; color: var(--text-dim); display: block; margin-bottom: 2px;">Date</label>
            <input type="date" class="card-date" value="${escapeHtml(doc.timestamp || '2025-01-15')}" style="width: 100%; font-size: 12px; padding: 4px 6px;">
          </div>
        </div>
        <div>
          <label style="font-size: 10px; text-transform: uppercase; color: var(--text-dim); display: block; margin-bottom: 2px;">Propositions / Specifications (Separate statements with periods)</label>
          <textarea class="card-content" style="width: 100%; height: 60px; font-family: var(--font-mono); font-size: 11px; padding: 6px 8px; resize: vertical;">${escapeHtml(doc.content || '')}</textarea>
        </div>
      `;

      card.querySelector(".remove-builder-card-btn").addEventListener("click", () => {
        if (builderDocCards.children.length > 1) {
          card.remove();
        } else {
          alert("A problem must have at least one document revision.");
        }
      });

      return card;
    }

    function initBuilderCards() {
      if (!builderDocCards) return;
      builderDocCards.innerHTML = "";
      const defaultDocs = [
        {
          doc_id: "SPEC-V1",
          title: "Baseline Operational Architecture",
          version: "1.0.0",
          timestamp: "2025-01-15",
          content: "All cluster transaction state must execute directly on local NVMe solid-state storage.\nThe cluster size is strictly limited to 16 nodes due to Raft consensus constraints."
        },
        {
          doc_id: "SPEC-V2",
          title: "Cloud Scale Migration Architecture",
          version: "2.0.0",
          timestamp: "2025-07-20",
          content: "All cluster state persistence operations run on network-attached object storage volumes.\nThe cluster size scales to 64 nodes through a leaderless Paxos ring."
        },
        {
          doc_id: "AUDIT-1",
          title: "Annual Performance SLA Certification",
          version: "1.1.0",
          timestamp: "2025-08-01",
          content: "Sub-5ms write latency is guaranteed as a direct consequence of local NVMe solid-state storage."
        }
      ];
      defaultDocs.forEach(d => builderDocCards.appendChild(createBuilderDocCard(d)));
    }

    if (addBuilderDocCardBtn) {
      addBuilderDocCardBtn.addEventListener("click", () => {
        const nextIdx = builderDocCards.children.length + 1;
        builderDocCards.appendChild(createBuilderDocCard({
          doc_id: `SPEC-V${nextIdx}`,
          title: `Revision Specification ${nextIdx}`,
          version: `${nextIdx}.0.0`,
          timestamp: new Date().toISOString().slice(0, 10),
          content: ""
        }));
      });
    }

    // --- TEMPLATES SELECTION ---
    document.querySelectorAll(".template-card").forEach(card => {
      card.addEventListener("click", () => {
        document.querySelectorAll(".template-card").forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        const tplId = card.getAttribute("data-template-id");
        selectedTemplateId = tplId;
        const tpl = BUILTIN_SCENARIOS[tplId];
        if (tpl) {
          importProblemTitleInput.value = tpl.title;
          importProblemIdInput.value = tpl.id;
          importProblemStatus.textContent = `✓ Selected enterprise template: "${tpl.title}". Ready to ingest.`;
          importProblemStatus.style.color = "var(--cyan)";
        }
      });
    });

    // --- EXECUTE IMPORT AND SOLVE PROBLEM ---
    if (executeImportAndSolveBtn) {
      executeImportAndSolveBtn.addEventListener("click", () => {
        let finalDocs = [];
        let defaultTitle = "Custom Technical Problem";

        if (activeImportTab === "uploadTab") {
          if (!importedFileDocuments || !importedFileDocuments.documents || importedFileDocuments.documents.length === 0) {
            importProblemStatus.textContent = "Please upload or drop a valid specification file (.json, .txt, .md).";
            importProblemStatus.style.color = "var(--rose)";
            return;
          }
          finalDocs = importedFileDocuments.documents;
          defaultTitle = importedFileDocuments.title || "Uploaded Problem Specification";
        } else if (activeImportTab === "pasteTab") {
          const raw = pasteSpecTextarea.value.trim();
          if (!raw) {
            importProblemStatus.textContent = "Please paste specification text or click 'Load Sample Markdown'.";
            importProblemStatus.style.color = "var(--rose)";
            return;
          }
          const parsed = parseProblemText(raw, "Pasted Technical Scenario");
          finalDocs = parsed.documents;
          defaultTitle = parsed.title || "Pasted Specification Scenario";
        } else if (activeImportTab === "builderTab") {
          const cardItems = builderDocCards.querySelectorAll(".builder-doc-item");
          cardItems.forEach(card => {
            const docId = card.querySelector(".card-doc-id").value.trim();
            const title = card.querySelector(".card-title").value.trim();
            const version = card.querySelector(".card-version").value.trim();
            const timestamp = card.querySelector(".card-date").value.trim();
            const content = card.querySelector(".card-content").value.trim();
            if (content) {
              finalDocs.push({ doc_id: docId || "DOC", title: title || "Specification", version: version || "1.0.0", timestamp: timestamp || "2025-01-01", content });
            }
          });
          if (finalDocs.length === 0) {
            importProblemStatus.textContent = "Please provide proposition text in at least one document card.";
            importProblemStatus.style.color = "var(--rose)";
            return;
          }
          defaultTitle = "Interactive Assembled Problem";
        } else if (activeImportTab === "templatesTab") {
          if (!selectedTemplateId || !BUILTIN_SCENARIOS[selectedTemplateId]) {
            importProblemStatus.textContent = "Please click to select an enterprise template card above.";
            importProblemStatus.style.color = "var(--rose)";
            return;
          }
          const tpl = BUILTIN_SCENARIOS[selectedTemplateId];
          finalDocs = JSON.parse(JSON.stringify(tpl.documents));
          defaultTitle = tpl.title;
        }

        const title = (importProblemTitleInput.value.trim()) || defaultTitle;
        const problemId = (importProblemIdInput.value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_")) || `prob_${Date.now().toString().slice(-6)}`;

        // Save into userProblems
        userProblems[problemId] = {
          id: problemId,
          title: title,
          description: `Custom ingested problem with ${finalDocs.length} specification revisions.`,
          documents: finalDocs,
          importedAt: new Date().toISOString()
        };

        try {
          localStorage.setItem("claimgraph_user_problems", JSON.stringify(userProblems));
        } catch (e) {
          console.warn("Storage quota exceeded or unavailable:", e);
        }

        // Update dropdown and select this problem
        updateScenarioSelect(problemId);

        // Close modal
        closeImportModal();

        // Solve problem immediately via audit
        runAudit();

        // Switch to interactive graph view
        switchMainTab("graphTab");

        // Status update
        statusMessage.textContent = `✓ Problem "${title}" successfully imported and solved!`;
        statusMessage.style.color = "var(--emerald)";
      });
    }

    // --- HELPER HTML ESCAPE ---
    function escapeHtml(str) {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    // --- INITIALIZE ON LOAD ---
    window.addEventListener("DOMContentLoaded", () => {
      updateScenarioSelect();
      checkHealth();
      runAudit();
    });
  
