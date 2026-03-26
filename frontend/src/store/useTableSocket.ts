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
let tableSocketConnectVersion = 0;

function getSocketRouteConfig() {
  const match = window.location.pathname.match(
    /^\/events\/\d+\/location\/\d+\/league\/(\d+)\/results\/(kvartaly|fudzi)\/?$/
  );

  if (!match) {
    return null;
  }

  return {
    leagueId: match[1],
    tableType: match[2],
  };
}


interface SocketState {
  socket: Socket | null;
  tableData: any | null;
  isConnected: boolean;

  connect: (passedTableType?: string, passedLeagueId?: string | number) => void;
  disconnect: () => void;

  fudziSetAnswer: (
    team_id: number,
    question_num: number,
    status: "correct" | "incorrect" | "not_submitted"
  ) => void;

  fudziSetCard: (team_id: number, has_card: boolean) => void;

  fudziSetPenalty : (
    team_id: number,
    penalty: number
  ) => void;

  kvartalAddAnswer: (
    team_id: number,
    question_num: number,
    delta_correct: number,
    delta_incorrect: number
  ) => void;

  kvartalFinish : (
    team_id: number,
    kvartal: number,
    finished: boolean
  ) => void;

  kvartalSetPenalty : (
    team_id: number,
    penalty: number
  ) => void;

}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  tableData: null,
  isConnected: false,

  connect: ( passedTableType?: string, passedLeagueId?: string | number) => {
    const connectVersion = ++tableSocketConnectVersion;
    const previousSocket = get().socket;

    if (previousSocket) {
      previousSocket.close();
    }

    set({ socket: null, tableData: null, isConnected: false });

    void ensureUserSessionInitialized().then(() => {
    if (connectVersion !== tableSocketConnectVersion) {
      return;
    }

    const notify = useNotifications.getState().addMessage;

    const routeConfig = getSocketRouteConfig();
    const leagueId =  passedLeagueId ?? routeConfig?.leagueId ?? null;
    const tableType = passedTableType ?? routeConfig?.tableType ?? null;

    const token = useUser.getState().token;

    if (!leagueId || !tableType) {
      notify({ type: "warning", text: "Нет данных для подключения к таблице" });
      return;
    }

    const socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket"],
      query: {
        league_id: String(leagueId),
        type: tableType,
        ...(token ? { token } : {}),
      },
    });

    set({ socket });

    const handleTableData = (t: any) => {
      set({ tableData: t });
    };

    socket.on("connect_error", (err: any) => {
      if (connectVersion !== tableSocketConnectVersion) {
        return;
      }
      notify({
        type: "error",
        text: err?.message ?? "Ошибка подключения к таблице",
      });
      socket.close();
      set({ socket: null, isConnected: false });
    });

    socket.on("connect", () => {
      if (connectVersion !== tableSocketConnectVersion) {
        socket.close();
        return;
      }
      set({ isConnected: true });
      notify({ type: "success", text: "Подключено к таблице" });

      socket.emit("get_table");
    });

    socket.on("disconnect", () => {
      if (connectVersion !== tableSocketConnectVersion) {
        return;
      }
      set({ isConnected: false });
    });

    socket.on("data", handleTableData);
    socket.on("table_data", handleTableData);

    socket.on("error_response", (err: any) => {
      if (connectVersion !== tableSocketConnectVersion) {
        return;
      }
      if(err?.error?.code === "WRONG_LEAGUE_STATUS"){
        notify({ type: "error", text: "Неверный статуc лиги" });
      } else{
        console.error(err);
      }
    });

    socket.connect();
    });
  },

  disconnect: () => {
    tableSocketConnectVersion += 1;
    const s = get().socket;
    if (s) s.close();
    set({socket: null, isConnected: false, tableData: null});
  },


  fudziSetAnswer: (team_id, question_num, status) => {
    const {socket} = get();
    if (!socket) return;

    socket.emit("fudzi_set_answer", {
      team_id,
      question_num,
      status,
    });
  },

  fudziSetCard: (team_id, has_card) => {
    const {socket} = get();
    if (!socket) return;

    socket.emit("fudzi_set_card", {team_id, has_card});
  },

  fudziSetPenalty: (team_id, penalty) => {
    const {socket} = get();
    if (!socket) return;

    socket.emit("fudzi_set_penalty", {team_id, penalty});
  },


  kvartalAddAnswer: (team_id, question_num, delta_correct, delta_incorrect) => {
    const {socket} = get();
    if (!socket) return;

    socket.emit("kvartaly_add_answer", {
      team_id,
      question_num,
      delta_correct,
      delta_incorrect,
    });
  },


  kvartalFinish: (team_id, kvartal, finished) => {
    const {socket} = get();
    if (!socket) return;

    socket.emit("kvartaly_finish", {team_id, kvartal, finished});
  },


  kvartalSetPenalty: (team_id, penalty) => {
    const {socket} = get();
    if (!socket) return;

    socket.emit("kvartaly_set_penalty", {team_id, penalty});
  },


}));
