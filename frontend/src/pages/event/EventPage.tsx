import { Navigate, useParams } from "react-router-dom";
import { EventsView } from "./EventPageView";
import { useEventsPageModel } from "./model/useEventsPageModel";
function EventsCollection() { return <EventsView {...useEventsPageModel()} />; }
export function EventsPage() {
    const { eventId } = useParams();
    return eventId ? <Navigate replace to={`/events/${eventId}/location`} /> : <EventsCollection />;
}
