export interface CampaignStatus {
  state: string;
  progress: number;
  total: number;
  success: number;
  fail: number;
  logs: string[];
  status: string;
  result?: {
    failed_rows?: any[];
  };
}

export interface CampaignStartResponse {
  message: string;
  task_id: string;
  total_recipients: number;
}
