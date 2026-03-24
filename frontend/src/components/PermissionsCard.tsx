import { useState, useEffect } from "react";
import { apiPatch, apiPost, apiDelete, apiGet } from "@/api";
import { useNotifications } from "@/store";
import { confirmWithNotification } from "@/utils/confirmWithNotification";

import {
  Save,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";


export const actions = [
  "get",
  "create",
  "update",
  "delete",
  "restore",
  "access_history",
  "access_actions_history",
  "print_documents",
  "edit_answers",
  "get_show",
  "control_show",
  "edit_penalties",
  "edit_photos"
] as const;

export type PermissionAction = (typeof actions)[number];

export type PermissionObject =
  | "events"
  | "locations"
  | "leagues"
  | "teams"
  | "users"
  | "permissions"
  | "mailings";

export type PermissionScope = "global" | "local" | "nested";

export interface PermissionRow {
  id: number | null;
  user_id: number;

  object: PermissionObject | "";
  permission: PermissionAction[];

  object_id: number | null;
  scope_object: PermissionObject | null;
  scope_object_id: number | null;
}

const OBJECT_LABELS: Record<PermissionObject, string> = {
  events: "Мероприятия",
  locations: "Площадки",
  leagues: "Лиги",
  teams: "Команды",
  users: "Пользователи",
  permissions: "Права доступа",
  mailings: "Рассылки",
};

const ACTION_LABELS: Record<PermissionAction, string> = {
  get: "Просмотр",
  create: "Создание",
  update: "Редактирование",
  delete: "Удаление",
  restore: "Восстановление",
  access_history: "История изменений",
  access_actions_history: "История действий",
  print_documents: "Печать документов",
  edit_answers: "Внесение ответов команд",
  get_show: "Получение показа",
  control_show: "Управление показом",
  edit_penalties: "Изменение штрафов команд",
  edit_photos: "Загрузка фотографий"
};

const SCOPE_DESCR: Record<PermissionScope, string> = {
  global: "Действует для всех объектов этого типа.",
  local: "Только для объекта с указанным ID.",
  nested:
    "Действует для объектов внутри заданного родительского объекта (например, лиги конкретного мероприятия).",
};


interface Props {
  row: PermissionRow;
  onChangedOutside?: () => void;
}

export function PermissionsCard({ row, onChangedOutside }: Props) {
  const notify = useNotifications((s) => s.addMessage);

  const [data, setData] = useState<PermissionRow>({
    ...row,
    permission: Array.isArray(row.permission) ? row.permission : [],
  });

  const [scope, setScope] = useState<PermissionScope>("global");
  const [expanded, setExpanded] = useState(false);

  const [lookupName, setLookupName] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    setData({
      ...row,
      permission: Array.isArray(row.permission) ? row.permission : [],
    });

    if (row.object_id !== null) setScope("local");
    else if (row.scope_object !== null) setScope("nested");
    else setScope("global");
  }, [row]);

  useEffect(() => {
    async function loadName() {
      setLookupLoading(true);
      setLookupName(null);
      setLookupError(null);

      let type: string | null = null;
      let id: number | null = null;

      if (scope === "local") {
        type = data.object;
        id = data.object_id;
      } else if (scope === "nested") {
        type = data.scope_object;
        id = data.scope_object_id;
      }

      if (!type || !id) {
        setLookupLoading(false);
        return;
      }

      try {
        const result = await apiGet(`${type}/${id}`);
        setLookupName(result?.name || result?.title || "найдено");
      } catch {
        setLookupError("Не найдено");
      }

      setLookupLoading(false);
    }

    loadName();
  }, [scope, data.object, data.object_id, data.scope_object, data.scope_object_id]);



  function update(patch: Partial<PermissionRow>) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  function updateScope(newScope: PermissionScope) {
    setScope(newScope);

    if (newScope === "global") {
      update({ object_id: null, scope_object: null, scope_object_id: null });
    }

    if (newScope === "local") {
      update({
        object_id: data.object_id ?? 1,
        scope_object: null,
        scope_object_id: null,
      });
    }

    if (newScope === "nested") {
      update({
        object_id: null,
        scope_object: data.scope_object ?? "events",
        scope_object_id: data.scope_object_id ?? 1,
      });
    }
  }

  function toggleAction(a: PermissionAction) {
    const has = data.permission.includes(a);
    update({
      permission: has
        ? data.permission.filter((x) => x !== a)
        : [...data.permission, a],
    });
  }



  function validate(): string | null {
    if (!data.object) return "Выберите объект.";
    if (data.permission.length === 0) return "Выберите хотя бы одно действие.";

    if (scope === "local" && (!data.object_id || isNaN(data.object_id)))
      return "Укажите корректный ID объекта.";

    if (scope === "nested") {
      if (!data.scope_object) return "Выберите тип родительского объекта.";
      if (!data.scope_object_id || isNaN(data.scope_object_id))
        return "Укажите корректный ID родительского объекта.";
    }

    return null;
  }


  async function save() {
    const err = validate();
    if (err) return notify({ type: "warning", text: err });

    const payload = { ...data, permission: data.permission };

    if (data.id === null) {
      try {
        await apiPost("permissions", payload);
        notify({ type: "success", text: "Право добавлено" });
        onChangedOutside?.();
      } catch {}
      return;
    }

    try {
      await apiPatch(`permissions/${data.id}`, payload);
      onChangedOutside?.();
    } catch {}
  }

  async function remove() {
    if (!await confirmWithNotification({ text: "Точно удалить?" })) {
      return;
    }

    if (data.id !== null) {
      try {
        await apiDelete(`permissions/${data.id}`);
      } catch {}
    }
    onChangedOutside?.();
  }



  return (
    <div className="space-y-4 rounded-[24px] border border-[var(--color-border)] bg-[rgba(248,250,252,0.88)] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

        <div className="text-lg font-semibold flex items-center gap-1">
          #{data.id ?? "NEW"}
        </div>

        <div className="w-full sm:w-72 flex items-center gap-2">
          <span className="text-sm font-medium whitespace-nowrap">Объект:</span>

          <select
            value={data.object}
            onChange={(e) =>
              update({ object: e.target.value as PermissionObject | "" })
            }
            className="flex-1 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text-main)] outline-none"
          >
            {data.id === null && <option value="">Выберите…</option>}

            {(Object.keys(OBJECT_LABELS) as PermissionObject[]).map(
              (o) => (
                <option key={o} value={o}>
                  {OBJECT_LABELS[o]}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {/* -------- ACTIONS -------- */}
      <div>
        <div className="text-xs mb-1 opacity-70">Доступные действия</div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {actions
              .filter(a => {
                if (data.object === "permissions" && ["restore", "access_history"].includes(a)) {
                  return false;
                }

                if (data.object !== "users" && a === "access_actions_history") {
                  return false;
                }

                if (data.object !== "locations" && a === "edit_photos") {
                  return false;
                }

                if (data.object !== "leagues") {
                  if (["print_documents", "edit_answers", "get_show", "control_show", "edit_penalties"].includes(a)) {
                    return false;
                  }
                }

                return true;
              })
            .map((action) => (
              <label
                key={action}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2"
              >
                <input
                  type="checkbox"
                  checked={data.permission.includes(action)}
                  onChange={() => toggleAction(action)}
                  className="accent-primary"
                />
                <span className="text-sm">{ACTION_LABELS[action]}</span>
              </label>
            ))}
        </div>
      </div>

      {/* -------- EXPAND -------- */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-white py-2 text-sm text-[var(--color-text-main)]"
      >
        {expanded ? "Скрыть детали" : "Показать детали"}
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* -------- DETAILS -------- */}
      {expanded && (
        <div className="space-y-4 border-t border-[var(--color-border)] pt-4">

          {/* SCOPE HEADER */}
          <div className="text-center">
            <div className="text-base font-semibold">Область действия</div>
            <div className="text-xs opacity-70 mt-1">{SCOPE_DESCR[scope]}</div>
          </div>

          {/* SCOPE SELECT */}
          <div className="flex justify-center">
            <select
              value={scope}
              onChange={(e) => updateScope(e.target.value as PermissionScope)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text-main)] outline-none sm:w-64"
            >
              <option value="global">Глобальное</option>
              <option value="local">Локальное</option>
              <option value="nested">Вложенное</option>
            </select>
          </div>

          {/* LOCAL */}
          {scope === "local" && (
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
              <span className="text-base font-medium">ID объекта:</span>

              <input
                type="number"
                value={data.object_id ?? ""}
                onChange={(e) =>
                  update({
                    object_id: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="Например, 5"
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text-main)] outline-none sm:w-40"
              />

              {/* lookup result */}
              {lookupLoading && <Loader2 className="animate-spin w-4 h-4 opacity-70" />}
              {lookupError && (
                <span className="text-error text-xs">{lookupError}</span>
              )}
              {lookupName && (
                <span className="text-success text-xs">{lookupName}</span>
              )}
            </div>
          )}

          {/* NESTED */}
          {scope === "nested" && (
            <div className="space-y-3">

              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
                <span className="text-base font-medium">
                  Родительский объект:
                </span>

                <select
                  value={data.scope_object ?? ""}
                  onChange={(e) =>
                    update({ scope_object: e.target.value as PermissionObject })
                  }
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text-main)] outline-none sm:w-64"
                >
                  <option value="">— выберите тип —</option>
                  {["events", "locations", "leagues", "teams"].map((o) => (
                    <option key={o} value={o}>
                      {OBJECT_LABELS[o as PermissionObject]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
                <span className="text-base font-medium">
                  ID родительского объекта:
                </span>

                <input
                  type="number"
                  value={data.scope_object_id ?? ""}
                  onChange={(e) =>
                    update({
                      scope_object_id: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                  placeholder="Например, 12"
                  className="w-full sm:w-40 px-3 py-2 border rounded-lg bg-surface dark:bg-dark-surface dark:border-dark-border"
                />

                {/* lookup nested */}
                {lookupLoading && <Loader2 className="animate-spin w-4 h-4 opacity-70" />}
                {lookupError && (
                  <span className="text-error text-xs">{lookupError}</span>
                )}
                {lookupName && (
                  <span className="text-success text-xs">{lookupName}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------- BUTTONS -------- */}
      <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-2">
        <button
          onClick={save}
          className="w-full sm:w-auto px-4 py-2 rounded-lg bg-success text-white hover:bg-success/80 flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {data.id === null ? "Добавить" : "Сохранить"}
        </button>

        {data.id !== null && (
          <button
            onClick={remove}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-error text-white hover:bg-error/80 flex items-center justify-center gap-2"
          >
            <Trash2 size={18} />
            Удалить
          </button>
        )}
      </div>
    </div>
  );
}
