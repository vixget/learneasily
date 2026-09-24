import { useState } from "react";

const COLORS = {
  bg: "#F0F7FF",
  white: "#FFFFFF",
  accent: "#2563EB",
  accentLight: "#E2EEFF",
  text: "#0F172A",
  muted: "#64748B",
  border: "#CBD5E1",
  tabInactive: "#F1F5F9",
  success: "#16A34A",
  warning: "#F59E0B",
};

const NOTES_PROMPT = `You are an expert study notes writer for students from high school to university level.

A student has uploaded study material. Produce clear, simplified notes that are easy to understand.

Respond ONLY with valid JSON in this exact format, nothing else — no markdown, no extra text:

{
  "title": "Topic name here",
  "sections": [
    {
      "heading": "First main concept",
      "bullets": ["Point one explained simply", "Point two", "Point three"]
    },
    {
      "heading": "Second main concept",
      "bullets": ["Point one", "Point two"]
    },
    {
      "heading": "Third main concept",
      "bullets": ["Point one", "Point two"]
    }
  ],
  "keyTerms": [
    {"term": "Term name", "definition": "Short plain definition"},
    {"term": "Term name", "definition": "Short plain definition"}
  ],
  "examTip": "One important exam tip or common mistake to avoid"
}

Rules:
- Keep language simple. No jargon unless explained.
- Each bullet point should be one clear sentence.
- Write for a student seeing this topic for the first time.
- Include 3-5 sections, 2-5 bullets each.
- Include 3-5 key terms.`;

const FLOWMAP_PROMPT = `You are an expert at creating concept flow maps for students.

A student has uploaded study material. Create a flow map showing how the main concepts connect.

Respond ONLY with valid JSON in this exact format, nothing else:

{
  "title": "Topic name",
  "nodes": [
    {"id": "1", "label": "Main Topic", "type": "root"},
    {"id": "2", "label": "Sub concept 1", "type": "branch"},
    {"id": "3", "label": "Sub concept 2", "type": "branch"},
    {"id": "4", "label": "Detail A", "type": "leaf"},
    {"id": "5", "label": "Detail B", "type": "leaf"},
    {"id": "6", "label": "Detail C", "type": "leaf"}
  ],
  "edges": [
    {"from": "1", "to": "2"},
    {"from": "1", "to": "3"},
    {"from": "2", "to": "4"},
    {"from": "2", "to": "5"},
    {"from": "3", "to": "6"}
  ]
}

Keep node labels short (max 4 words). Include 6-10 nodes. Show clear parent-child relationships.`;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function parseNotes(text) {
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

function FlowMap({ data, locked }) {
  if (!data || !data.nodes) return null;
  const rootNodes = data.nodes.filter(
    (n) => !data.edges.some((e) => e.to === n.id),
  );
  const branchNodes = data.nodes.filter((n) => n.type === "branch");
  const leafNodes = data.nodes.filter((n) => n.type === "leaf");
  const W = 560,
    H = 420;
  const positions = {};
  rootNodes.forEach((n) => {
    positions[n.id] = { x: W / 2, y: 40 };
  });
  branchNodes.forEach((n, i) => {
    positions[n.id] = { x: (W / (branchNodes.length + 1)) * (i + 1), y: 150 };
  });
  leafNodes.forEach((n, i) => {
    positions[n.id] = { x: (W / (leafNodes.length + 1)) * (i + 1), y: 280 };
  });
  const nodeColor = { root: COLORS.accent, branch: "#3B82F6", leaf: "#93C5FD" };
  const textColor = { root: "#fff", branch: "#fff", leaf: COLORS.text };
  return (
    <div style={{ position: "relative" }}>
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ overflow: "visible" }}
      >
        {data.edges.map((e, i) => {
          const from = positions[e.from];
          const to = positions[e.to];
          if (!from || !to) return null;
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y + 20}
              x2={to.x}
              y2={to.y - 20}
              stroke={locked && i > 2 ? "transparent" : COLORS.border}
              strokeWidth="2"
              strokeDasharray={locked ? "4,4" : "none"}
            />
          );
        })}
        {data.nodes.map((n, i) => {
          const pos = positions[n.id];
          if (!pos) return null;
          const isLocked = locked && i >= 3;
          const w = n.type === "root" ? 160 : n.type === "branch" ? 130 : 110;
          return (
            <g key={n.id} style={{ filter: isLocked ? "blur(3px)" : "none" }}>
              <rect
                x={pos.x - w / 2}
                y={pos.y - 19}
                width={w}
                height={38}
                rx="10"
                fill={
                  isLocked ? COLORS.border : nodeColor[n.type] || COLORS.accent
                }
                stroke={isLocked ? COLORS.border : nodeColor[n.type]}
                strokeWidth="2"
              />
              <text
                x={pos.x}
                y={pos.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={n.type === "root" ? 13 : 11}
                fontWeight={n.type === "root" ? 700 : 600}
                fill={isLocked ? COLORS.white : textColor[n.type] || "#fff"}
                fontFamily="Inter, sans-serif"
              >
                {n.label.length > 18 ? n.label.slice(0, 16) + "…" : n.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function NotesView({ notes, locked }) {
  if (!notes) return null;
  return (
    <div>
      <div
        style={{
          background: COLORS.accent,
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 20,
        }}
      >
        <h3
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: COLORS.white,
            margin: 0,
          }}
        >
          {notes.title}
        </h3>
      </div>
      {(notes.sections || []).map((s, i) => {
        const isLocked = locked && i >= 1;
        return (
          <div
            key={i}
            style={{
              marginBottom: 16,
              background: COLORS.bg,
              borderRadius: 12,
              padding: "14px 16px",
              filter: isLocked ? "blur(5px)" : "none",
              userSelect: isLocked ? "none" : "auto",
              pointerEvents: isLocked ? "none" : "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 18,
                  background: COLORS.accent,
                  borderRadius: 4,
                  flexShrink: 0,
                }}
              />
              <h4
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: COLORS.text,
                  margin: 0,
                }}
              >
                {s.heading}
              </h4>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {(s.bullets || []).map((b, j) => (
                <li
                  key={j}
                  style={{
                    fontSize: 12,
                    color: COLORS.text,
                    lineHeight: 1.8,
                    marginBottom: 3,
                  }}
                >
                  {b}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {!locked && notes.keyTerms && notes.keyTerms.length > 0 && (
        <div
          style={{
            background: COLORS.accentLight,
            borderRadius: 12,
            padding: 16,
            marginBottom: 14,
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: COLORS.accent,
              marginBottom: 10,
            }}
          >
            📚 Key Terms
          </p>
          {notes.keyTerms.map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: COLORS.accent,
                  minWidth: 80,
                }}
              >
                {t.term}:
              </span>
              <span
                style={{ fontSize: 12, color: COLORS.text, lineHeight: 1.6 }}
              >
                {t.definition}
              </span>
            </div>
          ))}
        </div>
      )}
      {!locked && notes.examTip && (
        <div
          style={{
            background: "#FFFBEB",
            border: `1px solid ${COLORS.warning}`,
            borderRadius: 12,
            padding: 14,
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#92400E",
              marginBottom: 4,
            }}
          >
            ⚡ Exam Tip
          </p>
          <p style={{ fontSize: 12, color: "#92400E", lineHeight: 1.7 }}>
            {notes.examTip}
          </p>
        </div>
      )}
    </div>
  );
}

function PaywallOverlay() {
  const [payLoading, setPayLoading] = useState(false);

  const handlePayment = async (plan) => {
    setPayLoading(true);
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.paymentUrl) window.location.href = data.paymentUrl;
    } catch (e) {
      alert("Payment failed. Please try again.");
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "65%",
        background:
          "linear-gradient(to bottom, rgba(240,247,255,0.2), rgba(240,247,255,0.98) 40%)",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 24,
        paddingLeft: 24,
        paddingRight: 24,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
      <h3
        style={{
          fontSize: 16,
          fontWeight: 800,
          color: COLORS.text,
          marginBottom: 6,
        }}
      >
        Unlock the full content
      </h3>
      <p
        style={{
          fontSize: 12,
          color: COLORS.muted,
          marginBottom: 16,
          maxWidth: 220,
          lineHeight: 1.6,
        }}
      >
        You're seeing a preview. Get full notes, complete flow map and
        downloads.
      </p>
      <button
        onClick={() => handlePayment("session")}
        disabled={payLoading}
        style={{
          width: "100%",
          background: COLORS.accent,
          color: COLORS.white,
          border: "none",
          borderRadius: 10,
          padding: "11px 0",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          marginBottom: 8,
        }}
      >
        {payLoading ? "Loading..." : "Pay R29 for this session"}
      </button>
      <button
        onClick={() => handlePayment("unlimited")}
        disabled={payLoading}
        style={{
          width: "100%",
          background: COLORS.white,
          color: COLORS.accent,
          border: `2px solid ${COLORS.accent}`,
          borderRadius: 10,
          padding: "10px 0",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {payLoading ? "Loading..." : "R249/month — Unlimited"}
      </button>
      <p style={{ fontSize: 11, color: COLORS.muted, marginTop: 10 }}>
        🔐 Secured by PayFast
      </p>
    </div>
  );
}

export default function LearnEasily() {
  const [activeTab, setActiveTab] = useState("notes");
  const [dragging, setDragging] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [uploadMode, setUploadMode] = useState("pdf");
  const [photos, setPhotos] = useState([]);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [outputMode, setOutputMode] = useState("both");
  const [stage, setStage] = useState("upload");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [notes, setNotes] = useState(null);
  const [flowData, setFlowData] = useState(null);
  const [error, setError] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") setPdfFile(file);
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("PDF is too large. Please use a file under 5MB.");
        return;
      }
      setPdfFile(file);
    }
  };
  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.slice(0, 8 - photos.length);
    setPhotos((prev) => [
      ...prev,
      ...newFiles.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })),
    ]);
    setPhotoFiles((prev) => [...prev, ...newFiles]);
  };
  const removePhoto = (idx) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPhotoFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const canGenerate = uploadMode === "pdf" ? !!pdfFile : photos.length > 0;

  const buildMessages = async () => {
    if (uploadMode === "pdf") {
      const b64 = await fileToBase64(pdfFile);
      return [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: b64,
              },
            },
            { type: "text", text: "Here is the study material." },
          ],
        },
      ];
    } else {
      const imageParts = await Promise.all(
        photoFiles.map(async (f) => {
          const b64 = await fileToBase64(f);
          return {
            type: "image",
            source: {
              type: "base64",
              media_type: f.type === "image/png" ? "image/png" : "image/jpeg",
              data: b64,
            },
          };
        }),
      );
      return [
        {
          role: "user",
          content: [
            ...imageParts,
            { type: "text", text: "These are photos of study material." },
          ],
        },
      ];
    }
  };

  const callAPI = async (userPrompt, fileMessages) => {
    const messages = fileMessages.map((m, i) => {
      if (i === 0) {
        const content = Array.isArray(m.content) ? m.content : [m.content];
        return {
          role: "user",
          content: [...content, { type: "text", text: userPrompt }],
        };
      }
      return m;
    });
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        messages,
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    const text =
      data.content
        ?.filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("") || "";
    if (!text) throw new Error("Empty response from AI");
    return text;
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setNotes(null);
    setFlowData(null);
    setStage("upload");
    try {
      const fileMessages = await buildMessages();
      if (outputMode === "notes" || outputMode === "both") {
        setLoadingMsg("Reading your material...");
        const notesRaw = await callAPI(NOTES_PROMPT, fileMessages);
        const parsed = parseNotes(notesRaw);
        if (!parsed)
          throw new Error("Could not parse notes. Please try again.");
        setNotes(parsed);
      }
      if (outputMode === "flowmap" || outputMode === "both") {
        setLoadingMsg("Building your flow map...");
        const flowRaw = await callAPI(FLOWMAP_PROMPT, fileMessages);
        try {
          setFlowData(JSON.parse(flowRaw.replace(/```json|```/g, "").trim()));
        } catch {
          setFlowData(null);
        }
      }
      setStage("generated");
      setActiveTab(outputMode === "flowmap" ? "flowmap" : "notes");
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  };

  const switchUploadMode = (mode) => {
    setUploadMode(mode);
    setStage("upload");
    setPdfFile(null);
    setPhotos([]);
    setPhotoFiles([]);
    setNotes(null);
    setFlowData(null);
    setError(null);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        fontFamily: "'Inter', sans-serif",
        color: COLORS.text,
      }}
    >
      <style>{`
        @media (max-width: 700px) {
          .main-grid { grid-template-columns: 1fr !important; }
          .nav-links { display: none !important; }
          .hero h1 { font-size: 28px !important; }
          .hero p { font-size: 14px !important; }
          .pricing-grid { grid-template-columns: 1fr !important; }
          .how-grid { flex-direction: column !important; }
        }
      `}</style>

      {/* NAV */}
      <nav
        style={{
          background: COLORS.white,
          borderBottom: `1px solid ${COLORS.border}`,
          padding: "0 20px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 1px 8px rgba(37,99,235,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              background: COLORS.accent,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            📘
          </div>
          <span
            style={{
              fontWeight: 800,
              fontSize: 20,
              color: COLORS.accent,
              letterSpacing: "-0.5px",
            }}
          >
            Learn<span style={{ color: COLORS.text }}>Easily</span>
          </span>
        </div>
        <div
          className="nav-links"
          style={{ display: "flex", gap: 24, alignItems: "center" }}
        >
          {["How it works", "Pricing"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(" ", "-")}`}
              style={{
                fontSize: 14,
                color: COLORS.muted,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              {item}
            </a>
          ))}
          <button
            style={{
              background: COLORS.accent,
              color: COLORS.white,
              border: "none",
              borderRadius: 8,
              padding: "8px 18px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Get started
          </button>
        </div>
        <button
          className="mobile-cta"
          style={{
            background: COLORS.accent,
            color: COLORS.white,
            border: "none",
            borderRadius: 8,
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Get started
        </button>
      </nav>

      {/* HERO */}
      <div
        className="hero"
        style={{
          textAlign: "center",
          padding: "48px 20px 32px",
          maxWidth: 640,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: COLORS.accentLight,
            color: COLORS.accent,
            borderRadius: 20,
            padding: "5px 14px",
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          AI-powered study tool · For every student
        </div>
        <h1
          style={{
            fontSize: 36,
            fontWeight: 800,
            lineHeight: 1.2,
            color: COLORS.text,
            marginBottom: 14,
            letterSpacing: "-1px",
          }}
        >
          Overwhelmed by your textbook?{" "}
          <span style={{ color: COLORS.accent }}>We've got you.</span>
        </h1>
        <p
          style={{
            fontSize: 15,
            color: COLORS.muted,
            lineHeight: 1.7,
            maxWidth: 480,
            margin: "0 auto 28px",
          }}
        >
          Turn any learning unit into simplified notes and visual flow maps —
          instantly. Upload a PDF or snap photos and LearnEasily breaks it all
          down for you.
        </p>
      </div>

      {/* MAIN */}
      <div
        className="main-grid"
        style={{
          maxWidth: 920,
          margin: "0 auto",
          padding: "0 20px 60px",
          display: "grid",
          gridTemplateColumns: "1fr 1.4fr",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* LEFT */}
        <div
          style={{
            background: COLORS.white,
            borderRadius: 20,
            padding: 24,
            boxShadow: "0 2px 16px rgba(37,99,235,0.07)",
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
            Upload your material
          </h2>
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 20,
              background: COLORS.tabInactive,
              borderRadius: 10,
              padding: 4,
            }}
          >
            {[
              { id: "pdf", label: "📄 PDF" },
              { id: "photos", label: "📸 Photos" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => switchUploadMode(tab.id)}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: 8,
                  border: "none",
                  background:
                    uploadMode === tab.id ? COLORS.accent : "transparent",
                  color: uploadMode === tab.id ? COLORS.white : COLORS.muted,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {uploadMode === "pdf" && (
            <>
              <p
                style={{ fontSize: 12, color: COLORS.muted, marginBottom: 12 }}
              >
                PDF only · Max 5MB · Any subject
              </p>
              <label
                htmlFor="pdf-upload"
                style={{ cursor: "pointer", display: "block" }}
              >
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  style={{
                    border: `2px dashed ${dragging ? COLORS.accent : COLORS.border}`,
                    background: dragging ? COLORS.accentLight : COLORS.bg,
                    borderRadius: 14,
                    padding: "24px 16px",
                    textAlign: "center",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>
                    {pdfFile ? "✅" : "📄"}
                  </div>
                  {pdfFile ? (
                    <>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: COLORS.accent,
                          marginBottom: 2,
                        }}
                      >
                        {pdfFile.name}
                      </p>
                      <p style={{ fontSize: 11, color: COLORS.muted }}>
                        Ready to process
                      </p>
                    </>
                  ) : (
                    <>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: COLORS.text,
                          marginBottom: 4,
                        }}
                      >
                        Drag &amp; drop your PDF
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: COLORS.muted,
                          marginBottom: 12,
                        }}
                      >
                        or click to browse
                      </p>
                      <div
                        style={{
                          display: "inline-block",
                          background: COLORS.accentLight,
                          color: COLORS.accent,
                          borderRadius: 8,
                          padding: "6px 16px",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        Choose file
                      </div>
                    </>
                  )}
                </div>
              </label>
              <input
                id="pdf-upload"
                type="file"
                accept="application/pdf"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </>
          )}

          {uploadMode === "photos" && (
            <>
              <div
                style={{
                  background: "#FFFBEB",
                  border: `1px solid ${COLORS.warning}`,
                  borderRadius: 10,
                  padding: "9px 12px",
                  marginBottom: 12,
                  display: "flex",
                  gap: 8,
                }}
              >
                <span>💡</span>
                <p
                  style={{
                    fontSize: 11,
                    color: "#92400E",
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  Make sure photos are clear and well-lit. Max 8 photos per
                  session.
                </p>
              </div>
              {photos.length > 0 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 6,
                    marginBottom: 10,
                  }}
                >
                  {photos.map((p, i) => (
                    <div
                      key={i}
                      style={{
                        position: "relative",
                        borderRadius: 8,
                        overflow: "hidden",
                        aspectRatio: "1",
                        border: `1.5px solid ${COLORS.border}`,
                      }}
                    >
                      <img
                        src={p.url}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                      <button
                        onClick={() => removePhoto(i)}
                        style={{
                          position: "absolute",
                          top: 2,
                          right: 2,
                          background: "rgba(0,0,0,0.6)",
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
                          width: 16,
                          height: 16,
                          fontSize: 9,
                          cursor: "pointer",
                          fontWeight: 700,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {photos.length < 8 && (
                    <label htmlFor="photo-upload" style={{ cursor: "pointer" }}>
                      <div
                        style={{
                          aspectRatio: "1",
                          border: `2px dashed ${COLORS.border}`,
                          borderRadius: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: COLORS.bg,
                          fontSize: 20,
                          color: COLORS.muted,
                        }}
                      >
                        +
                      </div>
                    </label>
                  )}
                </div>
              ) : (
                <label
                  htmlFor="photo-upload"
                  style={{ cursor: "pointer", display: "block" }}
                >
                  <div
                    style={{
                      border: `2px dashed ${COLORS.border}`,
                      background: COLORS.bg,
                      borderRadius: 14,
                      padding: "24px 16px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📸</div>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: COLORS.text,
                        marginBottom: 4,
                      }}
                    >
                      Upload textbook photos
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: COLORS.muted,
                        marginBottom: 12,
                      }}
                    >
                      JPG, PNG or HEIC · Up to 8 photos
                    </p>
                    <div
                      style={{
                        display: "inline-block",
                        background: COLORS.accentLight,
                        color: COLORS.accent,
                        borderRadius: 8,
                        padding: "6px 16px",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      Choose photos
                    </div>
                  </div>
                </label>
              )}
              <input
                id="photo-upload"
                type="file"
                accept="image/jpeg,image/png,image/heic"
                multiple
                style={{ display: "none" }}
                onChange={handlePhotoChange}
              />
              {photos.length > 0 && (
                <p
                  style={{
                    fontSize: 11,
                    color: COLORS.muted,
                    textAlign: "center",
                    marginBottom: 4,
                  }}
                >
                  {photos.length}/8 photos · {8 - photos.length} remaining
                </p>
              )}
            </>
          )}

          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              What do you want?
            </p>
            {[
              {
                id: "notes",
                label: "Simplified Notes",
                desc: "Plain language breakdown",
                icon: "📝",
              },
              {
                id: "flowmap",
                label: "Flow Map",
                desc: "Visual concept diagram",
                icon: "🗺️",
              },
              {
                id: "both",
                label: "Both",
                desc: "Notes + Flow Map",
                icon: "✨",
              },
            ].map((opt) => (
              <div
                key={opt.id}
                onClick={() => setOutputMode(opt.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 10,
                  border: `1.5px solid ${outputMode === opt.id ? COLORS.accent : COLORS.border}`,
                  background:
                    outputMode === opt.id ? COLORS.accentLight : COLORS.white,
                  cursor: "pointer",
                  marginBottom: 7,
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 16 }}>{opt.icon}</span>
                <div>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      margin: 0,
                      color:
                        outputMode === opt.id ? COLORS.accent : COLORS.text,
                    }}
                  >
                    {opt.label}
                  </p>
                  <p style={{ fontSize: 11, margin: 0, color: COLORS.muted }}>
                    {opt.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={!canGenerate || loading}
            style={{
              width: "100%",
              marginTop: 14,
              background:
                canGenerate && !loading ? COLORS.accent : COLORS.border,
              color: COLORS.white,
              border: "none",
              borderRadius: 12,
              padding: "13px 0",
              fontSize: 14,
              fontWeight: 700,
              cursor: canGenerate && !loading ? "pointer" : "not-allowed",
            }}
          >
            {loading
              ? loadingMsg || "Processing..."
              : canGenerate
                ? "Generate ✨"
                : uploadMode === "pdf"
                  ? "Upload a PDF first"
                  : "Upload photos first"}
          </button>

          {loading && (
            <div style={{ marginTop: 10, textAlign: "center" }}>
              <div
                style={{
                  display: "inline-block",
                  width: 24,
                  height: 24,
                  border: `3px solid ${COLORS.accentLight}`,
                  borderTop: `3px solid ${COLORS.accent}`,
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          {error && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                borderRadius: 10,
                padding: "10px 14px",
                marginTop: 10,
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  color: "#DC2626",
                  margin: 0,
                  fontWeight: 600,
                }}
              >
                ⚠️ {error}
              </p>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div
          style={{
            background: COLORS.white,
            borderRadius: 20,
            padding: 24,
            boxShadow: "0 2px 16px rgba(37,99,235,0.07)",
            minHeight: 480,
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 20,
              background: COLORS.tabInactive,
              borderRadius: 10,
              padding: 4,
            }}
          >
            {[
              { id: "notes", label: "📝 Simplified Notes" },
              { id: "flowmap", label: "🗺️ Flow Map" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: 8,
                  border: "none",
                  background:
                    activeTab === tab.id ? COLORS.accent : "transparent",
                  color: activeTab === tab.id ? COLORS.white : COLORS.muted,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {stage === "upload" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 360,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 14 }}>
                {activeTab === "notes" ? "📝" : "🗺️"}
              </div>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: COLORS.text,
                  marginBottom: 6,
                }}
              >
                {activeTab === "notes"
                  ? "Your simplified notes will appear here"
                  : "Your flow map will appear here"}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: COLORS.muted,
                  maxWidth: 220,
                  lineHeight: 1.6,
                }}
              >
                Upload your material and click Generate to get started.
              </p>
            </div>
          )}

          {stage === "generated" && (
            <div style={{ position: "relative" }}>
              {activeTab === "notes" && notes && (
                <>
                  <NotesView notes={notes} locked={true} />
                  <PaywallOverlay />
                </>
              )}
              {activeTab === "flowmap" && (
                <>
                  <FlowMap data={flowData} locked={true} />
                  <PaywallOverlay />
                </>
              )}
              {activeTab === "notes" && !notes && outputMode === "flowmap" && (
                <div
                  style={{
                    textAlign: "center",
                    padding: 40,
                    color: COLORS.muted,
                    fontSize: 13,
                  }}
                >
                  Switch to Flow Map tab to see your results.
                </div>
              )}
              {activeTab === "flowmap" &&
                !flowData &&
                outputMode === "notes" && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 40,
                      color: COLORS.muted,
                      fontSize: 13,
                    }}
                  >
                    Switch to Notes tab to see your results.
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div
        id="how-it-works"
        style={{
          background: COLORS.white,
          borderTop: `1px solid ${COLORS.border}`,
          padding: "48px 20px",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
          How it works
        </h2>
        <p style={{ fontSize: 13, color: COLORS.muted, marginBottom: 36 }}>
          Upload. Generate. Study.
        </p>
        <div
          className="how-grid"
          style={{
            display: "flex",
            gap: 20,
            justifyContent: "center",
            maxWidth: 700,
            margin: "0 auto",
            flexWrap: "wrap",
          }}
        >
          {[
            {
              icon: "📤",
              title: "Upload PDF or photos",
              desc: "Drop in a PDF or snap up to 8 textbook photos — any subject, any grade",
            },
            {
              icon: "🎓",
              title: "Get your notes",
              desc: "Plain language notes and a visual flow map, ready to study",
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                flex: "1 1 200px",
                background: COLORS.bg,
                borderRadius: 16,
                padding: "24px 18px",
              }}
            >
              <div style={{ fontSize: 30, marginBottom: 10 }}>{item.icon}</div>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: COLORS.text,
                  marginBottom: 5,
                }}
              >
                {item.title}
              </p>
              <p style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.7 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* PRICING */}
      <div
        id="pricing"
        style={{
          padding: "48px 20px",
          textAlign: "center",
          maxWidth: 680,
          margin: "0 auto",
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
          Affordable pricing
        </h2>
        <p style={{ fontSize: 13, color: COLORS.muted, marginBottom: 36 }}>
          PDF or photos — same price. Pay per session or go unlimited.
        </p>
        <div
          className="pricing-grid"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}
        >
          {[
            {
              name: "Pay as you go",
              price: "R29",
              per: "per session",
              desc: "One PDF or up to 8 photos. Pay only when you need it.",
              features: [
                "Simplified notes",
                "Flow map",
                "Download as PDF",
                "PDF or photo upload",
              ],
              accent: false,
              plan: "session",
            },
            {
              name: "Unlimited",
              price: "R249",
              per: "per month",
              desc: "Unlimited sessions, all features included.",
              features: [
                "Unlimited sessions",
                "Notes + flow maps",
                "Download as PDF",
                "PDF and photo upload",
                "Priority processing",
              ],
              accent: true,
              plan: "unlimited",
            },
          ].map((plan) => (
            <div
              key={plan.name}
              style={{
                background: plan.accent ? COLORS.accent : COLORS.white,
                borderRadius: 20,
                padding: 24,
                textAlign: "left",
                boxShadow: plan.accent
                  ? "0 8px 32px rgba(37,99,235,0.25)"
                  : "0 2px 16px rgba(37,99,235,0.07)",
                border: plan.accent ? "none" : `1.5px solid ${COLORS.border}`,
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: plan.accent ? "rgba(255,255,255,0.7)" : COLORS.muted,
                  marginBottom: 4,
                }}
              >
                {plan.name}
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 4,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: plan.accent ? COLORS.white : COLORS.text,
                  }}
                >
                  {plan.price}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: plan.accent ? "rgba(255,255,255,0.7)" : COLORS.muted,
                    paddingBottom: 5,
                  }}
                >
                  {plan.per}
                </span>
              </div>
              <p
                style={{
                  fontSize: 11,
                  color: plan.accent ? "rgba(255,255,255,0.75)" : COLORS.muted,
                  marginBottom: 16,
                  lineHeight: 1.6,
                }}
              >
                {plan.desc}
              </p>
              {plan.features.map((f) => (
                <div
                  key={f}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    marginBottom: 7,
                  }}
                >
                  <span
                    style={{
                      color: plan.accent ? COLORS.white : COLORS.success,
                      fontSize: 12,
                    }}
                  >
                    ✓
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: plan.accent ? COLORS.white : COLORS.text,
                    }}
                  >
                    {f}
                  </span>
                </div>
              ))}
              <button
                onClick={async () => {
                  const res = await fetch("/api/payment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ plan: plan.plan }),
                  });
                  const data = await res.json();
                  if (data.paymentUrl) window.location.href = data.paymentUrl;
                }}
                style={{
                  width: "100%",
                  marginTop: 16,
                  background: plan.accent ? COLORS.white : COLORS.accent,
                  color: plan.accent ? COLORS.accent : COLORS.white,
                  border: "none",
                  borderRadius: 10,
                  padding: "11px 0",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {plan.accent ? "Go Unlimited" : "Pay per session"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div
        style={{
          background: COLORS.white,
          borderTop: `1px solid ${COLORS.border}`,
          padding: "20px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <span style={{ fontWeight: 800, fontSize: 15, color: COLORS.accent }}>
          Learn<span style={{ color: COLORS.text }}>Easily</span>
        </span>
        <span style={{ fontSize: 11, color: COLORS.muted }}>
          © 2026 LearnEasily · For every student, everywhere
        </span>
        <span style={{ fontSize: 11, color: COLORS.muted }}>
          🔐 Payments secured by PayFast
        </span>
      </div>
    </div>
  );
}
