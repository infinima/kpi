import {useEffect} from "react";
import NotificationCenter from "@/components/services/NotificationCenter";
import { ModalContainer } from "@/components/modals/ModalContainer";
import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";
import ExamplePage from "@/pages/ExamplePage";
import NotFoundPage from "@/pages/NotFoundPage";
import HomePage from "@/pages/HomePage";
import AuthPage from "@/pages/AuthPage";
import ForgotPassPage from "@/pages/ForgotPassPage";
import LkPage from "@/pages/LkPage";
import {useUser} from "@/store";
import {ensureUserSessionInitialized} from "@/store/useUserStore";
import NewPassPage from "@/pages/NewPassPage";
import NotReadyPage from "@/pages/NotReadyPage";
import { EventsPage } from "@/pages/event/EventPage";
import { EventsRootPage } from "@/pages/event/EventsRootPage";
import { LocationsPage } from "@/pages/event/LocationPage";
import { LeaguesPage } from "@/pages/event/LeaguesPage";
import { EventPlaceholderPage } from "@/pages/event/EventPlaceholderPage";
import { EventTeamsPage } from "@/pages/event/EventTeamsPage";

export default function App() {
    const fetchUser = useUser((state) => state.fetchUser);
    const clearSession = useUser((state) => state.clearSession);

    useEffect(() => {
        void ensureUserSessionInitialized().then(() => {
            const {token, user} = useUser.getState();

            if (!token || user) {
                return;
            }

            return fetchUser().catch((error) => {
                const code = error?.error?.code;
                if (code === "INVALID_TOKEN" || code === "INVALID_SESSION" || code === "SESSION_NOT_FOUND") {
                    clearSession();
                }
            });
        });
    }, [clearSession, fetchUser]);

    return (
        <BrowserRouter>
            <NotificationCenter />
            <ModalContainer />

            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/indev" element={<NotReadyPage pageName={"В разработке"} />} />
                <Route path="/example" element={<ExamplePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/forgot_pass" element={<ForgotPassPage />} />
                <Route path="/new_pass" element={<NewPassPage />} />
                <Route path="/lk" element={<Navigate to="/lk/me" replace />} />
                <Route path="/lk/*" element={<LkPage />} />
                <Route path="*" element={<NotFoundPage />} />

                <Route path="/events" element={<EventsRootPage />}>
                    <Route index element={<EventsPage />} />
                    <Route path=":eventId" element={<EventsPage />} />
                    <Route path=":eventId/history" element={<EventPlaceholderPage title="История изменений мероприятия" />} />
                    <Route path=":eventId/teams" element={<EventTeamsPage />} />
                    <Route path=":eventId/location" element={<LocationsPage />} />
                    <Route path=":eventId/location/:locationId" element={<LocationsPage />} />
                    <Route path=":eventId/location/:locationId/history" element={<EventPlaceholderPage title="История изменений площадки" />} />
                    <Route path=":eventId/location/:locationId/teams" element={<EventTeamsPage />} />
                    <Route path=":eventId/location/:locationId/league" element={<LeaguesPage />} />
                    <Route path=":eventId/location/:locationId/league/:leagueId" element={<LeaguesPage />} />
                    <Route path=":eventId/location/:locationId/league/:leagueId/history" element={<EventPlaceholderPage title="История изменений лиги" />} />
                    <Route path=":eventId/location/:locationId/league/:leagueId/results/kvartaly" element={<EventPlaceholderPage title="Результаты кварталов" />} />
                    <Route path=":eventId/location/:locationId/league/:leagueId/results/fudzi" element={<EventPlaceholderPage title="Результаты фудзи" />} />
                    <Route path=":eventId/location/:locationId/league/:leagueId/results/overall" element={<EventPlaceholderPage title="Общие результаты" />} />
                    <Route path=":eventId/location/:locationId/league/:leagueId/accounts" element={<EventPlaceholderPage title="Аккаунты показа" />} />
                    <Route path=":eventId/location/:locationId/league/:leagueId/teams" element={<EventTeamsPage />} />
                    <Route path=":eventId/location/:locationId/league/:leagueId/show" element={<EventPlaceholderPage title="Показ" />} />
                    <Route path=":eventId/location/:locationId/league/:leagueId/show-control" element={<EventPlaceholderPage title="Управление показом" />} />
                    <Route path=":eventId/location/:locationId/league/:leagueId/tables" element={<EventPlaceholderPage title="Таблички" />} />
                    <Route path=":eventId/location/:locationId/league/:leagueId/fudzi-presentation" element={<EventPlaceholderPage title="Презентация фудзи" />} />
                </Route>

            </Routes>
        </BrowserRouter>
    );
}
