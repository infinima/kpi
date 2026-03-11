import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import Background from "@/components/layout/Background";
import EventsSidebar from "@/components/layout/events/EventsSidebar";
import { apiGet } from "@/api";

type EntitySummary = {
    id: number;
    name: string;
};

export function EventsRootPage() {
    const location = useLocation();
    const { eventId, locationId, leagueId } = useParams();

    const [eventInfo, setEventInfo] = useState<EntitySummary | null>(null);
    const [locationInfo, setLocationInfo] = useState<EntitySummary | null>(null);
    const [leagueInfo, setLeagueInfo] = useState<EntitySummary | null>(null);

    useEffect(() => {
        let ignore = false;

        async function loadEvent() {
            if (!eventId) {
                setEventInfo(null);
                return;
            }

            try {
                const data = await apiGet<EntitySummary>(`events/${eventId}`);
                if (!ignore) {
                    setEventInfo({ id: data.id, name: data.name });
                }
            } catch {
                if (!ignore) {
                    setEventInfo(null);
                }
            }
        }

        void loadEvent();
        return () => {
            ignore = true;
        };
    }, [eventId]);

    useEffect(() => {
        let ignore = false;

        async function loadLocation() {
            if (!locationId) {
                setLocationInfo(null);
                return;
            }

            try {
                const data = await apiGet<EntitySummary>(`locations/${locationId}`);
                if (!ignore) {
                    setLocationInfo({ id: data.id, name: data.name });
                }
            } catch {
                if (!ignore) {
                    setLocationInfo(null);
                }
            }
        }

        void loadLocation();
        return () => {
            ignore = true;
        };
    }, [locationId]);

    useEffect(() => {
        let ignore = false;

        async function loadLeague() {
            if (!leagueId) {
                setLeagueInfo(null);
                return;
            }

            try {
                const data = await apiGet<EntitySummary>(`leagues/${leagueId}`);
                if (!ignore) {
                    setLeagueInfo({ id: data.id, name: data.name });
                }
            } catch {
                if (!ignore) {
                    setLeagueInfo(null);
                }
            }
        }

        void loadLeague();
        return () => {
            ignore = true;
        };
    }, [leagueId]);

    return (
        <div className="relative min-h-screen overflow-hidden">
            <Background active={true} />

            <div className="relative mx-auto flex min-h-screen w-full max-w-none px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-start">
                    <EventsSidebar />

                    <main className="min-w-0 flex-1 rounded-[32px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.88)] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
                        <Outlet context={{ eventInfo, locationInfo, leagueInfo }} />
                    </main>
                </div>
            </div>
        </div>
    );
}

export function EventsIndexRedirect() {
    return <Navigate to="/events" replace />;
}
