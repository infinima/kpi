import { UserRightsModal } from "@/pages/account/ui/UserRightsModal";
import { ModalPortal } from "@/shared/ui/ModalPortal";
import OutlineButton from "@/shared/ui/OutlineButton";
import PrimaryButton from "@/shared/ui/PrimaryButton";
import { History, KeyRound, ListTree, Pencil, RotateCcw, Save, Trash2, Users, X } from "lucide-react";
import { UserDraft, formatDate, formatName } from '../model/usersSupport';
import type { useUsersModel } from '../model/useUsersModel';
export function UsersView(props: ReturnType<typeof useUsersModel>) {
    const {
        navigate,
        can,
        rightsUser,
        setRightsUser,
        loading,
        visibility,
        setVisibility,
        editingId,
        draft,
        savingId,
        query,
        setQuery,
        canRestoreGlobally,
        canManagePermissions,
        filteredRows,
        beginEdit,
        cancelEdit,
        updateDraft,
        handleSave,
        handleDelete,
        handleRestore,
    } = props;
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
        <div className="min-w-0 space-y-6">
            <ModalPortal><UserRightsModal payload={rightsUser} onClose={() => setRightsUser(null)} /></ModalPortal>
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
                <section className="min-w-0 overflow-x-auto">
                    <div className="w-full min-w-[960px] overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.9)] backdrop-blur-sm">
                        <div
                            className="grid items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-primary)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-white"
                            style={{ gridTemplateColumns: "56px minmax(150px,1.2fr) minmax(170px,1.4fr) minmax(120px,0.9fr) minmax(128px,1fr) minmax(176px,1.2fr)" }}
                        >
                            <div>ID</div>
                            <div>Пользователь</div>
                            <div>Email</div>
                            <div>Телефон</div>
                            
                            <div>Создан</div>
                            <div className="text-left">Действия</div>
                        </div>

                        <div className="divide-y divide-[var(--color-border)]">
                            {filteredRows.map((row, index) => {
                                const canUpdate = visibility === "active" && can("users", "update", row.id);
                                const canDelete = visibility === "active" && can("users", "delete", row.id);
                                const canRestore = visibility === "deleted" && can("users", "restore", row.id);
                                const canHistory = can("users", "access_history", row.id);
                                const canActionsHistory = can("users", "access_actions_history", row.id);
                                const isEditing = editingId === row.id && draft;

                                return (
                                    <div
                                        key={row.id}
                                        className={`grid items-start gap-3 px-6 py-4 text-sm text-[var(--color-text-main)] transition ${index % 2 === 0 ? "bg-[rgba(248,250,252,0.88)]" : "bg-[rgba(255,255,255,0.96)]"
                                            } hover:bg-[rgba(148,163,184,0.08)]`}
                                        style={{ gridTemplateColumns: "56px minmax(150px,1.2fr) minmax(170px,1.4fr) minmax(120px,0.9fr) minmax(128px,1fr) minmax(176px,1.2fr)" }}
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
                                                </>
                                            )}
                                        </div>

                                        <div className="min-w-0 pt-1">
                                            {isEditing ? renderCellInput(row.id, "email", "Email", "email") : <div className="truncate">{row.email}</div>}
                                        </div>

                                        <div className="min-w-0 pt-1">
                                            {isEditing ? renderCellInput(row.id, "phone_number", "Телефон", "tel") : <div className="truncate">{row.phone_number || "—"}</div>}
                                        </div>

                                        <div className="pt-2 text-[var(--color-text-secondary)]">{formatDate(row.created_at)}</div>

                                        <div className="flex flex-wrap justify-start gap-2">
                                            {canManagePermissions ? (
                                                <OutlineButton
                                                    active
                                                    onClick={() => setRightsUser({ userId: row.id, userName: formatName(row) || row.email })}
                                                    className="px-3 py-2 text-sm"
                                                    leftIcon={<KeyRound size={14} />}
                                                >
                                                    Права
                                                </OutlineButton>
                                            ) : null}

                                            {canHistory ? (
                                                <OutlineButton
                                                    active
                                                    onClick={() => navigate(`/logs/users/${row.id}`)}
                                                    className="px-3 py-2 text-sm"
                                                    leftIcon={<History size={14} />}
                                                >
                                                    История
                                                </OutlineButton>
                                            ) : null}

                                            {canActionsHistory ? (
                                                <OutlineButton
                                                    active
                                                    onClick={() => navigate(`/logs/users/${row.id}/actions`)}
                                                    className="px-3 py-2 text-sm"
                                                    leftIcon={<ListTree size={14} />}
                                                >
                                                    Действия
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
