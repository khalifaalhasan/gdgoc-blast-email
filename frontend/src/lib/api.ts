import type { CampaignStartResponse } from "../types/campaign";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export async function startCampaign(
  formData: FormData,
): Promise<CampaignStartResponse> {
  const res = await fetch(`${API_URL}/campaign/start`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || "Gagal memulai campaign");
  }

  return res.json();
}

export async function getCampaignStatus(taskId: string) {
  const res = await fetch(`${API_URL}/campaign/status/${taskId}`);
  const data = await res.json();

  if (!res.ok && res.status !== 400 && res.status !== 500) {
    throw new Error(data.detail || "Gagal mengambil status");
  }

  return { status: res.status, data };
}

export async function checkAuthStatus(): Promise<{ valid: boolean; message: string }> {
  try {
    const res = await fetch(`${API_URL}/auth/google/status`);
    if (!res.ok) {
      return { valid: false, message: "Server error saat cek token." };
    }
    return await res.json();
  } catch (err) {
    return { valid: false, message: "Gagal terhubung ke server backend." };
  }
}

