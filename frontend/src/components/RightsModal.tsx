import { useEffect, useState } from "react";
import { useUI } from "@/store";
import { apiGet } from "@/api";
import { X, Plus } from "lucide-react";
import { PermissionsCard } from "@/components/PermissionsCard";

export const ALL_ACTIONS = [
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
  "edit_penalties"
] as const;

export type PermissionAction = typeof ALL_ACTIONS[number];

export type PermissionObject =
  | "events"
  | "locations"
  | "leagues"
  | "teams"
  | "users"
  | "permissions";

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




export function RightsModal() {
  const {
    rightsModalOpen,
    rightsUserId,
    rightsUserName,
    closeRightsModal,
  } = useUI();

  const [rows, setRows] = useState<PermissionRow[]>([]);

  // ------ ЗАГРУЗКА ------
  useEffect(() => {
    if (!rightsModalOpen || !rightsUserId) return;

    async function load() {
      const data = await apiGet(`permissions/user/${rightsUserId}`);

      // сервер отдаёт массив строк → приводим к массиву PermissionAction[]
      const parsed: PermissionRow[] = data.map((r: any) => ({
        ...r,
        permission: Array.isArray(r.permission) ? r.permission : [],
      }));

      setRows(parsed);
    }

    load();
  }, [rightsModalOpen, rightsUserId]);

  if (!rightsModalOpen) return null;

  // ------ ДОБАВИТЬ ПУСТОЕ ПРАВО ------
  function addEmptyPermission() {
    setRows((prev) => [
      ...prev,
      {
        id: null,
        user_id: rightsUserId!,
        object: "",
        permission: [],
        object_id: null,
        scope_object: null,
        scope_object_id: null,
      },
    ]);
  }

  async function reload() {
    const data = await apiGet(`permissions/user/${rightsUserId}`);
    const parsed = data.map((r: any) => ({
      ...r,
      permission: Array.isArray(r.permission) ? r.permission : [],
    }));
    setRows(parsed);
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface dark:bg-dark-surface rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* HEADER */}
        <div className="p-4 border-b border-border dark:border-dark-border flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            Права пользователя: {rightsUserName}
          </h2>

          <button onClick={closeRightsModal}>
            <X size={24} />
          </button>
        </div>

        {/* ADD BUTTON */}
        <div className="p-4 border-b border-border dark:border-dark-border">
          <button
            onClick={addEmptyPermission}
            className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark flex items-center gap-2"
          >
            <Plus size={18} />
            Добавить право
          </button>
        </div>

        {/* BODY — РИСУЕМ КАРТОЧКИ */}
        <div className="p-4 overflow-auto space-y-4">

          {rows.length === 0 && (
            <p className="opacity-70">Прав нет</p>
          )}

          {rows.map((row, i) => (
            <PermissionsCard
              key={row.id ?? `new-${i}`}
              row={row}
              onChangedOutside={reload}
            />
          ))}

        </div>
      </div>
    </div>
  );
}