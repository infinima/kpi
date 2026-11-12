import { canAccessDashboard } from "@/entities/permission/model/permissions";
import { authDestination } from "@/shared/lib/navigation";
import { useUser } from "@/entities/session/model/session";
import { usePermissions } from "@/entities/session/model/usePermissions";
import { teamApi } from "@/entities/team/api";
import { useLocation, useNavigate } from "react-router-dom";
import type { CabinetSection } from "./forms";
import { useProfileModel } from "./useProfileModel";
import { useTeamRegistrationModel } from "./useTeamRegistrationModel";

export function useCabinetModel() {
    const location = useLocation();
    const navigate = useNavigate();
    const user = useUser((state) => state.user);
    const token = useUser((state) => state.token);
    const logout = useUser((state) => state.logout);
    const fetchUser = useUser((state) => state.fetchUser);
    const { can, canGlobal } = usePermissions();
    const section = location.pathname.split("/")[2];
    const activeSection: CabinetSection = section === "my_team" || section === "reg_team" || section === "users" || section === "mailings" || section === "dashboard" ? section : "me";
    const profile = useProfileModel();
    const team = useTeamRegistrationModel();
    return {
        authUrl: authDestination(location.pathname + location.search, true), downloadTeamDocument: teamApi.document, location, navigate, user, token, logout, fetchUser, can, canGlobal, activeSection,
        canDashboard: canAccessDashboard(user?.rights),
        canManageUsers: canGlobal("users", "get"), canManageMailings: false, canScanTeams: Boolean(user?.rights.grants.some(grant => grant.actions.includes("teams.register"))),
        ...profile, ...team,
    };
}
