import type { ShowStatus } from "@/entities/show/model/protocol";
import { useShowConnection } from "@/pages/show/model/useShowConnection";
import { useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { EventsOutletContext } from './showControlSupport';
export function useShowControlModel() {
    const { leagueId } = useParams();

    const {
        show,
        isConnected,
        error,
        showSetStatus,
        showSetSlideNum,
        showSetTimerIsEnabled,
    } = useShowConnection(leagueId);

    const outletContext = useOutletContext<EventsOutletContext | undefined>();

    const [customTimerMinutes, setCustomTimerMinutes] = useState("3");

    function changeSlide(delta: number) {
        let n = (show?.slide_num ?? 1) + delta;
        if (n < 1) n = 1;
        if (n > 99) n = 99;
        showSetSlideNum(n);
    }

    function handleStatusChange(status: string) {
        showSetStatus(status as ShowStatus);
    }

    function startTimer(minutes: number) {
        if (!Number.isFinite(minutes) || minutes < 1) {
            return;
        }
        showSetTimerIsEnabled(true, minutes);
    }
    return {
        connectionError: error,
        leagueId,
        show,
        isConnected,
        showSetStatus,
        showSetSlideNum,
        showSetTimerIsEnabled,
        outletContext,
        customTimerMinutes,
        setCustomTimerMinutes,
        changeSlide,
        handleStatusChange,
        startTimer,
    };
}
