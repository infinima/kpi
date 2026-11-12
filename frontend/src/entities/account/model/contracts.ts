export type ProfileResponse = {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    patronymic: string | null;
    phone_number: string;
    tg_username: string | null;
    tg_full_name: string | null;
};

export type RegistrationLeague = {
    id: number;
    location_id: number;
    name: string;
    status: string;
    max_teams_count: number;
    teams_count: number;
    reserve_teams_count: number;
};

export type RegistrationLocation = {
    id: number;
    event_id: number;
    name: string;
    address: string;
    leagues: RegistrationLeague[];
};

export type RegistrationEvent = {
    id: number;
    name: string;
    date: string;
    locations: RegistrationLocation[];
};

export type OwnedTeam = {
    is_paid?: boolean;
    id: number;
    league_id: number;
    owner_user_id: number | null;
    owner_can_edit?: boolean;
    name: string;
    members: string[];
    texts?: string[];
    appreciations: string[];
    school: string;
    region: string;
    meals_count: number;
    maintainer_full_name: string | null;
    maintainer_activity: string | null;
    status: "IN_RESERVE" | "ON_CHECKING" | "ACCEPTED" | "ARRIVED" | "DOCUMENTS_SUBMITTED";
    payment_link?: string | number | null;
    diploma?: "FIRST_DEGREE" | "SECOND_DEGREE" | "THIRD_DEGREE" | "PARTICIPANT" | null;
    special_nominations?: string[];
    created_at: string;
    updated_at: string;
    event_id?: number;
    event_name?: string;
    event_date?: string;
    location_id?: number;
    location_name?: string;
    location_address?: string;
    league_name?: string;
    league_status?: string;
};
