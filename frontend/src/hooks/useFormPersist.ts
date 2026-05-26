import { useState, useEffect } from 'react';
import localforage from 'localforage';
import Papa from 'papaparse';

// Inisialisasi localforage
localforage.config({
  name: 'gdgoc-blast-email',
  storeName: 'campaign_drafts'
});

interface DriveLinkEntry {
  role: string;
  url: string;
}

export function useFormPersist() {
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
  const [csvPreview, setCsvPreview] = useState<{ headers: string[]; rows: any[] } | null>(null);

  // Fungsi helper untuk nge-parse ulang file yang diambil dari IndexedDB
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

  // Muat data dari IndexedDB saat pertama kali load
  useEffect(() => {
    async function loadData() {
      try {
        const savedSubject = await localforage.getItem<string>('subject');
        const savedTheme = await localforage.getItem<string>('themeColor');
        const savedBody = await localforage.getItem<string>('body');
        const savedDriveLinks = await localforage.getItem<DriveLinkEntry[]>('driveLinksList');
        const savedFile = await localforage.getItem<File>('csvFile');

        if (savedSubject) setSubject(savedSubject);
        if (savedTheme) setThemeColor(savedTheme);
        if (savedBody) setBody(savedBody);
        if (savedDriveLinks) setDriveLinksList(savedDriveLinks);
        
        if (savedFile) {
          setFile(savedFile);
          handleParse(savedFile);
        }
      } catch (err) {
        console.error("Gagal memuat data dari IndexedDB:", err);
      } finally {
        setIsLoaded(true);
      }
    }
    loadData();
  }, []);

  // Simpan text/links setiap kali berubah
  useEffect(() => {
    if (!isLoaded) return;
    localforage.setItem('subject', subject);
  }, [subject, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localforage.setItem('themeColor', themeColor);
  }, [themeColor, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localforage.setItem('body', body);
  }, [body, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localforage.setItem('driveLinksList', driveLinksList);
  }, [driveLinksList, isLoaded]);

  // Simpan file asli ke IndexedDB
  useEffect(() => {
    if (!isLoaded) return;
    if (file) {
      localforage.setItem('csvFile', file);
    } else {
      localforage.removeItem('csvFile');
      setCsvPreview(null);
    }
  }, [file, isLoaded]);

  return {
    isLoaded,
    themeColor, setThemeColor,
    subject, setSubject,
    body, setBody,
    driveLinksList, setDriveLinksList,
    file, setFile,
    csvPreview, setCsvPreview
  };
}
