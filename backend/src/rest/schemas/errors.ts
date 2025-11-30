import { registry } from "../../utils/openapi.js";

registry.registerComponent(
    "schemas",
    "ErrorCodes",
    {
        type: "string",
        enum: [
            // ===== GENERAL =====
            "INTERNAL_ERROR",

            // ===== AUTH =====
            "NO_TOKEN",
            "INVALID_TOKEN",
            "INVALID_CREDENTIALS",
            "SESSION_NOT_FOUND",
            "INVALID_SESSION",

            // ===== PERMISSIONS =====
            "FORBIDDEN",
            "INVALID_SCOPE",

            // ===== USERS =====
            "USER_NOT_FOUND",
            "USER_DELETED",
            "USER_NOT_DELETED",
            "EMAIL_ALREADY_EXISTS",
            "CREATE_USER_FAILED",
            "UPDATE_USER_FAILED",
            "NO_FIELDS_FOR_UPDATE",

            // ===== EVENTS =====
            "EVENT_NOT_FOUND",
            "EVENT_DELETED",
            "EVENT_NOT_DELETED",
            "EVENT_HAS_RELATED_OBJECTS",
            "CREATE_EVENT_FAILED",
            "UPDATE_EVENT_FAILED",

            // ===== LOCATIONS =====
            "LOCATION_NOT_FOUND",
            "LOCATION_DELETED",
            "LOCATION_NOT_DELETED",
            "LOCATION_HAS_RELATED_OBJECTS",
            "CREATE_LOCATION_FAILED",
            "UPDATE_LOCATION_FAILED",

            // ===== LEAGUES =====
            "LEAGUE_NOT_FOUND",
            "LEAGUE_DELETED",
            "LEAGUE_HAS_RELATED_OBJECTS",
            "NO_TEAMS",
            "INVALID_PRESENTATION_FORMAT",
            "INVALID_PDF_SIGNATURE",
            "NO_FUDZI_PRESENTATION",
            "PDF_GENERATION_FAILED",
            "UPDATE_LEAGUE_FAILED",
            "ILLEGAL_STATUS_TRANSITION",
            "INVALID_IMPORT_DATA",
            "STATUS_SIDE_EFFECT_FAILED",

            // ===== TEAMS =====
            "TEAM_NOT_FOUND",
            "TEAM_DELETED",
            "TEAM_NOT_DELETED",
            "CREATE_TEAM_FAILED",
            "UPDATE_TEAM_FAILED",

            // ===== FILES =====
            "FAILED_TO_SEND_FILE",
            "INVALID_FILE_PATH",

            // ===== SOCKET GENERAL =====
            "WRONG_SOCKET_TYPE",
            "WRONG_LEAGUE_STATUS",

            // ===== SOCKET — KVARTALY =====
            "INVALID_QUESTION_NUM",
            "INVALID_PENALTY",
            "INVALID_TEAM_ID",
            "INVALID_CORRECT_DELTA",
            "INVALID_INCORRECT_DELTA",
            "INVALID_KVARTAL",

            // ===== SOCKET — SHOW =====
            "INVALID_COLOR_SCHEME",
            "INVALID_SLIDE_NUM",
            "INVALID_TIMER_VALUE",

            // ===== SOCKET — FUDZI =====
            "INVALID_STATUS",
            "INVALID_HAS_CARD"
        ]
    }
);

registry.registerComponent(
    "schemas",
    "ErrorResponse",
    {
        type: "object",
        properties: {
            error: {
                type: "object",
                properties: {
                    code: { $ref: "#/components/schemas/ErrorCodes" },
                    message: { type: "string" },
                    details: { type: "object", nullable: true },
                },
                required: ["code", "message"]
            }
        },
        required: ["error"]
    }
);
