import { Plus, Trash2 } from "lucide-react";

interface DriveLinkEntry {
  role: string;
  url: string;
}

interface DriveLinksProps {
  links: DriveLinkEntry[];
  onChange: (links: DriveLinkEntry[]) => void;
}

export function DriveLinksList({ links, onChange }: DriveLinksProps) {
  const handleLinkChange = (
    index: number,
    field: keyof DriveLinkEntry,
    value: string,
  ) => {
    const newList = [...links];
    newList[index][field] = value;
    onChange(newList);
  };

  const removeRow = (index: number) => {
    const newList = [...links];
    newList.splice(index, 1);
    onChange(newList);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center bg-muted/50 p-4 rounded-xl border border-border">
        <div>
          <h2 className="text-sm font-bold text-card-foreground">
            Mapping Role ke Google Drive
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Role di CSV akan mendapat link Drive yang sesuai.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            const newLinks = [...links, { role: "", url: "" }];
            onChange(newLinks);
          }}
          className="text-xs font-semibold px-4 py-2 rounded-full border border-input bg-background text-foreground cursor-pointer flex items-center gap-1.5 hover:bg-muted transition-colors shadow-sm"
        >
          <Plus size={14} /> Tambah Role
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {links.map((link, i) => (
          <div
            key={i}
            className="flex flex-col sm:flex-row sm:items-center gap-3 bg-card p-4 rounded-xl border border-border shadow-sm group transition-colors"
          >
            <div className="flex-1 flex flex-col gap-1.5 relative">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide px-1">
                Role (Sesuai CSV)
              </label>
              <input
                placeholder="Contoh: Peserta"
                value={link.role}
                onChange={(e) => handleLinkChange(i, "role", e.target.value)}
                className="w-full p-2.5 bg-background border border-input rounded-lg text-[13px] text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"
              />
            </div>

            <div className="hidden sm:block text-muted-foreground mt-6 px-1">
              {/* Panah dekoratif */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </div>

            <div className="flex-[2] flex flex-col gap-1.5 relative">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide px-1">
                Link Folder Google Drive
              </label>
              <input
                placeholder="https://drive.google.com/drive/folders/..."
                value={link.url}
                onChange={(e) => handleLinkChange(i, "url", e.target.value)}
                className="w-full p-2.5 bg-background border border-input rounded-lg text-[13px] text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"
              />
            </div>

            <div className="sm:mt-6 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-destructive/20"
                title="Hapus baris ini"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
