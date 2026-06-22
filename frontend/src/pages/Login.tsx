import { useSearchParams } from "react-router-dom";
import { LogIn, AlertCircle } from "lucide-react";

export default function Login() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

  const handleLogin = () => {
    // Redirect langsung ke endpoint backend yang akan initiate OAuth flow
    window.location.href = `${API_URL}/auth/google/login`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--lt-bg)] p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[color:var(--lt-primary)] opacity-10 blur-3xl rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[color:var(--lt-accent)] opacity-10 blur-3xl rounded-full"></div>

      <div className="max-w-md w-full bg-[color:var(--lt-surface)] rounded-3xl p-8 border border-[color:var(--lt-border)] shadow-xl relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[color:var(--lt-primary)]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[color:var(--lt-primary)]/20 shadow-inner">
            <span className="text-3xl">✉️</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[color:var(--lt-text-primary)] mb-3 tracking-tight">
            GDGoC Blast Email
          </h1>
          <p className="text-[color:var(--lt-text-secondary)] font-medium">
            Sistem pengiriman email dan sertifikat otomatis untuk event Anda.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400 font-medium">
              {error === "access_denied"
                ? "Anda menolak akses ke Google Account. Akses dibutuhkan untuk mengirim email."
                : "Terjadi kesalahan saat otentikasi. Silakan coba lagi."}
            </p>
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-5 mb-8">
          <h3 className="font-bold text-blue-900 dark:text-blue-300 text-sm mb-2 flex items-center gap-2">
            <span>🔒</span> Otorisasi Dibutuhkan
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-400/80">
            Aplikasi ini membutuhkan akses ke <b>Gmail</b> (untuk mengirim pesan) dan <b>Google Drive</b> (untuk mengambil lampiran PDF). Pastikan Anda login dengan akun resmi GDGoC (misal: dscunsri@gmail.com).
          </p>
        </div>

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-[color:var(--lt-text-primary)] hover:bg-[color:var(--lt-text-primary)]/90 text-[color:var(--lt-bg)] rounded-2xl font-bold transition-all duration-300 shadow-lg shadow-black/10 dark:shadow-black/30 hover:-translate-y-1 group"
        >
          <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Login dengan Google Workspace</span>
        </button>
      </div>
    </div>
  );
}
