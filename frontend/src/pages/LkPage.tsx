import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    CalendarDays,
    Check,
    ChevronRight,
    CircleUserRound,
    LogIn,
    LogOut,
    MapPin,
    Pencil,
    PlusSquare,
    Trophy,
    Users
} from "lucide-react";
import Background from "@/components/layout/Background";
import AnimatedText from "@/components/ui/AnimatedText";
import PrimaryButton from "@/components/ui/PrimaryButton";
import OutlineButton from "@/components/ui/OutlineButton";
import { apiGet, apiPatch, apiPost } from "@/api";
import { useNotifications, useUser } from "@/store";

type CabinetSection = "me" | "my_team" | "reg_team";

type ProfileResponse = {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    patronymic: string | null;
    phone_number: string;
    tg_username: string | null;
    tg_full_name: string | null;
};

type RegistrationLeague = {
    id: number;
    location_id: number;
    name: string;
    status: string;
    max_teams_count: number;
    teams_count: number;
    reserve_teams_count: number;
};

type RegistrationLocation = {
    id: number;
    event_id: number;
    name: string;
    address: string;
    leagues: RegistrationLeague[];
};

type RegistrationEvent = {
    id: number;
    name: string;
    date: string;
    locations: RegistrationLocation[];
};

type OwnedTeam = {
    id: number;
    league_id: number;
    owner_user_id: number | null;
    owner_can_edit?: boolean;
    name: string;
    members: string[];
    appreciations: string[];
    school: string;
    region: string;
    meals_count: number;
    maintainer_full_name: string | null;
    maintainer_activity: string | null;
    status: "IN_RESERVE" | "ON_CHECKING" | "ACCEPTED" | "PAID";
    payment_link?: string | number | null;
    created_at: string;
    updated_at: string;
    event_id?: number;
    event_name?: string;
    event_date?: string;
    location_id?: number;
    location_name?: string;
    location_address?: string;
    league_name?: string;
    league_status?: string;
};

type LeagueDetails = {
    id: number;
    location_id: number;
    name: string;
    status: string;
};

type LocationDetails = {
    id: number;
    event_id: number;
    name: string;
    address: string;
};

type EventDetails = {
    id: number;
    name: string;
    date: string;
};

type ProfileFormState = {
    first_name: string;
    last_name: string;
    patronymic: string;
    phone_number: string;
    email: string;
};

type TeamFormState = {
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

const inputClassName = `
    w-full rounded-2xl border border-[var(--color-border)]
    bg-[rgba(255,255,255,0.92)] px-4 py-3
    text-[var(--color-text-main)] outline-none transition
    placeholder:text-[var(--color-text-secondary)]
    focus:border-[var(--color-primary-light)]
`;

const readOnlyClassName = `
    w-full rounded-2xl border border-[var(--color-border)]
    bg-[rgba(248,250,252,0.88)] px-4 py-3
    text-[var(--color-text-secondary)]
`;

const invalidInputClassName = `
    border-[rgba(220,38,38,0.4)] bg-[rgba(254,242,242,0.95)]
    text-[var(--color-text-main)] placeholder:text-[rgba(127,29,29,0.6)]
    focus:border-[rgba(220,38,38,0.65)]
`;

const activityOptions = [
    "семинар учителей математики",
    "экскурсия по Технопарку (платно)",
    "мастер-класс в Технопарке (платно)",
    "заниматься своими делами",
];

const schoolOptions = [
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

const regionOptions = [
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

const customSchoolValue = "свое название";
const customRegionValue = "свой регион";

const teamStatusLabels: Record<OwnedTeam["status"], string> = {
    IN_RESERVE: "В резерве",
    ON_CHECKING: "На проверке",
    ACCEPTED: "Принята",
    PAID: "Оплачена",
};

function getTeamStatusLabel(status: OwnedTeam["status"] | undefined) {
    if (!status) {
        return "Неизвестно";
    }

    return teamStatusLabels[status] ?? status;
}

function getTeamPaymentLink(team: OwnedTeam) {
    const rawValue = team.payment_link;

    if (rawValue === null || rawValue === undefined) {
        return null;
    }

    const normalizedValue = String(rawValue).trim();

    if (!normalizedValue || normalizedValue === "0") {
        return null;
    }

    return normalizedValue;
}

function isMealsCountInvalid(value: string) {
    const mealsCount = Number(value);
    return !Number.isInteger(mealsCount) || mealsCount < 0 || mealsCount > 5;
}

function getTeamFormMissingFields(form: TeamFormState, isEditing: boolean) {
    const missingFields: string[] = [];
    return missingFields;
}

function withValidationClass(baseClassName: string, isInvalid: boolean) {
    return isInvalid ? `${baseClassName} ${invalidInputClassName}` : baseClassName;
}

function RequiredLabel({ children, invalid = false }: { children: ReactNode; invalid?: boolean }) {
    return (
        <span className={`text-sm ${invalid ? "text-[rgba(185,28,28,0.95)]" : "text-[var(--color-text-secondary)]"}`}>
            {children} <span className="text-[rgba(220,38,38,0.9)]">*</span>
        </span>
    );
}

const emptyTeamForm = (): TeamFormState => ({
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

function InfoBadge({ icon, text }: { icon: ReactNode; text: string }) {
    return (
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[rgba(255,255,255,0.78)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)]">
            <span className="text-[var(--color-primary)]">{icon}</span>
            <span>{text}</span>
        </div>
    );
}

function formatEventDate(value: string) {
    try {
        return new Date(value).toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    } catch {
        return value;
    }
}

function formatDateTime(value: string) {
    try {
        return new Date(value).toLocaleString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return value;
    }
}

export default function LkPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const user = useUser((state) => state.user);
    const token = useUser((state) => state.token);
    const fetchUser = useUser((state) => state.fetchUser);
    const logout = useUser((state) => state.logout);
    const notify = useNotifications((state) => state.addMessage);

    const [profileForm, setProfileForm] = useState<ProfileFormState>({
        first_name: "",
        last_name: "",
        patronymic: "",
        phone_number: "",
        email: "",
    });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileSaving, setProfileSaving] = useState(false);

    const [registrationData, setRegistrationData] = useState<RegistrationEvent[]>([]);
    const [registrationLoading, setRegistrationLoading] = useState(false);
    const [ownedTeams, setOwnedTeams] = useState<OwnedTeam[]>([]);
    const [ownedTeamsLoading, setOwnedTeamsLoading] = useState(false);
    const [teamSaving, setTeamSaving] = useState(false);
    const [teamForm, setTeamForm] = useState<TeamFormState>(emptyTeamForm);
    const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
    const [teamSubmitAttempted, setTeamSubmitAttempted] = useState(false);

    useEffect(() => {
        if (!user?.id) {
            return;
        }

        let cancelled = false;

        async function loadProfile() {
            try {
                setProfileLoading(true);
                const data = await apiGet<ProfileResponse>(`users/${user?.id}`, { error: true });

                if (cancelled) {
                    return;
                }

                setProfileForm({
                    first_name: data.first_name ?? "",
                    last_name: data.last_name ?? "",
                    patronymic: data.patronymic ?? "",
                    phone_number: data.phone_number ?? "",
                    email: data.email ?? "",
                });
            } finally {
                if (!cancelled) {
                    setProfileLoading(false);
                }
            }
        }

        void loadProfile();

        return () => {
            cancelled = true;
        };
    }, [user?.id]);

    useEffect(() => {
        if (!token) {
            return;
        }

        let cancelled = false;

        async function loadRegistrationOptions() {
            try {
                setRegistrationLoading(true);
                const data = await apiGet<RegistrationEvent[]>("events/registration", { error: true });

                if (cancelled) {
                    return;
                }

                setRegistrationData(data);
            } finally {
                if (!cancelled) {
                    setRegistrationLoading(false);
                }
            }
        }

        void loadRegistrationOptions();

        return () => {
            cancelled = true;
        };
    }, [token]);

    useEffect(() => {
        if (!token) {
            return;
        }

        let cancelled = false;

        async function loadOwnedTeams() {
            try {
                setOwnedTeamsLoading(true);
                const data = await apiGet<OwnedTeam[]>("teams/my", { error: true });

                const enrichedTeams = await Promise.all(
                    data.map(async (team) => {
                        try {
                            const league = await apiGet<LeagueDetails>(`leagues/${team.league_id}`);
                            const location = await apiGet<LocationDetails>(`locations/${league.location_id}`);
                            const event = await apiGet<EventDetails>(`events/${location.event_id}`);

                            return {
                                ...team,
                                league_name: league.name,
                                league_status: league.status,
                                location_id: location.id,
                                location_name: location.name,
                                location_address: location.address,
                                event_id: event.id,
                                event_name: event.name,
                                event_date: event.date,
                            };
                        } catch {
                            return team;
                        }
                    })
                );

                if (cancelled) {
                    return;
                }

                setOwnedTeams(enrichedTeams);
            } finally {
                if (!cancelled) {
                    setOwnedTeamsLoading(false);
                }
            }
        }

        void loadOwnedTeams();

        return () => {
            cancelled = true;
        };
    }, [token]);

    const selectedEvent = useMemo(
        () => registrationData.find((event) => String(event.id) === teamForm.eventId) ?? null,
        [registrationData, teamForm.eventId]
    );

    const selectedLocation = useMemo(
        () => selectedEvent?.locations.find((location) => String(location.id) === teamForm.locationId) ?? null,
        [selectedEvent, teamForm.locationId]
    );

    const selectedLeague = useMemo(
        () => selectedLocation?.leagues.find((league) => String(league.id) === teamForm.leagueId) ?? null,
        [selectedLocation, teamForm.leagueId]
    );

    const hasUnlimitedPlaces = Boolean(selectedLeague && selectedLeague.max_teams_count <= 0);

    const availablePlaces = useMemo(() => {
        if (editingTeamId) {
            return null;
        }

        if (!selectedLeague) {
            return null;
        }

        if (selectedLeague.max_teams_count <= 0) {
            return null;
        }

        return Math.max(0, selectedLeague.max_teams_count - selectedLeague.teams_count);
    }, [editingTeamId, selectedLeague]);

    const editingTeam = useMemo(
        () => ownedTeams.find((team) => team.id === editingTeamId) ?? null,
        [editingTeamId, ownedTeams]
    );

    const activeSection = useMemo<CabinetSection>(() => {
        if ( location.pathname === "/lk/reg_team") {
            return "reg_team";
        }

        if (location.pathname === "/lk/my_team") {
            return "my_team";
        }

        return "me";
    }, [location.pathname]);

    useEffect(() => {
        if (registrationData.length === 0) {
            return;
        }

        setTeamForm((prev) => {
            if (prev.eventId) {
                return prev;
            }

            const firstEvent = registrationData[0];
            const firstLocation = firstEvent?.locations[0];

            return {
                ...prev,
                eventId: firstEvent ? String(firstEvent.id) : "",
                locationId: firstLocation ? String(firstLocation.id) : "",
                leagueId: "",
            };
        });
    }, [registrationData]);

    useEffect(() => {
        if (!selectedEvent) {
            return;
        }

        setTeamForm((prev) => {
            const hasCurrentLocation = selectedEvent.locations.some((location) => String(location.id) === prev.locationId);
            if (hasCurrentLocation) {
                return prev;
            }

            const firstLocation = selectedEvent.locations[0];

            return {
                ...prev,
                locationId: firstLocation ? String(firstLocation.id) : "",
                leagueId: "",
            };
        });
    }, [selectedEvent]);

    useEffect(() => {
        if (editingTeamId) {
            return;
        }

        setTeamForm((prev) => {
            const shouldReserve = !hasUnlimitedPlaces && availablePlaces === 0;
            return prev.isReserve === shouldReserve ? prev : { ...prev, isReserve: shouldReserve };
        });
    }, [availablePlaces, editingTeamId, hasUnlimitedPlaces]);

    function handleProfileFieldChange(field: keyof ProfileFormState, value: string) {
        setProfileForm((prev) => ({ ...prev, [field]: value }));
    }

    function applyTeamToForm(team: OwnedTeam) {
        setEditingTeamId(team.id);
        setTeamSubmitAttempted(false);
        setTeamForm({
            eventId: team.event_id ? String(team.event_id) : "",
            locationId: team.location_id ? String(team.location_id) : "",
            leagueId: String(team.league_id),
            name: team.name ?? "",
            school: team.school ?? "",
            schoolMode: schoolOptions.includes(team.school) ? team.school : customSchoolValue,
            region: team.region ?? "",
            regionMode: regionOptions.includes(team.region) ? team.region : customRegionValue,
            members: Array.isArray(team.members) && team.members.length === 4 ? team.members : ["", "", "", ""],
            appreciationsText: Array.isArray(team.appreciations) ? team.appreciations.join("\n") : "",
            meals_count: String(team.meals_count ?? 0),
            maintainer_full_name: team.maintainer_full_name ?? "",
            maintainer_activity: team.maintainer_activity ?? "",
            isReserve: team.status === "IN_RESERVE",
            acceptedOffer: true,
        });
        void navigate("/lk/reg_team");
    }

    function resetTeamEditor() {
        setEditingTeamId(null);
        setTeamSubmitAttempted(false);
        setTeamForm(emptyTeamForm());
        void navigate("/lk/my_team");
    }

    function handleMemberChange(index: number, value: string) {
        setTeamForm((prev) => ({
            ...prev,
            members: prev.members.map((member, memberIndex) => memberIndex === index ? value : member),
        }));
    }

    function handleEventChange(value: string) {
        setTeamForm((prev) => ({
            ...prev,
            eventId: value,
            locationId: "",
            leagueId: "",
        }));
    }

    function handleLocationChange(value: string) {
        setTeamForm((prev) => ({
            ...prev,
            locationId: value,
            leagueId: "",
        }));
    }

    function handleSchoolModeChange(value: string) {
        setTeamForm((prev) => ({
            ...prev,
            schoolMode: value,
            school: value && value !== customSchoolValue ? value : "",
        }));
    }

    function handleRegionModeChange(value: string) {
        setTeamForm((prev) => ({
            ...prev,
            regionMode: value,
            region: value && value !== customRegionValue ? value : "",
        }));
    }

    async function handleProfileSave() {
        if (!user?.id) {
            return;
        }

        if (!profileForm.first_name.trim() || !profileForm.last_name.trim() || !profileForm.phone_number.trim()) {
            notify({ type: "warning", text: "Заполните имя, фамилию и телефон" });
            return;
        }

        try {
            setProfileSaving(true);
            await apiPatch(`users/${user.id}`, {
                first_name: profileForm.first_name.trim(),
                last_name: profileForm.last_name.trim(),
                patronymic: profileForm.patronymic.trim() || null,
                phone_number: profileForm.phone_number.trim(),
            }, {
                success: "Личные данные сохранены",
                error: true,
            });
            await fetchUser();
        } finally {
            setProfileSaving(false);
        }
    }

    async function handleTeamSubmit() {
        setTeamSubmitAttempted(true);

        if (!editingTeamId && (!teamForm.eventId || !teamForm.locationId || !teamForm.leagueId)) {
            notify({ type: "warning", text: "Выберите мероприятие, площадку и лигу" });
            return;
        }

        if (
            !teamForm.name.trim() ||
            !teamForm.school.trim() ||
            !teamForm.region.trim() ||
            !teamForm.maintainer_activity
        ) {
            notify({ type: "warning", text: "Заполните обязательные поля команды и выберите активность сопровождающего" });
            return;
        }

        if (teamForm.members.some((member) => !member.trim())) {
            notify({ type: "warning", text: "Укажите всех четырёх участников" });
            return;
        }

        if (!editingTeamId && !teamForm.acceptedOffer) {
            notify({ type: "warning", text: "Подтвердите согласие с офертой" });
            return;
        }

        const mealsCount = Number(teamForm.meals_count);
        if (!Number.isInteger(mealsCount) || mealsCount < 0 || mealsCount > 5) {
            notify({ type: "warning", text: "Количество обедов должно быть от 0 до 5" });
            return;
        }

        try {
            setTeamSaving(true);
            const payload = {
                name: teamForm.name.trim(),
                members: teamForm.members.map((member) => member.trim()),
                appreciations: teamForm.appreciationsText
                    .split("\n")
                    .map((value) => value.trim())
                    .filter(Boolean),
                school: teamForm.school.trim(),
                region: teamForm.region.trim(),
                meals_count: mealsCount,
                maintainer_full_name: teamForm.maintainer_full_name.trim() || null,
                maintainer_activity: teamForm.maintainer_activity || null,
            };

            if (editingTeamId) {
                await apiPatch(`teams/${editingTeamId}`, payload, {
                    success: "Команда обновлена",
                    error: true,
                });
            } else {
                await apiPost("teams", {
                    league_id: Number(teamForm.leagueId),
                    owner_user_id: user?.id,
                    is_reserve: teamForm.isReserve,
                    ...payload,
                }, {
                    success: "Команда зарегистрирована",
                    error: true,
                });
            }

            const [updatedRegistrationData, updatedOwnedTeams] = await Promise.all([
                apiGet<RegistrationEvent[]>("events/registration"),
                apiGet<OwnedTeam[]>("teams/my").then(async (teams) => Promise.all(
                    teams.map(async (team) => {
                        try {
                            const league = await apiGet<LeagueDetails>(`leagues/${team.league_id}`);
                            const location = await apiGet<LocationDetails>(`locations/${league.location_id}`);
                            const event = await apiGet<EventDetails>(`events/${location.event_id}`);

                            return {
                                ...team,
                                league_name: league.name,
                                league_status: league.status,
                                location_id: location.id,
                                location_name: location.name,
                                location_address: location.address,
                                event_id: event.id,
                                event_name: event.name,
                                event_date: event.date,
                            };
                        } catch {
                            return team;
                        }
                    })
                )),
            ]);

            setRegistrationData(updatedRegistrationData);
            setOwnedTeams(updatedOwnedTeams);
            setEditingTeamId(null);
            setTeamSubmitAttempted(false);
            setTeamForm(emptyTeamForm());
            void navigate("/lk/my_team");
        } finally {
            setTeamSaving(false);
        }
    }

    if (!token) {
        return (
            <div className="relative min-h-screen overflow-hidden">
                <Background active />

                <section className="relative mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
                    <div className="w-full rounded-[36px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.88)] p-8 shadow-[0_30px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-10">
                        <AnimatedText
                            as="h1"
                            text="Личный кабинет"
                            className="text-4xl font-semibold tracking-tight text-[var(--color-text-main)] sm:text-5xl"
                        />

                        <p className="mt-4 max-w-2xl text-base text-[var(--color-text-secondary)]">
                            Для продолжения нужно войти в аккаунт или создать его.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link to="/auth">
                                <PrimaryButton active leftIcon={<LogIn size={18} />}>
                                    Войти / зарегистрироваться
                                </PrimaryButton>
                            </Link>
                            <Link to="/">
                                <OutlineButton active>
                                    Вернуться на главную
                                </OutlineButton>
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="relative min-h-screen overflow-hidden">
                <Background active />

                <section className="relative mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
                    <div className="w-full rounded-[36px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.88)] p-8 shadow-[0_30px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-10">
                        <AnimatedText
                            as="h1"
                            text="Загружаем личный кабинет"
                            className="text-4xl font-semibold tracking-tight text-[var(--color-text-main)] sm:text-5xl"
                        />
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-hidden">
            <Background active />

            <section className="relative mx-auto max-w-8xl px-6 pb-20 pt-12">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                        <AnimatedText
                            as="h1"
                            text="Личный кабинет"
                            className="text-4xl font-semibold tracking-tight text-[var(--color-text-main)] sm:text-5xl"
                        />
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Link to="/">
                            <OutlineButton
                                active
                            >
                                На главную
                            </OutlineButton>
                        </Link>
                        <OutlineButton
                            active
                            leftIcon={<LogOut size={16} />}
                            onClick={() => {
                                void logout();
                            }}
                        >
                            Выйти
                        </OutlineButton>
                    </div>
                </div>

                <div className="mt-10 grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <aside className="rounded-[32px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.80)] p-4 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                        <Link
                            to="/lk/me"
                            className={`flex w-full items-center justify-between rounded-[24px] px-4 py-4 text-left transition ${activeSection === "me" ? "bg-[var(--color-primary)] text-white shadow-lg" : "text-[var(--color-text-main)] hover:bg-[rgba(255,255,255,0.7)]"}`}
                        >
                            <span className="flex items-center gap-3">
                                <CircleUserRound size={18} />
                                <span>Личные данные</span>
                            </span>
                            <ChevronRight size={16} />
                        </Link>

                        <Link
                            to="/lk/my_team"
                            className={`mt-3 flex w-full items-center justify-between rounded-[24px] px-4 py-4 text-left transition ${activeSection === "my_team" ? "bg-[var(--color-primary)] text-white shadow-lg" : "text-[var(--color-text-main)] hover:bg-[rgba(255,255,255,0.7)]"}`}
                        >
                            <span className="flex items-center gap-3">
                                <Trophy size={18} />
                                <span>Мои команды</span>
                            </span>
                            <ChevronRight size={16} />
                        </Link>

                        <Link
                            to="/lk/reg_team"
                            className={`mt-3 flex w-full items-center justify-between rounded-[24px] px-4 py-4 text-left transition ${activeSection === "reg_team" ? "bg-[var(--color-primary)] text-white shadow-lg" : "text-[var(--color-text-main)] hover:bg-[rgba(255,255,255,0.7)]"}`}
                        >
                            <span className="flex items-center gap-3">
                                <PlusSquare size={18} />
                                <span>Регистрация команды</span>
                            </span>
                            <ChevronRight size={16} />
                        </Link>
                    </aside>

                    <motion.div
                        key={activeSection}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-[36px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.84)] p-6 shadow-[0_30px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-8"
                    >
                        {activeSection === "me" ? (
                            <div>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="text-2xl font-semibold text-[var(--color-text-main)]">
                                            Личные данные
                                        </h2>
                                    </div>
                                </div>

                                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                                    <label className="block space-y-2">
                                        <span className="text-sm text-[var(--color-text-secondary)]">Имя</span>
                                        <input
                                            value={profileForm.first_name}
                                            onChange={(event) => handleProfileFieldChange("first_name", event.target.value)}
                                            className={inputClassName}
                                        />
                                    </label>

                                    <label className="block space-y-2">
                                        <span className="text-sm text-[var(--color-text-secondary)]">Фамилия</span>
                                        <input
                                            value={profileForm.last_name}
                                            onChange={(event) => handleProfileFieldChange("last_name", event.target.value)}
                                            className={inputClassName}
                                        />
                                    </label>

                                    <label className="block space-y-2">
                                        <span className="text-sm text-[var(--color-text-secondary)]">Отчество</span>
                                        <input
                                            value={profileForm.patronymic}
                                            onChange={(event) => handleProfileFieldChange("patronymic", event.target.value)}
                                            placeholder="Необязательно"
                                            className={inputClassName}
                                        />
                                    </label>

                                    <label className="block space-y-2">
                                        <span className="text-sm text-[var(--color-text-secondary)]">Телефон</span>
                                        <input
                                            value={profileForm.phone_number}
                                            onChange={(event) => handleProfileFieldChange("phone_number", event.target.value)}
                                            placeholder="+7 999 123-45-67"
                                            className={inputClassName}
                                        />
                                    </label>

                                    <label className="block space-y-2 sm:col-span-2">
                                        <span className="text-sm text-[var(--color-text-secondary)]">Email</span>
                                        <input
                                            value={profileForm.email}
                                            readOnly
                                            className={readOnlyClassName}
                                        />
                                    </label>
                                </div>

                                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-sm text-[var(--color-text-secondary)]">
                                        {profileLoading ? "Профиль загружается..." : ""}
                                    </p>

                                    <PrimaryButton
                                        active
                                        loading={profileSaving}
                                        loadingText="Сохраняем..."
                                        leftIcon={<Check size={18} />}
                                        onClick={handleProfileSave}
                                    >
                                        Сохранить
                                    </PrimaryButton>
                                </div>
                            </div>
                        ) : activeSection === "my_team" ? (
                            <div>
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="max-w-2xl">
                                        <h2 className="text-2xl font-semibold text-[var(--color-text-main)]">
                                            Мои команды
                                        </h2>
                                        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                                            Здесь собраны все ваши заявки. Можно посмотреть текущий статус и открыть нужную команду на редактирование.
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                        <InfoBadge
                                            icon={<Users size={14} />}
                                            text={`Команд: ${ownedTeams.length}`}
                                        />
                                        <Link to="/lk/reg_team">
                                            <PrimaryButton active leftIcon={<PlusSquare size={16} />}>
                                                Новая команда
                                            </PrimaryButton>
                                        </Link>
                                    </div>
                                </div>

                                {ownedTeamsLoading ? (
                                    <div className="mt-8 rounded-[28px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.65)] p-6 text-sm text-[var(--color-text-secondary)]">
                                        Загружаем ваши команды...
                                    </div>
                                ) : ownedTeams.length === 0 ? (
                                    <div className="mt-8 rounded-[32px] border border-dashed border-[var(--color-border)] bg-[rgba(255,255,255,0.55)] p-8">
                                        <h3 className="text-lg font-semibold text-[var(--color-text-main)]">
                                            Команд пока нет
                                        </h3>
                                        <p className="mt-2 max-w-xl text-sm text-[var(--color-text-secondary)]">
                                            Создайте первую заявку на турнир. После отправки она появится на этой странице со статусом и возможностью редактирования.
                                        </p>
                                        <div className="mt-6">
                                            <Link to="/lk/reg_team">
                                                <PrimaryButton active leftIcon={<PlusSquare size={16} />}>
                                                    Перейти к регистрации
                                                </PrimaryButton>
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-8 grid gap-5">
                                        {ownedTeams.map((team) => (
                                            <div
                                                key={team.id}
                                                className={`rounded-[32px] border p-6 transition ${
                                                    editingTeamId === team.id
                                                        ? "border-[var(--color-primary)] bg-[rgba(255,255,255,0.96)] shadow-[0_18px_50px_rgba(15,23,42,0.10)]"
                                                        : "border-[var(--color-border)] bg-[rgba(255,255,255,0.74)]"
                                                }`}
                                            >
                                                {(() => {
                                                    const paymentLink = getTeamPaymentLink(team);
                                                    const shouldShowPaymentLink = team.status === "ACCEPTED" && Boolean(paymentLink);
                                                    const shouldShowPaidState = team.status === "PAID";

                                                    return (
                                                <div className="flex flex-col gap-6">
                                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                        <div className="space-y-4">
                                                            <div className="flex flex-wrap items-center gap-3">
                                                                <h4 className="text-lg font-semibold text-[var(--color-text-main)]">
                                                                    {team.name}
                                                                </h4>
                                                                <span className="rounded-full bg-[rgba(15,23,42,0.06)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
                                                                    {getTeamStatusLabel(team.status)}
                                                                </span>
                                                                {editingTeamId === team.id ? (
                                                                    <span className="rounded-full bg-[rgba(14,116,144,0.12)] px-3 py-1 text-xs font-medium text-[var(--color-primary)]">
                                                                        Сейчас редактируется
                                                                    </span>
                                                                ) : null}
                                                            </div>

                                                            <div className="flex flex-wrap gap-3">
                                                                <InfoBadge
                                                                    icon={<Trophy size={14} />}
                                                                    text={team.event_name ?? "Мероприятие не указано"}
                                                                />
                                                                <InfoBadge
                                                                    icon={<MapPin size={14} />}
                                                                    text={team.location_name ?? "Площадка не указана"}
                                                                />
                                                                <InfoBadge
                                                                    icon={<Users size={14} />}
                                                                    text={team.league_name ?? "Лига не указана"}
                                                                />
                                                                <InfoBadge
                                                                    icon={<CalendarDays size={14} />}
                                                                    text={formatEventDate(team.event_date ?? "")}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col gap-3 sm:flex-row">
                                                            {team.owner_can_edit ? (
                                                                <OutlineButton
                                                                    active
                                                                    leftIcon={<Pencil size={16} />}
                                                                    onClick={() => applyTeamToForm(team)}
                                                                >
                                                                    Изменить
                                                                </OutlineButton>
                                                            ) : null}
                                                        </div>
                                                    </div>

                                                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                                                        <div className="rounded-[24px] border border-[var(--color-border)] bg-[rgba(248,250,252,0.72)] p-5">
                                                            <p className="text-sm font-medium text-[var(--color-text-main)]">
                                                                Состав команды
                                                            </p>
                                                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                                                {team.members.map((member, index) => (
                                                                    <div
                                                                        key={`${team.id}-${index}`}
                                                                        className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-[var(--color-text-main)]"
                                                                    >
                                                                        <span className="block text-xs text-[var(--color-text-secondary)]">
                                                                            Участник {index + 1}
                                                                        </span>
                                                                        <span className="mt-1 block font-medium">
                                                                            {member}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="rounded-[24px] border border-[var(--color-border)] bg-[rgba(248,250,252,0.72)] p-5">
                                                            <p className="text-sm font-medium text-[var(--color-text-main)]">
                                                                Данные заявки
                                                            </p>
                                                            <div className="mt-4 space-y-3 text-sm">
                                                                <div>
                                                                    <span className="text-[var(--color-text-secondary)]">Статус</span>
                                                                    <p className="mt-1 text-[var(--color-text-main)]">{getTeamStatusLabel(team.status)}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-[var(--color-text-secondary)]">Учебное заведение</span>
                                                                    <p className="mt-1 text-[var(--color-text-main)]">{team.school}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-[var(--color-text-secondary)]">Регион</span>
                                                                    <p className="mt-1 text-[var(--color-text-main)]">{team.region}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-[var(--color-text-secondary)]">Сопровождающий</span>
                                                                    <p className="mt-1 text-[var(--color-text-main)]">{team.maintainer_full_name || "Не указан"}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-[var(--color-text-secondary)]">Активность сопровождающего</span>
                                                                    <p className="mt-1 text-[var(--color-text-main)]">{team.maintainer_activity || "Не выбрана"}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-[var(--color-text-secondary)]">Количество обедов</span>
                                                                    <p className="mt-1 text-[var(--color-text-main)]">{team.meals_count}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="text-[var(--color-text-secondary)]">Обновлено</span>
                                                                    <p className="mt-1 text-[var(--color-text-main)]">{formatDateTime(team.updated_at)}</p>
                                                                </div>
                                                                {shouldShowPaymentLink ? (
                                                                    <div className="rounded-2xl border border-[rgba(14,116,144,0.18)] bg-[rgba(14,116,144,0.08)] p-4">
                                                                        <span className="text-[var(--color-text-secondary)]">Оплата участия</span>
                                                                        <p className="mt-1 text-[var(--color-text-main)]">
                                                                            Ваша заявка одобрена. Пожалуйста, оплатите участие по ссылке ниже.
                                                                        </p>
                                                                        <a
                                                                            href={paymentLink!}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                                                                        >
                                                                            Перейти к оплате
                                                                            <ChevronRight size={16} />
                                                                        </a>
                                                                    </div>
                                                                ) : null}
                                                                {shouldShowPaidState ? (
                                                                    <div className="rounded-2xl border border-[rgba(34,197,94,0.18)] bg-[rgba(34,197,94,0.08)] p-4">
                                                                        <span className="text-[var(--color-text-secondary)]">Оплата участия</span>
                                                                        <p className="mt-1 text-[var(--color-text-main)]">
                                                                            Участие полностью оплачено.
                                                                        </p>
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                    );
                                                })()}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="max-w-2xl">
                                        <h2 className="text-2xl font-semibold text-[var(--color-text-main)]">
                                            Регистрация команды
                                        </h2>
                                    </div>
                                </div>

                                {registrationLoading ? (
                                    <p className="mt-8 text-sm text-[var(--color-text-secondary)]">
                                        Загружаем доступные турниры...
                                    </p>
                                ) : registrationData.length === 0 && !editingTeam ? (
                                    <div className="mt-8 rounded-[28px] border border-dashed border-[var(--color-border)] bg-[rgba(255,255,255,0.55)] p-6 text-sm text-[var(--color-text-secondary)]">
                                        Сейчас нет лиг с открытой регистрацией.
                                    </div>
                                ) : (
                                    <>
                                        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold text-[var(--color-text-main)]">
                                                    {editingTeam ? `Редактирование команды «${editingTeam.name}»` : "Новая заявка"}
                                                </h3>
                                            </div>

                                            {editingTeam ? (
                                                <OutlineButton
                                                    active
                                                    onClick={resetTeamEditor}
                                                >
                                                    Отменить редактирование
                                                </OutlineButton>
                                            ) : null}
                                        </div>

                                        {editingTeam ? (
                                            <div className="mt-6 flex flex-wrap gap-3">
                                                <InfoBadge
                                                    icon={<Check size={14} />}
                                                    text={`Статус: ${getTeamStatusLabel(editingTeam.status)}`}
                                                />
                                                <InfoBadge
                                                    icon={<CalendarDays size={14} />}
                                                    text={`Дата: ${formatEventDate(editingTeam.event_date ?? "")}`}
                                                />
                                                <InfoBadge
                                                    icon={<Trophy size={14} />}
                                                    text={`Мероприятие: ${editingTeam.event_name ?? "не указано"}`}
                                                />
                                                <InfoBadge
                                                    icon={<MapPin size={14} />}
                                                    text={`Площадка: ${editingTeam.location_name ?? "не указана"}`}
                                                />
                                                <InfoBadge
                                                    icon={<Users size={14} />}
                                                    text={`Лига: ${editingTeam.league_name ?? "не указана"}`}
                                                />
                                            </div>
                                        ) : (
                                            <div className="mt-8 grid gap-5 lg:grid-cols-3">
                                                <label className="block space-y-2">
                                                    <RequiredLabel invalid={teamSubmitAttempted && !teamForm.eventId}>Мероприятие</RequiredLabel>
                                                    <select
                                                        value={teamForm.eventId}
                                                        onChange={(event) => handleEventChange(event.target.value)}
                                                        className={withValidationClass(inputClassName, teamSubmitAttempted && !teamForm.eventId)}
                                                    >
                                                        <option value="">Выберите мероприятие</option>
                                                        {registrationData.map((event) => (
                                                            <option key={event.id} value={event.id}>
                                                                {event.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>

                                                <label className="block space-y-2">
                                                    <RequiredLabel invalid={teamSubmitAttempted && !teamForm.locationId}>Площадка</RequiredLabel>
                                                    <select
                                                        value={teamForm.locationId}
                                                        onChange={(event) => handleLocationChange(event.target.value)}
                                                        className={withValidationClass(inputClassName, teamSubmitAttempted && !teamForm.locationId)}
                                                        disabled={!selectedEvent}
                                                    >
                                                        <option value="">Выберите площадку</option>
                                                        {selectedEvent?.locations.map((location) => (
                                                            <option key={location.id} value={location.id}>
                                                                {location.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>

                                                <label className="block space-y-2">
                                                    <RequiredLabel invalid={teamSubmitAttempted && !teamForm.leagueId}>Лига</RequiredLabel>
                                                    <select
                                                        value={teamForm.leagueId}
                                                        onChange={(event) => setTeamForm((prev) => ({ ...prev, leagueId: event.target.value }))}
                                                        className={withValidationClass(inputClassName, teamSubmitAttempted && !teamForm.leagueId)}
                                                        disabled={!selectedLocation}
                                                    >
                                                        <option value="">Выберите лигу</option>
                                                        {selectedLocation?.leagues.map((league) => (
                                                            <option key={league.id} value={league.id}>
                                                                {league.name}{league.max_teams_count > 0 && league.teams_count >= league.max_teams_count ? " (резерв)" : ""}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>
                                            </div>
                                        )}

                                        {!editingTeam && selectedEvent ? (
                                            <div className="mt-6 flex flex-wrap gap-3">
                                                <InfoBadge
                                                    icon={<CalendarDays size={14} />}
                                                    text={`Дата: ${formatEventDate(selectedEvent.date)}`}
                                                />
                                                {selectedLocation ? (
                                                    <InfoBadge
                                                        icon={<MapPin size={14} />}
                                                        text={`Адрес: ${selectedLocation.address}`}
                                                    />
                                                ) : null}
                                                {selectedLeague ? (
                                                    <InfoBadge
                                                        icon={<Users size={14} />}
                                                        text={hasUnlimitedPlaces ? "Мест неограниченно" : `Осталось мест: ${availablePlaces ?? 0}`}
                                                    />
                                                ) : null}
                                            </div>
                                        ) : null}

                                        {!editingTeam && selectedLeague && !hasUnlimitedPlaces && availablePlaces === 0 ? (
                                            <div className="mt-6 rounded-[24px] border border-[rgba(245,158,11,0.28)] bg-[rgba(245,158,11,0.10)] px-5 py-4">
                                                <p className="text-sm font-medium text-[var(--color-text-main)]">
                                                    Свободные места закончились. Сейчас доступна регистрация ТОЛЬКО в резерв.
                                                </p>
                                            </div>
                                        ) : null}

                                        <div className="mt-8 grid gap-5 sm:grid-cols-2">
                                            <label className="block space-y-2 sm:col-span-2">
                                                <RequiredLabel invalid={teamSubmitAttempted && !teamForm.name.trim()}>Название команды</RequiredLabel>
                                                <input
                                                    value={teamForm.name}
                                                    onChange={(event) => setTeamForm((prev) => ({ ...prev, name: event.target.value }))}
                                                    placeholder="Пифагоры"
                                                    className={withValidationClass(inputClassName, teamSubmitAttempted && !teamForm.name.trim())}
                                                />
                                            </label>

                                            <label className="block space-y-2">
                                                <RequiredLabel invalid={teamSubmitAttempted && !teamForm.schoolMode}>Учебное заведение команды</RequiredLabel>
                                                <select
                                                    value={teamForm.schoolMode}
                                                    onChange={(event) => handleSchoolModeChange(event.target.value)}
                                                    className={withValidationClass(inputClassName, teamSubmitAttempted && !teamForm.schoolMode)}
                                                >
                                                    <option value="">Выберите учебное заведение</option>
                                                    {schoolOptions.map((option) => (
                                                        <option key={option} value={option}>
                                                            {option}
                                                        </option>
                                                    ))}
                                                    <option value={customSchoolValue}>{customSchoolValue}</option>
                                                </select>
                                            </label>

                                            <label className="block space-y-2">
                                                <RequiredLabel invalid={teamSubmitAttempted && !teamForm.regionMode}>Регион</RequiredLabel>
                                                <select
                                                    value={teamForm.regionMode}
                                                    onChange={(event) => handleRegionModeChange(event.target.value)}
                                                    className={withValidationClass(inputClassName, teamSubmitAttempted && !teamForm.regionMode)}
                                                >
                                                    <option value="">Выберите регион</option>
                                                    {regionOptions.map((option) => (
                                                        <option key={option} value={option}>
                                                            {option}
                                                        </option>
                                                    ))}
                                                    <option value={customRegionValue}>{customRegionValue}</option>
                                                </select>
                                            </label>

                                            {teamForm.schoolMode === customSchoolValue ? (
                                                <label className="block space-y-2">
                                                    <RequiredLabel invalid={teamSubmitAttempted && !teamForm.school.trim()}>Свое учебное заведение</RequiredLabel>
                                                    <input
                                                        value={teamForm.school}
                                                        onChange={(event) => setTeamForm((prev) => ({ ...prev, school: event.target.value }))}
                                                        className={withValidationClass(inputClassName, teamSubmitAttempted && !teamForm.school.trim())}
                                                    />
                                                </label>
                                            ) : null}

                                            {teamForm.regionMode === customRegionValue ? (
                                                <label className="block space-y-2">
                                                    <RequiredLabel invalid={teamSubmitAttempted && !teamForm.region.trim()}>Свой регион</RequiredLabel>
                                                    <input
                                                        value={teamForm.region}
                                                        onChange={(event) => setTeamForm((prev) => ({ ...prev, region: event.target.value }))}
                                                        className={withValidationClass(inputClassName, teamSubmitAttempted && !teamForm.region.trim())}
                                                    />
                                                </label>
                                            ) : null}

                                            {teamForm.members.map((member, index) => (
                                                <label key={index} className="block space-y-2">
                                                    <RequiredLabel invalid={teamSubmitAttempted && !member.trim()}>Участник {index + 1}</RequiredLabel>
                                                    <input
                                                        value={member}
                                                        onChange={(event) => handleMemberChange(index, event.target.value)}
                                                        placeholder="Фамилия Имя"
                                                        className={withValidationClass(inputClassName, teamSubmitAttempted && !member.trim())}
                                                    />
                                                </label>
                                            ))}

                                            <label className="block space-y-2">
                                                <span className="text-sm text-[var(--color-text-secondary)]">Сопровождающий</span>
                                                <input
                                                    value={teamForm.maintainer_full_name}
                                                    onChange={(event) => setTeamForm((prev) => ({ ...prev, maintainer_full_name: event.target.value }))}
                                                    placeholder="ФИО сопровождающего"
                                                    required
                                                    className={inputClassName}
                                                />
                                            </label>

                                            <label className="block space-y-2">
                                                <RequiredLabel invalid={teamSubmitAttempted && !teamForm.maintainer_activity}>Активность сопровождающего</RequiredLabel>
                                                <select
                                                    value={teamForm.maintainer_activity}
                                                    onChange={(event) => setTeamForm((prev) => ({ ...prev, maintainer_activity: event.target.value }))}
                                                    required
                                                    className={withValidationClass(inputClassName, teamSubmitAttempted && !teamForm.maintainer_activity)}
                                                >
                                                    <option value="">Не выбрано</option>
                                                    {activityOptions.map((option) => (
                                                        <option key={option} value={option}>
                                                            {option}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>

                                            <label className="block space-y-2">
                                                <RequiredLabel invalid={teamSubmitAttempted && isMealsCountInvalid(teamForm.meals_count)}>Количество обедов</RequiredLabel>
                                                <span className="block text-xs text-[var(--color-text-secondary)]">
                                                    Цена: 400 рублей за человека, сопровождающего тоже нужно учитывать.
                                                </span>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={5}
                                                    value={teamForm.meals_count}
                                                    onChange={(event) => setTeamForm((prev) => ({ ...prev, meals_count: event.target.value }))}
                                                    className={withValidationClass(inputClassName, teamSubmitAttempted && isMealsCountInvalid(teamForm.meals_count))}
                                                />
                                            </label>

                                            <label className="block space-y-2 sm:col-span-2">
                                                <span className="text-sm text-[var(--color-text-secondary)]">Благодарности</span>
                                                <textarea
                                                    value={teamForm.appreciationsText}
                                                    onChange={(event) => setTeamForm((prev) => ({ ...prev, appreciationsText: event.target.value }))}
                                                    placeholder={`По одной строчке на каждого человека, например:\nИванов Иван Сергеевич\nПетрова Мария Алексеевна\nСмирнов Алексей Дмитриевич`}
                                                    rows={4}
                                                    className={`${inputClassName} resize-none`}
                                                />
                                            </label>
                                        </div>

                                        {!editingTeam ? (
                                            <label className={`mt-6 flex items-start gap-3 rounded-[24px] border bg-[rgba(255,255,255,0.72)] px-4 py-4 ${
                                                teamSubmitAttempted && !teamForm.acceptedOffer
                                                    ? "border-[rgba(220,38,38,0.35)] bg-[rgba(254,242,242,0.92)]"
                                                    : "border-[var(--color-border)]"
                                            }`}>
                                                <input
                                                    type="checkbox"
                                                    checked={teamForm.acceptedOffer}
                                                    onChange={(event) => setTeamForm((prev) => ({ ...prev, acceptedOffer: event.target.checked }))}
                                                    className="mt-1 h-4 w-4 rounded border-[var(--color-border)]"
                                                />
                                                <span className="text-sm text-[var(--color-text-secondary)]">
                                                    <span className="text-[rgba(220,38,38,0.9)]">*</span>{" "}
                                                    Подавая заявку на регистрацию вы автоматически соглашаетесь с {" "}
                                                    <a href="/offer" target="_blank" rel="noreferrer" className="text-[var(--color-primary)] underline underline-offset-2">
                                                        офертой
                                                    </a>
                                                    .
                                                </span>
                                            </label>
                                        ) : null}

                                        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex flex-col gap-3 sm:flex-row">
                                                {editingTeam ? (
                                                    <OutlineButton
                                                        active
                                                        onClick={resetTeamEditor}
                                                    >
                                                        Отменить
                                                    </OutlineButton>
                                                ) : null}
                                                <PrimaryButton
                                                    active
                                                    loading={teamSaving}
                                                    loadingText={editingTeam ? "Сохраняем..." : (teamForm.isReserve ? "Записываем в очередь..." : "Отправляем...")}
                                                    leftIcon={<Check size={18} />}
                                                    onClick={handleTeamSubmit}
                                                >
                                                    {editingTeam
                                                        ? "Сохранить изменения"
                                                        : (teamForm.isReserve ? "Зарегистрироваться в очередь" : "Подать заявку")}
                                                </PrimaryButton>
                                            </div>
                                        </div>

                                        {!editingTeam ? (
                                            <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
                                                Заявка поступит на рассмотрение. Вы получите уведомление о результате рассмотрения на электронную почту.
                                            </p>
                                        ) : null}
                                    </>
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
