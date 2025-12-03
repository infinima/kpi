import { useState } from "react";
import { X } from "lucide-react";
import { useNotifications, useUI, useEventsNav } from "@/store";
import { apiPost } from "@/api";

export function ImportZuevaModal({ onSuccess }: { onSuccess: () => void }) {
  const { importZuevaOpen, closeImportZueva } = useUI();
  const { leagueId } = useEventsNav();
  const notify = useNotifications((s) => s.addMessage);

  const [txt, setTxt] = useState("");
  const [loading, setLoading] = useState(false);

  if (!importZuevaOpen) return null;

  async function submit() {
    if (!txt.trim()) {
      notify({ type: "warning", text: "Введите текст" });
      return;
    }

    if (!leagueId) {
      notify({ type: "error", text: "Нет leagueId" });
      return;
    }

    setLoading(true);

    try {
      const res = await apiPost(`leagues/${leagueId}/import-teams`, { url: txt });

      if(res?.success === true) {
        notify({ type: "success", text: `Импорт выполнен \nСоздано: ${res?.created} \nОбновлено: ${res?.updated}` });
      }
      if (res?.error?.code === "INVALID_IMPORT_DATA") {
        notify({ type: "error", text: res?.error?.message });

      }



      onSuccess(); // обновить список
    } catch (e: any) {
      notify({ type: "error", text: e?.message || "Ошибка при импорте" });
    } finally {
      closeImportZueva();
      setTxt("");
      setLoading(false);
    }
  }

  return (
    <div
      className="
        fixed inset-0 z-50 bg-black/40 backdrop-blur-sm
        flex items-center justify-center px-4
      "
      onMouseDown={closeImportZueva}
    >
      <div
        className="
          w-full max-w-lg p-6 rounded-xl space-y-6
          bg-surface dark:bg-dark-surface
          border border-border dark:border-dark-border
          shadow-card
        "
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Импорт Зуева</h2>

          <button
            className="p-2 rounded-lg hover:bg-hover dark:hover:bg-dark-hover"
            onClick={closeImportZueva}
          >
            <X className="opacity-70" />
          </button>
        </div>

        {/* INPUT */}
        <textarea
          value={txt}
          onChange={(e) => setTxt(e.target.value)}
          placeholder="Вставьте данные…"
          className="
            w-full h-48 p-3 rounded-lg text-sm resize-none
            bg-surface dark:bg-dark-surface
            border border-border dark:border-dark-border
          "
        />

        {/* ACTIONS */}
        <div className="flex justify-end gap-3">
          <button
            onClick={closeImportZueva}
            className="
              px-4 py-2 rounded-lg
              bg-hover dark:bg-dark-hover
              text-text-secondary dark:text-dark-text-secondary
            "
          >
            Отмена
          </button>

          <button
            disabled={loading}
            onClick={submit}
            className="
              px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark
              disabled:opacity-50 disabled:pointer-events-none
            "
          >
            {loading ? "Сохранение…" : "Импортировать"}
          </button>
        </div>
      </div>
    </div>
  );
}