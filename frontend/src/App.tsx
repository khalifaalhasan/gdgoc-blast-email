import { useState, useCallback, useEffect } from "react";
import { useCampaign } from "./hooks/useCampaign";
import { useFormPersist } from "./hooks/useFormPersist";
import { CampaignForm } from "./components/campaign/CampaignForm";
import { ProgressTracker } from "./components/campaign/ProgressTracker";
import { EmailPreview } from "./components/campaign/EmailPreview";

export default function App() {
  const { taskId, status, isLoading, error, submitCampaign, resetCampaign } = useCampaign();

  const {
    isLoaded,
    themeColor, setThemeColor,
    subject, setSubject,
    body, setBody,
    driveLinksList, setDriveLinksList,
    file, setFile,
    csvPreview, setCsvPreview
  } = useFormPersist();

  const handleRetryFailed = useCallback((failedRows: any[]) => {
    if (!failedRows || failedRows.length === 0) return;
    const headers = Object.keys(failedRows[0]);
    setCsvPreview({ headers, rows: failedRows });
    resetCampaign();
  }, [setCsvPreview, resetCampaign]);

  // Resizable Sidebar
  const [previewWidth, setPreviewWidth] = useState(550);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth > 400 && newWidth < 1000) {
          setPreviewWidth(newWidth);
        }
      }
    },
    [isResizing],
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  const hasStarted = taskId || status;

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        userSelect: isResizing ? "none" : "auto",
        cursor: isResizing ? "col-resize" : "auto",
        background: "#f8fafc"
      }}
    >
      {/* Left: Main Content (Form & Tracker) */}
      <div style={{ flex: 1, overflowY: "auto", padding: 32, height: "100%" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b" }}>
              Create Campaign
            </h1>
            <p style={{ color: "#64748b", marginTop: 4 }}>
              Configure your email blast and certificate distribution.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {!isLoaded && <div style={{ color: "#64748b", textAlign: "center", padding: 40 }}>Memuat data tersimpan...</div>}
            
            {isLoaded && !hasStarted && (
              <CampaignForm
                onSubmit={submitCampaign}
                isLoading={isLoading}
                error={error}
                taskId={taskId}
                subject={subject}
                setSubject={setSubject}
                body={body}
                setBody={setBody}
                themeColor={themeColor}
                setThemeColor={setThemeColor}
                driveLinksList={driveLinksList}
                setDriveLinksList={setDriveLinksList}
                file={file}
                setFile={setFile}
                csvPreview={csvPreview}
                setCsvPreview={setCsvPreview}
              />
            )}
            
            {hasStarted && (
              <ProgressTracker 
                taskId={taskId} 
                status={status} 
                onReset={resetCampaign}
                onRetryFailed={handleRetryFailed}
              />
            )}
          </div>
        </div>
      </div>

      {/* Right: Email Preview Sidebar */}
      <div
        style={{
          width: previewWidth,
          flexShrink: 0,
          borderLeft: "1px solid #e2e8f0",
          background: "#fff",
          height: "100%",
          boxShadow: "-1px 0 4px rgb(0 0 0 / 0.05)",
          zIndex: 10,
          display: "flex",
          position: "relative"
        }}
      >
        {/* Resizer Handle (Now on the left side of the right sidebar) */}
        <div
          onMouseDown={startResizing}
          title="Geser untuk mengubah ukuran"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 6,
            cursor: "col-resize",
            transition: "background 0.15s",
            zIndex: 20,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#60a5fa")}
          onMouseLeave={(e) => {
            if (!isResizing) e.currentTarget.style.background = "transparent";
          }}
        />
        <div style={{ flex: 1, overflow: "hidden", marginLeft: 6 }}>
          <EmailPreview subject={subject} body={body} themeColor={themeColor} />
        </div>
      </div>
    </div>
  );
}
