import {
  X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useUI } from "@/store";
import { apiGet } from "@/api";
import { FudziLogRow } from "@/components/FudziLogRow";
import { KvartalyLogRow } from "@/components/KvartalyLogRow";

export function LogTableModal() {
  const {
    logTableModal,
    logTableModalType,
    logTableModalId,
    closeTableLogModal
  } = useUI();

  const [page, setPage] = useState(1);
  const [raw, setRaw] = useState<any[]>([]);
  const [maxPage, setMaxPage] = useState(1);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!logTableModal || !logTableModalId) return;

    setLoading(true);

    try {
      const json = await apiGet(
        `logs/object/teams/${logTableModalId}?current_page=${page}`
      );

      setRaw(json.page ?? []);
      setMaxPage(json.max_page ?? 1);
    } catch (e) {
      console.error(e);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [logTableModal, logTableModalId, page]);

  // ────────────────────────────────────────────
  // Extract SINGLE change from diff_data
  // ────────────────────────────────────────────

  function extractFudzi(record: any) {
    const oldQ = record.old_data?.answers_fudzi?.questions;
    const newQ = record.new_data?.answers_fudzi?.questions;
    if (!oldQ || !newQ) return null;

    for (let i = 0; i < newQ.length; i++) {
      const o = oldQ[i];
      const n = newQ[i];
      if (!o || !n) continue;

      if (o.status !== n.status) {
        return {
          type: "fudzi" as const,
          record,                        // <── вся лог-запись
          questionIndex: i,              // индекс вопроса (0..15)
          oldStatus: o.status,
          newStatus: n.status,
          meta: {
            created_at: record.created_at,
            user_id: record.user_id,
          },
        };
      }
    }
    return null;
  }

  function extractKvartaly(record: any) {
    const oldQ = record.old_data?.answers_kvartaly;
    const newQ = record.new_data?.answers_kvartaly;
    if (!oldQ || !newQ) return null;

    for (let qi = 0; qi < newQ.length; qi++) {
      const oq = oldQ[qi];
      const nq = newQ[qi];
      if (!oq || !nq) continue;

      for (let ai = 0; ai < nq.questions.length; ai++) {
        const o = oq.questions[ai];
        const n = nq.questions[ai];
        if (!o || !n) continue;

        if (o.correct !== n.correct || o.incorrect !== n.incorrect) {
          return {
            type: "kvartaly" as const,
            record,                  // <── лог-запись
            quarterIndex: qi,
            questionIndex: ai,
            old: { correct: o.correct, incorrect: o.incorrect },
            new: { correct: n.correct, incorrect: n.incorrect },
            meta: {
              created_at: record.created_at,
              user_id: record.user_id,
            },
          };
        }
      }
    }
    return null;
  }

  // ────────────────────────────────────────────
  // Filter + transform logs
  // ────────────────────────────────────────────

  const changes = useMemo(() => {
    if (!raw?.length) return [];

    return raw
      .map((r) => {
        if (logTableModalType === "fudzi") return extractFudzi(r);
        if (logTableModalType === "kvartaly") return extractKvartaly(r);
        return null;
      })
      .filter(Boolean) as any[];
  }, [raw, logTableModalType]);

  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [changes]);

  const item = changes[index] ?? null;

  if (!logTableModal) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-[2000] flex items-center justify-center p-4">
      <div className="bg-surface dark:bg-dark-surface rounded-xl border border-border dark:border-dark-border shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">

        {/* HEADER */}
        <div className="p-4 flex justify-between items-center border-b border-border dark:border-dark-border">
          <div className="text-lg font-semibold">
            История изменений — {logTableModalType} — команда #{logTableModalId}
          </div>

          <button onClick={closeTableLogModal}>
            <X size={24}/>
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && <div>Загрузка…</div>}

          {!loading && changes.length === 0 && (
            <div className="text-center opacity-70">
              Изменений нет
            </div>
          )}

          {!loading && item && (
            <div className="space-y-4">
              <div className="flex justify-between text-sm opacity-80">
                <div>
                  Изменение {index+1} из {changes.length}
                </div>

                <div>
                  {new Date(item.meta.created_at).toLocaleString()}
                </div>

                <div>
                  Пользователь: #{item.meta.user_id}
                </div>
              </div>

              {/* Строка таблицы в стиле таблиц + подсветка diff */}
              {item.type === "fudzi" && (
                <FudziLogRow change={item}/>
              )}

              {item.type === "kvartaly" && (
                <KvartalyLogRow change={item}/>
              )}
            </div>
          )}
        </div>

        {/* FOOTER: навигация по изменениям + пагинация */}
        <div className="p-4 border-t border-border dark:border-dark-border flex justify-between items-center">
          <div className="flex gap-2">
            <button onClick={() => setIndex(0)} disabled={index===0}>
              <ChevronsLeft/>
            </button>
            <button onClick={() => setIndex(i => Math.max(0,i-1))} disabled={index===0}>
              <ChevronLeft/>
            </button>
            <button onClick={() => setIndex(i => Math.min(changes.length-1,i+1))} disabled={index===changes.length-1}>
              <ChevronRight/>
            </button>
            <button onClick={() => setIndex(changes.length-1)} disabled={index===changes.length-1}>
              <ChevronsRight/>
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm">
            Стр {page}/{maxPage}

            <button disabled={page<=1} onClick={()=>setPage(1)}>
              <ChevronsLeft size={18}/>
            </button>
            <button disabled={page<=1} onClick={()=>setPage(p=>p-1)}>
              <ChevronLeft size={18}/>
            </button>

            <button disabled={page>=maxPage} onClick={()=>setPage(p=>p+1)}>
              <ChevronRight size={18}/>
            </button>
            <button disabled={page>=maxPage} onClick={()=>setPage(maxPage)}>
              <ChevronsRight size={18}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}