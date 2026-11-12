export type UserRowDto = {
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
