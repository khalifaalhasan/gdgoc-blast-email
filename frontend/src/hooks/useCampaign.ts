import { useState, useEffect, useCallback } from "react";
import { startCampaign, getCampaignStatus } from "../lib/api";
import type { CampaignStatus } from "../types/campaign";

export function useCampaign() {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<CampaignStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitCampaign = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);
    setStatus(null);
    setTaskId(null);
    try {
      const data = await startCampaign(formData);
      setTaskId(data.task_id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const checkStatus = useCallback(async () => {
    if (!taskId) return false;
    try {
      const { data } = await getCampaignStatus(taskId);
      setStatus(data as CampaignStatus);
      if (data.status === "Selesai" || data.status === "Gagal" || data.state === "FAILURE") {
        return true;
      }
    } catch (err: any) {
      console.error(err);
    }
    return false;
  }, [taskId]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (taskId && status?.status !== "Selesai" && status?.status !== "Gagal") {
      interval = setInterval(async () => {
        const isFinished = await checkStatus();
        if (isFinished) clearInterval(interval);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [taskId, status, checkStatus]);

  const resetCampaign = useCallback(() => {
    setTaskId(null);
    setStatus(null);
    setError(null);
  }, []);

  return { taskId, status, isLoading, error, submitCampaign, resetCampaign };
}
