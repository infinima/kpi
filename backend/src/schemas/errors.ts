import { registry } from "../utils/openapi.js";

registry.registerComponent(
    "schemas",
    "EventErrorCodes",
    {
        type: "string",
        enum: [
            "EVENT_NOT_FOUND",
            "EVENT_DELETED",
            "LOCATION_NOT_FOUND",
            "LOCATION_DELETED",
            "LEAGUE_NOT_FOUND",
            "LEAGUE_DELETED",
            "TEAM_NOT_FOUND",
            "TEAM_DELETED",

            "FAILED_TO_SEND_FILE",
            "INVALID_FILE_PATH",

            "CREATE_EVENT_FAILED",
            "NO_FIELDS_FOR_UPDATE",
            "UPDATE_EVENT_FAILED",

            "EVENT_HAS_RELATED_OBJECTS",
            "EVENT_NOT_DELETED",

            "INTERNAL_ERROR"
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
