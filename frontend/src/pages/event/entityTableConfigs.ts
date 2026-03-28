import type { EntityTableColumn, EntityTableRowData } from "@/components/ui/table/EntityTableRow";

export const eventEntityColumns: EntityTableColumn[] = [
    { key: "id", label: "ID", width: 0.55, editable: false, searchable: true, sortable: true, type: "number" },
    { key: "name", label: "Мероприятие", width: 2.1, editable: true, required: true, searchable: true, sortable: true, type: "text" },
    { key: "date", label: "Дата", width: 1, editable: true, required: true, searchable: true, sortable: true, type: "date" },
    { key: "created_at", label: "Создано", width: 1.1, editable: false, searchable: true, sortable: true, type: "text" },
    { key: "updated_at", label: "Обновлено", width: 1.1, editable: false, searchable: true, sortable: true, type: "text" },
];

export const locationEntityColumns: EntityTableColumn[] = [
    { key: "id", label: "ID", width: 0.55, editable: false, searchable: true, sortable: true, type: "number" },
    { key: "event_id", label: "ID мероприятия", width: 0.8, editable: false, searchable: true, sortable: true, type: "number" },
    { key: "name", label: "Площадка", width: 1.5, editable: true, required: true, searchable: true, sortable: true, type: "text" },
    { key: "address", label: "Адрес", width: 2, editable: true, required: true, searchable: true, sortable: true, type: "text" },
    { key: "created_at", label: "Создано", width: 1.1, editable: false, searchable: true, sortable: true, type: "text" },
    { key: "updated_at", label: "Обновлено", width: 1.1, editable: false, searchable: true, sortable: true, type: "text" },
];

export const leagueStatusOptions = [
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
];

export const leagueEntityColumns: EntityTableColumn[] = [
    { key: "id", label: "ID", width: 0.55, editable: false, searchable: true, sortable: true, type: "number" },
    { key: "location_id", label: "ID площадки", width: 0.75, editable: false, searchable: true, sortable: true, type: "number" },
    { key: "name", label: "Лига", width: 1.5, editable: true, required: true, searchable: true, sortable: true, type: "text" },
    { key: "max_teams_count", label: "Команд", width: 0.8, editable: true, searchable: true, sortable: true, type: "number" },
    { key: "status", label: "Статус", width: 1.45, editable: true, searchable: true, sortable: true, type: "select", options: leagueStatusOptions },
    { key: "created_at", label: "Создано", width: 1.1, editable: false, searchable: true, sortable: true, type: "text" },
    { key: "updated_at", label: "Обновлено", width: 1.1, editable: false, searchable: true, sortable: true, type: "text" },
    { key: "deleted_at", label: "Удалено", width: 1.1, editable: false, searchable: true, sortable: true, type: "text" },
];

export function mapEventEntityRows(rows: Array<{ id: number; name: string; date: string; created_at?: string; updated_at?: string; deleted_at?: string | null }>): EntityTableRowData[] {
    return rows.map((row) => ({
        id: row.id,
        name: row.name,
        date: row.date,
        created_at: row.created_at ?? "",
        updated_at: row.updated_at ?? "",
    }));
}

export function mapLocationEntityRows(rows: Array<{ id: number; event_id: number; name: string; address: string; created_at?: string; updated_at?: string; deleted_at?: string | null }>): EntityTableRowData[] {
    return rows.map((row) => ({
        id: row.id,
        event_id: row.event_id,
        name: row.name,
        address: row.address,
        created_at: row.created_at ?? "",
        updated_at: row.updated_at ?? "",
    }));
}

export function mapLeagueEntityRows(rows: Array<{ id: number; location_id: number; name: string; status: string; max_teams_count?: number; created_at?: string; updated_at?: string; deleted_at?: string | null }>): EntityTableRowData[] {
    return rows.map((row) => ({
        id: row.id,
        location_id: row.location_id,
        name: row.name,
        max_teams_count: row.max_teams_count ?? 0,
        status: row.status,
        fudzi_presentation: "fudzi_presentation" in row ? (row as { fudzi_presentation?: string | null }).fudzi_presentation ?? "" : "",
        created_at: row.created_at ?? "",
        updated_at: row.updated_at ?? "",
        deleted_at: row.deleted_at ?? "",
    }));
}
