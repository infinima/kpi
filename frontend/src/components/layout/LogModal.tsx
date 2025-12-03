import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
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

interface PageResponse {
  page: LogItem[];
  current_page: number;
  page_size: number;
  total: number;
  max_page: number;
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

  // пагинация
  const [page, setPage] = useState(1);
  const [maxPage, setMaxPage] = useState(1);
  const [total, setTotal] = useState(0);


  // FETCH
  async function load(pageNum: number = page) {
    if (!logModal || !logModalName || !logModalId) return;

    setLoading(true);

    try {
      const res: PageResponse = await apiGet(
        `logs/object/${logModalName}/${logModalId}?current_page=${pageNum}`
      );

      setData(res.page || []);
      setPage(res.current_page ?? pageNum);
      setMaxPage(res.max_page ?? 1);
      setTotal(res.total ?? 0) ;

    } catch (err) {
      setData([]);
      notify({ type: "error", text: "Ошибка загрузки логов" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(1); // сбрасываем страницу
  }, [logModalId, logModalName]);

  useEffect(() => {
    if (logModal) load(page);
  }, [logModal, page]);

  if (!logModal) return null;

  // NAV
  const hasPrev = page > 1;
  const hasNext = page < maxPage;

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
          <h2 className="text-lg font-semibold">
            Логи: {logModalName} #{logModalId}
          </h2>

          <button
            onClick={closeLogModal}
            className="p-2 rounded-lg hover:bg-hover dark:hover:bg-dark-hover"
          >
            <X className="w-5 h-5 opacity-70" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-auto p-4 space-y-4 text-sm">
          {loading && <div className="text-center opacity-70 py-8">Загрузка…</div>}

          {!loading && data.length === 0 && (
            <div className="text-center opacity-70 py-8">Нет изменений</div>
          )}

          {!loading && data.length > 0 && data.map((item) => (
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
                <DetailsBlock label="Старые значения" value={item.old_data} />
              )}

              {/* NEW */}
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

              {/* USER */}
              <div
                className="text-xs opacity-70 cursor-pointer hover:underline"
                onClick={() => openUserLogModal(item.user_id)}
              >
                Пользователь: {item.user_id}
              </div>
            </div>
          ))}

        </div>

        {/* FOOTER */}
        <div className="p-3 border-t border-border dark:border-dark-border flex items-center justify-between">
          <div className="opacity-70">
            Всего: {total}
          </div>
          {/* Пагинация */}
          <div className="flex items-center gap-2 text-sm">

            <button
              disabled={!hasPrev}
              onClick={() => hasPrev && setPage(page - 1)}
              className={`
                p-2 rounded-lg border border-border dark:border-dark-border
                hover:bg-hover dark:hover:bg-dark-hover
                ${!hasPrev ? "opacity-40 cursor-not-allowed" : ""}
              `}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="opacity-70">
              {page} / {maxPage}
            </span>

            <button
              disabled={!hasNext}
              onClick={() => hasNext && setPage(page + 1)}
              className={`
                p-2 rounded-lg border border-border dark:border-dark-border
                hover:bg-hover dark:hover:bg-dark-hover
                ${!hasNext ? "opacity-40 cursor-not-allowed" : ""}
              `}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

          </div>


        </div>
      </div>
    </div>
  );
}

function JsonField({ label, value }: any) {
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
      <summary className="cursor-pointer opacity-70 mb-1">{label}</summary>

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