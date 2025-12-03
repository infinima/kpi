import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useUI, useNotifications } from "@/store";
import { apiGet } from "@/api";
import { formatDate } from "@/helpers/formatDate";

interface LogItem {
  id: number;
  table_name: string;
  record_id: number;
  action: string;
  old_data: any;
  new_data: any;
  diff_data: any;
  params: any;
  user_id: number;
  query_text: string;
  created_at: string;
}

export function LogModal() {
  const {
    logModal,
    logModalId,
    logModalName,
    closeLogModal,
    openUserLogModal,
  } = useUI();

  const notify = useNotifications((s) => s.addMessage);

  const [data, setData] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(false);

  // FETCH
  useEffect(() => {
    if (!logModal || !logModalName || !logModalId) return;

    setLoading(true);

    apiGet(`logs/object/${logModalName}/${logModalId}`)
      .then((res) => setData(res || []))
      .catch(() => {
        setData([]);
        notify({ type: "error", text: "Ошибка загрузки логов" });
      })
      .finally(() => setLoading(false));
  }, [logModal, logModalName, logModalId]);

  if (!logModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="
          w-full max-w-2xl max-h-[90vh] overflow-hidden
          rounded-xl border border-border dark:border-dark-border
          bg-surface dark:bg-dark-surface shadow-card flex flex-col
        "
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-border dark:border-dark-border">
          <h2 className="text-xl font-semibold">
            Логи: {logModalName} #{logModalId}
          </h2>

          <button onClick={closeLogModal} className="p-2 rounded-lg hover:bg-hover dark:hover:bg-dark-hover">
            <X className="w-5 h-5 opacity-70" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="overflow-auto p-4 space-y-4 text-sm">
          {loading && <div className="text-center opacity-70 py-8">Загрузка…</div>}

          {!loading && data.length === 0 && <div className="text-center opacity-70 py-8">Нет изменений</div>}

          {!loading &&
            data.map((item) => (
              <div
                key={item.id}
                className="rounded-lg p-4 border border-border dark:border-dark-border bg-surface dark:bg-dark-surface shadow-sm space-y-3"
              >
                {/* META */}
                <div className="flex items-center justify-between text-xs opacity-70">
                  <span>{item.action}</span>
                  <span>{formatDate(item.created_at)}</span>
                </div>

                {/* DIFF */}
                {item.diff_data && (
                  <JsonField label="Изменения" value={item.diff_data} />
                )}

                {/* OLD */}
                {item.old_data && (
                  <details className="text-xs">
                    <summary className="cursor-pointer opacity-70 mb-1">Старые значения</summary>
                    <JsonField value={item.old_data} />
                  </details>
                )}

                {/* NEW */}
                {item.new_data && (
                  <details className="text-xs">
                    <summary className="cursor-pointer opacity-70 mb-1">Новые значения</summary>
                    <JsonField value={item.new_data} />
                  </details>
                )}

                {/* PARAMS */}
                {item.params && (
                  <details className="text-xs">
                    <summary className="cursor-pointer opacity-70 mb-1">Параметры</summary>
                    <JsonField value={item.params} />
                  </details>
                )}

                {/* QUERY */}
                {item.query_text && (
                  <details className="text-xs">
                    <summary className="cursor-pointer opacity-70 mb-1">SQL</summary>
                    <pre className="bg-hover dark:bg-dark-hover p-2 rounded-lg border border-border dark:border-dark-border overflow-x-auto text-xs">
                      {item.query_text}
                    </pre>
                  </details>
                )}

                {/* USER */}
                <div className="text-xs opacity-70" onClick={() => openUserLogModal(item.user_id)}>Пользователь: {item.user_id}</div>
              </div>
            ))}
        </div>

        {/* FOOTER */}
        <div className="p-3 border-t border-border dark:border-dark-border flex justify-end">
          <button
            onClick={closeLogModal}
            className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

export function JsonField({ label, value }: any) {
  return (
    <div className="space-y-1 text-xs">
      {label && <div className="opacity-60">{label}</div>}

      <pre
        className="
          text-xs font-mono whitespace-pre-wrap
          bg-hover dark:bg-dark-hover p-2 rounded-lg
          border border-border dark:border-dark-border
          overflow-auto
        "
      >
        {typeof value === "string"
          ? value
          : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}