import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { checkAuthStatus } from "../lib/api";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    async function verifyAuth() {
      const { valid } = await checkAuthStatus();
      setIsAuthenticated(valid);
    }
    verifyAuth();
  }, [location.pathname]);

  // Sedang loading (cek token)
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[color:var(--lt-bg)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[color:var(--lt-primary)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[color:var(--lt-text-secondary)] font-medium animate-pulse">
            Memeriksa akses Google Workspace...
          </p>
        </div>
      </div>
    );
  }

  // Token tidak valid/hilang, tendang ke halaman login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Lolos, tampilkan isi dashboard
  return <>{children}</>;
}
