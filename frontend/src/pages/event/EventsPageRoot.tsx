import { useEventsNav } from "@/store";

import { EventsPage } from "@/pages/event/EventPage";
import { LocationsPage } from "@/pages/event/LocationPage";
import { LeaguesPage } from "@/pages/event/LeaguesPage";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export function EventsPageRoot() {
    const { page } = useEventsNav();

    return (
        <div className="space-y-6">

            <Breadcrumbs />

            {page === "events" && <EventsPage />}
            {page === "locations" && <LocationsPage />}
            {page === "leagues" && <LeaguesPage />}

        </div>
    );
}