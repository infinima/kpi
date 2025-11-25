import { FormConfig } from "./forms";

export const locationForm: FormConfig = {
    titleCreate: "Создать локацию",
    titleEdit: "Редактировать локацию",
    endpoint: "locations",
    fields: [
        {
            name: "photo",
            label: "Фото",
            type: "image",
            required: false
        },
        {
            name: "event_id",
            label: "ID мероприятия",
            type: "number",
            required: true,
            placeholder: "Введите ID мероприятия",
            hiddenWhenEditing: true   // при редактировании менять нельзя
        },
        {
            name: "name",
            label: "Название локации",
            type: "text",
            required: true,
            placeholder: "Название локации"
        },
        {
            name: "address",
            label: "Адрес",
            type: "textarea",
            required: true,
            placeholder: "Введите адрес"
        }
    ]
};