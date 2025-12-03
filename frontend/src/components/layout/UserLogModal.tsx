import { useEffect, useState } from "react";
import { X, ArrowLeftRight } from "lucide-react";
import { useUI, useNotifications } from "@/store";
import { apiGet } from "@/api";
import { formatDate } from "@/helpers/formatDate";

interface LogItem {
  id: number;
  table_name: string;
  record_id: number;
  action: string;
  old_data: string;
  new_data: string;
  diff_data: string;
  params: string;
  user_id: number;
  query_text: string;
  created_at: string;
}

export function UserLogModal() {
  const {
    logUserModal,
    logUserModalId,
    openLogModal,
    closeUserLogModal,
  } = useUI();

  const notify = useNotifications((s) => s.addMessage);

  const [data, setData] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(false);

  // ===== load logs
  useEffect(() => {
    if (!logUserModal || !logUserModalId) return;

    setLoading(true);

    apiGet(`logs/user/${logUserModalId}`)
      .then((res) => setData(res || []))
      .catch(() => {
        setData([]);
        notify({ type: "error", text: "Ошибка загрузки логов пользователя" });
      })
      .finally(() => setLoading(false));
  }, [logUserModal, logUserModalId]);

  if (!logUserModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">

      <div
        className="
          w-full max-w-2xl max-h-[90vh] overflow-hidden
          rounded-xl border border-border dark:border-dark-border
          bg-surface dark:bg-dark-surface shadow-card
          flex flex-col
        "
      >

        {/* ===== HEADER ===== */}
        <div
          className="
            flex items-center justify-between p-4 border-b
            border-border dark:border-dark-border
          "
        >
          <h2 className="text-lg font-semibold">
            Логи пользователя #{logUserModalId}
          </h2>

          <button
            onClick={closeUserLogModal}
            className="p-2 rounded-lg hover:bg-hover dark:hover:bg-dark-hover"
          >
            <X className="w-5 h-5 opacity-70" />
          </button>
        </div>

        {/* ===== CONTENT ===== */}
        <div className="overflow-auto p-4 space-y-4 text-sm">

          {loading && (
            <div className="text-center opacity-70 py-8">Загрузка…</div>
          )}

          {!loading && data.length === 0 && (
            <div className="text-center opacity-70 py-8">
              Нет изменений
            </div>
          )}

          {!loading &&
            data.map((item) => (
              <div
                key={item.id}
                className="
                  rounded-lg p-4 border border-border dark:border-dark-border
                  bg-white/50 dark:bg-dark-surface shadow-sm space-y-2
                "
              >
                {/* HEADER ROW */}
                <div className="flex items-center justify-between text-xs opacity-70">
                  <span>{item.action}</span>
                  <span>{formatDate(item.created_at)}</span>
                </div>

                {/* GO TO OBJECT LOGS */}
                {item.table_name && item.record_id && (
                  <button
                    onClick={() => openLogModal(item.record_id, item.table_name)}
                    className="
                      w-full text-left flex items-center gap-2 text-xs
                      px-2 py-1 rounded-lg
                      bg-primary/10 hover:bg-primary/20 dark:bg-primary/20
                      text-primary dark:text-primary
                    "
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                    Посмотреть изменения этой записи
                  </button>
                )}

                {/* DIFF */}
                {item.diff_data && (
                  <DataBlock label="Изменения" value={item.diff_data} />
                )}

                {/* OLD DATA */}
                {item.old_data && (
                  <DetailsBlock label="Старые значения" value={item.old_data} />
                )}

                {/* NEW DATA */}
                {item.new_data && (
                  <DetailsBlock label="Новые значения" value={item.new_data} />
                )}

                {/* PARAMS */}
                {item.params && (
                  <DetailsBlock label="Параметры" value={item.params} />
                )}

                {/* QUERY */}
                {item.query_text && (
                  <DetailsBlock label="SQL" value={item.query_text} mono />
                )}

              </div>
            ))}
        </div>

        {/* ===== FOOTER ===== */}
        <div
          className="
            p-3 border-t border-border dark:border-dark-border
            flex justify-end
          "
        >
          <button
            onClick={closeUserLogModal}
            className="
              px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark
            "
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

function DataBlock({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-xs opacity-60 mb-1">{label}</div>

      <pre className="
        bg-hover dark:bg-dark-hover rounded-lg p-2 text-xs whitespace-pre-wrap
        border border-border dark:border-dark-border
      ">
        {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

function DetailsBlock({
                        label,
                        value,
                        mono,
                      }: {
  label: string;
  value: any;
  mono?: boolean;
}) {
  return (
    <details className="text-xs">
      <summary className="cursor-pointer opacity-70 mb-1">
        {label}
      </summary>

      <pre
        className={`
          bg-hover dark:bg-dark-hover rounded-lg p-2 whitespace-pre-wrap text-xs
          border border-border dark:border-dark-border
          ${mono ? "font-mono overflow-x-auto" : ""}
        `}
      >
        {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}