import type { UserRow } from '../model/user.js';
import type { UserRowDto } from './contracts.js';

export function fromUserRowDto(dto: UserRowDto): UserRow {
    return {
        id: dto.id,
        email: dto.email,
        last_name: dto.last_name,
        first_name: dto.first_name,
        patronymic: dto.patronymic,
        phone_number: dto.phone_number ?? "",
        tg_id: dto.tg_id ?? null,
        tg_username: dto.tg_username ?? null,
        tg_full_name: dto.tg_full_name ?? null,
        created_at: dto.created_at,
        updated_at: dto.updated_at,
        deleted_at: dto.deleted_at,
    };
}
