import {create} from "zustand";
import {apiGet, apiPost} from "@/api";
import {useNotifications} from "@/store/useNotificationStore";

const AUTH_TOKEN_KEY = "auth_token";

function readStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

const initialToken = readStoredToken();
let authInitializationPromise: Promise<void> | null = null;

export type PermissionEntity =
  "events" |
  "locations" |
  "leagues" |
  "teams" |
  "users" |
  "permissions" |
  "mailings";

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

export type PermissionMap = Record<string, PermissionAction[]>;

export type EntityPermissions = {
  global?: PermissionAction[];
  ids?: PermissionMap;
  by_event?: PermissionMap;
  by_location?: PermissionMap;
  by_league?: PermissionMap;
};

export interface PermissionsResponse {
  [entity: string]: EntityPermissions | undefined;
}

type PermissionTarget = number | {
  id?: number | null;
  eventId?: number | null;
  locationId?: number | null;
  leagueId?: number | null;
};

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

  can: (entity: PermissionEntity, action: PermissionAction, target?: PermissionTarget) => boolean;
  canGlobal: (entity: PermissionEntity, action: PermissionAction) => boolean;
}

export function ensureUserSessionInitialized(): Promise<void> {
  if (!authInitializationPromise) {
    authInitializationPromise = Promise.resolve().then(() => {
      const {token} = useUser.getState();

      if (token) {
        return;
      }

      const storedToken = readStoredToken();

      if (storedToken) {
        useUser.setState({token: storedToken, guest: false});
      }
    });
  }

  return authInitializationPromise;
}

export const useUser = create<UserState>((set, get) => ({

  user: null,
  token: initialToken,
  guest: !initialToken,

  login: async (token: string) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
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
      localStorage.removeItem(AUTH_TOKEN_KEY);
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

    localStorage.removeItem(AUTH_TOKEN_KEY);
    set({user: null, token: null, guest: true});
  },

  clearSession: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
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

  can: (entity: PermissionEntity, action: PermissionAction, target?: PermissionTarget) => {
    const u = get().user;
    if (!u) return false;

    const perms = u.rights[entity];
    if (!perms) return false;

    const globalRights = perms.global;
    if (globalRights && globalRights.includes(action)) {
      return true;
    }

    const resolvedTarget = typeof target === "number"
      ? { id: target }
      : (target ?? {});

    if (resolvedTarget.id !== undefined && resolvedTarget.id !== null) {
      const objRights = perms.ids?.[String(resolvedTarget.id)];
      if (objRights && objRights.includes(action)) {
        return true;
      }
    }

    if (resolvedTarget.eventId !== undefined && resolvedTarget.eventId !== null) {
      const scopedRights = perms.by_event?.[String(resolvedTarget.eventId)];
      if (scopedRights && scopedRights.includes(action)) {
        return true;
      }
    }

    if (resolvedTarget.locationId !== undefined && resolvedTarget.locationId !== null) {
      const scopedRights = perms.by_location?.[String(resolvedTarget.locationId)];
      if (scopedRights && scopedRights.includes(action)) {
        return true;
      }
    }

    if (resolvedTarget.leagueId !== undefined && resolvedTarget.leagueId !== null) {
      const scopedRights = perms.by_league?.[String(resolvedTarget.leagueId)];
      if (scopedRights && scopedRights.includes(action)) {
        return true;
      }
    }

    return false;
  },

  canGlobal: (entity: PermissionEntity, action: PermissionAction) => {
    const u = get().user;
    if (!u) return false;

    return Boolean(u.rights[entity]?.global?.includes(action));
  },

}));
