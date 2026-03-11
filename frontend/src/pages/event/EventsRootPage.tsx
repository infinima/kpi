import { useEffect, useState } from "react";
import { Link, Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
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

    const crumbs = [
        { label: "Мероприятия", to: "/events" },
        ...(eventInfo ? [{ label: eventInfo.name, to: `/events/${eventInfo.id}/location` }] : []),
        ...(locationInfo
            ? [{
                label: locationInfo.name,
                to: location.pathname.includes("/photos")
                    ? `/events/${eventId}/location/${locationInfo.id}/photos`
                    : `/events/${eventId}/location/${locationInfo.id}/league`,
            }]
            : []),
        ...(leagueInfo
            ? [{
                label: leagueInfo.name,
                to: `/events/${eventId}/location/${locationId}/league/${leagueInfo.id}/history`,
            }]
            : []),
    ];

    return (
        <div className="relative min-h-screen overflow-hidden">
            <Background active={true} />

            <div className="relative mx-auto flex min-h-screen w-full max-w-none px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-start">
                    <EventsSidebar />

                    <main className="min-w-0 flex-1 rounded-[32px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.88)] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
                        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                            {crumbs.map((crumb, index) => (
                                <div key={crumb.to} className="flex items-center gap-2">
                                    <Link to={crumb.to} className="rounded-full px-3 py-1 hover:bg-[var(--color-hover)]">
                                        {crumb.label}
                                    </Link>
                                    {index < crumbs.length - 1 ? <ChevronRight size={14} /> : null}
                                </div>
                            ))}
                        </div>

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
