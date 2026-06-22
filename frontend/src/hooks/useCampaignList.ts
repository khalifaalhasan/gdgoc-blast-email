import { useState, useEffect } from "react";

export interface CampaignMeta {
  id: string;
  name: string;
  createdAt: number;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export function useCampaignList() {
  const [campaigns, setCampaigns] = useState<CampaignMeta[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch(`${API_URL}/campaigns`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(
          data.map((c: Record<string, unknown>) => ({
            id: c.id as string,
            name: c.name as string,
            createdAt: new Date(c.created_at as string).getTime(),
          })),
        );
      }
    } catch (err) {
      console.error("Gagal memuat list campaign:", err);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchCampaigns();
  }, []);

  const addCampaign = async (name: string) => {
    const res = await fetch(`${API_URL}/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const data = await res.json();
      await fetchCampaigns();
      return data.id;
    }
    throw new Error("Gagal membuat campaign");
  };

  const deleteCampaign = async (id: string) => {
    await fetch(`${API_URL}/campaigns/${id}`, { method: "DELETE" });
    await fetchCampaigns();
  };

  return { campaigns, isLoaded, addCampaign, deleteCampaign };
}
