export type CabinetSection = "me" | "my_team" | "reg_team" | "users" | "mailings" | "dashboard";

export type ProfileFormState = {
    first_name: string;
    last_name: string;
    patronymic: string;
    phone_number: string;
    email: string;
};

export type TeamFormState = {
    eventId: string;
    locationId: string;
    leagueId: string;
    name: string;
    school: string;
    schoolMode: string;
    region: string;
    regionMode: string;
    members: string[];
    appreciationsText: string;
    meals_count: string;
    maintainer_full_name: string;
    maintainer_activity: string;
    isReserve: boolean;
    acceptedOffer: boolean;
};

export const activityOptions = [
    "семинар учителей математики",
    "экскурсия по Технопарку (платно)",
    "мастер-класс в Технопарке (платно)",
    "заниматься своими делами",
];

export const schoolOptions = [
    "АНОО «Физтех-лицей» им. П.Л. Капицы",
    "МАОУ лицей №5 г. Долгопрудный",
    "АНОО Гимназия им. Е.М. Примакова",
    "АНОО \"Физмат-лицей имени академика В.Г. Кадышевского\"",
    "АНОО «Областной технолицей им. В. И. Долгих»",
    "ГБОУ Школа № 2101",
    "ГБОУ Школа № 57",
    "ГБОУ Школа №1543",
    "ГБОУ ФМО \"Курчатовская школа\"",
    "ГБПОУ «Воробьевы горы»",
    "ГАОУ МО \"Балашихинский лицей\"",
    "МБОУ «Гимназия №1 имени Героя РФ А.В. Баландина»",
    "МБОУ СОШ №6 г.о. Мытищи",
    "ГБОУ МО «Одинцовский «Десятый лицей»",
    "МБОУ Гимназия №1 г. Жуковский",
    "ШПЦМ",
    "Школа «Летово»",
    "ГАОУ ТО «ФМШ» Г. Тюмень",
    "Математический клуб \"Ответ\"",
    "сборная команда",
];

export const regionOptions = [
    "Московская область",
    "г. Москва",
    "г. Тверь",
    "Тверская область",
    "г. Калуга",
    "Калужская область",
    "г. Калининград",
    "г. Санкт-Петербург",
    "г. Тюмень",
];

export const customSchoolValue = "свое название";

export const customRegionValue = "свой регион";

export function isMealsCountInvalid(value: string) {
    const mealsCount = Number(value);
    return !Number.isInteger(mealsCount) || mealsCount < 0 || mealsCount > 100;
}

export const emptyTeamForm = (): TeamFormState => ({
    eventId: "",
    locationId: "",
    leagueId: "",
    name: "",
    school: "",
    schoolMode: "",
    region: "",
    regionMode: "",
    members: ["", "", "", ""],
    appreciationsText: "",
    meals_count: "0",
    maintainer_full_name: "",
    maintainer_activity: "",
    isReserve: false,
    acceptedOffer: false,
});

export function getSingleOptionId<T extends { id: number; }>(items: T[] | null | undefined) {
    if (!items || items.length !== 1) {
        return "";
    }

    return String(items[0].id);
}

export function validateTeamForm(form: TeamFormState, isEditing: boolean): string | null {
    if (!isEditing && (!form.eventId || !form.locationId || !form.leagueId)) return "Выберите мероприятие, площадку и лигу";
    if (!form.name.trim() || !form.school.trim() || !form.region.trim()) return "Заполните обязательные поля команды";
    if (form.members.length !== 4 || form.members.some((member) => !member.trim())) return "Укажите всех четырёх участников";
    if (!isEditing && !form.acceptedOffer) return "Подтвердите согласие с договором";
    if (isMealsCountInvalid(form.meals_count)) return "Количество обедов должно быть от 0 до 100";
    return null;
}

export function teamMemberPayload(form: TeamFormState) {
    return {
        members: form.members.map((member) => member.trim()),
        appreciations: form.appreciationsText.split("\n").map((value) => value.trim()).filter(Boolean),
        meals_count: Number(form.meals_count),
        maintainer_full_name: form.maintainer_full_name.trim() || null,
        maintainer_activity: form.maintainer_activity || null,
    };
}

export function validateProfile(form: ProfileFormState): string | null {
    return !form.first_name.trim() || !form.last_name.trim() || !form.phone_number.trim() ? "Заполните имя, фамилию и телефон" : null;
}
