import { useLocation, useNavigate } from "react-router-dom"
import { useUser, useUI, useEventsNav } from "@/store"
import DesktopMenuBar from "@/components/layout/MenuBar/DesktopMenuBar"
import PhoneMenuBar from "@/components/layout/MenuBar/PhoneMenuBar"

export type MenuItem = {
    id: string
    title: string
    path: string
}

export function MenuBar() {
    const { mobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUI()
    const { user, can } = useUser()
    // @ts-ignore
    const { leagueId, tableType } = useEventsNav()

    const location = useLocation()
    const navigate = useNavigate()

    const menuItems: MenuItem[] = [
        { id: "home", title: "Главная", path: "/" },
        { id: "events", title: "Мероприятия", path: "/events" },
        { id: "locations", title: "Локации", path: "/locations" },
        { id: "leagues", title: "Лиги", path: "/leagues" },
        { id: "logs", title: "Логи", path: "/logs" },
        { id: "results", title: "Результаты", path: "/results" },
    ]

    if (can("users", "get") || true) {
        menuItems.push({ id: "users", title: "Пользователи", path: "/users" })
    }

    if (leagueId && can("teams", "create")|| true) {
        menuItems.push({ id: "teams", title: "Команды", path: "/teams" })
    }

    if (leagueId && can("leagues", "get_show", leagueId)|| true) {
        menuItems.push({ id: "show", title: "Показ", path: "/show" })
    }

    if (leagueId && can("leagues", "control_show", leagueId)|| true) {
        menuItems.push({
            id: "showControl",
            title: "Управление показом",
            path: "/show",
        })
    }

    if (leagueId && tableType || true) {
        menuItems.push({ id: "tables", title: "Таблицы", path: "/tables" })
    }

    const changePage = (path: string) => {
        navigate(path)
        closeMobileMenu()
    }

    return (
        <header
            className="
        sticky top-0 z-50 w-full
        border-b border-[var(--color-border)]
        bg-[rgba(255,255,255,0.72)]
        backdrop-blur-xl
        shadow-[0_8px_30px_rgba(15,23,42,0.04)]
      "
        >
            <div className="mx-auto flex items-center justify-between px-6 py-4">
                <DesktopMenuBar
                    menuItems={menuItems}
                    currentPath={location.pathname}
                    changePage={changePage}
                    user={user}
                />

                <PhoneMenuBar
                    menuItems={menuItems}
                    currentPath={location.pathname}
                    changePage={changePage}
                    mobileMenuOpen={mobileMenuOpen}
                    toggleMobileMenu={toggleMobileMenu}
                    closeMobileMenu={closeMobileMenu}
                    user={user}
                />
            </div>
        </header>
    )
}