import { Link } from "react-router-dom";
import { Plus, Trash2, Mail, Calendar } from "lucide-react";
import { useCampaignList } from "../hooks/useCampaignList";

export default function CampaignList() {
  const { campaigns, isLoaded, deleteCampaign } = useCampaignList();

  if (!isLoaded)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Memuat daftar campaign...
      </div>
    );

  return (
    <div className="pt-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tighter text-[color:var(--lt-text-primary)]">
            Semua Campaign
          </h1>
          <p className="text-sm text-[color:var(--lt-text-secondary)] mt-1 font-medium">
            Kelola dan pantau seluruh email blast kamu dari satu tempat.
          </p>
        </div>

        <Link
          to="/dashboard/campaign/create"
          className="lt-btn-primary whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Buat Campaign Baru
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 lt-card border-dashed">
          <Mail className="w-16 h-16 text-[color:var(--lt-text-secondary)]/30 mb-4" />
          <h3 className="text-xl font-bold text-[color:var(--lt-text-primary)]">
            Belum ada campaign
          </h3>
          <p className="text-[color:var(--lt-text-secondary)] mt-2">
            Mulai buat campaign pertamamu sekarang.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="group relative lt-card p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
            >
              <Link
                to={`/dashboard/campaign/${campaign.id}`}
                className="absolute inset-0 z-10 rounded-2xl"
                aria-label={campaign.name}
              />

              <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 bg-[color:var(--lt-bg)] rounded-full text-[color:var(--lt-primary)] border border-[color:var(--lt-border)]">
                  <Mail className="w-5 h-5" />
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (
                      confirm(
                        "Yakin ingin menghapus campaign ini? Semua draft akan hilang.",
                      )
                    ) {
                      deleteCampaign(campaign.id);
                    }
                  }}
                  className="z-20 p-2 text-[color:var(--lt-text-secondary)] hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  title="Hapus Campaign"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3
                className="text-lg font-bold mb-1 line-clamp-1 text-[color:var(--lt-text-primary)] tracking-tight"
                title={campaign.name}
              >
                {campaign.name}
              </h3>

              <div className="flex items-center gap-1.5 text-[11px] text-[color:var(--lt-text-secondary)] mt-3 font-medium">
                <Calendar className="w-3 h-3" />
                <span>
                  Dibuat pada{" "}
                  {new Date(campaign.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
