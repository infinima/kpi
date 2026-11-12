import { useDashboardModel } from "../model/useDashboardModel";
import { DashboardView } from "./DashboardView";
export function DashboardSection() { return <DashboardView {...useDashboardModel()} />; }
