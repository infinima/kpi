import { useUser } from "@/entities/session/model/session";
import { createQueryClient } from "@/shared/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import NotificationCenter from "./NotificationCenter";
import { MaintenanceGate } from "./MaintenanceGate";
import App from "./App";
import { configureAppApi } from "./configureApi";

const queryClient = createQueryClient();
configureAppApi(async (path) => {
    await queryClient.invalidateQueries();
    if (path.startsWith("role-assignments")) await useUser.getState().fetchUser();
}, () => { void queryClient.invalidateQueries({ queryKey: ["maintenance"] }); });
useUser.subscribe((state, previous) => {
    if (state.token !== previous.token) queryClient.clear();
});

/** Cache resets on session changes; App remounts route content while keeping browser history alive. */
export function Application() {
    return <QueryClientProvider client={queryClient}><BrowserRouter><NotificationCenter /><MaintenanceGate><App /></MaintenanceGate></BrowserRouter></QueryClientProvider>;
}
