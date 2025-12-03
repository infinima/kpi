import { useEffect, useState } from "react";
import {
  X,
  ArrowLeftRight,
  ChevronRight,
  ChevronLeft,
  ChevronFirst,
  ChevronLast,
} from "lucide-react";
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

  // pagination
  const [page, setPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);
  const [total, setTotal] = useState(0);

  // ===== load logs
  async function loadLogs(p: number) {
    if (!logUserModal || !logUserModalId) return;

    setLoading(true);

    try {
      const res = await apiGet(
        `logs/user/${logUserModalId}?current_page=${p}`
      );

      setData(res.page || []);
      setPage(res.current_page || 1);
      setMaxPage(res.max_page || 1);
      setTotal(res.total || 0);
    } catch (err) {
      setData([]);
      notify({ type: "error", text: "Ошибка загрузки логов пользователя" });
    } finally {
      setLoading(false);
    }
  }

  // при открытии — грузим первую страницу
  useEffect(() => {
    if (!logUserModal || !logUserModalId) return;
    loadLogs(1);
  }, [logUserModal, logUserModalId]);

  // если модалка закрыта — ничего не рендерим
  if (!logUserModal) return null;

  // pagination controls
  const goFirst = () => page > 1 && loadLogs(1);
  const goPrev = () => page > 1 && loadLogs(page - 1);
  const goNext = () => page < maxPage && loadLogs(page + 1);
  const goLast = () => page < maxPage && loadLogs(maxPage);

  const disablePrev = page <= 1;
  const disableNext = page >= maxPage;

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
                    onClick={() =>
                      openLogModal(item.record_id, item.table_name)
                    }
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

        {/* ===== PAGINATION ===== */}
        <div
          className="
            p-3 border-t border-border dark:border-dark-border
            flex items-center justify-between text-sm
          "
        >
          <div className="opacity-70">
            Всего: {total}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goFirst}
              disabled={disablePrev}
              className={`
                p-2 rounded-lg border border-border dark:border-dark-border
                hover:bg-hover dark:hover:bg-dark-hover
                ${disablePrev ? "opacity-40 cursor-not-allowed" : ""}
              `}
            >
              <ChevronFirst className="w-4 h-4" />
            </button>

            <button
              onClick={goPrev}
              disabled={disablePrev}
              className={`
                p-2 rounded-lg border border-border dark:border-dark-border
                hover:bg-hover dark:hover:bg-dark-hover
                ${disablePrev ? "opacity-40 cursor-not-allowed" : ""}
              `}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2">
              {page} / {maxPage}
            </span>

            <button
              onClick={goNext}
              disabled={disableNext}
              className={`
                p-2 rounded-lg border border-border dark:border-dark-border
                hover:bg-hover dark:hover:bg-dark-hover
                ${disableNext ? "opacity-40 cursor-not-allowed" : ""}
              `}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={goLast}
              disabled={disableNext}
              className={`
                p-2 rounded-lg border border-border dark:border-dark-border
                hover:bg-hover dark:hover:bg-dark-hover
                ${disableNext ? "opacity-40 cursor-not-allowed" : ""}
              `}
            >
              <ChevronLast className="w-4 h-4" />
            </button>
          </div>
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
        {typeof value === "string"
          ? value
          : JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}