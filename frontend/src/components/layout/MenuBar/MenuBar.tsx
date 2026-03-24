import { useLocation, useNavigate } from "react-router-dom"
import { useUser, useUI } from "@/store"
import DesktopMenuBar from "@/components/layout/MenuBar/DesktopMenuBar"
import PhoneMenuBar from "@/components/layout/MenuBar/PhoneMenuBar"

export type MenuItem = {
    id: string
    title: string
    path: string
}

export function MenuBar() {
    const { user, can } = useUser()

    const location = useLocation()
    const navigate = useNavigate()
    const leagueIdMatch = location.pathname.match(/\/league\/(\d+)/)
    const leagueId = leagueIdMatch?.[1] ? Number(leagueIdMatch[1]) : null
    const leagueRouteMatch = location.pathname.match(/(\/events\/\d+\/location\/\d+\/league\/\d+)/)
    const leagueRouteBase = leagueRouteMatch?.[1] ?? null

    const menuItems: MenuItem[] = [
        { id: "home", title: "Главная", path: "/" },
        { id: "events", title: "Мероприятия", path: "/events" },
        { id: "locations", title: "Локации", path: "/locations" },
        { id: "leagues", title: "Лиги", path: "/leagues" },
        { id: "logs", title: "Логи", path: "/logs" },
        { id: "results", title: "Результаты", path: "/results" },
    ]

    if (leagueId && can("leagues", "get_show", leagueId)) {
        menuItems.push({ id: "show", title: "Показ", path: `/show/${leagueId}` })
    }

    if (leagueId && can("leagues", "control_show", leagueId)) {
        menuItems.push({
            id: "showControl",
            title: "Управление показом",
            path: leagueRouteBase ? `${leagueRouteBase}/show-control` : `/showcontroller/${leagueId}`,
        })
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
                    changePage={(path: string) => navigate(path)}
                    user={user}
                />

                <PhoneMenuBar
                    menuItems={menuItems}
                    currentPath={location.pathname}
                    changePage={(path: string) => navigate(path)}
                    user={user}
                />
            </div>
        </header>
    )
}
