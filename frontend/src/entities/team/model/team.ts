export type TeamMembersValue = string[];

export type Team = {
    eventId?: number;
    locationId?: number;
    can_manage?: boolean;
    is_paid?: boolean;
    editable_fields?: string[];
    id: number;
    league_id: number;
    league_name: string;
    owner_user_id: number | null;
    owner_full_name: string;
    owner_email?: string | null;
    owner_phone_number?: string | null;
    name: string;
    members: TeamMembersValue;
    documents: string;
    texts: string[];
    appreciations: string[];
    school: string;
    region: string;
    meals_count: number;
    maintainer_full_name: string;
    maintainer_activity: string;
    status: string;
    payment_link?: string | number | null;
    diploma: string;
    special_nominations: string[];
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
};

export type TeamInfoRequest = {
    row: Team;
    canEdit: boolean;
    onSave: (row: Team) => Promise<void> | void;
    onCheckPayment?: (row: Team) => Promise<Team | void> | Team | void;
};
