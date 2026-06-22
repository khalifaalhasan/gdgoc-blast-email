import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, RotateCcw, ChevronLeft, ChevronRight, Clock, Users, CheckCircle2, XCircle } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export default function CampaignOverview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Grouping State
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function fetchData() {
      try {
        const [campRes, histRes] = await Promise.all([
          fetch(`${API_URL}/campaigns/${id}`),
          fetch(`${API_URL}/history/campaign/${id}`)
        ]);
        if (campRes.ok) setCampaign(await campRes.json());
        if (histRes.ok) setHistory(await histRes.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // Group history by task_id into "Runs"
  const runs = useMemo(() => {
    const map = new Map<string, any[]>();
    history.forEach(log => {
      // Avoid grouping missing task_ids if any
      const tid = log.task_id || "unknown";
      if (!map.has(tid)) map.set(tid, []);
      map.get(tid)!.push(log);
    });
    
    const runsList = Array.from(map.entries()).map(([taskId, logs]) => {
      // Sort logs inside run by date descending
      logs.sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
      
      return {
        taskId,
        logs,
        date: new Date(logs[0].sent_at),
        successCount: logs.filter(l => l.status === 'success').length,
        failedCount: logs.filter(l => l.status === 'failed').length,
        total: logs.length
      };
    }).sort((a, b) => b.date.getTime() - a.date.getTime());

    // Assign runName to logs
    runsList.forEach((run, idx) => {
      const runNum = runsList.length - idx;
      run.runName = `Run #${runNum}`;
      run.logs.forEach(log => log.runName = run.runName);
    });

    return runsList;
  }, [history]);

  // Create an artificial "All Runs" 
  const allRun = useMemo(() => {
    if (runs.length === 0) return null;
    const allLogs = runs.flatMap(r => r.logs).sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
    return {
      taskId: 'all',
      runName: 'Semua Riwayat Eksekusi',
      date: new Date(),
      logs: allLogs,
      successCount: allLogs.filter(l => l.status === 'success').length,
      failedCount: allLogs.filter(l => l.status === 'failed').length,
      total: allLogs.length
    };
  }, [runs]);

  // Auto select "All Runs" as default
  useEffect(() => {
    if (runs.length > 0 && !activeTask) {
      setActiveTask('all');
    }
  }, [runs, activeTask]);

  const activeRun = activeTask === 'all' ? allRun : runs.find(r => r.taskId === activeTask);

  // Paginated logs for active run
  const paginatedLogs = useMemo(() => {
    if (!activeRun) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    return activeRun.logs.slice(startIndex, startIndex + itemsPerPage);
  }, [activeRun, currentPage]);
  
  const totalPages = activeRun ? Math.ceil(activeRun.logs.length / itemsPerPage) : 0;

  if (loading) return <DashboardLayout><div className="p-8 text-center text-[color:var(--lt-text-secondary)]">Memuat data...</div></DashboardLayout>;
  if (!campaign) return <DashboardLayout><div className="p-8 text-center text-red-500">Campaign tidak ditemukan</div></DashboardLayout>;

  const isDraft = runs.length === 0;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto pt-4 animate-in fade-in duration-500">
        <Link to="/dashboard/campaign" className="inline-flex items-center gap-1.5 text-xs text-[color:var(--lt-text-secondary)] hover:text-[color:var(--lt-text-primary)] mb-6 transition-colors font-medium">
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Daftar
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tighter text-[color:var(--lt-text-primary)]">{campaign.name}</h1>
            <p className="text-sm text-[color:var(--lt-text-secondary)] font-medium mt-1">Dibuat pada: {new Date(campaign.created_at).toLocaleDateString()}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate(`/dashboard/campaign/${id}/edit`)} className="lt-btn-secondary flex items-center justify-center">
              <Pencil className="w-4 h-4 mr-2" /> {isDraft ? "Lanjutkan Setup" : "Edit / Setup Ulang"}
            </button>
          </div>
        </div>

        {isDraft ? (
           <div className="lt-card p-12 text-center flex flex-col items-center justify-center">
             <span className="text-4xl mb-4 opacity-50">📭</span>
             <p className="text-sm font-semibold text-[color:var(--lt-text-primary)]">Belum Ada Pengiriman</p>
             <p className="text-xs text-[color:var(--lt-text-secondary)] mt-1 max-w-xs">Kamu belum melakukan blast email untuk campaign ini. Lanjutkan setup untuk memulai.</p>
           </div>
        ) : (
          <div className="flex flex-col gap-6">
              {activeRun && (
                <div className="flex flex-col gap-6">
                  {/* Stats for Active Run */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="lt-card p-5 flex justify-between items-center">
                      <div>
                        <h3 className="text-xs font-medium text-[color:var(--lt-text-secondary)] mb-1">Total Target</h3>
                        <p className="text-3xl font-bold text-[color:var(--lt-text-primary)]">{activeRun.total}</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Users className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="lt-card p-5 flex justify-between items-center">
                      <div>
                        <h3 className="text-xs font-medium text-[color:var(--lt-text-secondary)] mb-1">Sukses</h3>
                        <p className="text-3xl font-bold text-[color:var(--lt-text-primary)]">{activeRun.successCount}</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="lt-card p-5 flex justify-between items-center">
                      <div>
                        <h3 className="text-xs font-medium text-[color:var(--lt-text-secondary)] mb-1">Gagal</h3>
                        <p className="text-3xl font-bold text-[color:var(--lt-text-primary)]">{activeRun.failedCount}</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                        <XCircle className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  {/* Table for Active Run */}
                  <div className="lt-card p-0 overflow-hidden">
                    <div className="p-5 border-b border-[color:var(--lt-border)] bg-[color:var(--lt-bg)] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                      <div>
                        <h2 className="text-base font-extrabold text-[color:var(--lt-text-primary)]">Log Pengiriman</h2>
                        <p className="text-[11px] text-[color:var(--lt-text-secondary)] font-medium mt-0.5">Pilih riwayat eksekusi di bawah ini untuk melihat detail log.</p>
                        
                        <div className="mt-3 relative">
                          <select 
                            value={activeTask || ""}
                            onChange={(e) => { setActiveTask(e.target.value); setCurrentPage(1); }}
                            className="appearance-none w-full sm:w-auto bg-[color:var(--lt-bg)] border border-[color:var(--lt-border)] text-[color:var(--lt-text-primary)] text-xs font-semibold py-2 pl-3 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer transition-shadow"
                          >
                            {allRun && (
                              <option value="all">
                                Semua Riwayat Eksekusi • Total {allRun.total} (Sukses: {allRun.successCount}, Gagal: {allRun.failedCount})
                              </option>
                            )}
                            {runs.map((run, idx) => (
                              <option key={run.taskId} value={run.taskId}>
                                {run.runName} • {run.date.toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })} (Sukses: {run.successCount}, Gagal: {run.failedCount})
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[color:var(--lt-text-secondary)]">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                      </div>
                      {activeRun.failedCount > 0 && (
                        <button 
                          onClick={() => navigate(`/dashboard/campaign/${id}/edit?resend_task_id=${activeRun.taskId}`)}
                          className="lt-btn-primary !bg-red-500 !border-red-500 !text-white hover:!bg-red-600 flex items-center justify-center text-xs py-2 px-4 whitespace-nowrap shadow-sm shadow-red-500/20"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Resend yang Gagal
                        </button>
                      )}
                    </div>
                    
                    <div className="overflow-x-auto min-h-[300px]">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-[color:var(--lt-bg)]/50">
                          <tr className="border-b border-[color:var(--lt-border)]">
                            <th className="p-3 font-bold text-[color:var(--lt-text-secondary)] text-[11px] uppercase tracking-wider">Eksekusi</th>
                            <th className="p-3 font-bold text-[color:var(--lt-text-secondary)] text-[11px] uppercase tracking-wider">Penerima</th>
                            <th className="p-3 font-bold text-[color:var(--lt-text-secondary)] text-[11px] uppercase tracking-wider">Email</th>
                            <th className="p-3 font-bold text-[color:var(--lt-text-secondary)] text-[11px] uppercase tracking-wider">Status</th>
                            <th className="p-3 font-bold text-[color:var(--lt-text-secondary)] text-[11px] uppercase tracking-wider hidden sm:table-cell">Waktu</th>
                            <th className="p-3 font-bold text-[color:var(--lt-text-secondary)] text-[11px] uppercase tracking-wider max-w-[200px]">Keterangan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[color:var(--lt-border)]">
                          {paginatedLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-[color:var(--lt-bg)] transition-colors">
                              <td className="p-3">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[color:var(--lt-border)] text-[color:var(--lt-text-secondary)]">
                                  {log.runName || "-"}
                                </span>
                              </td>
                              <td className="p-3 font-medium text-[color:var(--lt-text-primary)] text-xs">{log.nama}</td>
                              <td className="p-3 text-[color:var(--lt-text-secondary)] text-xs">{log.email}</td>
                              <td className="p-3">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold ${log.status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                  {log.status === 'success' ? 'Berhasil' : 'Gagal'}
                                </span>
                              </td>
                              <td className="p-3 text-[10px] text-[color:var(--lt-text-secondary)] hidden sm:table-cell">{new Date(log.sent_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute:'2-digit', second: '2-digit' })}</td>
                              <td className="p-3 text-[10px] font-medium text-red-500 max-w-[200px] truncate" title={log.error_reason}>{log.error_reason || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="p-4 border-t border-[color:var(--lt-border)] flex items-center justify-between bg-[color:var(--lt-bg)]/30">
                        <span className="text-xs text-[color:var(--lt-text-secondary)]">
                          Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
                        </span>
                        <div className="flex items-center gap-2">
                          <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="p-1.5 rounded-md border border-[color:var(--lt-border)] hover:bg-[color:var(--lt-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button 
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="p-1.5 rounded-md border border-[color:var(--lt-border)] hover:bg-[color:var(--lt-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
