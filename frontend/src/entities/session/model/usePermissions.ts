import { hasGlobalPermission, hasPermission, type PermissionAction, type PermissionEntity, type PermissionTarget } from "../../permission/model/permissions";
import { useUser } from "./session";
export function usePermissions() {
    const rights = useUser((state) => state.user?.rights);
    return {
        can: (entity: PermissionEntity, action: PermissionAction, target?: PermissionTarget) => hasPermission(rights, entity, action, target),
        canGlobal: (entity: PermissionEntity, action: PermissionAction) => hasGlobalPermission(rights, entity, action),
    };
}
