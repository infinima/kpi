export type LogEntity = "events" | "locations" | "leagues" | "teams" | "users" | "permissions" | "mailings";

export type PrimaryLogEntity = "events" | "locations" | "leagues" | "teams" | "users";

export type LogAction = "INSERT" | "UPDATE" | "DELETE";

export type LogUser = {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    patronymic?: string | null;
};

export type LogRecord = {
    id: number;
    table_name: LogEntity;
    record_id: number | null;
    action: LogAction;
    old_data: unknown;
    new_data: unknown;
    diff_data: unknown;
    params: unknown;
    user_id: number | null;
    query_text: string | null;
    created_at: string;
    user?: LogUser;
};

export type LogsResponse = {
    page: LogRecord[];
    current_page: number;
    page_size: number;
    total: number;
    max_page: number;
};

export type FudziStatus = "correct" | "incorrect" | "not_submitted";

export type TeamStageLogChange =
    | {
        type: "fudzi";
        record: LogRecord;
        questionIndex: number | null;
        penaltyChanged: boolean;
    }
    | {
        type: "kvartaly";
        record: LogRecord;
        quarterIndex: number | null;
        questionIndex: number | null;
        penaltyChanged: boolean;
        finishChanged: boolean;
    };
