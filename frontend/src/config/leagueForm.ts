import { FormConfig } from "./forms";

export const leagueForm: FormConfig = {
    titleCreate: "Создать лигу",
    titleEdit: "Редактировать лигу",
    endpoint: "leagues",
    fields: [
        {
            name: "location_id",
            label: "ID площадки",
            type: "number",
            required: true,
            placeholder: "ID площадки",
            hiddenWhenEditing: true
        },
        {
            name: "name",
            label: "Название лиги",
            type: "text",
            required: true,
            placeholder: "Название лиги"
        },
      {
        name: "fudzi_presentation",
        label: "Презентация Фудзи",
        type: "file",
        required: true,
        placeholder: "Файл"
      }
    ]
};