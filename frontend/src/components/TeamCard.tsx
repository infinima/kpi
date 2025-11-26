import { useState } from "react";
import { useNotifications, useUser } from "@/store";
import { apiDelete, apiPost } from "@/api";
import { useUI } from "@/store";

import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash,
  RotateCcw,
  History,
} from "lucide-react";

import { formatDate } from "@/helpers/formatDate";
import { teamForm } from "@/config/teamForm";

export function TeamCard({ team, onRefresh, isDeleted = false }) {
  const [open, setOpen] = useState(false);

  const notify = useNotifications((s) => s.addMessage);
  const { can } = useUser();
  const openEdit = useUI((s) => s.openFormModal);

  const canUpdate = can("teams", "update", team.id);
  const canDelete = can("teams", "delete", team.id);
  const canRestore = can("teams", "restore", team.id);
  const canHistory = can("teams", "access_history", team.id);

  async function handleDelete() {
    await apiDelete(`teams/${team.id}`);
    onRefresh();
  }

  async function handleRestore() {
    await apiPost(`teams/${team.id}/restore`);
    notify({ type: "success", text: "Команда восстановлена" });
    onRefresh();
  }

  function handleHistoryView() {
    notify({ type: "info", text: "История пока не реализована" });
  }

  const coach = team.members?.coach;
  const participants = team.members?.participants ?? [];

  return (
    <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl shadow-card p-4 space-y-3">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-lg">{team.name}</p>
          <p className="text-text-secondary text-sm">
            Тренер: {coach?.full_name ?? "—"}
          </p>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="text-primary hover:opacity-80"
        >
          {open ? <ChevronUp /> : <ChevronDown />}
        </button>
      </div>

      {/* EXPANDED AREA */}
      {open && (
        <div className="pt-3 border-t border-border dark:border-dark-border text-sm space-y-3">

          {/* BASIC INFO */}
          <p><b>ID:</b> {team.id}</p>
          <p><b>Создано:</b> {formatDate(team.created_at)}</p>
          <p><b>Обновлено:</b> {formatDate(team.updated_at)}</p>
          {isDeleted && <p><b>Удалено:</b> {formatDate(team.deleted_at)}</p>}

          {/* COACH INFO */}

            <p><b>Email:</b> {coach?.email ?? "—"}</p>

          {/* PARTICIPANTS */}
          <div className="pt-2">
            <p className="font-semibold text-base mb-1">Участники</p>

            {participants.length === 0 && (
              <p className="opacity-70">Нет участников</p>
            )}

            {participants.map((p, index) => (
              <div
                key={index}
                className="
                  p-3 rounded-lg border border-border dark:border-dark-border
                  bg-hover/50 dark:bg-dark-hover/50
                  space-y-1 mb-2
                "
              >
                <p><b>Участник #{index + 1}</b></p>
                <p><b>ФИО:</b> {p.full_name}</p>
                <p><b>Школа:</b> {p.school}</p>
              </div>
            ))}
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-3 flex flex-wrap gap-2">

            {!isDeleted && (
              <>
                {canUpdate && (
                  <button
                    onClick={() => openEdit(teamForm, team)}
                    className="px-3 py-2 flex items-center gap-2 rounded-lg bg-primary text-white hover:bg-primary-dark flex-1"
                  >
                    <Pencil size={16} /> Редактировать
                  </button>
                )}

                {canDelete && (
                  <button
                    onClick={handleDelete}
                    className="px-3 py-2 flex items-center gap-2 rounded-lg bg-error text-white hover:bg-error/80 flex-1"
                  >
                    <Trash size={16} /> Удалить
                  </button>
                )}
              </>
            )}

            {isDeleted && canRestore && (
              <button
                onClick={handleRestore}
                className="px-3 py-2 flex items-center gap-2 rounded-lg bg-success text-white hover:bg-success/80 flex-1"
              >
                <RotateCcw size={16} /> Восстановить
              </button>
            )}

            {canHistory && (
              <button
                onClick={handleHistoryView}
                className="
                  w-full px-3 py-2 flex items-center gap-2 rounded-lg
                  bg-surface dark:bg-dark-surface
                  border border-border dark:border-dark-border
                "
              >
                <History size={16}/> История изменений
              </button>
            )}

          </div>
        </div>
      )}

    </div>
  );
}