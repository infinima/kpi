import { MenuBar } from "@/components/layout/MenuBar";
import { useNavigation } from "@/store";

import { HomePage } from "@/pages/HomePage";
import { EventsPage } from "@/pages/EventPage";
import { TablesPage } from "@/pages/TablePage";
import { LogsPage } from "@/pages/LogsPage";
import { UsersPage } from "@/pages/UserPage";
import {NotificationCenter} from "@/components/services/NotificationCenter";

export function App() {
    const { currentPage } = useNavigation();

    const pages = {
        home: <HomePage />,
        events: <EventsPage />,
        tables: <TablesPage />,
        logs: <LogsPage />,
        users: <UsersPage />,
    };

    return (
        <div className="min-h-screen bg-background dark:bg-dark-bg text-text-main dark:text-dark-text-main font-nunito">

            <NotificationCenter />
            <MenuBar isLoggedIn={false} />

            <main className="max-w-6xl mx-auto px-6 py-6">
                {pages[currentPage]}
            </main>

        </div>
    );
}