import { roleApi } from "@/entities/permission/roleApi";
export type { Role, ScopeType } from "@/shared/api/schema";
import type { Role, ScopeType } from "@/shared/api/schema";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
export function useUserRightsModel({ payload, onClose: closeModal }: { payload: { userId: number; userName: string } | null; onClose: () => void }) {
    const [role, setRole] = useState<Role>("organizer");
    const [scope, setScope] = useState<ScopeType>("event");
    const [scopeId, setScopeId] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => { setError(null); setScopeId(""); }, [payload?.userId]);
    const query = useQuery({ queryKey: ["roles", payload?.userId], queryFn: () => roleApi.list(payload!.userId), enabled: Boolean(payload) });
    async function save() {
        if (!payload || busy) return;
        const effectiveScope = role === "admin" ? "global" : scope;
        if (effectiveScope !== "global" && (!/^\d+$/.test(scopeId) || Number(scopeId) < 1)) { setError("Укажите положительный ID области"); return; }
        setBusy(true); setError(null);
        try { await roleApi.create({ user_id: payload.userId, role, scope_type: effectiveScope, scope_id: effectiveScope === "global" ? null : Number(scopeId) }); await query.refetch(); }
        catch { setError("Не удалось назначить роль"); } finally { setBusy(false); }
    }
    async function remove(id: number) {
        if (busy) return;
        setBusy(true); setError(null);
        try { await roleApi.remove(id); await query.refetch(); }
        catch { setError("Не удалось отозвать роль"); } finally { setBusy(false); }
    }
    return { payload, closeModal, role, setRole, scope, setScope, scopeId, setScopeId, busy, error, query, save, remove };
}
