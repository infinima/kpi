import { decodeTable, type FudziStatus, type StageType, type TableCommands, type TableTeams } from "@/entities/results/model/protocol";
import { useUser } from "@/entities/session/model/session";
import { createChannel } from "@/shared/realtime/channel";
import { getRealtimeUrl, socketFactory } from "@/shared/realtime/runtime";
import { useEffect, useMemo, useSyncExternalStore } from "react";

export function useTableConnection(type: StageType | null, leagueId: string | undefined) {
    const token = useUser((state) => state.token);
    const channel = useMemo(() => createChannel<TableTeams, TableCommands>(socketFactory, (value) => decodeTable(value, type!), ["data", "table_data"], "get_table"), [type, leagueId, token]);
    const state = useSyncExternalStore(channel.subscribe, channel.getSnapshot);
    useEffect(() => {
        if (type && leagueId) channel.start({ url: getRealtimeUrl(), leagueId, type, token });
        return () => channel.stop();
    }, [channel, type, leagueId, token]);
    return {
        tableData: state.data, isConnected: state.connected, error: state.error,
        fudziSetAnswer: (team_id: number, question_num: number, status: FudziStatus) => { channel.send("fudzi_set_answer", { team_id, question_num, status }); },
        fudziSetCard: (team_id: number, has_card: boolean) => { channel.send("fudzi_set_card", { team_id, has_card }); },
        fudziSetPenalty: (team_id: number, penalty: number) => { channel.send("fudzi_set_penalty", { team_id, penalty }); },
        kvartalAddAnswer: (team_id: number, question_num: number, delta_correct: number, delta_incorrect: number) => { channel.send("kvartaly_add_answer", { team_id, question_num, delta_correct, delta_incorrect }); },
        kvartalFinish: (team_id: number, kvartal: number, finished: boolean) => { channel.send("kvartaly_finish", { team_id, kvartal, finished }); },
        kvartalSetPenalty: (team_id: number, penalty: number) => { channel.send("kvartaly_set_penalty", { team_id, penalty }); },
    };
}
export type TableActions = ReturnType<typeof useTableConnection>;
