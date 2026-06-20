import { useState, useEffect, useCallback, useRef } from 'react';
import Papa from 'papaparse';

interface DriveLinkEntry {
  role: string;
  url: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export function useFormPersist(campaignId: string) {
  const [isLoaded, setIsLoaded] = useState(false);

  // States
  const [subject, setSubject] = useState("[Certificate of Appreciation] Secure Computer User");
  const [themeColor, setThemeColor] = useState("blue");
  const [body, setBody] = useState(`<p>Hi {{nama}} ✨</p>
<p>Thank you for being a part of <strong>GDGoC UNSRI InspireHer 2026</strong>. We truly appreciate your contribution and dedication as a <strong>{{role}}</strong> during the event.</p>
<p>In recognition of your hard work and contribution to empowering women in tech, we are pleased to present your official <strong>E-Certificate</strong>. You earned it! 🏆</p>
<p>Your certificate is attached to this email as a file below.</p>
<p>We hope this experience has helped you grow as a developer and provided valuable connections. We look forward to seeing what you build next! 🚀</p>
<p>Best regards,<br><strong>The GDGoC UNSRI 2026 Organizing Team</strong></p>`);

  const [driveLinksList, setDriveLinksList] = useState<DriveLinkEntry[]>([
    { role: "Participant", url: "" },
    { role: "Committee", url: "" },
  ]);

  const [file, setFile] = useState<File | null>(null);
  const [suratFile, setSuratFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<{ headers: string[]; rows: any[] } | null>(null);
  const [campaignType, setCampaignType] = useState<'sertifikat' | 'surat'>(() => {
    return (localStorage.getItem(`campaignType_${campaignId}`) as 'sertifikat' | 'surat') || 'sertifikat';
  });

  useEffect(() => {
    if (campaignId) {
      localStorage.setItem(`campaignType_${campaignId}`, campaignType);
    }
  }, [campaignType, campaignId]);

  const initialLoadRef = useRef(false);

  const handleParse = (selectedFile: File) => {
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const headers = Object.keys(results.data[0] as object);
          setCsvPreview({ headers, rows: results.data });
        } else {
          setCsvPreview(null);
        }
      },
    });
  };

  useEffect(() => {
    async function loadData() {
      setIsLoaded(false);
      try {
        const res = await fetch(`${API_URL}/campaigns/${campaignId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.subject_template) setSubject(data.subject_template);
          if (data.theme_color) setThemeColor(data.theme_color);
          if (data.body_template) setBody(data.body_template);
          
          if (data.drive_links) {
            const links = Object.keys(data.drive_links).map(role => ({
              role,
              url: data.drive_links[role]
            }));
            if (links.length > 0) {
              setDriveLinksList(links);
            }
          }
          
          if (data.csv_data && data.csv_data.length > 0) {
            const headers = Object.keys(data.csv_data[0] as object);
            setCsvPreview({ headers, rows: data.csv_data });
          } else {
            setCsvPreview(null);
          }
        }
      } catch (err) {
        console.error("Gagal memuat data dari API:", err);
      } finally {
        setIsLoaded(true);
        initialLoadRef.current = true;
      }
    }
    if (campaignId) {
      loadData();
    }
  }, [campaignId]);

  // Autosave
  const saveToApi = useCallback(async () => {
    if (!campaignId) return;
    
    const drive_links: Record<string, string> = {};
    driveLinksList.forEach(l => {
      if (l.role.trim() && l.url.trim()) {
        drive_links[l.role.trim()] = l.url.trim();
      }
    });

    try {
      await fetch(`${API_URL}/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_template: subject,
          body_template: body,
          theme_color: themeColor,
          drive_links,
          csv_data: csvPreview ? csvPreview.rows : []
        })
      });
    } catch (e) {
      console.error("Autosave failed", e);
    }
  }, [campaignId, subject, body, themeColor, driveLinksList, csvPreview]);

  useEffect(() => {
    if (!isLoaded || !initialLoadRef.current) return;
    const timeoutId = setTimeout(() => {
      saveToApi();
    }, 1500);
    return () => clearTimeout(timeoutId);
  }, [subject, themeColor, body, driveLinksList, csvPreview, isLoaded, saveToApi]);

  useEffect(() => {
    if (file && isLoaded) {
      handleParse(file);
    }
  }, [file, isLoaded]);

  return {
    isLoaded,
    themeColor, setThemeColor,
    subject, setSubject,
    body, setBody,
    driveLinksList, setDriveLinksList,
    file, setFile,
    suratFile, setSuratFile,
    csvPreview, setCsvPreview,
    campaignType, setCampaignType
  };
}
