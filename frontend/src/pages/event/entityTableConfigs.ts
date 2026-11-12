import type { Event } from "@/entities/event/model/event";
import type { League } from "@/entities/league/model/league";
import type { Location } from "@/entities/location/model/location";
import type { EntityTableColumn, EntityTableRowData } from "@/shared/ui/table/EntityTableRow";
import type { MouseEvent as ReactMouseEvent } from "react";
import { createElement } from "react";

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
    {
        key: "photo_album_url",
        label: "Ссылка",
        width: 1.7,
        editable: true,
        searchable: true,
        sortable: true,
        type: "text",
        renderCell: (row) => {
            const value = typeof row.photo_album_url === "string" ? row.photo_album_url.trim() : "";

            if (!value) {
                return null;
            }

            const shortValue = value.length > 10 ? `${value.slice(0, 10)}...` : value;

            return createElement(
                "a",
                {
                    href: value,
                    target: "_blank",
                    rel: "noreferrer",
                    onClick: (event: ReactMouseEvent<HTMLAnchorElement>) => event.stopPropagation(),
                    className: "truncate text-[var(--color-primary)] underline underline-offset-2",
                    title: value,
                },
                shortValue
            );
        },
    },
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
    { label: "Игры завершены", value: "GAMES_ENDED" },
    { label: "Завершено", value: "ENDED" },
];

export const leagueEntityColumns: EntityTableColumn[] = [
    { key: "id", label: "ID", width: 0.55, editable: false, searchable: true, sortable: true, type: "number" },
    { key: "location_id", label: "ID площадки", width: 0.75, editable: false, searchable: true, sortable: true, type: "number" },
    { key: "name", label: "Лига", width: 1.5, editable: true, required: true, searchable: true, sortable: true, type: "text" },
    { key: "max_teams_count", label: "Макс команд", width: 0.8, editable: true, searchable: true, sortable: true, type: "number" },
    { key: "status", label: "Статус", width: 1.45, editable: true, searchable: true, sortable: true, type: "select", options: leagueStatusOptions },
    { key: "created_at", label: "Создано", width: 1.1, editable: false, searchable: true, sortable: true, type: "text" },
    { key: "updated_at", label: "Обновлено", width: 1.1, editable: false, searchable: true, sortable: true, type: "text" },
    { key: "deleted_at", label: "Удалено", width: 1.1, editable: false, searchable: true, sortable: true, type: "text" },
];

export function mapEventEntityRows(rows: Event[]): EntityTableRowData[] {
    return rows.map((row) => ({
        id: row.id,
        name: row.name,
        date: row.date,
        created_at: row.createdAt ?? "",
        updated_at: row.updatedAt ?? "",
    }));
}

export function mapLocationEntityRows(rows: Location[]): EntityTableRowData[] {
    return rows.map((row) => ({
        id: row.id,
        event_id: row.eventId,
        name: row.name,
        address: row.address,
        photo_album_url: row.photoAlbumUrl ?? "",
        created_at: row.createdAt ?? "",
        updated_at: row.updatedAt ?? "",
    }));
}

export function mapLeagueEntityRows(rows: League[]): EntityTableRowData[] {
    return rows.map((row) => ({
        id: row.id,
        location_id: row.locationId,
        name: row.name,
        max_teams_count: row.maxTeamsCount ?? 0,
        status: row.status,
        fudzi_presentation: row.presentation ?? "",
        created_at: row.createdAt ?? "",
        updated_at: row.updatedAt ?? "",
        deleted_at: row.deletedAt ?? "",
    }));
}
