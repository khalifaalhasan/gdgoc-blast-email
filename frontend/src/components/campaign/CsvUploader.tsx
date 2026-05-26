import React, { useState, useCallback } from "react";
import { UploadCloud, FileSpreadsheet, X } from "lucide-react";
import Papa from "papaparse";

interface CsvUploaderProps {
  file: File | null;
  setFile: (file: File | null) => void;
  csvPreview: { headers: string[]; rows: any[] } | null;
  setCsvPreview: (preview: { headers: string[]; rows: any[] } | null) => void;
}

export function CsvUploader({ file, setFile, csvPreview, setCsvPreview }: CsvUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleParse = (selectedFile: File) => {
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      // Hapus pembatasan preview agar semua data terbaca
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

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      handleParse(selectedFile);
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.name.endsWith(".csv")) {
      setFile(droppedFile);
      handleParse(droppedFile);
    }
  }, []);

  const clearFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFile(null);
    setCsvPreview(null);
  };

  const handleRowChange = (rowIndex: number, colName: string, newValue: string) => {
    if (!csvPreview) return;
    const newRows = [...csvPreview.rows];
    newRows[rowIndex] = { ...newRows[rowIndex], [colName]: newValue };
    setCsvPreview({ headers: csvPreview.headers, rows: newRows });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Drag & Drop Area */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${isDragging ? "#3b82f6" : file ? "#cbd5e1" : "#cbd5e1"}`,
          borderRadius: 16,
          padding: "40px 24px",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.2s ease",
          background: isDragging ? "#eff6ff" : file ? "#f8fafc" : "#fff",
          position: "relative",
        }}
      >
        <input
          type="file"
          accept=".csv"
          onChange={onFileChange}
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%" }}
        />
        
        {file ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ background: "#dbeafe", padding: 16, borderRadius: "50%", color: "#2563eb" }}>
              <FileSpreadsheet size={32} />
            </div>
            <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 16 }}>{file.name}</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              {(file.size / 1024).toFixed(1)} KB • Berhasil diupload
            </div>
            <button
              onClick={clearFile}
              style={{
                marginTop: 12, display: "flex", alignItems: "center", gap: 6,
                padding: "6px 12px", borderRadius: 20, border: "1px solid #e2e8f0",
                background: "#fff", color: "#ef4444", fontSize: 12, fontWeight: 600,
                cursor: "pointer", zIndex: 10, position: "relative"
              }}
            >
              <X size={14} /> Hapus File
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ background: "#f1f5f9", padding: 16, borderRadius: "50%", color: "#64748b", transition: "all 0.2s", transform: isDragging ? "scale(1.1)" : "scale(1)" }}>
              <UploadCloud size={32} />
            </div>
            <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 16 }}>
              {isDragging ? "Lepaskan file di sini" : "Tarik & Lepas File CSV di sini"}
            </div>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              atau klik untuk memilih dari komputer (Maks 5MB)
            </div>
          </div>
        )}
      </div>

      {/* Modern Editable Table Preview */}
      {csvPreview && (
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", background: "#fff", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>Preview Data (Bisa Diedit)</div>
            <div style={{ fontSize: 12, color: "#64748b", background: "#e2e8f0", padding: "2px 8px", borderRadius: 12, fontWeight: 600 }}>Total: {csvPreview.rows.length} baris</div>
          </div>
          
          {/* Scrollable Container */}
          <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "350px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                <tr style={{ background: "#fff", borderBottom: "2px solid #f1f5f9", boxShadow: "0 1px 2px rgb(0 0 0 / 0.05)" }}>
                  {csvPreview.headers.map((h, i) => (
                    <th key={i} style={{ padding: "12px 16px", color: h === '_error_reason' ? "#ef4444" : "#475569", fontWeight: 600, whiteSpace: "nowrap", background: "#fff" }}>
                      {h === '_error_reason' ? 'Alasan Gagal' : h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvPreview.rows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                    {csvPreview.headers.map((h, j) => (
                      <td key={j} style={{ padding: h === '_error_reason' ? "12px 16px" : 0 }}>
                        {h === '_error_reason' ? (
                          <div style={{ background: "#fef2f2", color: "#b91c1c", fontSize: 11, padding: "4px 8px", borderRadius: 4, fontWeight: 600, display: "inline-block", maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={row[h]}>
                            {row[h]}
                          </div>
                        ) : (
                          <input
                            value={row[h] || ""}
                            onChange={(e) => handleRowChange(i, h, e.target.value)}
                            style={{
                              width: "100%", padding: "12px 16px", border: "none", background: "transparent",
                              color: "#334155", outline: "none", fontSize: 13,
                              boxShadow: "inset 0 0 0 1px transparent",
                              transition: "all 0.2s"
                            }}
                            onFocus={(e) => e.target.style.background = "#e0f2fe"}
                            onBlur={(e) => e.target.style.background = "transparent"}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
