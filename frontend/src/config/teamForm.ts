import { FormConfig } from "./forms";

export const teamForm: FormConfig = {
  titleCreate: "Создать команду",
  titleEdit: "Редактировать команду",
  endpoint: "teams",

  fields: [
    // ---------------- ОСНОВНОЕ ----------------
    {
      name: "name",
      label: "Название команды",
      type: "text",
      required: true,
    },
    {
      name: "league_id",
      label: "ID лиги",
      type: "number",
      hiddenWhenEditing: true,
      required: true,
    },

    // ---------------- ТРЕНЕР ----------------
    {
      name: "coach_full_name",
      label: "ФИО тренера",
      type: "text",
      required: true,
    },
    {
      name: "coach_email",
      label: "Email тренера",
      type: "email",
      required: true,
    },

    // ---------------- УЧЕНИКИ ----------------
    { name: "p1_full_name", label: "ФИО участника №1", type: "text", required: true },
    { name: "p1_school",     label: "Школа участника №1", type: "text", required: true },

    { name: "p2_full_name", label: "ФИО участника №2", type: "text", required: true },
    { name: "p2_school",     label: "Школа участника №2", type: "text", required: true },

    { name: "p3_full_name", label: "ФИО участника №3", type: "text", required: true },
    { name: "p3_school",     label: "Школа участника №3", type: "text", required: true },

    { name: "p4_full_name", label: "ФИО участника №4", type: "text", required: true },
    { name: "p4_school",     label: "Школа участника №4", type: "text", required: true },
  ],
};