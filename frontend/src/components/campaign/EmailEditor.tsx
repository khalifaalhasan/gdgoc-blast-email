import React from "react";
import { DefaultEditor } from "react-simple-wysiwyg";

interface EmailEditorProps {
  subject: string;
  setSubject: (v: string) => void;
  body: string;
  setBody: (v: string) => void;
  themeColor: string;
  setThemeColor: (v: string) => void;
}

export function EmailEditor({ subject, setSubject, body, setBody, themeColor, setThemeColor }: EmailEditorProps) {
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 16px", border: "1px solid transparent", borderRadius: 10,
    fontSize: 14, outline: "none", color: "#0f172a", background: "#f8fafc",
    transition: "all 0.2s ease-in-out",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8,
    textTransform: "uppercase", letterSpacing: "0.05em"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div>
        <label style={labelStyle}>Tema Warna Email</label>
        <div style={{ display: "flex", gap: 12 }}>
          {["blue", "green", "pink", "yellow"].map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setThemeColor(color)}
              style={{
                width: 32, height: 32, borderRadius: "50%", cursor: "pointer", border: "none",
                background: color === "blue" ? "#3b82f6" : color === "green" ? "#22c55e" : color === "pink" ? "#ec4899" : "#eab308",
                boxShadow: themeColor === color ? `0 0 0 3px #fff, 0 0 0 5px ${color === "blue" ? "#3b82f6" : color === "green" ? "#22c55e" : color === "pink" ? "#ec4899" : "#eab308"}` : "none",
                transform: themeColor === color ? "scale(1.1)" : "scale(1)",
                transition: "all 0.2s"
              }}
              title={`Template ${color}`}
            />
          ))}
        </div>
        <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 10 }}>
          Pilih warna untuk *header* dan ikon (*pastikan file di public/assets/[warna]/ sudah siap*).
        </p>
      </div>

      <div>
        <label style={labelStyle}>Subject Email</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          style={inputStyle}
          placeholder="Tulis subject email yang menarik..."
          onFocus={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(59,130,246,0.1)"; }}
          onBlur={(e) => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.boxShadow = "none"; }}
        />
        <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 10 }}>
          💡 Variabel cerdas: <code style={{ color: "#3b82f6", fontWeight: 600 }}>{"{{nama}}"}</code> untuk nama peserta, <code style={{ color: "#3b82f6", fontWeight: 600 }}>{"{{role}}"}</code> untuk peran.
        </p>
      </div>

      <div>
        <label style={labelStyle}>Isi Email (Body)</label>
        <div style={{ color: "#0f172a", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", transition: "border-color 0.2s" }}
             onFocus={(e) => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(59,130,246,0.1)"; }}
             onBlur={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}>
          <DefaultEditor value={body} onChange={(e: any) => setBody(e.target.value)} />
        </div>
      </div>
    </div>
  );
}
