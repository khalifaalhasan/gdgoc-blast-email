import React from "react";
import { Plus, Trash2 } from "lucide-react";

interface DriveLinkEntry {
  role: string;
  url: string;
}

interface DriveLinksProps {
  links: DriveLinkEntry[];
  onChange: (links: DriveLinkEntry[]) => void;
}

export function DriveLinksList({ links, onChange }: DriveLinksProps) {
  const handleAddLink = () => {
    onChange([...links, { role: "", url: "" }]);
  };

  const handleRemoveLink = (index: number) => {
    const newList = [...links];
    newList.splice(index, 1);
    onChange(newList);
  };

  const handleLinkChange = (index: number, field: keyof DriveLinkEntry, value: string) => {
    const newList = [...links];
    newList[index][field] = value;
    onChange(newList);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 10,
    fontSize: 14, outline: "none", color: "#0f172a", background: "transparent",
    transition: "all 0.2s ease-in-out",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8,
    textTransform: "uppercase", letterSpacing: "0.05em"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>Folder Google Drive (Per Role)</label>
        <button
          type="button"
          onClick={handleAddLink}
          style={{
            fontSize: 13, display: "flex", alignItems: "center", gap: 6, color: "#2563eb",
            fontWeight: 600, background: "#eff6ff", padding: "6px 12px", borderRadius: 20,
            border: "none", cursor: "pointer", transition: "background 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#dbeafe"}
          onMouseLeave={(e) => e.currentTarget.style.background = "#eff6ff"}
        >
          <Plus size={14} strokeWidth={3} /> Tambah Role
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {links.map((item, idx) => (
          <div key={idx} style={{
            display: "flex", gap: 12, alignItems: "center", background: "#fff",
            border: "1px solid #f1f5f9", padding: "10px 12px", borderRadius: 12,
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
          }}>
            <div style={{ width: "35%" }}>
              <input
                type="text"
                value={item.role}
                onChange={(e) => handleLinkChange(idx, "role", e.target.value)}
                placeholder="Nama Role (ex: Participant)"
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
                onBlur={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <input
                type="text"
                value={item.url}
                onChange={(e) => handleLinkChange(idx, "url", e.target.value)}
                placeholder="Link Folder Google Drive"
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)"; }}
                onBlur={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
            <button
              type="button"
              onClick={() => handleRemoveLink(idx)}
              style={{
                color: "#94a3b8", background: "none", border: "none", cursor: "pointer",
                padding: 10, borderRadius: 8, transition: "all 0.2s"
              }}
              title="Hapus baris"
              onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#ef4444"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
