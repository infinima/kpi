import { useNotifications } from "@/store";

const errorMessages: Record<string, string> = {
    INTERNAL_ERROR: "Внутренняя ошибка сервера.",
    NO_TOKEN: "Необходим токен. Пожалуйста, войдите в систему.",
    INVALID_TOKEN: "Недействительный токен. Требуется авторизация.",
    INVALID_CREDENTIALS: "Неверный логин или пароль.",
    SESSION_NOT_FOUND: "Сессия не найдена.",
    FORBIDDEN: "У вас нет прав для выполнения этого действия.",
    USER_NOT_FOUND: "Пользователь не найден.",
    USER_DELETED: "Пользователь был удалён.",
    USER_NOT_DELETED: "Не удалось удалить пользователя.",
    CREATE_USER_FAILED: "Ошибка при создании пользователя.",
    UPDATE_USER_FAILED: "Ошибка при обновлении пользователя.",
    NO_FIELDS_FOR_UPDATE: "Нет полей для обновления.",
    EVENT_NOT_FOUND: "Мероприятие не найдено.",
    EVENT_DELETED: "Мероприятие было удалено.",
    EVENT_NOT_DELETED: "Не удалось удалить мероприятие.",
    CREATE_EVENT_FAILED: "Ошибка при создании мероприятия.",
    UPDATE_EVENT_FAILED: "Ошибка при обновлении мероприятия.",
    EVENT_HAS_RELATED_OBJECTS: "У мероприятия есть зависимые объекты.",
    LOCATION_NOT_FOUND: "Локация не найдена.",
    LOCATION_DELETED: "Локация удалена.",
    LEAGUE_NOT_FOUND: "Лига не найдена.",
    LEAGUE_DELETED: "Лига удалена.",
    TEAM_NOT_FOUND: "Команда не найдена.",
    TEAM_DELETED: "Команда удалена.",
    FAILED_TO_SEND_FILE: "Не удалось отправить файл.",
    INVALID_FILE_PATH: "Неверный путь к файлу.",
};

export function showApiError(error: any) {
    const notify = useNotifications.getState().addMessage;

    if (error?.error?.code) {
        const code = error.error.code;
        const message =
            errorMessages[code] || error.error.message || "Неизвестная ошибка";

        if (code === 'FAILED_TO_SEND_FILE') {
            return;
        }

        notify({
            type: "error",
            text: message,
        });

        return;
    }

    if (typeof error === "string") {
        notify({
            type: "error",
            text: error,
        });
        return;
    }

    if (error instanceof Error) {
        notify({
            type: "error",
            text: error.message || "Ошибка запроса",
        });
        return;
    }

    notify({
        type: "error",
        text: "Произошла неизвестная ошибка",
    });
}