import { FormConfig } from "./forms";

export const locationForm: FormConfig = {
    titleCreate: "Создать площадку",
    titleEdit: "Редактировать площадку",
    endpoint: "locations",
    fields: [
        {
            name: "event_id",
            label: "ID мероприятия",
            type: "number",
            required: true,
            placeholder: "ID мероприятия",
            hiddenWhenEditing: true   // при редактировании менять нельзя
        },
        {
            name: "name",
            label: "Название площадки",
            type: "text",
            required: true,
            placeholder: "Название площадки"
        },
        {
            name: "address",
            label: "Адрес",
            type: "textarea",
            required: true,
            placeholder: "Адрес"
        }
    ]
};