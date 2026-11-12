import {
    ChevronDown,
    ChevronUp,
    Loader2,
    Save,
    Trash2,
} from "lucide-react";
import { ACTION_LABELS, actions, OBJECT_LABELS, PermissionObject, PermissionScope, SCOPE_DESCR } from '../model/permissionsCardSupport';
import type { usePermissionsCardModel } from '../model/usePermissionsCardModel';
export function PermissionsCardView(props: ReturnType<typeof usePermissionsCardModel>) {
    const {
        data,
        scope,
        expanded,
        setExpanded,
        lookupName,
        lookupLoading,
        lookupError,
        update,
        updateScope,
        toggleAction,
        save,
        remove,
    } = props;
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
