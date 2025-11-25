import { ChevronLeft } from "lucide-react";
import { useEventsNav } from "@/store";

export function Breadcrumbs() {
    const { page, eventId, locationId, goBack } = useEventsNav();

    const chain = [];

    chain.push("Мероприятия");

    if (eventId) chain.push(`Event ${eventId}`);
    if (locationId) chain.push(`Location ${locationId}`);

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

            <span>/</span>
            <span>{chain.join(" → ")}</span>
        </div>
    );
}