import { FormConfig } from "./forms";

export const userForm: FormConfig = {
    titleCreate: "Создать пользователя",
    titleEdit: "Редактировать пользователя",
    endpoint: "users",
    fields: [

        {
            name: "photo",
            label: "Фото",
            type: "image",
            required: false              // оставить необязательным
        },
        {
            name: "email",
            label: "Почта",
            type: "email",
            required: true,
            placeholder: "example@gmail.com"
        },
        {
            name: "password",
            label: "Пароль",
            type: "password",
            required: true,              // обязательно только при создании
            hiddenWhenEditing: true,
            placeholder: "Пароль"
        },
        {
            name: "last_name",
            label: "Фамилия",
            type: "text",
            required: true,
            placeholder: "Фамилию"
        },
        {
            name: "first_name",
            label: "Имя",
            type: "text",
            required: true,
            placeholder: "Имя"
        },
        {
            name: "patronymic",
            label: "Отчество",
            type: "text",
            required: false,             // отчество необязательно
            placeholder: "Отчество"
        },
      {
        name: "tg_id",
        label: "Телеграм ID",
        type: "number",
        required: false,             // отчество необязательно
        placeholder: "Телеграм ID"
      }
    ]
};