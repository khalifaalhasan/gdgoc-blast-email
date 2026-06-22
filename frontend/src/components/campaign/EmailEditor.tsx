import React from "react";
import { DefaultEditor } from "react-simple-wysiwyg";
import EmojiPicker from "emoji-picker-react";
import { Smile } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { toast } from "sonner";

interface EmailEditorProps {
  subject: string;
  setSubject: (v: string) => void;
  body: string;
  setBody: (v: string) => void;
}

export function EmailEditor({
  subject,
  setSubject,
  body,
  setBody,
}: EmailEditorProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [eventNameInput, setEventNameInput] = React.useState(() => {
    return localStorage.getItem("lastEventName") || "Build With AI";
  });

  const handleApplyTemplate = () => {
    if (eventNameInput.trim() !== "") {
      localStorage.setItem("lastEventName", eventNameInput.trim());
      const template = `Hi {{nama}} ✨<br><br>
Thank you for being a part of <b>${eventNameInput}</b>. We truly appreciate your contribution and dedication as a <b>{{role}}</b> during the event.<br><br>
In recognition of your hard work and contribution to advancing AI technology, we are pleased to present your official E-Certificate. You earned it! 🏆<br><br>
Your certificate is attached to this email as a file below.<br><br>
We hope this experience has helped you grow as a developer and provided valuable connections. We look forward to seeing what you build next! 🚀<br><br>
Best regards,<br>
The GDGoC UNSRI 2026 Organizing Team`;
      setBody(template);
      setIsDialogOpen(false);
      toast.success("Template berhasil dimuat!");
    } else {
      toast.error("Nama event tidak boleh kosong!");
    }
  };

  const onEmojiClick = (emojiObject: any) => {
    setBody(body + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="flex flex-col gap-8 transition-colors">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Gunakan Template Default</DialogTitle>
            <DialogDescription>
              Masukkan nama event untuk mengisi otomatis template email Anda.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Nama Event
            </label>
            <input
              autoFocus
              type="text"
              value={eventNameInput}
              onChange={(e) => setEventNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApplyTemplate();
              }}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsDialogOpen(false)}
              className="px-4 py-2 rounded-md text-sm font-medium border border-input bg-transparent text-foreground hover:bg-muted transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApplyTemplate}
              className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-colors"
            >
              Simpan
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex-1 flex flex-col gap-6">
        <div>
          <label className="block text-sm font-bold text-[color:var(--lt-text-primary)] mb-2">
            Subject Email
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Contoh: [Certificate] Thank you for attending!"
            className="lt-input"
          />
        </div>

        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="block text-sm font-bold text-[color:var(--lt-text-primary)]">
              Body Email
            </label>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="flex items-center gap-1 text-xs text-[color:var(--lt-text-secondary)] hover:text-[color:var(--lt-primary)] font-semibold transition-colors"
                >
                  <Smile className="w-4 h-4" />
                  Emoji
                </button>
                {showEmojiPicker && (
                  <div className="absolute z-50 right-0 top-full mt-2 shadow-xl border border-[color:var(--lt-border)] rounded-xl bg-background">
                    <EmojiPicker onEmojiClick={onEmojiClick} />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsDialogOpen(true)}
                className="text-xs text-[color:var(--lt-primary)] hover:text-[color:var(--lt-primary-hover)] font-semibold"
              >
                Gunakan Template E-Certificate
              </button>
            </div>
          </div>
          <div className="text-[color:var(--lt-text-primary)] bg-[color:var(--lt-bg)] border border-[color:var(--lt-border)] rounded-xl overflow-hidden transition-all duration-200 focus-within:border-[color:var(--lt-primary)] focus-within:ring-4 focus-within:ring-[color:var(--lt-primary)]/10 [&_.rsw-editor]:!border-none [&_.rsw-toolbar]:!bg-[color:var(--lt-sidebar)] [&_.rsw-toolbar]:!border-b-[color:var(--lt-border)] [&_.rsw-btn]:!text-[color:var(--lt-text-primary)] [&_.rsw-btn:hover]:!bg-[color:var(--lt-bg)]">
            <DefaultEditor
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
