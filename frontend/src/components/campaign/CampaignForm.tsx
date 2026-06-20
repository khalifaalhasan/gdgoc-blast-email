import { useState, useEffect } from "react";
import { Play, Loader2, CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";
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
  setDriveLinksList: (links: DriveLinkEntry[]) => void;
  setFile: (file: File | null) => void;
  suratFile: File | null;
  setSuratFile: (file: File | null) => void;
  csvPreview: { headers: string[]; rows: any[] } | null;
  setCsvPreview: (v: { headers: string[]; rows: any[] } | null) => void;
  campaignType: 'sertifikat' | 'surat';
  setCampaignType: (v: 'sertifikat' | 'surat') => void;
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
  setFile,
  suratFile,
  setSuratFile,
  csvPreview,
  setCsvPreview,
  campaignType,
  setCampaignType
}: CampaignFormProps) {

  const [activeStep, setActiveStep] = useState<number>(1);
  const [testEmail, setTestEmail] = useState<string>("");
  const [isTesting, setIsTesting] = useState<boolean>(false);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvPreview || csvPreview.rows.length === 0) {
      toast.error("Silakan upload file CSV terlebih dahulu.");
      return;
    }

    if (campaignType === 'surat' && !suratFile) {
      toast.error("Harap upload dokumen Surat (PDF) terlebih dahulu.");
      return;
    }

    const jsonMapping = campaignType === 'sertifikat' ? driveLinksList.reduce((acc, curr) => {
      if (curr.role.trim() !== "" && curr.url.trim() !== "") {
        acc[curr.role.trim()] = curr.url.trim();
      }
      return acc;
    }, {} as Record<string, string>) : {};

    if (campaignType === 'sertifikat' && Object.keys(jsonMapping).length === 0) {
      toast.error("Minimal isi 1 role dan link folder Drive-nya untuk opsi Sertifikat.");
      return;
    }

    // Strip internal fields before sending and trim string values
    const cleanRows = csvPreview.rows.map(row => {
      const copy: Record<string, any> = {};
      Object.keys(row).forEach(k => {
        if (k !== '_error_reason') {
          copy[k] = typeof row[k] === 'string' ? row[k].trim() : row[k];
        }
      });
      return copy;
    });

    const formData = new FormData();
    formData.append("rows_json", JSON.stringify(cleanRows));
    formData.append("drive_links_json", JSON.stringify(jsonMapping));
    formData.append("subject_template", subject);

    // Fetch social links from env
    const linkInstagram = import.meta.env.VITE_LINK_INSTAGRAM || "https://www.instagram.com/gdgunsri/";
    const linkWebsite = import.meta.env.VITE_LINK_WEBSITE || "https://linktr.ee/gdgunsri";
    const linkLinkedin = import.meta.env.VITE_LINK_LINKEDIN || "https://www.linkedin.com/company/gdsc-unsri/";
    const emailAssetBaseUrl = import.meta.env.VITE_EMAIL_ASSET_BASE_URL || "https://gdgoc-boilerplate-blast-email.vercel.app/assets";

    const enhancedBody = `
<div style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    <div style="width: 100%; background-color: #f4f4f5; border-bottom: 1px solid #e4e4e7;">
      <img src="${emailAssetBaseUrl}/${themeColor}/header.png" style="width: 100%; height: auto; display: block;" alt="Email Header">
    </div>
    <div style="padding: 40px; color: #27272a; font-size: 15px; line-height: 1.6;">
      ${body}
    </div>
    <div style="background-color: #fafafa; padding: 40px; text-align: center; border-top: 1px solid #e4e4e7;">
      <img src="${emailAssetBaseUrl}/${themeColor}/icon.png" style="height: 40px; margin-bottom: 20px; display: inline-block;" alt="GDGoC Logo">
      <h3 style="margin: 0; font-size: 16px; color: #18181b;">Google Developer Groups on Campus</h3>
      <p style="margin: 4px 0 24px 0; font-size: 14px; color: #71717a;">Universitas Sriwijaya</p>
      <div style="font-size: 13px;">
        <a href="${linkInstagram}" style="color: #3b82f6; text-decoration: none; margin: 0 8px; display: inline-flex; align-items: center;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>Instagram</a>
        <span style="color: #d4d4d8;">·</span>
        <a href="${linkWebsite}" style="color: #3b82f6; text-decoration: none; margin: 0 8px; display: inline-flex; align-items: center;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>Website</a>
        <span style="color: #d4d4d8;">·</span>
        <a href="${linkLinkedin}" style="color: #3b82f6; text-decoration: none; margin: 0 8px; display: inline-flex; align-items: center;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>LinkedIn</a>
      </div>
    </div>
  </div>
</div>`;

    formData.append("body_template", enhancedBody);
    formData.append("campaign_type", campaignType);
    if (campaignType === 'surat' && suratFile) {
      formData.append("surat_file", suratFile);
    }

    onSubmit(formData);
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error("Masukkan alamat email tujuan test.");
      return;
    }
    setIsTesting(true);
    
    try {
      const emailAssetBaseUrl = import.meta.env.VITE_EMAIL_ASSET_BASE_URL || "https://gdgoc-boilerplate-blast-email.vercel.app/assets";
      const linkInstagram = import.meta.env.VITE_LINK_INSTAGRAM || "https://www.instagram.com/gdgunsri/";
      const linkWebsite = import.meta.env.VITE_LINK_WEBSITE || "https://linktr.ee/gdgunsri";
      const linkLinkedin = import.meta.env.VITE_LINK_LINKEDIN || "https://www.linkedin.com/company/gdsc-unsri/";
      
      const enhancedBody = `
<div style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    <div style="width: 100%; background-color: #f4f4f5; border-bottom: 1px solid #e4e4e7;">
      <img src="${emailAssetBaseUrl}/${themeColor}/header.png" style="width: 100%; height: auto; display: block;" alt="Email Header">
    </div>
    <div style="padding: 40px; color: #27272a; font-size: 15px; line-height: 1.6;">
      ${body}
    </div>
    <div style="background-color: #fafafa; padding: 40px; text-align: center; border-top: 1px solid #e4e4e7;">
      <img src="${emailAssetBaseUrl}/${themeColor}/icon.png" style="height: 40px; margin-bottom: 20px; display: inline-block;" alt="GDGoC Logo">
      <h3 style="margin: 0; font-size: 16px; color: #18181b;">Google Developer Groups on Campus</h3>
      <p style="margin: 4px 0 24px 0; font-size: 14px; color: #71717a;">Universitas Sriwijaya</p>
      <div style="font-size: 13px;">
        <a href="${linkInstagram}" style="color: #3b82f6; text-decoration: none; margin: 0 8px; display: inline-flex; align-items: center;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>Instagram</a>
        <span style="color: #d4d4d8;">·</span>
        <a href="${linkWebsite}" style="color: #3b82f6; text-decoration: none; margin: 0 8px; display: inline-flex; align-items: center;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>Website</a>
        <span style="color: #d4d4d8;">·</span>
        <a href="${linkLinkedin}" style="color: #3b82f6; text-decoration: none; margin: 0 8px; display: inline-flex; align-items: center;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>LinkedIn</a>
      </div>
    </div>
  </div>
</div>`;

      const formData = new FormData();
      formData.append("test_email", testEmail);
      formData.append("subject_template", subject);
      formData.append("body_template", enhancedBody);

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${API_URL}/campaign/test-email`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Gagal mengirim test email");
      }
      
      toast.success("Test email berhasil dikirim!");
    } catch (err: any) {
      toast.error(err.message || "Gagal mengirim test email");
    } finally {
      setIsTesting(false);
    }
  };

  const steps = [
    { id: 1, title: "Jenis & Tema" },
    { id: 2, title: "Konten" },
    { id: 3, title: "Testing" },
    { id: 4, title: campaignType === 'sertifikat' ? "Sertifikat" : "Upload Surat" },
    { id: 5, title: "Dataset & Kirim" }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Timeline Header */}
      <div className="lt-card p-4 sm:p-6 mb-2">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-[color:var(--lt-border)] z-0 rounded-full"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[color:var(--lt-primary)] z-0 rounded-full transition-all duration-500" style={{ width: `${((activeStep - 1) / (steps.length - 1)) * 100}%` }}></div>
          
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center gap-2 bg-[color:var(--lt-card)] px-2 z-10">
              <button
                type="button"
                onClick={() => setActiveStep(step.id)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-[3px] ${
                  activeStep === step.id 
                    ? "bg-[color:var(--lt-primary)] text-white border-[color:var(--lt-card)] ring-4 ring-[color:var(--lt-primary)]/20"
                    : activeStep > step.id
                      ? "bg-[color:var(--lt-primary)] text-white border-[color:var(--lt-card)]"
                      : "bg-[color:var(--lt-bg)] text-[color:var(--lt-text-secondary)] border-[color:var(--lt-card)]"
                }`}
              >
                {activeStep > step.id ? <CheckCircle2 className="w-5 h-5" /> : step.id}
              </button>
              <span className={`text-xs font-semibold hidden sm:block ${activeStep >= step.id ? 'text-[color:var(--lt-text-primary)]' : 'text-[color:var(--lt-text-secondary)]'}`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Step 1: Pilih Tema */}
        {activeStep === 1 && (
          <div className="lt-card p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-[color:var(--lt-text-primary)] mb-6">Jenis Campaign & Tema</h2>
            
            <div className="mb-8">
              <label className="block text-sm font-bold text-[color:var(--lt-text-primary)] mb-3">Pilih Jenis Lampiran Campaign</label>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => setCampaignType('sertifikat')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 text-left ${campaignType === 'sertifikat' ? 'border-[color:var(--lt-primary)] bg-[color:var(--lt-primary)]/10 ring-4 ring-[color:var(--lt-primary)]/20' : 'border-[color:var(--lt-border)] bg-[color:var(--lt-bg)] text-[color:var(--lt-text-secondary)] hover:border-[color:var(--lt-primary)]/50'}`}
                >
                  <div className="font-bold text-[color:var(--lt-text-primary)] mb-1">🎓 E-Certificate</div>
                  <span className="text-sm">Kirim sertifikat berbeda untuk setiap nama/role via Google Drive.</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCampaignType('surat')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 text-left ${campaignType === 'surat' ? 'border-[color:var(--lt-primary)] bg-[color:var(--lt-primary)]/10 ring-4 ring-[color:var(--lt-primary)]/20' : 'border-[color:var(--lt-border)] bg-[color:var(--lt-bg)] text-[color:var(--lt-text-secondary)] hover:border-[color:var(--lt-primary)]/50'}`}
                >
                  <div className="font-bold text-[color:var(--lt-text-primary)] mb-1">📄 Surat (Satu File)</div>
                  <span className="text-sm">Kirim lampiran 1 file PDF yang sama ke semua penerima.</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[color:var(--lt-text-primary)] mb-3">Pilih Warna Tema Email</label>
              <div className="flex gap-4">
                {["blue", "green", "pink", "yellow"].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setThemeColor(color)}
                    className="w-12 h-12 rounded-full cursor-pointer transition-transform duration-200"
                    style={{
                      background: color === "blue" ? "#3b82f6" : color === "green" ? "#22c55e" : color === "pink" ? "#ec4899" : "#eab308",
                      boxShadow: themeColor === color ? `0 0 0 4px var(--lt-bg), 0 0 0 6px ${color === "blue" ? "#3b82f6" : color === "green" ? "#22c55e" : color === "pink" ? "#ec4899" : "#eab308"}` : "none",
                      transform: themeColor === color ? "scale(1.1)" : "scale(1)",
                    }}
                    title={`Tema ${color}`}
                  />
                ))}
              </div>

              {/* Theme Preview */}
              <div className="mt-8 p-4 rounded-xl border border-[color:var(--lt-border)] bg-[color:var(--lt-bg)]">
                <p className="text-sm font-semibold text-[color:var(--lt-text-secondary)] mb-3">Preview Aset Tema</p>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Header */}
                  <div 
                    className="flex-1 w-full max-w-md rounded-lg overflow-hidden shadow-sm"
                    style={{ backgroundColor: themeColor === 'blue' ? '#3b82f6' : themeColor === 'green' ? '#22c55e' : themeColor === 'pink' ? '#ec4899' : '#eab308' }}
                  >
                    <img 
                      src={`${import.meta.env.VITE_EMAIL_ASSET_BASE_URL || 'https://gdgoc-boilerplate-blast-email.vercel.app/assets'}/${themeColor}/header.png`} 
                      alt={`Header ${themeColor}`} 
                      className="w-full h-auto object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  
                  {/* Icons */}
                  <div className="flex sm:flex-col justify-center items-center gap-4">
                    <p className="hidden sm:block text-xs font-semibold text-[color:var(--lt-text-secondary)] mb-1 text-center">Ikon GDG & Footer</p>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-2">
                      <img 
                        src={`${import.meta.env.VITE_EMAIL_ASSET_BASE_URL || 'https://gdgoc-boilerplate-blast-email.vercel.app/assets'}/${themeColor}/icon.png`} 
                        alt="GDGoC Logo"
                        className="h-10 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end pt-6 border-t border-[color:var(--lt-border)]">
              <button type="button" onClick={() => setActiveStep(2)} className="lt-btn-primary">Lanjut ke Konten</button>
            </div>
          </div>
        )}

        {/* Step 2: Konten Email */}
        {activeStep === 2 && (
          <div className="lt-card p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-[color:var(--lt-text-primary)] mb-6">Konten Email & Preview</h2>
            <EmailEditor 
              subject={subject} 
              setSubject={setSubject} 
              body={body} 
              setBody={setBody} 
            />
            <div className="mt-8 flex justify-between pt-6 border-t border-[color:var(--lt-border)]">
              <button type="button" onClick={() => setActiveStep(1)} className="lt-btn-secondary">Kembali</button>
              <button type="button" onClick={() => setActiveStep(3)} className="lt-btn-primary">Lanjut ke Testing</button>
            </div>
          </div>
        )}

        {/* Step 3: Testing Email */}
        {activeStep === 3 && (
          <div className="lt-card p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-[color:var(--lt-text-primary)] mb-6">Testing Email (Opsional)</h2>
            <div className="flex flex-col gap-4 max-w-xl">
              <p className="text-sm text-[color:var(--lt-text-secondary)]">Kirim email ujicoba ke email kamu sendiri sebelum blast ke banyak orang. Pastikan desain terlihat rapi.</p>
              <div className="flex items-center gap-3">
                <input 
                  type="email" 
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Masukkan email kamu..." 
                  className="lt-input flex-1"
                />
                <button
                  type="button"
                  disabled={isTesting || !testEmail}
                  onClick={handleTestEmail}
                  className="lt-btn-secondary whitespace-nowrap"
                >
                  {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Kirim Test
                </button>
              </div>
            </div>
            <div className="mt-8 flex justify-between pt-6 border-t border-[color:var(--lt-border)]">
              <button type="button" onClick={() => setActiveStep(2)} className="lt-btn-secondary">Kembali</button>
              <button type="button" onClick={() => setActiveStep(4)} className="lt-btn-primary">Lanjut ke Sertifikat</button>
            </div>
          </div>
        )}

        {/* Step 4: Lampiran Sertifikat / Surat */}
        {activeStep === 4 && (
          <div className="lt-card p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {campaignType === 'sertifikat' ? (
              <>
                <h2 className="text-xl font-bold text-[color:var(--lt-text-primary)] mb-6">Lampiran Sertifikat (Opsional)</h2>
                <DriveLinksList links={driveLinksList} onChange={setDriveLinksList} />
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-[color:var(--lt-text-primary)] mb-6">Upload File Surat (Opsional)</h2>
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-[color:var(--lt-text-secondary)]">Silakan unggah 1 file PDF yang akan dilampirkan ke semua penerima email.</p>
                  <label className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${suratFile ? 'border-[color:var(--lt-primary)] bg-[color:var(--lt-primary)]/10' : 'border-[color:var(--lt-border)] hover:border-[color:var(--lt-primary)]/50 bg-[color:var(--lt-bg)]'}`}>
                    <input type="file" accept="application/pdf" className="hidden" onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSuratFile(e.target.files[0]);
                      }
                    }} />
                    {suratFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-10 h-10 text-[color:var(--lt-primary)]" />
                        <span className="font-bold text-[color:var(--lt-text-primary)]">{suratFile.name}</span>
                        <span className="text-xs text-[color:var(--lt-text-secondary)] mt-1">Klik untuk mengganti file</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-[color:var(--lt-border)] rounded-full flex items-center justify-center mb-2">
                          <span className="text-2xl">📄</span>
                        </div>
                        <span className="font-bold text-[color:var(--lt-text-primary)]">Pilih atau Drag file PDF ke sini</span>
                        <span className="text-xs text-[color:var(--lt-text-secondary)] mt-1">Maks 5MB</span>
                      </div>
                    )}
                  </label>
                  {suratFile && (
                    <button type="button" onClick={() => setSuratFile(null)} className="text-xs text-red-500 font-semibold self-center mt-2 hover:underline">Hapus Surat</button>
                  )}
                </div>
              </>
            )}
            <div className="mt-8 flex justify-between pt-6 border-t border-[color:var(--lt-border)]">
              <button type="button" onClick={() => setActiveStep(3)} className="lt-btn-secondary">Kembali</button>
              <button type="button" onClick={() => setActiveStep(5)} className="lt-btn-primary">Lanjut ke Dataset</button>
            </div>
          </div>
        )}

        {/* Step 5: Dataset & Kirim */}
        {activeStep === 5 && (
          <div className="lt-card p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-[color:var(--lt-text-primary)] mb-6">Dataset CSV & Mulai Blast</h2>
            <CsvUploader
              setFile={setFile}
              csvPreview={csvPreview}
              setCsvPreview={setCsvPreview}
              campaignType={campaignType}
            />
            <div className="mt-8 pt-6 border-t border-[color:var(--lt-border)] flex flex-col sm:flex-row justify-between items-center gap-4">
              <button type="button" onClick={() => setActiveStep(4)} className="lt-btn-secondary w-full sm:w-auto">Kembali</button>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <p className="text-sm text-[color:var(--lt-text-secondary)] text-center sm:text-right hidden md:block">
                  Pastikan seluruh data sudah benar<br/>sebelum memulai blast.
                </p>
                <button
                  type="submit"
                  disabled={isLoading || !!taskId}
                  className="lt-btn-primary !px-8 !py-3 w-full sm:w-auto"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Play className="w-5 h-5 fill-current" />
                  )}
                  {isLoading ? "Memproses..." : "Mulai Blast Sekarang"}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
