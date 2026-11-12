import { LeaguesView } from "./LeaguesPageView";
import { useLeaguesPageModel } from "./model/useLeaguesPageModel";

export function LeaguesPage() { return <LeaguesView {...useLeaguesPageModel()} />; }
