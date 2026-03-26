import {useEffect} from "react";
import NotificationCenter from "@/components/services/NotificationCenter";
import { ModalContainer } from "@/components/modals/ModalContainer";
import {BrowserRouter, Navigate, Route, Routes, useParams} from "react-router-dom";
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
import { FudziResultsPage, KvartalyResultsPage } from "@/pages/event/LeagueStageResultsPage";
import { ResultPage } from "@/pages/ResultPage";
import { ShowPage } from "@/pages/ShowPage";
import { ShowControlPage } from "@/pages/ShowControlPage";
import { LogsPage } from "@/pages/LogsPage";
import { TeamQrPage } from "@/pages/TeamQrPage";
import { ReadQrPage } from "@/pages/ReadQrPage";

function LeagueShowRedirect({ mode }: { mode: "show" | "controller" }) {
    const { leagueId } = useParams();

    if (!leagueId) {
        return <Navigate to="/events" replace />;
    }

    return (
        <Navigate
            to={mode === "show" ? `/show/${leagueId}` : `/showcontroller/${leagueId}`}
            replace
        />
    );
}

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
                <Route path="/logs" element={<LogsPage />} />
                <Route path="/logs/teams/:teamId" element={<LogsPage mode="record" entity="teams" />} />
                <Route path="/logs/users/:userId" element={<LogsPage mode="record" entity="users" />} />
                <Route path="/logs/users/:userId/actions" element={<LogsPage mode="user-actions" />} />
                <Route path="/locations" element={<Navigate to="/events" replace />} />
                <Route path="/leagues" element={<Navigate to="/events" replace />} />
                <Route path="/results" element={<Navigate to="/events" replace />} />
                <Route path="/qr" element={<TeamQrPage />} />
                <Route path="/scanner" element={<ReadQrPage />} />
                <Route path="/read_qr" element={<Navigate to="/scanner" replace />} />
                <Route path="/show/:leagueId" element={<ShowPage />} />
                <Route path="/showcontroller/:leagueId" element={<ShowControlPage />} />
                <Route path="*" element={<NotFoundPage />} />

                <Route path="/events" element={<EventsRootPage />}>
                    <Route index element={<EventsPage />} />
                    <Route path=":eventId" element={<EventsPage />} />
                    <Route path=":eventId/history" element={<LogsPage mode="record" entity="events" />} />
                    <Route path=":eventId/teams" element={<EventTeamsPage />} />
                    <Route path=":eventId/location" element={<LocationsPage />} />
                    <Route path=":eventId/location/:locationId" element={<LocationsPage />} />
                    <Route path=":eventId/location/:locationId/history" element={<LogsPage mode="record" entity="locations" />} />
                    <Route path=":eventId/location/:locationId/teams" element={<EventTeamsPage />} />
                    <Route path=":eventId/location/:locationId/league" element={<LeaguesPage />} />
                    <Route path=":eventId/location/:locationId/league/:leagueId" element={<LeaguesPage />} />
                    <Route path=":eventId/location/:locationId/league/:leagueId/history" element={<LogsPage mode="record" entity="leagues" />} />
                    <Route path=":eventId/location/:locationId/league/:leagueId/results/kvartaly" element={<KvartalyResultsPage />} />
                    <Route path=":eventId/location/:locationId/league/:leagueId/results/fudzi" element={<FudziResultsPage />} />
                    <Route path=":eventId/location/:locationId/league/:leagueId/results/overall" element={<ResultPage />} />
                    <Route path=":eventId/location/:locationId/league/:leagueId/accounts" element={<EventPlaceholderPage title="Аккаунты показа" />} />
                    <Route path=":eventId/location/:locationId/league/:leagueId/teams" element={<EventTeamsPage />} />
                    <Route path=":eventId/location/:locationId/league/:leagueId/show" element={<LeagueShowRedirect mode="show" />} />
                    <Route path=":eventId/location/:locationId/league/:leagueId/show-control" element={<ShowControlPage />} />
                    <Route path=":eventId/location/:locationId/league/:leagueId/tables" element={<EventPlaceholderPage title="Таблички" />} />
                    <Route path=":eventId/location/:locationId/league/:leagueId/fudzi-presentation" element={<EventPlaceholderPage title="Презентация фудзи" />} />
                </Route>

            </Routes>
        </BrowserRouter>
    );
}
