import { useState } from "react";
import { Play, AlertCircle } from "lucide-react";
import { CsvUploader } from "./CsvUploader";
import { DriveLinksList } from "./DriveLinksList";
import { EmailEditor } from "./EmailEditor";



interface DriveLinkEntry {
  role: string;
  url: string;
}

interface CampaignFormProps {
  onSubmit: (formData: FormData) => void;
  isLoading: boolean;
  error: string | null;
  taskId: string | null;
  subject: string;
  setSubject: (v: string) => void;
  body: string;
  setBody: (v: string) => void;
  themeColor: string;
  setThemeColor: (v: string) => void;
  driveLinksList: DriveLinkEntry[];
  setDriveLinksList: (v: DriveLinkEntry[]) => void;
  file: File | null;
  setFile: (v: File | null) => void;
  csvPreview: { headers: string[]; rows: any[] } | null;
  setCsvPreview: (v: { headers: string[]; rows: any[] } | null) => void;
}

export function CampaignForm({
  onSubmit,
  isLoading,
  error,
  taskId,
  subject,
  setSubject,
  body,
  setBody,
  themeColor,
  setThemeColor,
  driveLinksList,
  setDriveLinksList,
  file,
  setFile,
  csvPreview,
  setCsvPreview
}: CampaignFormProps) {
  const [localError, setLocalError] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvPreview || csvPreview.rows.length === 0) {
      setLocalError("Silakan upload file CSV terlebih dahulu.");
      return;
    }

    const jsonMapping = driveLinksList.reduce((acc, curr) => {
      if (curr.role.trim() !== "" && curr.url.trim() !== "") {
        acc[curr.role.trim()] = curr.url.trim();
      }
      return acc;
    }, {} as Record<string, string>);

    if (Object.keys(jsonMapping).length === 0) {
      setLocalError("Minimal isi 1 role dan link folder Drive-nya.");
      return;
    }

    setLocalError("");

    // Strip internal fields before sending
    const cleanRows = csvPreview.rows.map(row => {
      const copy = { ...row };
      delete copy['_error_reason'];
      return copy;
    });

    const formData = new FormData();
    formData.append("rows_json", JSON.stringify(cleanRows));
    formData.append("drive_links_json", JSON.stringify(jsonMapping));
    formData.append("subject_template", subject);

    // Fetch social links from env
    const linkInstagram = import.meta.env.VITE_LINK_INSTAGRAM || "https://www.instagram.com/gdgunsri/";
    const linkWebsite = import.meta.env.VITE_LINK_WEBSITE || "https://linktr.ee/gdgunsri";
    const linkLinkedin = import.meta.env.VITE_LINK_LINKEDIN || "https://www.linkedin.com/company/gdgunsri/";
    const linkTiktok = import.meta.env.VITE_LINK_TIKTOK || "https://www.tiktok.com/@gdgunsri";

    // Build the full HTML template wrapping the user's body
    const fullHtmlBody = `
<div style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    <div style="width: 100%; height: 140px; background-color: #f4f4f5; border-bottom: 1px solid #e4e4e7;">
      <img src="${window.location.origin}/assets/${themeColor}/header.png" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="Email Header">
    </div>
    <div style="padding: 40px; color: #27272a; font-size: 15px; line-height: 1.6;">
      ${body}
    </div>
    <div style="background-color: #fafafa; padding: 40px; text-align: center; border-top: 1px solid #e4e4e7;">
      <img src="${window.location.origin}/assets/${themeColor}/icon.png" style="height: 40px; margin-bottom: 20px; display: inline-block;" alt="GDGoC Logo">
      <h3 style="margin: 0; font-size: 16px; color: #18181b;">Google Developer Groups on Campus</h3>
      <p style="margin: 4px 0 24px 0; font-size: 14px; color: #71717a;">Universitas Sriwijaya</p>
      <div style="font-size: 13px;">
        <a href="${linkInstagram}" style="color: #3b82f6; text-decoration: none; margin: 0 8px;">Instagram</a>
        <span style="color: #d4d4d8;">|</span>
        <a href="${linkWebsite}" style="color: #3b82f6; text-decoration: none; margin: 0 8px;">Website</a>
        <span style="color: #d4d4d8;">|</span>
        <a href="${linkLinkedin}" style="color: #3b82f6; text-decoration: none; margin: 0 8px;">LinkedIn</a>
        <span style="color: #d4d4d8;">|</span>
        <a href="${linkTiktok}" style="color: #3b82f6; text-decoration: none; margin: 0 8px;">TikTok</a>
      </div>
    </div>
  </div>
</div>`;

    formData.append("body_template", fullHtmlBody);

    onSubmit(formData);
  };

  const displayError = localError || error;

  return (
    <form onSubmit={handleSubmit} style={{ background: "#fff", borderRadius: 20, border: "1px solid #f1f5f9", padding: 32, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)" }}>
      
      {/* Editor Section */}
      <EmailEditor 
        subject={subject} 
        setSubject={setSubject} 
        body={body} 
        setBody={setBody} 
        themeColor={themeColor}
        setThemeColor={setThemeColor}
      />

      {/* Drive Links Section */}
      <div style={{ marginTop: 36, paddingTop: 36, borderTop: "1px dashed #e2e8f0" }}>
        <DriveLinksList links={driveLinksList} onChange={setDriveLinksList} />
      </div>

      {/* CSV Upload Section */}
      <div style={{ marginTop: 36, paddingTop: 36, borderTop: "1px dashed #e2e8f0" }}>
        <CsvUploader file={file} setFile={setFile} csvPreview={csvPreview} setCsvPreview={setCsvPreview} />
      </div>

      {/* Error Display */}
      {displayError && (
        <div style={{ marginTop: 36, padding: "16px 20px", background: "#fef2f2", borderLeft: "4px solid #ef4444", color: "#b91c1c", borderRadius: 8, fontSize: 14, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 2px rgba(239, 68, 68, 0.05)" }}>
          <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
          <p style={{ fontWeight: 500 }}>{displayError}</p>
        </div>
      )}

      {/* Submit Button */}
      <div style={{ marginTop: 36, paddingTop: 24, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
        <button
          type="submit"
          disabled={isLoading || !!taskId}
          style={{
            display: "flex", alignItems: "center", gap: 10, 
            background: isLoading || taskId ? "#94a3b8" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
            color: "#fff", padding: "14px 36px", borderRadius: 30, fontWeight: 600, fontSize: 15,
            border: "none", cursor: isLoading || taskId ? "not-allowed" : "pointer", 
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", 
            boxShadow: isLoading || taskId ? "none" : "0 4px 12px rgba(37, 99, 235, 0.3)",
          }}
          onMouseEnter={(e) => { 
            if (!isLoading && !taskId) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(37, 99, 235, 0.4)";
            }
          }}
          onMouseLeave={(e) => { 
            if (!isLoading && !taskId) {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.3)";
            }
          }}
        >
          <Play size={18} fill="currentColor" />
          {isLoading ? "Memproses..." : "Kirim Sekarang"}
        </button>
      </div>
    </form>
  );
}
