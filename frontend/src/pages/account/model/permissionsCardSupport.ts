import type { PermissionAction, PermissionObject, PermissionRow, PermissionScope } from "../../../entities/permission/model/editor.js";
export { actions } from "../../../entities/permission/model/editor.js";
export type { PermissionAction, PermissionObject, PermissionRow, PermissionScope } from "../../../entities/permission/model/editor.js";

export const OBJECT_LABELS: Record<PermissionObject, string> = {
    events: "Мероприятия",
    locations: "Площадки",
    leagues: "Лиги",
    teams: "Команды",
    users: "Пользователи",
    permissions: "Права доступа",
    mailings: "Рассылки",
};

export const ACTION_LABELS: Record<PermissionAction, string> = {
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

export const SCOPE_DESCR: Record<PermissionScope, string> = {
    global: "Действует для всех объектов этого типа.",
    local: "Только для объекта с указанным ID.",
    nested:
        "Действует для объектов внутри заданного родительского объекта (например, лиги конкретного мероприятия).",
};

export interface Props {
    row: PermissionRow;
    onChangedOutside?: () => void;
}
