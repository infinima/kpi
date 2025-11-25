import { FormConfig } from "./forms";

export const leagueForm: FormConfig = {
    titleCreate: "Создать лигу",
    titleEdit: "Редактировать лигу",
    endpoint: "leagues",
    fields: [
        {
            name: "location_id",
            label: "ID локации",
            type: "number",
            required: true,
            placeholder: "ID локации",
            hiddenWhenEditing: true
        },
        {
            name: "name",
            label: "Название лиги",
            type: "text",
            required: true,
            placeholder: "Название лиги"
        }
    ]
};