import React, { useState, useCallback } from "react";
import { UploadCloud, AlertCircle } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";

interface CsvUploaderProps {
  setFile: (file: File | null) => void;
  csvPreview: { headers: string[]; rows: any[] } | null;
  setCsvPreview: (preview: { headers: string[]; rows: any[] } | null) => void;
  campaignType?: string;
}

export function CsvUploader({ setFile, csvPreview, setCsvPreview, campaignType }: CsvUploaderProps) {
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

  const handleRowChange = (rowIndex: number, colName: string, newValue: string) => {
    if (!csvPreview) return;
    const newRows = [...csvPreview.rows];
    newRows[rowIndex] = { ...newRows[rowIndex], [colName]: newValue };
    setCsvPreview({ headers: csvPreview.headers, rows: newRows });
  };

  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const handleClearAll = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus seluruh data di tabel ini?")) {
      setCsvPreview(null);
      setFile(null);
    }
  };

  const handleClearSuccessful = () => {
    if (!csvPreview) return;
    // Hapus baris yang tidak memiliki _error_reason (berarti berhasil/belum dikirim)
    const newRows = csvPreview.rows.filter(row => !!row['_error_reason']);
    setCsvPreview(newRows.length > 0 ? { headers: csvPreview.headers, rows: newRows } : null);
  };

  const [activeTab, setActiveTab] = useState<'all' | 'success' | 'failed'>('all');

  const hasResults = csvPreview?.rows.some(r => r['_status'] || r['_error_reason']);
  const successCount = csvPreview?.rows.filter(r => r['_status'] === 'success').length || 0;
  const failCount = csvPreview?.rows.filter(r => !!r['_error_reason']).length || 0;

  const displayRows = csvPreview ? csvPreview.rows.filter(row => {
    if (activeTab === 'all') return true;
    if (activeTab === 'success') return row['_status'] === 'success';
    if (activeTab === 'failed') return !!row['_error_reason'];
    return true;
  }) : [];

  const processPaste = useCallback((text: string) => {
    Papa.parse(text, {
      header: false, // Selalu false agar kita bisa kontrol headernya
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) return;
        
        let dataRows = results.data as string[][];
        const defaultHeaders = campaignType === 'surat' ? ["nama", "email"] : ["nama", "email", "role"];
        
        // Cek apakah baris pertama kemungkinan besar adalah header bawaan
        const firstRowStr = dataRows[0].join(" ").toLowerCase();
        if (firstRowStr.includes("nama") || firstRowStr.includes("name") || firstRowStr.includes("email")) {
          dataRows = dataRows.slice(1); // Buang baris pertama karena itu adalah header
        }

        if (dataRows.length === 0) return;
        
        if (!csvPreview) {
          // Buat tabel baru dengan default header
          const newRows = dataRows.map(rowArray => {
            const rowObj: any = {};
            defaultHeaders.forEach((h, i) => {
              rowObj[h] = rowArray[i] || "";
            });
            return rowObj;
          });
          setCsvPreview({ headers: defaultHeaders, rows: newRows });
        } else {
          // Tambahkan ke tabel yang sudah ada
          const newRows = [...csvPreview.rows];
          const expectedHeaders = csvPreview.headers.filter(h => h !== '_status' && h !== '_error_reason');
          
          dataRows.forEach(rowArray => {
            const rowObj: any = {};
            expectedHeaders.forEach((h, i) => {
              rowObj[h] = rowArray[i] || "";
            });
            newRows.push(rowObj);
          });
          
          setCsvPreview({ headers: csvPreview.headers, rows: newRows });
        }
      }
    });
  }, [csvPreview, setCsvPreview, campaignType]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText) return;

    const target = e.target as HTMLElement;
    // Biarkan paste normal jika ke dalam input dan tidak terlihat seperti data CSV/Excel multi-sel
    if (target.tagName === 'INPUT') {
      const isMultiCell = pastedText.includes('\t') || pastedText.includes('\n') || pastedText.split(',').length > 2;
      if (!isMultiCell) return;
    }

    e.preventDefault();
    processPaste(pastedText);
  }, [processPaste]);

  React.useEffect(() => {
    if (!csvPreview) {
      if (campaignType === 'surat') {
        setCsvPreview({ headers: ["nama", "email"], rows: [{ nama: "", email: "" }] });
      } else {
        setCsvPreview({ headers: ["nama", "email", "role"], rows: [{ nama: "", email: "", role: "" }] });
      }
    } else {
      // Re-adjust columns if campaignType changes while preview exists
      if (campaignType === 'surat' && csvPreview.headers.includes("role")) {
        const newHeaders = csvPreview.headers.filter(h => h !== "role");
        const newRows = csvPreview.rows.map(r => {
          const newRow = { ...r };
          delete newRow.role;
          return newRow;
        });
        setCsvPreview({ headers: newHeaders, rows: newRows });
      } else if (campaignType === 'sertifikat' && !csvPreview.headers.includes("role") && csvPreview.headers.includes("nama") && csvPreview.headers.includes("email")) {
        const newHeaders = ["nama", "email", "role", ...csvPreview.headers.filter(h => h !== "nama" && h !== "email")];
        const newRows = csvPreview.rows.map(r => ({ ...r, role: "" }));
        setCsvPreview({ headers: newHeaders, rows: newRows });
      }
    }
  }, [csvPreview, setCsvPreview, campaignType]);
  const emailCol = csvPreview?.headers.find(h => h.toLowerCase() === 'email' || h.toLowerCase() === 'alamat email');
  const emptyEmailsCount = csvPreview && emailCol
    ? csvPreview.rows.filter(row => !String(row[emailCol] || "").trim()).length
    : 0;

  return (
    <div 
      className="flex flex-col gap-4 outline-none"
      onPaste={handlePaste}
      tabIndex={-1}
    >
      {/* Modern Editable Table Preview */}
      {csvPreview && (
        <div className="flex flex-col gap-3">
          {emptyEmailsCount > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded-xl text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <strong className="block mb-0.5">Catatan:</strong>
                Terdapat {emptyEmailsCount} baris dengan kolom email yang kosong. Baris-baris ini akan dilewati oleh sistem pada saat pengiriman.
              </div>
            </div>
          )}
          <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm transition-colors">
          <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-muted/50 flex-wrap gap-3 transition-colors">
            <div className="flex items-center gap-3">
              <div className="font-semibold text-sm text-card-foreground">Data Penerima</div>
              <div className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-semibold transition-colors">Total: {displayRows.length} baris</div>
            </div>
            
            <div className="flex gap-2 flex-wrap justify-end">
              <input
                type="file"
                id="csv-upload-small"
                accept=".csv"
                onChange={onFileChange}
                className="hidden"
              />
              <label
                htmlFor="csv-upload-small"
                className="text-xs font-semibold px-3 py-1.5 rounded-md border border-input bg-background text-foreground cursor-pointer flex items-center gap-1.5 hover:bg-muted transition-colors"
              >
                <UploadCloud size={14} /> Upload CSV
              </label>

              <button
                type="button"
                onClick={() => {
                  const newRow = campaignType === 'surat' ? { nama: "", email: "" } : { nama: "", email: "", role: "" };
                  const newRows = [...csvPreview.rows, newRow];
                  setCsvPreview({ headers: csvPreview.headers, rows: newRows });
                }}
                className="text-xs font-semibold px-3 py-1.5 rounded-md border border-input bg-background text-foreground cursor-pointer flex items-center gap-1 hover:bg-muted transition-colors"
              >
                + Tambah Baris
              </button>

              {selectedRows.size > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Hapus ${selectedRows.size} baris yang dipilih?`)) {
                      const newRows = csvPreview.rows.filter((_, i) => !selectedRows.has(i));
                      setCsvPreview(newRows.length > 0 ? { headers: csvPreview.headers, rows: newRows } : null);
                      setSelectedRows(new Set());
                    }
                  }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-md border-none bg-destructive hover:bg-destructive/90 text-destructive-foreground cursor-pointer flex items-center gap-1 transition-colors"
                >
                  Hapus ({selectedRows.size})
                </button>
              )}
              {csvPreview.headers.includes('_error_reason') && (
                <button
                  type="button"
                  onClick={handleClearSuccessful}
                  className="text-xs font-semibold px-3 py-1.5 rounded-md border border-input bg-background text-primary hover:bg-muted cursor-pointer transition-colors"
                >
                  Sisakan Error
                </button>
              )}
              <button
                type="button"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) {
                      processPaste(text);
                    } else {
                      toast.error("Clipboard kosong atau tidak berisi teks.");
                    }
                  } catch (e) {
                    toast.error("Browser memblokir akses clipboard. Silakan klik di sembarang area tabel lalu tekan Ctrl+V / Cmd+V.");
                  }
                }}
                className="text-xs font-semibold px-3 py-1.5 rounded-md border-none bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer flex items-center gap-1 transition-colors"
              >
                + Paste
              </button>
              
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs font-semibold px-3 py-1.5 rounded-md border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 cursor-pointer transition-colors"
              >
                Kosongkan
              </button>
            </div>
          </div>
          
          {hasResults && (
            <div className="flex border-b border-border bg-muted/50 px-4 transition-colors">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2.5 text-[13px] font-semibold cursor-pointer border-b-2 transition-colors ${activeTab === 'all' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                Semua Data
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('success')}
                className={`px-4 py-2.5 text-[13px] font-semibold cursor-pointer border-b-2 flex items-center gap-1.5 transition-colors ${activeTab === 'success' ? "border-emerald-500 text-emerald-500" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                Berhasil <span className={`px-1.5 py-0.5 rounded-full text-[11px] ${activeTab === 'success' ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>{successCount}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('failed')}
                className={`px-4 py-2.5 text-[13px] font-semibold cursor-pointer border-b-2 flex items-center gap-1.5 transition-colors ${activeTab === 'failed' ? "border-destructive text-destructive" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                Gagal <span className={`px-1.5 py-0.5 rounded-full text-[11px] ${activeTab === 'failed' ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground"}`}>{failCount}</span>
              </button>
            </div>
          )}
          
          {/* Scrollable Container */}
          <div className="overflow-auto max-h-[350px]">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-card border-b-2 border-border shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors">
                  <th className="w-10 p-3 text-muted-foreground font-semibold bg-card text-center transition-colors">
                    <input 
                      type="checkbox" 
                      checked={displayRows.length > 0 && displayRows.every(r => selectedRows.has(csvPreview!.rows.indexOf(r)))}
                      onChange={(e) => {
                        if (!csvPreview) return;
                        const next = new Set(selectedRows);
                        if (e.target.checked) {
                          displayRows.forEach(r => next.add(csvPreview.rows.indexOf(r)));
                        } else {
                          displayRows.forEach(r => next.delete(csvPreview.rows.indexOf(r)));
                        }
                        setSelectedRows(next);
                      }}
                      className="cursor-pointer"
                    />
                  </th>
                  {csvPreview.headers.map((h, i) => (
                    h !== '_status' && (
                      <th key={i} className={`p-3 font-semibold whitespace-nowrap bg-card transition-colors ${h === '_error_reason' ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {h === '_error_reason' ? 'Alasan Gagal' : h}
                      </th>
                    )
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row, i) => {
                  const isSuccess = row['_status'] === 'success';
                  const rowBgClass = row['_error_reason'] 
                    ? "bg-destructive/10" 
                    : isSuccess 
                      ? "bg-emerald-500/10" 
                      : i % 2 === 0 
                        ? "bg-card" 
                        : "bg-muted/30";
                  
                  const originalIndex = csvPreview!.rows.indexOf(row);
                  
                  return (
                  <tr key={i} className={`border-b border-border transition-colors ${rowBgClass}`}>
                    <td className="px-4 py-2 text-center align-middle">
                      <input 
                        type="checkbox" 
                        checked={selectedRows.has(originalIndex)}
                        onChange={(e) => {
                          const next = new Set(selectedRows);
                          if (e.target.checked) next.add(originalIndex);
                          else next.delete(originalIndex);
                          setSelectedRows(next);
                        }}
                        className="cursor-pointer"
                      />
                    </td>
                    {csvPreview.headers.map((h, j) => (
                      h !== '_status' && (
                        <td key={j} className={h === '_error_reason' ? "p-3" : "p-0"}>
                          {h === '_error_reason' ? (
                            <div className="bg-destructive/20 text-destructive text-[11px] px-2 py-1 rounded font-semibold inline-block max-w-[180px] whitespace-nowrap overflow-hidden text-ellipsis" title={row[h]}>
                              {row[h]}
                            </div>
                          ) : (
                            <input
                              value={row[h] || ""}
                              onChange={(e) => handleRowChange(originalIndex, h, e.target.value)}
                              placeholder={`Masukkan ${h}`}
                              className={`
                                w-full p-3 border-none bg-transparent outline-none text-[13px] transition-colors
                                ${row['_error_reason'] 
                                  ? 'text-destructive focus:bg-destructive/20' 
                                  : isSuccess 
                                    ? 'text-emerald-600 dark:text-emerald-400 focus:bg-emerald-500/20' 
                                    : 'text-card-foreground focus:bg-accent/50'
                                }
                              `}
                            />
                          )}
                        </td>
                      )
                    ))}
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
