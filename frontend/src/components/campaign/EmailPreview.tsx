import { Mail, Star, Reply, MoreVertical } from "lucide-react";

interface EmailPreviewProps {
  subject: string;
  body: string;
  themeColor: string;
}

export function EmailPreview({ subject, body, themeColor }: EmailPreviewProps) {
  const currentSubject = subject || "(Tidak ada subjek)";
  const currentBody = body || "<p>Isi email kosong...</p>";

  const headerSrc = `/assets/${themeColor}/header.png`;
  const iconSrc = `/assets/${themeColor}/icon.png`;

  // Fetch social links from env
  const linkInstagram =
    import.meta.env.VITE_LINK_INSTAGRAM ||
    "https://www.instagram.com/gdgunsri/";
  const linkWebsite =
    import.meta.env.VITE_LINK_WEBSITE || "https://linktr.ee/gdgunsri";
  const linkLinkedin =
    import.meta.env.VITE_LINK_LINKEDIN ||
    "https://www.linkedin.com/company/gdgunsri/";
  const linkTiktok =
    import.meta.env.VITE_LINK_TIKTOK || "https://www.tiktok.com/@gdgunsri";

  return (
    <aside
      style={{
        width: "100%",
        height: "100%",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      {/* Inbox Header */}
      <div
        style={{
          borderBottom: "1px solid #e2e8f0",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          position: "sticky",
          top: 0,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(8px)",
          zIndex: 10,
        }}
      >
        <Mail size={18} color="#64748b" />
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
          Preview Tampilan Email
        </h2>
      </div>

      <div style={{ padding: 24, flex: 1 }}>
        {/* Subject */}
        <h1
          style={{
            fontSize: 22,
            fontWeight: 400,
            color: "#0f172a",
            lineHeight: 1.4,
            marginBottom: 24,
          }}
        >
          {currentSubject}
        </h1>

        {/* Sender Info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              overflow: "hidden",
              border: "1px solid #e2e8f0",
              background: "#f1f5f9",
              flexShrink: 0,
            }}
          >
            <img
              src={iconSrc}
              alt="Avatar"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                padding: 4,
              }}
              onError={(e) => (e.currentTarget.src = "/assets/icon.png")}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}
                >
                  GDG on Campus UNSRI
                </span>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  &lt;dscunsri@gmail.com&gt;
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#94a3b8",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 11 }}>10:00 AM</span>
                <Star size={16} style={{ cursor: "pointer" }} />
                <Reply size={16} style={{ cursor: "pointer" }} />
                <MoreVertical size={16} style={{ cursor: "pointer" }} />
              </div>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#64748b",
                marginTop: 2,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span>kepada saya</span>
              <span
                style={{
                  fontSize: 10,
                  background: "#f1f5f9",
                  padding: "1px 4px",
                  borderRadius: 3,
                  border: "1px solid #e2e8f0",
                  cursor: "pointer",
                }}
              >
                ▼
              </span>
            </div>
          </div>
        </div>

        {/* Email Content */}
        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgb(0 0 0 / 0.1)",
          }}
        >
          {/* Header Banner */}
          <div
            style={{
              width: "100%",
              background: "#f1f5f9",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <img
              src={headerSrc}
              alt="Email Banner"
              style={{ width: "100%", height: "auto", display: "block" }}
              onError={(e) => (e.currentTarget.src = "/assets/header.png")}
            />
          </div>

          {/* Body */}
          <div
            className="prose"
            style={{
              padding: 32,
              color: "#1e293b",
              fontSize: 14,
              lineHeight: 1.75,
            }}
            dangerouslySetInnerHTML={{ __html: currentBody }}
          />

          {/* Footer */}
          <div
            style={{
              background: "#f8f9fa",
              padding: "40px 32px",
              borderTop: "1px solid #e2e8f0",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <img
              src={iconSrc}
              alt="GDGoC Logo"
              style={{
                width: 64,
                height: 32,
                objectFit: "contain",
                marginBottom: 16,
              }}
              onError={(e) => (e.currentTarget.src = "/assets/icon.png")}
            />
            <h3
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: 4,
              }}
            >
              Google Developer Groups on Campus
            </h3>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>
              Universitas Sriwijaya
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              <a
                href={linkInstagram}
                style={{ color: "#4285F4", textDecoration: "none" }}
              >
                Instagram
              </a>
              <span style={{ color: "#cbd5e1" }}>•</span>
              <a
                href={linkWebsite}
                style={{ color: "#4285F4", textDecoration: "none" }}
              >
                Website
              </a>
              <span style={{ color: "#cbd5e1" }}>•</span>
              <a
                href={linkLinkedin}
                style={{ color: "#4285F4", textDecoration: "none" }}
              >
                LinkedIn
              </a>
              <span style={{ color: "#cbd5e1" }}>•</span>
              <a
                href={linkTiktok}
                style={{ color: "#4285F4", textDecoration: "none" }}
              >
                TikTok
              </a>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
