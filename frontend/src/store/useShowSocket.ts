import {create} from "zustand";
import {io, Socket} from "socket.io-client";

import {useNotifications, useUser} from "@/store";
import {ensureUserSessionInitialized} from "@/store/useUserStore";

function getSocketUrl(): string {
  const { protocol, hostname, host } = window.location;
  if (host === "localhost:5173") {
    return `${protocol}//${hostname}:3000`;
  }
  return `${protocol}//${host}`;
}

const SOCKET_URL = getSocketUrl();

function getLeagueIdFromPath() {
  const match = window.location.pathname.match(
    /^\/(?:show|showcontroller)\/(\d+)\/?$|\/league\/(\d+)(?:\/|$)/
  );
  return match?.[1] ?? match?.[2] ?? null;
}

type showStatus = "WALLPAPER" |
  "KVARTALY-RESULTS" |
  "FUDZI-PRESENTATION" |
  "FUDZI-RESULTS";

const translator = {
  "WALLPAPER": "Заставка",
  "KVARTALY-RESULTS": "Таблица Кварталов",
  "FUDZI-PRESENTATION": "Презентация Фудзи",
  "FUDZI-RESULTS": "Таблица Фудзи",
}


interface SocketState {
  socket: Socket | null;
  show: any | null;
  isConnected: boolean;

  connect: () => void;
  disconnect: () => void;

  showSetStatus: (
    status: showStatus
  ) => void;

  showSetSlideNum: (
    slide_num: number
  ) => void;

  showSetTimerIsEnabled: (
    enabled: boolean
  ) => void;

  showSetColorScheme: (
    color_scheme: JSON
  ) => void;
}

export const useShowStore = create<SocketState>((set, get) => ({
  socket: null,
  show: null,
  isConnected: false,

  connect: () => {
    void ensureUserSessionInitialized().then(() => {
    const notify = useNotifications.getState().addMessage;

    const leagueId = getLeagueIdFromPath();
    const token = useUser.getState().token;

    if (!leagueId) {
      notify({ type: "warning", text: "Нет данных для подключения к показу" });
      return;
    }

    if ( get().socket) {
      return;
    }

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      query: {
        league_id: String(leagueId),
        type: "show",
        ...(token ? { token } : {}),
      },
    });

    set({ socket });


    socket.on("connection_error", (err: any) => {
      notify({
        type: "error",
        text: err?.message ?? "Ошибка подключения к показу",
      });

      socket.close();
      set({ isConnected: false, socket: null });
    });

    socket.on("connect", () => {
      set({ isConnected: true });
      notify({ type: "success", text: "Подключено к показу" });
    });

    socket.on("data", (t: any) => {
      set({ show: t });
    });

    socket.on("error_response", (err: any) => {
      notify({ type: "error", text: err });
    });
    });

  },

  disconnect: () => {
    const s = get().socket;
    if (s) s.close();
    set({socket: null, isConnected: false, show: null});
  },

  showSetStatus: (
    status: showStatus
  ) => {
    const {socket} = get();
    if (!socket) return;
    socket.emit("show_set_status", {status});
  },

  showSetSlideNum: (
    slide_num: number,
  ) => {
    const {socket} = get();
    if (!socket) return;
    socket.emit("show_set_slide_num", {slide_num});
  },

  showSetTimerIsEnabled: (
    enabled: boolean,
  ) => {
    const {socket} = get();
    if (!socket) return;
    socket.emit("show_set_timer_is_enabled", {enabled});
  },

  showSetColorScheme: (
    color_scheme: JSON
  ) => {
    const {socket} = get();
    if (!socket) return;
    socket.emit("show_set_color_scheme", {color_scheme});
  },


}));
