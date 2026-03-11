import type { TableConfig, TableRowData } from "@/components/ui/data-table/types";

export const eventsTableConfig: TableConfig = {
    actionsWidth: 360,
    columns: [
        { key: "id", label: "ID", type: "number", width: 0.7, sortable: true, editable: false, searchable: true },
        { key: "name", label: "Мероприятие", type: "text", width: 2.1, sortable: true, editable: true, searchable: true, required: true },
        { key: "date", label: "Дата", type: "date", width: 1, sortable: true, editable: true, searchable: true, required: true },
        { key: "created_at", label: "Создано", type: "text", width: 1.1, sortable: true, editable: false, searchable: true },
        { key: "updated_at", label: "Обновлено", type: "text", width: 1.1, sortable: true, editable: false, searchable: true },
        { key: "deleted_at", label: "Удалено", type: "text", width: 1.1, sortable: true, editable: false, searchable: true },
    ],
};

export const locationsTableConfig: TableConfig = {
    actionsWidth: 360,
    columns: [
        { key: "id", label: "ID", type: "number", width: 0.7, sortable: true, editable: false, searchable: true },
        { key: "event_id", label: "Мероприятие", type: "number", width: 0.8, sortable: true, editable: false, searchable: true },
        { key: "name", label: "Площадка", type: "text", width: 1.7, sortable: true, editable: true, searchable: true, required: true },
        { key: "address", label: "Адрес", type: "text", width: 1.8, sortable: true, editable: true, searchable: true, required: true },
        { key: "created_at", label: "Создано", type: "text", width: 1.1, sortable: true, editable: false, searchable: true },
        { key: "updated_at", label: "Обновлено", type: "text", width: 1.1, sortable: true, editable: false, searchable: true },
        { key: "deleted_at", label: "Удалено", type: "text", width: 1.1, sortable: true, editable: false, searchable: true },
    ],
};

export const leaguesTableConfig: TableConfig = {
    actionsWidth: 360,
    columns: [
        { key: "id", label: "ID", type: "number", width: 0.7, sortable: true, editable: false, searchable: true },
        { key: "location_id", label: "Площадка", type: "number", width: 0.8, sortable: true, editable: false, searchable: true },
        { key: "name", label: "Лига", type: "text", width: 1.7, sortable: true, editable: true, searchable: true, required: true },
        { key: "max_teams_count", label: "Команд", type: "number", width: 0.9, sortable: true, editable: true, searchable: true },
        {
            key: "status",
            label: "Статус",
            type: "select",
            width: 1.4,
            sortable: true,
            editable: true,
            searchable: true,
            options: [
                { label: "Не началась", value: "NOT_STARTED" },
                { label: "Идёт регистрация", value: "REGISTRATION_IN_PROGRESS" },
                { label: "Регистрация завершена", value: "REGISTRATION_ENDED" },
                { label: "Команды зафиксированы", value: "TEAMS_FIXED" },
                { label: "Идёт прибытие", value: "ARRIVAL_IN_PROGRESS" },
                { label: "Прибытие завершено", value: "ARRIVAL_ENDED" },
                { label: "Кварталы", value: "KVARTALY_GAME" },
                { label: "Обед", value: "LUNCH" },
                { label: "Фудзи", value: "FUDZI_GAME" },
                { label: "Перерыв", value: "FUDZI_GAME_BREAK" },
                { label: "Игры завершены", value: "GAMES_ENDED" },
                { label: "Награждение", value: "AWARDING_IN_PROGRESS" },
                { label: "Завершено", value: "ENDED" },
            ],
        },
        { key: "created_at", label: "Создано", type: "text", width: 1.1, sortable: true, editable: false, searchable: true },
        { key: "updated_at", label: "Обновлено", type: "text", width: 1.1, sortable: true, editable: false, searchable: true },
        { key: "deleted_at", label: "Удалено", type: "text", width: 1.1, sortable: true, editable: false, searchable: true },
    ],
};

export function mapEventRows(rows: { id: number; name: string; date: string }[]): TableRowData[] {
    return rows.map((row) => ({
        id: row.id,
        name: row.name,
        date: row.date,
        created_at: (row as any).created_at ?? "",
        updated_at: (row as any).updated_at ?? "",
        deleted_at: (row as any).deleted_at ?? "",
    }));
}

export function mapLocationRows(rows: { id: number; event_id: number; name: string; address: string }[]): TableRowData[] {
    return rows.map((row) => ({
        id: row.id,
        event_id: row.event_id,
        name: row.name,
        address: row.address,
        created_at: (row as any).created_at ?? "",
        updated_at: (row as any).updated_at ?? "",
        deleted_at: (row as any).deleted_at ?? "",
    }));
}

export function mapLeagueRows(rows: { id: number; location_id: number; name: string; status: string; max_teams_count?: number }[]): TableRowData[] {
    return rows.map((row) => ({
        id: row.id,
        location_id: row.location_id,
        name: row.name,
        max_teams_count: row.max_teams_count ?? 0,
        status: row.status,
        created_at: (row as any).created_at ?? "",
        updated_at: (row as any).updated_at ?? "",
        deleted_at: (row as any).deleted_at ?? "",
    }));
}
