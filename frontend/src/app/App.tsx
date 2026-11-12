import { ensureUserSessionInitialized, useUser } from "@/entities/session/model/session";
import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";

const AuthPage = lazy(() => import("@/pages/AuthPage"));
const EventsPage = lazy(async () => ({ default: (await import("@/pages/event/EventPage")).EventsPage }));
const EventPlaceholderPage = lazy(async () => ({ default: (await import("@/pages/event/EventPlaceholderPage")).EventPlaceholderPage }));
const EventsRootPage = lazy(async () => ({ default: (await import("@/pages/event/EventsRootPage")).EventsRootPage }));
const EventTeamsPage = lazy(async () => ({ default: (await import("@/pages/event/EventTeamsPage")).EventTeamsPage }));
const LeaguesPage = lazy(async () => ({ default: (await import("@/pages/event/LeaguesPage")).LeaguesPage }));
const FudziResultsPage = (_props: Record<string, unknown>) => <NotReadyPage pageName="Раздел пока недоступен в новой API" />;
const KvartalyResultsPage = (_props: Record<string, unknown>) => <NotReadyPage pageName="Раздел пока недоступен в новой API" />;
const LocationsPage = lazy(async () => ({ default: (await import("@/pages/event/LocationPage")).LocationsPage }));
const ExamplePage = lazy(() => import("@/pages/ExamplePage"));
const ForgotPassPage = lazy(() => import("@/pages/ForgotPassPage"));
const HomePage = lazy(() => import("@/pages/HomePage"));
const LkPage = lazy(() => import("@/pages/LkPage"));
const LogsPage = (_props: Record<string, unknown>) => <NotReadyPage pageName="Раздел пока недоступен в новой API" />;
const NewPassPage = lazy(() => import("@/pages/NewPassPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));
const NotReadyPage = lazy(() => import("@/pages/NotReadyPage"));
const ReadQrPage = lazy(async () => ({ default: (await import("@/pages/ReadQrPage")).ReadQrPage }));
const ResultPage = (_props: Record<string, unknown>) => <NotReadyPage pageName="Раздел пока недоступен в новой API" />;
const ShowControlPage = (_props: Record<string, unknown>) => <NotReadyPage pageName="Раздел пока недоступен в новой API" />;
const ShowPage = (_props: Record<string, unknown>) => <NotReadyPage pageName="Раздел пока недоступен в новой API" />;
const TeamQrPage = lazy(async () => ({ default: (await import("@/pages/TeamQrPage")).TeamQrPage }));

function LeagueShowRedirect({ mode }: { mode: "show" | "controller"; }) {
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
    const token = useUser((state) => state.token);

    useEffect(() => {
        void ensureUserSessionInitialized().then(() => {
            const { token, user } = useUser.getState();

            if (!token || user) {
                return;
            }

            // Session expiry is handled by the configured HTTP transport.
            return fetchUser().catch(() => undefined);
        });
    }, [fetchUser]);

    return (
        <>

            <Suspense key={token ?? "guest"} fallback={<div className="p-6 text-[var(--color-text-secondary)]">Загрузка...</div>}>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/indev" element={<NotReadyPage pageName={"В разработке"} />} />
                    <Route path="/example" element={<ExamplePage />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/forgot_pass" element={<ForgotPassPage />} />
                    <Route path="/new_pass" element={<NewPassPage />} />
                    <Route path="/dashboard" element={<Navigate to="/lk/dashboard" replace />} />
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
                    <Route path="/show/:leagueId/:secret_code" element={<ShowPage />} />
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
            </Suspense>
        </>
    );
}
