import type { TeamOut } from "../../../shared/api/schema.js";
import { mapTeamResponseRow } from "./adapters.js";
export function fromDevTeam(row: TeamOut) {
    return { ...mapTeamResponseRow({
        ...row, league_id: row.league.id, league_name: row.league.name,
        owner_user_id: row.owner.id,
        owner_full_name: [row.owner.last_name, row.owner.first_name, row.owner.patronymic].filter(Boolean).join(" "),
        owner_email: row.owner.email, owner_phone_number: row.owner.phone_number,
        meals_count: row.lunches_count, maintainer_full_name: row.accompanying_person,
        maintainer_activity: null, answers_kvartaly: null, answers_fudzi: null, diploma: null, updated_at: row.created_at,
    }), eventId: row.event.id, locationId: row.location.id, is_paid: row.is_paid, editable_fields: row.editable_fields };
}
export function toDevTeam(body: Record<string, unknown>, create = false) {
    const allowed = ["league_id", "name", "members", "school", "region", "appreciations", "documents", "is_reserve", "owner_user_id"];
    return { ...Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key) && (!create || key !== "documents"))),
        ...(body.meals_count !== undefined ? { lunches_count: body.meals_count } : {}),
        ...(body.maintainer_full_name !== undefined ? { accompanying_person: body.maintainer_full_name } : {}),
    };
}
