import { useCallback, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useCampaign } from "../hooks/useCampaign";
import { useFormPersist } from "../hooks/useFormPersist";
import { CampaignForm } from "../components/campaign/CampaignForm";
import { ProgressTracker } from "../components/campaign/ProgressTracker";

export default function CampaignDetail() {
  const { id: campaignId } = useParams<{ id: string }>();
  const { taskId, status, isLoading, error, submitCampaign, resetCampaign } =
    useCampaign();
  const [searchParams, setSearchParams] = useSearchParams();
  const resendTaskId = searchParams.get("resend_task_id");

  const {
    isLoaded,
    themeColor,
    setThemeColor,
    subject,
    setSubject,
    body,
    setBody,
    driveLinksList,
    setDriveLinksList,
    setFile,
    suratFile,
    setSuratFile,
    csvPreview,
    setCsvPreview,
    campaignType,
    setCampaignType,
  } = useFormPersist(campaignId || "");

  const handleReviewResults = useCallback(
    (failedRows: Record<string, string>[], successfulRows: Record<string, string>[]) => {
      const combined = [...failedRows, ...successfulRows];
      if (combined.length === 0) return;
      const headers = Object.keys(combined[0]);
      // Combine both so they can be viewed together
      setCsvPreview({ headers, rows: combined });
      resetCampaign();
    },
    [setCsvPreview, resetCampaign],
  );

  useEffect(() => {
    if (resendTaskId && isLoaded && csvPreview && csvPreview.rows.length > 0) {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
      fetch(`${API_URL}/history/task/${resendTaskId}`)
        .then(res => res.json())
        .then(logs => {
          const failedEmails = new Set(logs.filter((l: any) => l.status === 'failed').map((l: any) => l.email));
          if (failedEmails.size > 0) {
            const filteredRows = csvPreview.rows.filter(row => {
               const emailKey = Object.keys(row).find(k => k.toLowerCase().includes('email'));
               return emailKey && failedEmails.has(row[emailKey]);
            });
            if (filteredRows.length > 0) {
               setCsvPreview({ headers: csvPreview.headers, rows: filteredRows });
               searchParams.delete("resend_task_id");
               setSearchParams(searchParams, { replace: true });
               
               // Optional: Show a quick alert or toast that the table is filtered
               console.log("Table filtered to show only failed emails");
            }
          }
        })
        .catch(console.error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resendTaskId, isLoaded]);

  const hasStarted = taskId || status;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground transition-colors">
      <div className="flex-1 overflow-y-auto p-8 h-full relative">
        <div className="max-w-4xl mx-auto pt-6">
          <div className="mb-8">
            <Link
              to={`/dashboard/campaign/${campaignId}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Campaign Overview
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Detail Campaign
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure your email blast and certificate distribution
              seamlessly.
            </p>
          </div>

          <div className="flex flex-col gap-8">
            {!isLoaded && (
              <div className="text-muted-foreground text-center py-10">
                Memuat data tersimpan...
              </div>
            )}

            {isLoaded && !hasStarted && (
              <CampaignForm
                onSubmit={(formData) => submitCampaign(campaignId || "", formData)}
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
