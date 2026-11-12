import { leagueApi } from "@/entities/league/api/leagueApi";
import { timerSeconds, type ShowState } from "@/entities/show/model/protocol";
import { useTableConnection } from "@/pages/results/model/useTableConnection";
import { useEffect, useState } from "react";

export function useShowScreenModel(leagueId: string | undefined, show: ShowState | null) {
    const [pdfData, setPdfData] = useState<string | null>(null);
    const [pdfError, setPdfError] = useState<string | null>(null);
    const [revision, setRevision] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const table = useTableConnection(show?.status === "KVARTALY-RESULTS" ? "kvartaly" : show?.status === "FUDZI-RESULTS" ? "fudzi" : null, leagueId);
    useEffect(() => {
        const controller = new AbortController();
        let url: string | null = null;
        let active = true;
        setPdfData(null); setPdfError(null);
        if (leagueId && show?.status === "FUDZI-PRESENTATION") {
            void leagueApi.presentation(leagueId, controller.signal).then((blob) => {
                if (!active) return;
                url = URL.createObjectURL(blob); setPdfData(url);
            }).catch(() => { if (active && !controller.signal.aborted) setPdfError("Не удалось загрузить PDF."); });
        }
        return () => { active = false; controller.abort(); if (url) URL.revokeObjectURL(url); };
    }, [leagueId, show?.status, revision]);
    useEffect(() => {
        const serverTime = show?.server_time ? Date.parse(show.server_time) : NaN;
        const offset = Number.isFinite(serverTime) ? Date.now() - serverTime : 0;
        const update = () => setTimeLeft(timerSeconds(show, Date.now(), offset));
        update();
        if (!show?.timer_is_enabled) return;
        const id = setInterval(update, 250);
        return () => clearInterval(id);
    }, [show?.server_time, show?.timer_is_enabled, show?.timer_minutes, show?.timer_started_at]);
    return { table, pdfData, pdfError, reloadPresentation: () => setRevision((value) => value + 1), mm: String(Math.floor(timeLeft / 60)).padStart(2, "0"), ss: String(timeLeft % 60).padStart(2, "0") };
}
