import { useUser } from "@/entities/session/model/session";
import { decodeShow, type ShowCommands, type ShowState, type ShowStatus } from "@/entities/show/model/protocol";
import { createChannel } from "@/shared/realtime/channel";
import { getRealtimeUrl, socketFactory } from "@/shared/realtime/runtime";
import { useEffect, useMemo, useSyncExternalStore } from "react";

export function useShowConnection(leagueId: string | undefined) {
    const token = useUser((state) => state.token);
    const channel = useMemo(() => createChannel<ShowState, ShowCommands>(socketFactory, decodeShow), [leagueId, token]);
    const state = useSyncExternalStore(channel.subscribe, channel.getSnapshot);
    useEffect(() => {
        if (leagueId) channel.start({ url: getRealtimeUrl(), leagueId, type: "show", token });
        return () => channel.stop();
    }, [channel, leagueId, token]);
    return {
        show: state.data, isConnected: state.connected, error: state.error,
        showSetStatus: (status: ShowStatus) => { channel.send("show_set_status", { status }); },
        showSetSlideNum: (slide_num: number) => { channel.send("show_set_slide_num", { slide_num }); },
        showSetTimerIsEnabled: (enabled: boolean, minutes?: number) => { channel.send("show_set_timer_is_enabled", minutes === undefined ? { enabled } : { enabled, minutes }); },
    };
}
