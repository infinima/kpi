import { FormConfig } from "./forms";

export const leagueForm: FormConfig = {
    titleCreate: "Создать лигу",
    titleEdit: "Редактировать лигу",
    endpoint: "leagues",
    fields: [
        {
            name: "photo",
            label: "Фото",
            type: "image",
            required: false
        },
        {
            name: "location_id",
            label: "ID локации",
            type: "number",
            required: true,
            placeholder: "Введите ID локации",
            hiddenWhenEditing: true
        },
        {
            name: "name",
            label: "Название лиги",
            type: "text",
            required: true,
            placeholder: "Введите название лиги"
        },
        {
            name: "status",
            label: "Статус лиги",
            type: "select",
            required: true,
            placeholder: "Выберите статус",
            options: [
                { value: "open", label: "Открыта" },
                { value: "closed", label: "Закрыта" },
                { value: "pending", label: "Ожидает" }
            ]
        }
    ]
};