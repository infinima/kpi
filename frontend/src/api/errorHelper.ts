import { useNotifications } from "@/store";

const errorMessages: Record<string, string> = {
    INTERNAL_ERROR: "Внутренняя ошибка сервера.",

    NO_TOKEN: "Необходим токен. Пожалуйста, войдите в систему.",
    INVALID_TOKEN: "Недействительный токен. Требуется авторизация.",
    INVALID_CREDENTIALS: "Неверный логин или пароль.",
    SESSION_NOT_FOUND: "Сессия не найдена.",
    INVALID_SESSION: "Сессия истекла или недействительна.",

    FORBIDDEN: "У вас нет прав для выполнения этого действия.",
    INVALID_SCOPE: "Неверный формат области прав.",

    USER_NOT_FOUND: "Пользователь не найден.",
    USER_DELETED: "Пользователь был удалён.",
    USER_NOT_DELETED: "Пользователь не удалён.",
    CREATE_USER_FAILED: "Ошибка при создании пользователя.",
    UPDATE_USER_FAILED: "Ошибка при обновлении пользователя.",
    NO_FIELDS_FOR_UPDATE: "Нет полей для обновления.",
    EMAIL_ALREADY_EXISTS: "Пользователь с таким email уже существует.",

    EVENT_NOT_FOUND: "Мероприятие не найдено.",
    EVENT_DELETED: "Мероприятие было удалено.",
    EVENT_NOT_DELETED: "Мероприятие не удалено.",
    CREATE_EVENT_FAILED: "Ошибка при создании мероприятия.",
    UPDATE_EVENT_FAILED: "Ошибка при обновлении мероприятия.",
    EVENT_HAS_RELATED_OBJECTS: "Мероприятие содержит вложенные объекты.",

    LOCATION_NOT_FOUND: "Локация не найдена.",
    LOCATION_DELETED: "Локация удалена.",
    LOCATION_NOT_DELETED: "Локация не удалена.",
    LOCATION_HAS_RELATED_OBJECTS: "Локация содержит вложенные объекты.",
    CREATE_LOCATION_FAILED: "Ошибка при создании локации.",
    UPDATE_LOCATION_FAILED: "Ошибка при обновлении локации.",

    LEAGUE_NOT_FOUND: "Лига не найдена.",
    LEAGUE_DELETED: "Лига удалена.",
    LEAGUE_HAS_RELATED_OBJECTS: "Лига содержит вложенные объекты.",
    NO_TEAMS: "В лиге нет команд.",
    INVALID_PRESENTATION_FORMAT: "Неверный формат файла презентации.",
    INVALID_PDF_SIGNATURE: "Загруженный файл не является PDF.",
    NO_FUDZI_PRESENTATION: "У лиги нет презентации Fudzi.",
    PDF_GENERATION_FAILED: "Ошибка генерации PDF.",
    UPDATE_LEAGUE_FAILED: "Ошибка при обновлении лиги.",
    INVALID_IMPORT_DATA: "Неверный формат импортируемых данных.",
    ILLEGAL_STATUS_TRANSITION: "Переход в этот статус невозможен.",
    STATUS_SIDE_EFFECT_FAILED: "Ошибка обработки смены статуса.",

    TEAM_NOT_FOUND: "Команда не найдена.",
    TEAM_DELETED: "Команда удалена.",
    TEAM_NOT_DELETED: "Команда не удалена.",
    CREATE_TEAM_FAILED: "Ошибка создания команды.",
    UPDATE_TEAM_FAILED: "Ошибка обновления команды.",
    TEAM_HAS_NO_DIPLOMA: "Команде не присвоен диплом.",

    FAILED_TO_SEND_FILE: "Не удалось отправить файл.",
    INVALID_FILE_PATH: "Неверный путь к файлу.",

    WRONG_SOCKET_TYPE: "Неверный тип Socket.IO-соединения.",
    WRONG_LEAGUE_STATUS: "Нельзя выполнить действие при текущем статусе лиги.",

    INVALID_QUESTION_NUM: "Некорректный номер вопроса.",
    INVALID_STATUS: "Недопустимый статус ответа.",
    INVALID_PENALTY: "Недопустимое значение штрафа.",
    INVALID_TEAM_ID: "Неверный идентификатор команды.",
    INVALID_HAS_CARD: "Недопустимое значение признака карточки.",

    INVALID_COLOR_SCHEME: "Неверная цветовая схема.",
    INVALID_SLIDE_NUM: "Некорректный номер слайда.",
    INVALID_TIMER_VALUE: "Некорректное значение таймера.",
    INVALID_CORRECT_DELTA: "Некорректное изменение баллов за правильный ответ.",
    INVALID_INCORRECT_DELTA: "Некорректное изменение баллов за неправильный ответ.",
    INVALID_KVARTAL: "Некорректный квартал.",
};

export function showApiError(error: any) {
    const notify = useNotifications.getState().addMessage;

    if (error?.error?.code) {
        const code = error.error.code;
        if(code === "INVALID_TOKEN"){
          return;
        }
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