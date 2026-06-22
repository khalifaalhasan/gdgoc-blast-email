export interface CampaignStatus {
  state: string;
  progress: number;
  total: number;
  success: number;
  fail: number;
  logs: string[];
  status: string;
  result?: {
    failed_rows?: Record<string, string>[];
    successful_rows?: Record<string, string>[];
  };
}

export interface CampaignStartResponse {
  message: string;
  task_id: string;
  total_recipients: number;
}
