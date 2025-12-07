import { useEffect, useState } from "react";
import { X, Copy } from "lucide-react";
import { useUI, useNotifications } from "@/store";
import { apiGet } from "@/api";

export function LeagueAccountsModal() {
  const modal = useUI(s => s.leagueAccountsModal);
  const close = useUI(s => s.closeLeagueAccountsModal);
  const notify = useNotifications(s => s.addMessage);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function fetchData() {
    if (!modal.leagueId) return;
    setLoading(true);

    try {
      const res = await apiGet(`leagues/${modal.leagueId}/accounts`);
      setData(res);
    } catch {
      notify({ type: "error", text: "Не удалось загрузить данные аккаунтов" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (modal.open) fetchData();
  }, [modal.open]);

  if (!modal.open) return null;

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    notify({ type: "success", text: "Скопировано" });
  }

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4"
      onClick={close}
    >
      <div
        className="
          w-full max-w-md rounded-xl
          bg-surface dark:bg-dark-surface
          border border-border dark:border-dark-border
          shadow-xl p-4 space-y-4
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Данные для волонтеров</h2>

          <button
            onClick={close}
            className="
              p-1 rounded-lg
              hover:bg-hover dark:hover:bg-dark-hover
            "
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTENT */}
        {loading && (
          <p className="opacity-60 text-center py-6 text-sm">Загрузка…</p>
        )}

        {data && (
          <div className="space-y-4 text-sm">
            {/* SHOW */}
            <div className="space-y-1">
              <p className="text-xs uppercase opacity-60 font-medium">
                Аккаунт показа
              </p>

              <div className="flex items-center gap-2">
                <input
                  className="
                    flex-1 px-2 py-1 rounded-md text-sm
                    bg-hover/50 dark:bg-dark-hover/60
                    border border-border dark:border-dark-border
                  "
                  value={data.show?.login || ""}
                  readOnly
                />
                <button
                  onClick={() => copy(data.show?.login || "")}
                  className="
                    p-2 rounded-md
                    bg-hover dark:bg-dark-hover
                    hover:bg-hover/60 dark:hover:bg-dark-hover/80
                  "
                >
                  <Copy size={16} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  className="
                    flex-1 px-2 py-1 rounded-md text-sm
                    bg-hover/50 dark:bg-dark-hover/60
                    border border-border dark:border-dark-border
                  "
                  value={data.show?.password || ""}
                  readOnly
                />
                <button
                  onClick={() => copy(data.show?.password || "")}
                  className="
                    p-2 rounded-md
                    bg-hover dark:bg-dark-hover
                    hover:bg-hover/60 dark:hover:bg-dark-hover/80
                  "
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>

            {/* CHECK */}
            <div className="space-y-1">
              <p className="text-xs uppercase opacity-60 font-medium">
                Аккаунт проверки
              </p>

              <div className="flex items-center gap-2">
                <input
                  className="
                    flex-1 px-2 py-1 rounded-md text-sm
                    bg-hover/50 dark:bg-dark-hover/60
                    border border-border dark:border-dark-border
                  "
                  value={data.check?.login || ""}
                  readOnly
                />
                <button
                  onClick={() => copy(data.check?.login || "")}
                  className="
                    p-2 rounded-md
                    bg-hover dark:bg-dark-hover
                    hover:bg-hover/60 dark:hover:bg-dark-hover/80
                  "
                >
                  <Copy size={16} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  className="
                    flex-1 px-2 py-1 rounded-md text-sm
                    bg-hover/50 dark:bg-dark-hover/60
                    border border-border dark:border-dark-border
                  "
                  value={data.check?.password || ""}
                  readOnly
                />
                <button
                  onClick={() => copy(data.check?.password || "")}
                  className="
                    p-2 rounded-md
                    bg-hover dark:bg-dark-hover
                    hover:bg-hover/60 dark:hover:bg-dark-hover/80
                  "
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="text-right">
          <button
            onClick={close}
            className="
              px-3 py-2 rounded-lg text-sm
              bg-primary text-white hover:bg-primary-dark
            "
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}