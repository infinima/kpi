import {create} from "zustand";
import {io, Socket} from "socket.io-client";

import {useEventsNav, useNotifications, useUser} from "@/store";

const SOCKET_URL = "wss://localhost:3000";

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
    const notify = useNotifications.getState().addMessage;

    let { leagueId } = useEventsNav.getState();
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

  },

  disconnect: () => {
    const s = get().socket;
    if (s) s.close();
    set({socket: null, isConnected: false, show: null});
  },

  showSetStatus: (
    status: showStatus
  ) => {
    const notify = useNotifications.getState().addMessage;

    const {socket} = get();
    if (!socket) return;
    socket.emit("show_set_status", {status});
    notify({type: "success", text: `Переключено на ${translator[status]}`});

  },

  showSetSlideNum: (
    slide_num: number,
  ) => {
    const notify = useNotifications.getState().addMessage;

    const {socket} = get();
    if (!socket) return;
    socket.emit("show_set_slide_num", {slide_num});

    notify({type: "success", text: `Переключено на слайд ${slide_num}`});

  },

  showSetTimerIsEnabled: (
    enabled: boolean,
  ) => {

    const notify = useNotifications.getState().addMessage;

    const {socket} = get();
    if (!socket) return;
    socket.emit("show_set_timer_is_enabled", {enabled});

    notify({type: "success", text: `Таймер ${enabled ? "включен" : "выключен"}`});


  },

  showSetColorScheme: (
    color_scheme: JSON
  ) => {


    const notify = useNotifications.getState().addMessage;

    const {socket} = get();
    if (!socket) return;
    socket.emit("show_set_color_scheme", {color_scheme});

    notify({type: "success", text: `Тема изменена`});

  },


}));