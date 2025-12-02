import {useNavigation, useUI, useUser} from "@/store";
import {HomePage} from "@/pages/HomePage";
import {EventsPageRoot} from "@/pages/event/EventsPageRoot";
import {TablesPage} from "@/pages/TablePage";
import {ShowPage} from "@/pages/ShowPage";
import {ShowControlPage} from "@/pages/ShowControlPage";
import {ResultPage} from "@/pages/ResultPage";
import {TeamsPage} from "@/pages/TeamsPage";
import {UsersPage} from "@/pages/UserPage";
import {LogsPage} from "@/pages/LogsPage";
import {LoginModal} from "@/components/services/Login";
import {NotificationCenter} from "@/components/services/NotificationCenter";
import {ProfileModal} from "@/components/ProfileModal";
import {MenuBar} from "@/components/layout/MenuBar";

export function App() {
  const { currentPage, setPage } = useNavigation();

  const pages = {
    home: <HomePage />,
    events: <EventsPageRoot />,
    tables: <TablesPage />,
    logs: <LogsPage />,
    users: <UsersPage />,
    teams: <TeamsPage />,
    result: <ResultPage />,
    showControl: <ShowControlPage />,
    show: <ShowPage />
  };

  // Тема
  if (useUI.getState().theme === "dark") {
    document.documentElement.classList.add("dark");
  }

  // Токен
  const stored = localStorage.getItem("auth_token");
  if (stored && !useUser.getState().token) {
    useUser.setState({ token: stored, guest: false });
    useUser.getState().fetchUser();
  }

  // ===== FULLSCREEN =====
  const toggleFullscreen = () => {
    const root = document.documentElement as any;
    const doc = document as any;

    const isFull =
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.msFullscreenElement;

    if (!isFull) {
      (root.requestFullscreen ||
        root.webkitRequestFullscreen ||
        root.msRequestFullscreen).call(root);
    } else {
      (doc.exitFullscreen ||
        doc.webkitExitFullscreen ||
        doc.msExitFullscreen).call(doc);
    }
  };

  const toggleDualMode = useUI(s => s.toggleDualMode)

  // ======= РЕНДЕР =======

  return (
    <div className="min-h-screen bg-background dark:bg-dark-bg text-text-main dark:text-dark-text-main font-nunito">

      {/* Глобальные окна */}
      <LoginModal />
      <NotificationCenter />
      <ProfileModal />


      {currentPage === "show" ? (
        <div className="relative w-full h-screen bg-black overflow-hidden">

          <div
            className="absolute top-0 left-0 w-1/4 h-1/4 cursor-pointer"
            onClick={() => setPage("home")}
          />

          <div
            className="absolute top-0 left-1/4 w-1/2 h-1/4 cursor-pointer"
            onClick={() => {
              console.log("меню")
              toggleDualMode();
            }}
          />

          <div
            className="absolute top-0 right-0 w-1/4 h-1/4 cursor-pointer"
            onClick={toggleFullscreen}
          />

          <ShowPage/>
        </div>
      ) : (
        <>
          <MenuBar />


          <main className={`${currentPage === "tables" ? "max-w-8xl mx-auto px-20 py-6" : "max-w-6xl mx-auto px-6 py-6"}`}>
            {pages[currentPage]}
          </main>
        </>
      )}
    </div>
  );
}