import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Play, LayoutTemplate } from 'lucide-react';
import { useCampaignList } from '../hooks/useCampaignList';

export default function CampaignCreate() {
  const { addCampaign } = useCampaignList();
  const [newCampaignName, setNewCampaignName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) return;
    setIsSubmitting(true);
    try {
      const id = await addCampaign(newCampaignName.trim());
      navigate(`/dashboard/campaign/${id}`);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto pt-2 animate-in fade-in duration-500">
        <div className="mb-6">
          <Link to="/dashboard/campaign" className="inline-flex items-center gap-1.5 text-xs text-[color:var(--lt-text-secondary)] hover:text-[color:var(--lt-text-primary)] mb-3 transition-colors font-medium">
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Daftar Campaign
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tighter text-[color:var(--lt-text-primary)]">
            Buat Campaign Baru
          </h1>
          <p className="text-sm text-[color:var(--lt-text-secondary)] mt-1 font-medium">
            Berikan nama untuk campaign ini agar mudah diidentifikasi nanti.
          </p>
        </div>

        <form onSubmit={handleCreate} className="lt-card p-6">
          <div className="mb-6">
            <label className="block text-xs font-bold text-[color:var(--lt-text-primary)] mb-2 uppercase tracking-wider">Nama Event / Campaign</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LayoutTemplate className="w-4 h-4 text-[color:var(--lt-text-secondary)]" />
              </div>
              <input
                autoFocus
                type="text"
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
                placeholder="Contoh: GDGoC Cloud Next 2026"
                className="lt-input pl-10"
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              type="submit"
              disabled={!newCampaignName.trim() || isSubmitting}
              className="lt-btn-primary"
            >
              {isSubmitting ? "Menyimpan..." : "Buat & Lanjut Edit"}
              {!isSubmitting && <Play className="w-4 h-4" />}
            </button>
          </div>
        </form>
    </div>
  );
}
