import { MenuBar } from "@/components/layout/MenuBar";
import {useNavigation, useUI, useUser} from "@/store";

import { HomePage } from "@/pages/HomePage";
import { EventsPage } from "@/pages/EventPage";
import { TablesPage } from "@/pages/TablePage";
import { LogsPage } from "@/pages/LogsPage";
import { UsersPage } from "@/pages/UserPage";
import {NotificationCenter} from "@/components/services/NotificationCenter";
import {LoginModal} from "@/components/services/Login";

export function App() {
    const { currentPage } = useNavigation();

    const pages = {
        home: <HomePage />,
        events: <EventsPage />,
        tables: <TablesPage />,
        logs: <LogsPage />,
        users: <UsersPage />,
    };

    if (useUI.getState().theme === "dark") {
        document.documentElement.classList.add("dark");
    }

    const stored = localStorage.getItem("auth_token");
    if (stored && !useUser.getState().token) {
        useUser.setState({ token: stored, guest: false });
        useUser.getState().fetchUser();
    }

    return (
        <div className="min-h-screen bg-background dark:bg-dark-bg text-text-main dark:text-dark-text-main font-nunito">
            <LoginModal />
            <NotificationCenter />
            <MenuBar />

            <main className="max-w-6xl mx-auto px-6 py-6">
                {pages[currentPage]}
            </main>

        </div>
    );
}