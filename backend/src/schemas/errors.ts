import { registry } from "../utils/openapi.js";

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

            // ===== PERMISSIONS =====
            "FORBIDDEN",

            // ===== USERS =====
            "USER_NOT_FOUND",
            "USER_DELETED",
            "USER_NOT_DELETED",
            "CREATE_USER_FAILED",
            "UPDATE_USER_FAILED",
            "NO_FIELDS_FOR_UPDATE",

            // ===== EVENTS =====
            "EVENT_NOT_FOUND",
            "EVENT_DELETED",
            "EVENT_NOT_DELETED",
            "CREATE_EVENT_FAILED",
            "UPDATE_EVENT_FAILED",
            "NO_FIELDS_FOR_UPDATE",
            "EVENT_HAS_RELATED_OBJECTS",

            // ===== LOCATIONS =====
            "LOCATION_NOT_FOUND",
            "LOCATION_DELETED",

            // ===== LEAGUES =====
            "LEAGUE_NOT_FOUND",
            "LEAGUE_DELETED",

            // ===== TEAMS =====
            "TEAM_NOT_FOUND",
            "TEAM_DELETED",

            // ===== FILES =====
            "FAILED_TO_SEND_FILE",
            "INVALID_FILE_PATH"
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
                    code: { $ref: "#/components/schemas/EventErrorCodes" },
                    message: { type: "string" },
                    details: { type: "object", nullable: true },
                },
                required: ["code", "message"]
            }
        },
        required: ["error"]
    }
);
