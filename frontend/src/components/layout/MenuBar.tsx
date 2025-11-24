import React from "react";
import { useUI, useNavigation, type Page } from "@/store";
import { Menu, X } from "lucide-react";

export function MenuBar({ isLoggedIn = false }) {
    const { mobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUI();
    const { currentPage, setPage } = useNavigation();

    const menuItems: { id: Page; title: string }[] = [
        { id: "home", title: "Главная" },
        { id: "events", title: "Мероприятия" },
        { id: "tables", title: "Таблицы" },
        { id: "logs", title: "Логи" },
        { id: "users", title: "Пользователи" },
    ];

    const changePage = (id: Page) => {
        setPage(id);
        closeMobileMenu();
    };

    return (
        <header className="
            w-full bg-surface dark:bg-dark-surface
            border-b border-border dark:border-dark-border
            shadow-card
        ">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

                {/* DESKTOP MENU */}
                <nav className="hidden sm:flex space-x-6 text-body font-medium">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => changePage(item.id)}
                            className={`
                                hover:text-primary transition-colors
                                ${currentPage === item.id ? "text-primary font-semibold" : ""}
                            `}
                        >
                            {item.title}
                        </button>
                    ))}
                </nav>

                {/* MOBILE BURGER */}
                <button
                    className="sm:hidden text-text-main dark:text-dark-text-main"
                    onClick={toggleMobileMenu}
                >
                    {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>

                {/* LOGIN BUTTON */}
                <button className="
                    px-4 py-2 rounded-lg
                    bg-primary hover:bg-primary-dark
                    text-white text-sm sm:text-base
                ">
                    {isLoggedIn ? "Выйти" : "Войти"}
                </button>
            </div>

            {/* MOBILE MENU DROPDOWN */}
            {mobileMenuOpen && (
                <div className="
                    sm:hidden bg-surface dark:bg-dark-surface
                    border-t border-border dark:border-dark-border
                    animate-slideDown
                ">
                    <div className="px-6 py-4 flex flex-col space-y-4 text-body">

                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => changePage(item.id)}
                                className={`
                                    text-left text-lg font-medium hover:text-primary 
                                    ${currentPage === item.id ? "text-primary" : ""}
                                `}
                            >
                                {item.title}
                            </button>
                        ))}

                    </div>
                </div>
            )}
        </header>
    );
}