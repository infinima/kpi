import {useState} from "react";
import {ChevronDown, ChevronUp, History, ListTree, Pencil, RotateCcw, Scale, Trash} from "lucide-react";

import {useNotifications, useUI, useUser} from "@/store";
import {apiDelete, apiPost} from "@/api";
import {BaseImage} from "@/components/BaseImage";
import {formatDate} from "@/helpers/formatDate";
import {userForm} from "@/config/userForm";

export interface User {
  id: number;
  email: string;
  last_name: string;
  first_name: string;
  patronymic: string;
  tg_username: string;
  tg_full_name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string;
}

interface UserCardProps {
  user: User;
  onRefresh: () => void;
  isDeleted?: boolean;
}

export function UserCard({user, onRefresh, isDeleted = false}: UserCardProps) {
  const [open, setOpen] = useState(false);
  const openEdit = useUI((s) => s.openFormModal);
  const notify = useNotifications((s) => s.addMessage);
  const {can} = useUser();

  async function handleDelete() {
    try {
      await apiDelete(`users/${user.id}`, user.id);
      onRefresh();
    } catch {
    }
  }

  async function handleRestore() {
    try {
      await apiPost(`users/${user.id}/restore`);
      notify({type: "success", text: "Пользователь восстановлен"});
      onRefresh();
    } catch {
    }
  }

  function handleHistoryView() {
    notify({
      type: "info",
      text: "История пользователя пока не реализована",
    });
  }

  function handleChangesView() {
    notify({
      type: "info",
      text: "Просмотр изменений пользователя пока не реализован",
    });
  }

  const canUpdate = can("users", "update", user.id);
  const canDelete = can("users", "delete", user.id);
  const canRestore = can("users", "restore", user.id);
  const canHistory = can("users", "access_history", user.id);
  const canEditPermissions = can("permissions", "create");


  return (
    <div
      className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl shadow-card p-4 space-y-3 transition"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">

          {!isDeleted && (
            <BaseImage
              path={`users/${user.id}/photo`}
              alt="avatar"
              className="w-12 h-12 rounded-full object-cover border border-border dark:border-dark-border"
              fallbackLetter={user.first_name?.[0] ?? "?"}
            />
          )}

          <div>
            <p className="font-semibold text-lg">
              {user.last_name} {user.first_name}
            </p>
            <p className="text-text-secondary text-sm">{user.email}</p>
          </div>
        </div>

        <button
          onClick={() => setOpen((s) => !s)}
          className="text-primary hover:opacity-80">
          {open ? <ChevronUp/> : <ChevronDown/>}
        </button>
      </div>

      {open && (
        <div
          className="
                        pt-3 border-t border-border dark:border-dark-border
                        space-y-2 text-sm
                    "
        >
          <p><b>ID:</b> {user.id}</p>
          <p><b>Фамилия:</b> {user.last_name}</p>
          <p><b>Имя:</b> {user.first_name}</p>
          <p><b>Отчество:</b> {user.patronymic}</p>
          <p><b>Создан:</b> {formatDate(user.created_at)}</p>
          <p><b>Обновлен:</b> {formatDate(user.updated_at)}</p>
          {isDeleted && <p><b>Удален:</b> {formatDate(user.deleted_at)}</p>}

          <div className="pt-3 flex flex-wrap gap-3 w-full">

            {!isDeleted && (
              <>
                {canUpdate && (
                  <button
                    onClick={() => openEdit(userForm, user)}
                    className="px-3 py-2 flex items-center gap-2 rounded-lg bg-primary text-white hover:bg-primary-dark flex-1"
                  >
                    <Pencil size={16}/> Редактировать
                  </button>
                )}

                {canDelete && (
                  <button
                    onClick={handleDelete}
                    className="px-3 py-2 flex items-center gap-2 rounded-lg bg-error text-white hover:bg-error/80 flex-1"
                  >
                    <Trash size={16}/> Удалить
                  </button>
                )}

                {canEditPermissions && (<button
                  onClick={() => useUI.getState().openRightsModal(user.id, `${user.last_name} ${user.first_name}`)}
                  className="px-3 py-2 flex items-center gap-2 rounded-lg bg-success text-white hover:bg-success/80 flex-1"
                >
                  <Scale size={16}/> Редактировать права
                </button>)}

              </>
            )}

            {isDeleted && canRestore && (
              <button
                onClick={handleRestore}
                className="px-3 py-2 flex items-center gap-2 rounded-lg bg-success text-white hover:bg-success/80 flex-1"
              >
                <RotateCcw size={16}/> Восстановить
              </button>
            )}

            {canHistory && (
              <div className="flex flex-col gap-3 w-full">

                <button
                  onClick={handleHistoryView}
                  className="
                w-full px-3 py-2 flex items-center gap-2 rounded-lg
                bg-surface dark:bg-dark-surface
                border border-border dark:border-dark-border
                hover:bg-hover dark:hover:bg-dark-hover
            "
                >
                  <History size={16}/> История изменений
                </button>

                <button
                  onClick={handleChangesView}
                  className="
                w-full px-3 py-2 flex items-center gap-2 rounded-lg
                bg-surface dark:bg-dark-surface
                border border-border dark:border-dark-border
                hover:bg-hover dark:hover:bg-dark-hover
            "
                >
                  <ListTree size={16}/> Журнал действий
                </button>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}