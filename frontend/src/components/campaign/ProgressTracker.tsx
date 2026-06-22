import { FileText, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import type { CampaignStatus } from "../../types/campaign";

interface ProgressTrackerProps {
  taskId: string | null;
  status: CampaignStatus | null;
  onReset: () => void;
  onReviewResults?: (failedRows: Record<string, string>[], successfulRows: Record<string, string>[]) => void;
}

export function ProgressTracker({
  taskId,
  status,
  onReset,
  onReviewResults,
}: ProgressTrackerProps) {
  const percentage =
    status && status.total > 0
      ? Math.round(((status.success + status.fail) / status.total) * 100)
      : 0;

  const hasErrors = status && (status.fail > 0 || status.state === "FAILURE");

  return (
    <div className="bg-card text-card-foreground rounded-3xl border border-border p-8 shadow-xl flex flex-col min-h-[400px] transition-colors">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
        <FileText className="w-5 h-5 text-primary" />
        Progress Tracker
      </h2>

      {!taskId && !status && (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
          <div className="w-16 h-16 border-4 border-border border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium">Menunggu Campaign...</p>
        </div>
      )}

      {status && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Status
              </span>
              <span
                className={`
                text-xs font-bold px-2.5 py-1 rounded-md
                ${
                  status.status === "Selesai"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : status.status === "Gagal"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-primary/10 text-primary"
                }
              `}
              >
                {status.status || status.state}
              </span>
            </div>

            {/* Progress Bar */}
            {status.total > 0 && (
              <div className="w-full bg-muted rounded-full h-2.5 mt-4 overflow-hidden">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Sukses
                  </span>
                </div>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {status.success || 0}
                </p>
              </div>
              <div className="bg-destructive/10 rounded-xl p-4 border border-destructive/20">
                <div className="flex items-center gap-1.5 text-destructive mb-1">
                  <XCircle className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Gagal
                  </span>
                </div>
                <p className="text-3xl font-bold text-destructive">
                  {status.fail || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Terminal / Logs */}
          <div className="flex-1 bg-slate-950 dark:bg-black rounded-xl p-4 font-mono text-xs overflow-y-auto text-slate-300 shadow-inner min-h-[150px] mb-4 border border-slate-800">
            {status.logs && status.logs.length > 0 ? (
              status.logs.map((log: string, idx: number) => (
                <div key={idx} className="mb-1.5 break-words">
                  <span className="text-primary mr-2">{">"}</span>
                  <span
                    className={
                      log.includes("❌")
                        ? "text-red-400"
                        : log.includes("✅")
                          ? "text-emerald-400"
                          : ""
                    }
                  >
                    {log}
                  </span>
                </div>
              ))
            ) : (
              <span className="text-slate-500 italic">
                Logs akan muncul di sini...
              </span>
            )}
          </div>

          {(status.status === "Selesai" ||
            status.status === "Gagal" ||
            status.state === "FAILURE") && (
            <div className="mt-4 pt-4 border-t border-border flex flex-col gap-4">
              <div className="flex justify-between items-center bg-primary/10 p-4 rounded-xl">
                <div>
                  <p className="font-bold text-primary text-lg">
                    Proses Selesai!
                  </p>
                  <p className="text-sm text-primary/80 font-medium">
                    Semua email telah diproses.
                  </p>
                </div>
                {hasErrors ? (
                  <div className="bg-destructive/10 px-3 py-1.5 rounded-lg border border-destructive/20 text-destructive text-sm font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Ada yang gagal
                  </div>
                ) : (
                  <div className="bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Sukses Semua
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <button
                  onClick={onReset}
                  className="px-4 py-2 rounded-lg border border-input bg-transparent text-foreground text-sm font-semibold cursor-pointer hover:bg-muted transition-colors"
                >
                  Kembali ke Mode Edit
                </button>

                {status.result &&
                (status.result.failed_rows?.length ||
                  status.result.successful_rows?.length) ? (
                  <button
                    onClick={() => {
                      const failed = status.result?.failed_rows || [];
                      const success = status.result?.successful_rows || [];
                      if (onReviewResults) onReviewResults(failed, success);
                    }}
                    className="px-4 py-2 rounded-lg border-none bg-primary text-primary-foreground text-sm font-semibold cursor-pointer hover:opacity-90 transition-colors shadow-sm"
                  >
                    Lihat Hasil di Tabel
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
