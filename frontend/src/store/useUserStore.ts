import {create} from "zustand";
import {apiGet, apiPost} from "@/api";
import {useNotifications} from "@/store/useNotificationStore";

export type PermissionEntity =
  "events" |
  "locations" |
  "leagues" |
  "teams" |
  "users" |
  "permissions";

export type PermissionAction =
  "get" |
  "create" |
  "update" |
  "delete" |
  "restore" |
  "access_history" |
  "access_actions_history" |
  "print_documents" |
  "edit_answers" |
  "get_show" |
  "control_show" |
  "edit_penalties" |
  "edit_photos";

export type EntityPermissions = {
  global?: PermissionAction[];
} & {
  [id: string]: PermissionAction[];
};

export interface PermissionsResponse {
  [entity: string]: EntityPermissions;
}

interface User {
  tg_id: string;
  photo: string;
  patronymic: string;
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  rights: PermissionsResponse;
}

interface UserState {
  user: User | null;
  token: string | null;
  guest: boolean;

  login: (token: string) => Promise<void>;
  logout: () => void;
  clearSession: () => void;
  fetchUser: () => Promise<void>;

  can: (entity: PermissionEntity, action: PermissionAction, objectId?: number) => boolean;
}

export const useUser = create<UserState>((set, get) => ({

  user: null,
  token: null,
  guest: true,

  login: async (token: string) => {
    localStorage.setItem("auth_token", token);
    set({token, guest: false});

    const data = await apiGet("auth/me?include=user");
    const rights = await apiGet("auth/permissions");

    set({
      user: {
        ...data.user,
        rights: rights ?? {},
      },
    });

    useNotifications.getState().addMessage({
      type: "success",
      text: "Добро пожаловать",
    });
  },

  logout: async () => {
    const token = get().token;



    if (!token) {
      set({user: null, token: null, guest: true});
      localStorage.removeItem("auth_token");
      return;
    }

    try {
      await apiPost("auth/logout");
      useNotifications.getState().addMessage({
        type: "success",
        text: "До свидания",
      });
    } catch {
      useNotifications.getState().addMessage({
        type: "warning",
        text: "Сессия уже была завершена",
      });
    }

    localStorage.removeItem("auth_token");
    set({user: null, token: null, guest: true});
  },

  clearSession: () => {
    localStorage.removeItem("auth_token");
    set({user: null, token: null, guest: true});
  },

  fetchUser: async () => {
    const token = get().token;
    if (!token) return;

    const data = await apiGet("auth/me?include=user");
    const rights = await apiGet("auth/permissions");

    set({
      user: {
        ...data.user,
        rights: rights ?? {},
      },
    });
  },

  can: (entity: PermissionEntity, action: PermissionAction, id?: number) => {
    const u = get().user;
    if (!u) return false;

    const perms = u.rights[entity];
    if (!perms) return false;

    if (id !== undefined) {
      const objRights = perms[id];
      if (objRights && objRights.includes(action)) return true;
    }

    const globalRights = perms.global;
    return !!(globalRights && globalRights.includes(action));


  },

}));
