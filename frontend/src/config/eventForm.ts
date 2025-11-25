import { FormConfig } from "./forms";

export const eventForm: FormConfig = {
    titleCreate: "Создать мероприятие",
    titleEdit: "Редактировать мероприятие",
    endpoint: "events",
    fields: [
        {
            name: "photo",
            label: "Фото",
            type: "image",
            required: true
        },
        {
            name: "name",
            label: "Название мероприятия",
            type: "text",
            required: true,
            placeholder: "Введите название"
        },
        {
            name: "date",
            label: "Дата",
            type: "date",
            required: true,
            placeholder: "Выберите дату"
        }
    ]
};