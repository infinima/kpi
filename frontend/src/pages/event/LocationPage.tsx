import { Navigate, useParams } from "react-router-dom";
import { LocationsView } from "./LocationPageView";
import { useLocationsPageModel } from "./model/useLocationsPageModel";
function LocationsCollection() { return <LocationsView {...useLocationsPageModel()} />; }
export function LocationsPage() {
    const { eventId, locationId } = useParams();
    return locationId ? <Navigate replace to={`/events/${eventId}/location/${locationId}/league`} /> : <LocationsCollection />;
}
