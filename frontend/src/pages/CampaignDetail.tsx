import { useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useCampaign } from "../hooks/useCampaign";
import { useFormPersist } from "../hooks/useFormPersist";
import { CampaignForm } from "../components/campaign/CampaignForm";
import { ProgressTracker } from "../components/campaign/ProgressTracker";

export default function CampaignDetail() {
  const { id: campaignId } = useParams<{ id: string }>();
  const { taskId, status, isLoading, error, submitCampaign, resetCampaign } = useCampaign();

  const {
    isLoaded,
    themeColor, setThemeColor,
    subject, setSubject,
    body, setBody,
    driveLinksList, setDriveLinksList,
    setFile,
    suratFile, setSuratFile,
    csvPreview, setCsvPreview,
    campaignType, setCampaignType
  } = useFormPersist(campaignId || "");

  const handleReviewResults = useCallback((failedRows: any[], successfulRows: any[]) => {
    const combined = [...failedRows, ...successfulRows];
    if (combined.length === 0) return;
    const headers = Object.keys(combined[0]);
    // Combine both so they can be viewed together
    setCsvPreview({ headers, rows: combined });
    resetCampaign();
  }, [setCsvPreview, resetCampaign]);

  const hasStarted = taskId || status;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground transition-colors">
      <div className="flex-1 overflow-y-auto p-8 h-full relative">
        <div className="max-w-4xl mx-auto pt-6">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Daftar Campaign
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Detail Campaign
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure your email blast and certificate distribution seamlessly.
            </p>
          </div>

          <div className="flex flex-col gap-8">
            {!isLoaded && <div className="text-muted-foreground text-center py-10">Memuat data tersimpan...</div>}
            
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
                setFile={setFile}
                suratFile={suratFile}
                setSuratFile={setSuratFile}
                csvPreview={csvPreview}
                setCsvPreview={setCsvPreview}
                campaignType={campaignType}
                setCampaignType={setCampaignType}
              />
            )}
            
            {hasStarted && (
              <ProgressTracker 
                taskId={taskId} 
                status={status} 
                onReset={resetCampaign}
                onReviewResults={handleReviewResults}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
