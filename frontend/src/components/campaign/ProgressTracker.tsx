import { FileText, CheckCircle2, XCircle } from "lucide-react";
import type { CampaignStatus } from "../../types/campaign";

interface ProgressTrackerProps {
  taskId: string | null;
  status: CampaignStatus | null;
  onReset: () => void;
  onRetryFailed: (failedRows: any[]) => void;
}

export function ProgressTracker({ taskId, status, onReset, onRetryFailed }: ProgressTrackerProps) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24, boxShadow: "0 1px 2px rgb(0 0 0 / 0.05)", display: "flex", flexDirection: "column", minHeight: 400 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        <FileText size={20} color="#2563eb" />
        Progress Tracker
      </h2>

      {!taskId && !status && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
          <div className="animate-spin" style={{ width: 64, height: 64, border: "4px solid #f1f5f9", borderTopColor: "#cbd5e1", borderRadius: "50%", marginBottom: 16 }} />
          <p style={{ fontSize: 14 }}>Menunggu Campaign...</p>
        </div>
      )}

      {status && (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#334155" }}>Status</span>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: "4px 8px", borderRadius: 6,
                background: status.status === "Selesai" ? "#dcfce7" : status.status === "Gagal" ? "#fee2e2" : "#dbeafe",
                color: status.status === "Selesai" ? "#15803d" : status.status === "Gagal" ? "#b91c1c" : "#1d4ed8",
              }}>
                {status.status || status.state}
              </span>
            </div>

            {/* Progress Bar */}
            {status.total > 0 && (
              <div style={{ width: "100%", background: "#f1f5f9", borderRadius: 10, height: 10, marginTop: 16, overflow: "hidden" }}>
                <div style={{ background: "#2563eb", height: 10, borderRadius: 10, transition: "width 500ms ease-out", width: `${((status.success + status.fail) / status.total) * 100}%` }} />
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 24 }}>
              <div style={{ background: "#f0fdf4", borderRadius: 8, padding: 12, border: "1px solid #dcfce7" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#15803d", marginBottom: 4 }}>
                  <CheckCircle2 size={16} />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Sukses</span>
                </div>
                <p style={{ fontSize: 24, fontWeight: 700, color: "#15803d" }}>{status.success || 0}</p>
              </div>
              <div style={{ background: "#fef2f2", borderRadius: 8, padding: 12, border: "1px solid #fee2e2" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#b91c1c", marginBottom: 4 }}>
                  <XCircle size={16} />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Gagal</span>
                </div>
                <p style={{ fontSize: 24, fontWeight: 700, color: "#b91c1c" }}>{status.fail || 0}</p>
              </div>
            </div>
          </div>

          {/* Terminal / Logs */}
          <div style={{ flex: 1, background: "#0f172a", borderRadius: 8, padding: 16, fontFamily: "monospace", fontSize: 12, overflowY: "auto", color: "#cbd5e1", boxShadow: "inset 0 2px 4px rgb(0 0 0 / 0.2)", minHeight: 150, marginBottom: 16 }}>
            {status.logs && status.logs.length > 0 ? (
              status.logs.map((log: string, idx: number) => (
                <div key={idx} style={{ marginBottom: 6, wordBreak: "break-word" }}>
                  <span style={{ color: "#60a5fa", marginRight: 8 }}>{">"}</span>
                  <span style={{ color: log.includes("❌") ? "#f87171" : log.includes("✅") ? "#4ade80" : undefined }}>{log}</span>
                </div>
              ))
            ) : (
              <span style={{ color: "#475569", fontStyle: "italic" }}>Logs akan muncul di sini...</span>
            )}
          </div>

          {(status.status === "Selesai" || status.status === "Gagal" || status.state === "FAILURE") && (
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: "auto" }}>
              <button
                onClick={onReset}
                style={{
                  padding: "8px 16px", borderRadius: 6, border: "1px solid #cbd5e1",
                  background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Kembali ke Form
              </button>
              
              {status.result?.failed_rows && status.result.failed_rows.length > 0 && onRetryFailed && (
                <button
                  onClick={() => onRetryFailed(status.result!.failed_rows!)}
                  style={{
                    padding: "8px 16px", borderRadius: 6, border: "none",
                    background: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Coba Ulang yang Gagal ({status.result.failed_rows.length})
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
