import { maintenanceApi } from "@/entities/maintenance/api";
import { isMaintenanceAdmin, maintenanceAccess } from "@/entities/maintenance/model/access";
import { useUser } from "@/entities/session/model/session";
import Background from "@/shared/ui/Background";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const loading = <main role="status" className="flex min-h-screen items-center justify-center p-6 text-[var(--color-text-secondary)]">Проверяем доступ…</main>;
export function MaintenanceGate({ children }: { children: ReactNode }) {
    const { pathname } = useLocation();
    const user = useUser(state => state.user);
    const token = useUser(state => state.token);
    const status = useQuery({ queryKey: ["maintenance"], queryFn: ({ signal }) => maintenanceApi.status(signal), refetchInterval: 15000, refetchOnWindowFocus: true, retry: false });
    const identity = useQuery({ queryKey: ["maintenance-session", token], queryFn: async () => { await useUser.getState().fetchUser(); return true; }, enabled: Boolean(token && !user), retry: false });
    if (status.isPending || (status.data?.mode !== "off" && token && !user && identity.isPending)) return loading;
    if (!status.data) return <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center"><h1 className="text-2xl font-semibold">Не удалось проверить доступность сайта</h1><button onClick={() => void status.refetch()} disabled={status.isFetching} className="rounded-xl border border-[var(--color-border)] px-4 py-2">Повторить</button></main>;
    const access = maintenanceAccess(status.data.mode, isMaintenanceAdmin(user?.rights), pathname);
    if (access === "login") return <Suspense fallback={loading}><AuthPage adminOnly /></Suspense>;
    if (access === "maintenance") return <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
        <Background active />
        <main className="relative w-full max-w-xl rounded-[32px] border border-[var(--color-border)] bg-white/90 p-8 text-center shadow-xl sm:p-12">
            <span aria-hidden="true" className="mx-auto mb-6 block h-3 w-3 rounded-full bg-amber-400" />
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Технические работы<Link to="/auth?returnTo=%2Flk%2Fdashboard" aria-label="Вход для администратора" title="Вход для администратора" className="inline-block rounded px-1 text-[var(--color-primary)] transition hover:text-[var(--color-text-main)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">.</Link></h1>
            <p className="mt-5 leading-relaxed text-[var(--color-text-secondary)]">{status.data.message || "Мы обновляем сайт. Пожалуйста, зайдите позже."}</p>
        </main>
    </div>;
    return <>{status.data.mode === "users" && <div role="status" className="flex flex-wrap items-center justify-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900"><span aria-hidden="true" className="h-2 w-2 rounded-full bg-amber-500" /><strong>Сайт в работе</strong><span>Доступ открыт только администраторам.</span></div>}{children}</>;
}
