import type { UserRow } from '../../../entities/user/model/user.js';
export type { UserRow } from '../../../entities/user/model/user.js';

export type VisibilityMode = "active" | "deleted";

export type FilterKey = "full_name" | "email" | "phone_number" | "tg_id" | "created_at";

export type UserDraft = {
    last_name: string;
    first_name: string;
    patronymic: string;
    email: string;
    phone_number: string;
    tg_id: string;
};

export function formatName(user: UserRow) {
    return [user.last_name, user.first_name, user.patronymic].filter(Boolean).join(" ");
}

export function formatDate(value: string | null) {
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

export function createDraft(user: UserRow): UserDraft {
    return {
        last_name: user.last_name,
        first_name: user.first_name,
        patronymic: user.patronymic ?? "",
        email: user.email,
        phone_number: user.phone_number,
        tg_id: user.tg_id == null ? "" : String(user.tg_id),
    };
}
