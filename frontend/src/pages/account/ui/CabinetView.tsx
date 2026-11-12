import { DashboardSection } from "./DashboardSection";
import { UsersSection } from "@/pages/account/UsersSection";
import AnimatedText from "@/shared/ui/AnimatedText";
import Background from "@/shared/ui/Background";
import OutlineButton from "@/shared/ui/OutlineButton";
import PrimaryButton from "@/shared/ui/PrimaryButton";
import { motion } from "framer-motion";
import {
    LayoutDashboard,
    ChevronRight,
    CircleUserRound,
    LogIn,
    LogOut,
    Mail,
    PlusSquare,
    ScanLine,
    Trophy,
    Users
} from "lucide-react";
import { Link } from "react-router-dom";
import type { useCabinetModel } from '../model/useCabinetModel';
import { OwnedTeamsSection } from './OwnedTeamsSection';
import { ProfileSection } from './ProfileSection';
import { RegistrationSection } from './RegistrationSection';

export function CabinetView(props: ReturnType<typeof useCabinetModel>) {
    const {
        user,
        token,
        logout,
        canDashboard,
        canManageUsers,
        canManageMailings,
        canScanTeams,
        activeSection,
    } = props;
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
                            <Link to={props.authUrl}>
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

            <section className="relative mx-auto w-full max-w-none px-4 pb-20 pt-8 lg:px-5">
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

                <div className="mt-8 grid min-w-0 gap-5 lg:grid-cols-[224px_minmax(0,1fr)] 2xl:grid-cols-[240px_minmax(0,1fr)]">
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

                        {canDashboard && <Link to="/lk/dashboard" className={`mt-3 flex items-center justify-between rounded-[24px] px-4 py-4 ${activeSection === "dashboard" ? "bg-[var(--color-primary)] text-white" : "hover:bg-white/70"}`}><span className="flex items-center gap-3"><LayoutDashboard size={18} />Dashboard</span><ChevronRight size={16} /></Link>}

                        {canManageUsers ? (
                            <Link
                                to="/lk/users"
                                className={`mt-3 flex w-full items-center justify-between rounded-[24px] px-4 py-4 text-left transition ${activeSection === "users" ? "bg-[var(--color-primary)] text-white shadow-lg" : "text-[var(--color-text-main)] hover:bg-[rgba(255,255,255,0.7)]"}`}
                            >
                                <span className="flex items-center gap-3">
                                    <Users size={18} />
                                    <span>Пользователи</span>
                                </span>
                                <ChevronRight size={16} />
                            </Link>
                        ) : null}

                        {canManageMailings ? (
                            <Link
                                to="/lk/mailings"
                                className={`mt-3 flex w-full items-center justify-between rounded-[24px] px-4 py-4 text-left transition ${activeSection === "mailings" ? "bg-[var(--color-primary)] text-white shadow-lg" : "text-[var(--color-text-main)] hover:bg-[rgba(255,255,255,0.7)]"}`}
                            >
                                <span className="flex items-center gap-3">
                                    <Mail size={18} />
                                    <span>Рассылки</span>
                                </span>
                                <ChevronRight size={16} />
                            </Link>
                        ) : null}

                        {canScanTeams ? (
                            <Link
                                to="/scanner"
                                className="mt-3 flex w-full items-center justify-between rounded-[24px] px-4 py-4 text-left text-[var(--color-text-main)] transition hover:bg-[rgba(255,255,255,0.7)]"
                            >
                                <span className="flex items-center gap-3">
                                    <ScanLine size={18} />
                                    <span>Сканировать команды</span>
                                </span>
                                <ChevronRight size={16} />
                            </Link>
                        ) : null}
                    </aside>

                    <motion.div
                        key={activeSection}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="min-w-0 rounded-[36px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.84)] p-5 shadow-[0_30px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl 2xl:p-6"
                    >
                        {activeSection === "dashboard" ? <DashboardSection /> : activeSection === "me" ? <ProfileSection {...props} /> : activeSection === "my_team" ? <OwnedTeamsSection {...props} /> : activeSection === "users" ? (
                            <UsersSection />
                        ) : activeSection === "mailings" ? (
                            <p>Рассылки пока недоступны в новой API.</p>
                        ) : <RegistrationSection {...props} />}
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
