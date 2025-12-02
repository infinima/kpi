import {Page, useNavigation, useUser} from "@/store";
import { useUI } from "@/store";
import { useEventsNav } from "@/store";
import { Menu, X, Sun, Moon } from "lucide-react";
import { BaseImage } from "@/components/BaseImage";

export function MenuBar() {
  const { mobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUI();
  const { currentPage, setPage } = useNavigation();
  const { user, can } = useUser();
  const { theme, toggleTheme } = useUI();

  // @ts-ignore
  const { leagueId, tableType } = useEventsNav();  // <-- тут узнаём, выбрана ли лига

  // Базовое меню
  const menuItems: { id: Page; title: string }[] = [
    { id: "home", title: "Главная" },
    { id: "events", title: "Мероприятия" },
  ];

  // Пользователи — по правам
  if (can("users", "get")) {
    menuItems.push({ id: "users", title: "Пользователи" });
  }

  if (leagueId && can("teams", "create")) {

    menuItems.push({
      // @ts-ignore
      id: "teams",
      title: "Команды",
    });
  }

  if (leagueId && can("leagues", "get_show", leagueId)) {

    menuItems.push({
      // @ts-ignore
      id: "show",
      title: "Показ",
    });

  }
  if (leagueId && can("leagues", "control_show", leagueId)) {


    menuItems.push({
      // @ts-ignore
      id: "showControl",
      title: "Управление показом",
    });
  }



  if (leagueId && tableType) {

    menuItems.push({id: "tables", title: "Таблицы"});
  }

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

        {/* RIGHT SIDE */}
        <div className="flex items-center space-x-4">

          {/* THEME SWITCH */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-border dark:border-dark-border bg-surface dark:bg-dark-surface hover:bg-hover dark:hover:bg-dark-hover transition"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* USER / AUTH */}
          {!user ? (
            <button
              onClick={() => useUI.getState().openLoginModal()}
              className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark"
            >
              Войти
            </button>
          ) : (
            <button
              onClick={() => useUI.getState().openProfileModal()}
              className="
                                flex items-center gap-2
                                px-3 py-2
                                rounded-lg
                                bg-surface dark:bg-dark-surface
                                border border-border dark:border-dark-border
                                hover:bg-hover dark:hover:bg-dark-hover
                                font-medium
                            "
            >
              <BaseImage
                path={`users/${user.id}/photo`}
                fallbackLetter={user.first_name[0]}
                className="w-7 h-7 rounded-full object-cover border border-border dark:border-dark-border"
              />
              {user.first_name}
            </button>
          )}
        </div>

        {/* MOBILE BURGER */}
        <button
          className="sm:hidden text-text-main dark:text-dark-text-main"
          onClick={toggleMobileMenu}
        >
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
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