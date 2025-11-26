import { ChevronLeft } from "lucide-react";
import { useEventsNav } from "@/store";

export function Breadcrumbs() {
    const { page, eventId, locationId,leagueId, goBack , eventName, locationName,leagueName} = useEventsNav();

    const chain = [];

    chain.push("Мероприятия");

    if (eventId) chain.push(`${eventName}`);
    if (locationId) chain.push(`${locationName}`);
    if (leagueId) chain.push(`${leagueName}`);

    return (
        <div className="flex items-center gap-3 text-sm text-text-secondary">
            {page !== "events" && (
                <button
                    onClick={goBack}
                    className="flex items-center gap-1 text-primary hover:opacity-70"
                >
                    <ChevronLeft size={16} />
                    Назад
                </button>
            )}

            {/*<span>/</span>*/}
            <span>/  {chain.join(" → ")}</span>
        </div>
    );
}