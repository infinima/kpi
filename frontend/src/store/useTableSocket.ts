import {create} from "zustand";
import {io, Socket} from "socket.io-client";

import {useEventsNav, useNotifications, useUser} from "@/store";

const SOCKET_URL = "wss://localhost:3000";


interface SocketState {
  socket: Socket | null;
  tableData: any | null;
  isConnected: boolean;

  connect: (passedTableType: string) => void;
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

  connect: ( passedTableType?: string) => {
    const notify = useNotifications.getState().addMessage;

    const store = useEventsNav.getState();
    const leagueId =  store.leagueId;
    const tableType = passedTableType ?? store.tableType;

    const token = useUser.getState().token;

    if (!leagueId || !tableType) {
      notify({ type: "warning", text: "Нет данных для подключения к таблице" });
      return;
    }

    const oldSocket = get().socket;
    if (oldSocket) oldSocket.close();

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      query: {
        league_id: String(leagueId),
        type: tableType,
        ...(token ? { token } : {}),
      },
    });

    set({ socket });

    socket.on("connection_error", (err: any) => {
      notify({
        type: "error",
        text: err?.message ?? "Ошибка подключения к таблице",
      });
      socket.close();
      set({ isConnected: false });
    });

    socket.on("connect", () => {
      set({ isConnected: true });
      notify({ type: "success", text: "Подключено к таблице" });

      socket.emit("get_table");
    });

    socket.on("data", (t: any) => {
      set({ tableData: t });
    });

    socket.on("error_response", (err: any) => {
      if(err?.error?.code === "WRONG_LEAGUE_STATUS"){
        notify({ type: "error", text: "Неверный статуc лиги" });
      } else{
        console.error(err);
      }
    });
  },

  disconnect: () => {
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