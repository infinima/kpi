import { useEffect, useMemo, useState } from "react";
import { KeyRound, Pencil, RotateCcw, Save, Trash2, Users, X } from "lucide-react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/api";
import OutlineButton from "@/components/ui/OutlineButton";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { useModalStore, useUser } from "@/store";
import { confirmWithNotification } from "@/utils/confirmWithNotification";

type UserRow = {
  id: number;
  email: string;
  last_name: string;
  first_name: string;
  patronymic: string | null;
  phone_number: string;
  tg_id: number | null;
  tg_username: string | null;
  tg_full_name: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type VisibilityMode = "active" | "deleted";
type FilterKey = "full_name" | "email" | "phone_number" | "tg_id" | "created_at";

type UserDraft = {
  last_name: string;
  first_name: string;
  patronymic: string;
  email: string;
  phone_number: string;
  tg_id: string;
};

function formatName(user: UserRow) {
  return [user.last_name, user.first_name, user.patronymic].filter(Boolean).join(" ");
}

function formatDate(value: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function createDraft(user: UserRow): UserDraft {
  return {
    last_name: user.last_name,
    first_name: user.first_name,
    patronymic: user.patronymic ?? "",
    email: user.email,
    phone_number: user.phone_number,
    tg_id: user.tg_id == null ? "" : String(user.tg_id),
  };
}

export function UsersSection() {
  const { user, can } = useUser();
  const openModal = useModalStore((state) => state.openModal);
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibility, setVisibility] = useState<VisibilityMode>("active");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<UserDraft | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const canRestoreGlobally = Boolean(user?.rights.users?.global?.includes("restore"));
  const canManagePermissions = can("permissions", "get") && (can("permissions", "create") || can("permissions", "update"));

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await apiGet<UserRow[]>(visibility === "deleted" ? "users/deleted" : "users", { error: true });
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setEditingId(null);
    setDraft(null);
    void loadUsers();
  }, [visibility]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return rows;
    }

    return rows.filter((row) => [
      String(row.id),
      formatName(row),
      row.email,
      row.phone_number,
      row.tg_id == null ? "" : String(row.tg_id),
      row.tg_username ?? "",
      row.tg_full_name ?? "",
      formatDate(row.created_at),
    ].some((value) => String(value).toLowerCase().includes(normalizedQuery)));
  }, [query, rows]);

  function beginEdit(row: UserRow) {
    setEditingId(row.id);
    setDraft(createDraft(row));
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  function updateDraft<K extends keyof UserDraft>(key: K, value: UserDraft[K]) {
    setDraft((current) => current ? { ...current, [key]: value } : current);
  }

  async function handleSave(row: UserRow) {
    if (!draft) {
      return;
    }

    setSavingId(row.id);
    try {
      await apiPatch(`users/${row.id}`, {
        last_name: draft.last_name.trim(),
        first_name: draft.first_name.trim(),
        patronymic: draft.patronymic.trim() || null,
        email: draft.email.trim(),
        phone_number: draft.phone_number.trim(),
        tg_id: draft.tg_id.trim() ? Number(draft.tg_id.trim()) : null,
      }, {
        success: "Пользователь обновлён",
        error: true,
      });

      await loadUsers();
      cancelEdit();
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(row: UserRow) {
    if (!await confirmWithNotification({ text: "Точно удалить пользователя?" })) {
      return;
    }

    await apiDelete(`users/${row.id}`, row.id);
    await loadUsers();
  }

  async function handleRestore(row: UserRow) {
    await apiPost(`users/${row.id}/restore`, undefined, { success: "Пользователь восстановлен", error: true });
    await loadUsers();
  }

  function renderCellInput(rowId: number, key: keyof UserDraft, placeholder: string, type: "text" | "email" | "tel" | "number" = "text") {
    const isEditing = editingId === rowId && draft;

    if (!isEditing || !draft) {
      return null;
    }

    return (
      <input
        value={draft[key]}
        onChange={(event) => updateDraft(key, event.target.value)}
        placeholder={placeholder}
        type={type}
        className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text-main)] outline-none transition placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary-light)]"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold text-[var(--color-text-main)]">Пользователи</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Управление существующими и удалёнными пользователями, редактирование полей профиля и настройка прав доступа.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[rgba(255,255,255,0.78)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)]">
            <Users size={14} className="text-[var(--color-primary)]" />
            Найдено: {filteredRows.length}
          </div>
          {canRestoreGlobally ? (
            <OutlineButton
              active
              onClick={() => setVisibility((prev) => prev === "active" ? "deleted" : "active")}
              className="px-4 py-2 text-sm"
            >
              {visibility === "active" ? "Показать удалённых" : "Показать существующих"}
            </OutlineButton>
          ) : null}
        </div>
      </div>

      <div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по пользователям..."
          className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.92)] px-4 py-3 text-[var(--color-text-main)] outline-none transition placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary-light)]"
        />
      </div>

      {loading ? (
        <div className="rounded-[28px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.84)] px-6 py-8 text-sm text-[var(--color-text-secondary)]">
          Загрузка пользователей...
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="rounded-[28px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.84)] px-6 py-8 text-sm text-[var(--color-text-secondary)]">
          Пользователи не найдены.
        </div>
      ) : (
        <section className="overflow-x-auto">
          <div className="min-w-[1800px] overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.9)] backdrop-blur-sm">
            <div
              className="grid items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-primary)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-white"
              style={{ gridTemplateColumns: "72px 280px 280px 190px 180px 180px 640px" }}
            >
              <div>ID</div>
              <div>Пользователь</div>
              <div>Email</div>
              <div>Телефон</div>
              <div>Telegram ID</div>
              <div>Создан</div>
              <div className="text-left">Действия</div>
            </div>

            <div className="divide-y divide-[var(--color-border)]">
              {filteredRows.map((row, index) => {
                const canUpdate = visibility === "active" && can("users", "update", row.id);
                const canDelete = visibility === "active" && can("users", "delete", row.id);
                const canRestore = visibility === "deleted" && can("users", "restore", row.id);
                const isEditing = editingId === row.id && draft;

                return (
                  <div
                    key={row.id}
                    className={`grid items-start gap-3 px-6 py-4 text-sm text-[var(--color-text-main)] transition ${
                      index % 2 === 0 ? "bg-[rgba(248,250,252,0.88)]" : "bg-[rgba(255,255,255,0.96)]"
                    } hover:bg-[rgba(148,163,184,0.08)]`}
                    style={{ gridTemplateColumns: "72px 280px 280px 190px 180px 180px 1300px" }}
                  >
                    <div className="pt-2 font-medium">{row.id}</div>

                    <div className="min-w-0 space-y-2">
                      {isEditing ? (
                        <>
                          {renderCellInput(row.id, "last_name", "Фамилия")}
                          {renderCellInput(row.id, "first_name", "Имя")}
                          {renderCellInput(row.id, "patronymic", "Отчество")}
                        </>
                      ) : (
                        <>
                          <div className="truncate font-medium">{formatName(row)}</div>
                          <div className="truncate text-xs text-[var(--color-text-secondary)]">
                            {row.tg_username ? `@${row.tg_username}` : row.tg_full_name || "Telegram не привязан"}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="min-w-0 pt-1">
                      {isEditing ? renderCellInput(row.id, "email", "Email", "email") : <div className="truncate">{row.email}</div>}
                    </div>

                    <div className="min-w-0 pt-1">
                      {isEditing ? renderCellInput(row.id, "phone_number", "Телефон", "tel") : <div className="truncate">{row.phone_number || "—"}</div>}
                    </div>

                    <div className="min-w-0 pt-1">
                      {isEditing ? renderCellInput(row.id, "tg_id", "Telegram ID", "number") : <div className="truncate">{row.tg_id ?? "—"}</div>}
                    </div>

                    <div className="pt-2 text-[var(--color-text-secondary)]">{formatDate(row.created_at)}</div>

                    <div className="flex flex-wrap justify-start gap-2">
                      {canManagePermissions ? (
                        <OutlineButton
                          active
                          onClick={() => openModal("rights", { userId: row.id, userName: formatName(row) || row.email })}
                          className="px-3 py-2 text-sm"
                          leftIcon={<KeyRound size={14} />}
                        >
                          Права
                        </OutlineButton>
                      ) : null}

                      {visibility === "active" && canUpdate ? (
                        isEditing ? (
                          <>
                            <PrimaryButton
                              active
                              loading={savingId === row.id}
                              onClick={() => void handleSave(row)}
                              className="px-3 py-2 text-sm shadow-none"
                              leftIcon={<Save size={14} />}
                            >
                              Сохранить
                            </PrimaryButton>
                            <OutlineButton
                              active
                              onClick={cancelEdit}
                              className="px-3 py-2 text-sm"
                              leftIcon={<X size={14} />}
                            >
                              Отмена
                            </OutlineButton>
                          </>
                        ) : (
                          <OutlineButton
                            active
                            onClick={() => beginEdit(row)}
                            className="px-3 py-2 text-sm"
                            leftIcon={<Pencil size={14} />}
                          >
                            Изменить
                          </OutlineButton>
                        )
                      ) : null}

                      {canRestore ? (
                        <OutlineButton
                          active
                          onClick={() => void handleRestore(row)}
                          className="px-3 py-2 text-sm"
                          leftIcon={<RotateCcw size={14} />}
                        >
                          Восстановить
                        </OutlineButton>
                      ) : null}

                      {canDelete ? (
                        <OutlineButton
                          active
                          onClick={() => void handleDelete(row)}
                          className="px-3 py-2 text-sm"
                          leftIcon={<Trash2 size={14} />}
                        >
                          Удалить
                        </OutlineButton>
                      ) : null}

                      {visibility === "active" && !canUpdate && !canDelete && !canManagePermissions ? (
                        <div className="pt-2 text-xs text-[var(--color-text-secondary)]">Нет доступных действий</div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
