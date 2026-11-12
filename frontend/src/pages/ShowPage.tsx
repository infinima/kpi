import { useParams } from "react-router-dom";
import { useShowConnection } from "./show/model/useShowConnection";
import { ShowScreen } from "./show/ui/ShowScreen";
export function ShowPage() {
    const { leagueId } = useParams();
    const { show, isConnected, error } = useShowConnection(leagueId);
    return <>{error ? <p role="alert">{error}</p> : null}<ShowScreen leagueId={leagueId} show={show} isConnected={isConnected} /></>;
}
