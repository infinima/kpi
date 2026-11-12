import EventsSidebar from "@/pages/event/ui/EventsSidebar";
import Background from "@/shared/ui/Background";
import { Navigate, Outlet } from "react-router-dom";
import { useEventContext } from "./model/useEventContext";

export function EventsRootPage() {
    const { eventInfo, locationInfo, leagueInfo } = useEventContext();

    return (
        <div className="relative min-h-screen overflow-hidden">
            <Background active={true} />

            <div className="relative mx-auto flex min-h-screen w-full max-w-none px-3 py-4 sm:px-4 lg:px-5">
                <div className="flex w-full flex-col gap-4">
                    <EventsSidebar />

                    <main className="min-w-0 flex-1 rounded-[32px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.88)] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-5 lg:p-6">
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
