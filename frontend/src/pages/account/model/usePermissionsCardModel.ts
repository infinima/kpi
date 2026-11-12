import { permissionApi } from "@/entities/permission/api";
import { validatePermission } from "@/entities/permission/model/editor";
import { confirmWithNotification } from "@/shared/lib/confirmWithNotification";
import { useNotifications } from "@/shared/model/notifications";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { PermissionAction, PermissionRow, PermissionScope, Props } from './permissionsCardSupport';
export function usePermissionsCardModel({ row, onChangedOutside }: Props) {
    const notify = useNotifications((s) => s.addMessage);

    const [data, setData] = useState<PermissionRow>({
        ...row,
        permission: Array.isArray(row.permission) ? row.permission : [],
    });

    const [scope, setScope] = useState<PermissionScope>("global");

    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        setData({
            ...row,
            permission: Array.isArray(row.permission) ? row.permission : [],
        });

        if (row.object_id !== null) setScope("local");
        else if (row.scope_object !== null) setScope("nested");
        else setScope("global");
    }, [row]);

    const lookupType = scope === "local" ? data.object : scope === "nested" ? data.scope_object : null;
    const lookupId = scope === "local" ? data.object_id : scope === "nested" ? data.scope_object_id : null;
    const lookup = useQuery({ queryKey: ["permission-lookup", lookupType, lookupId], queryFn: () => permissionApi.lookup(lookupType!, lookupId!), enabled: Boolean(lookupType && lookupId) });
    const lookupName = lookup.data ? lookup.data.name || lookup.data.title || "найдено" : null;
    const lookupLoading = lookup.isLoading;
    const lookupError = lookup.error ? "Не найдено" : null;

    function update(patch: Partial<PermissionRow>) {
        setData((prev) => ({ ...prev, ...patch }));
    }

    function updateScope(newScope: PermissionScope) {
        setScope(newScope);

        if (newScope === "global") {
            update({ object_id: null, scope_object: null, scope_object_id: null });
        }

        if (newScope === "local") {
            update({
                object_id: data.object_id ?? 1,
                scope_object: null,
                scope_object_id: null,
            });
        }

        if (newScope === "nested") {
            update({
                object_id: null,
                scope_object: data.scope_object ?? "events",
                scope_object_id: data.scope_object_id ?? 1,
            });
        }
    }

    function toggleAction(a: PermissionAction) {
        const has = data.permission.includes(a);
        update({
            permission: has
                ? data.permission.filter((x) => x !== a)
                : [...data.permission, a],
        });
    }

    async function save() {
        const err = validatePermission(data, scope);
        if (err) return notify({ type: "warning", text: err });

        const payload = { ...data, permission: data.permission };

        if (data.id === null) {
            try {
                await permissionApi.create(payload);
                notify({ type: "success", text: "Право добавлено" });
                onChangedOutside?.();
            } catch { }
            return;
        }

        try {
            await permissionApi.update(data.id, payload);
            onChangedOutside?.();
        } catch { }
    }

    async function remove() {
        if (!await confirmWithNotification({ text: "Точно удалить?" })) {
            return;
        }

        if (data.id !== null) {
            try {
                await permissionApi.remove(data.id);
            } catch { }
        }
        onChangedOutside?.();
    }
    return {
        row,
        onChangedOutside,
        notify,
        data,
        setData,
        scope,
        setScope,
        expanded,
        setExpanded,
        lookupName,
        lookupLoading,
        lookupError,
        update,
        updateScope,
        toggleAction,
        save,
        remove,
    };
}
