import type { ShowState } from "@/entities/show/model/protocol";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShowScreenModel } from "../model/useShowScreenModel";

import { ShowTable } from "@/pages/show/ui/ShowTable";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function ShowScreen({ manageShowConnection = true, leagueId, show, isConnected }: { manageShowConnection?: boolean; leagueId?: string; show: ShowState | null; isConnected: boolean; }) {
    const navigate = useNavigate();
    const [dualMode, setDualMode] = useState(false);

    const { table, pdfData, pdfError, reloadPresentation, mm, ss } = useShowScreenModel(leagueId, show);
    const [numPages, setNumPages] = useState(0);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [pageWidth, setPageWidth] = useState<number | null>(null);
    useEffect(() => { setNumPages(0); }, [pdfData]);

    function handlePageLoad(page: { originalWidth: number; originalHeight: number; }) {
        const container = containerRef.current;
        if (!container) return;

        const containerW = container.clientWidth;
        const containerH = container.clientHeight;

        const pdfW = page.originalWidth;
        const pdfH = page.originalHeight;

        // Масштабирование PDF так, чтобы оно влезало в контейнер 16:9
        const scale = Math.min(containerW / pdfW, containerH / pdfH);

        setPageWidth(pdfW * scale);
    }

    function renderContent() {
        if (!show) return null;

        switch (show.status) {
            case "WALLPAPER":

                return (
                    <div className="w-full h-full flex items-center justify-center bg-black">
                        <video
                            src="/dark.mp4"
                            className="max-w-full max-h-full object-cover pointer-events-none"
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="auto"
                            disablePictureInPicture
                            disableRemotePlayback
                        />
                    </div>
                );

            case "KVARTALY-RESULTS":
                return (
                    <ShowTable tableType="kvartaly" dualMode={dualMode} tableData={table.tableData} isConnected={table.isConnected} />
                );

            case "FUDZI-RESULTS":
                return (
                    <ShowTable tableType="fudzi" dualMode={dualMode} tableData={table.tableData} isConnected={table.isConnected} />
                );

            case "FUDZI-PRESENTATION":

                if (!pdfData) {
                    return (
                        <div className="w-full h-full flex items-center justify-center opacity-70">
                            {pdfError ?? "Загрузка PDF…"}
                            {pdfError ? <button type="button" className="pointer-events-auto ml-2 underline" onClick={reloadPresentation}>Повторить</button> : null}
                        </div>
                    );
                }

                const slideNum = Math.min(Math.max(show.slide_num ?? 1, 1), numPages);

                return (
                    <div
                        ref={containerRef}
                        className="relative w-full h-full bg-black flex items-center justify-center"
                    >
                        <Document
                            file={pdfData}
                            onLoadSuccess={(p) => setNumPages(p.numPages)}
                            loading={<div className="text-white opacity-50">Загрузка…</div>}
                        >
                            <Page
                                pageNumber={slideNum}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                onLoadSuccess={handlePageLoad}
                                width={pageWidth ?? undefined}
                            />
                        </Document>
                    </div>
                );

            default:
                return (
                    <div className="text-white opacity-70 w-full h-full flex items-center justify-center">
                        Неизвестный статус
                    </div>
                );
        }
    }

    const backgroundClassName = show?.status === "WALLPAPER"
        ? "bg-white"
        : show?.status === "FUDZI-PRESENTATION"
            ? "bg-black"
            : "bg-[#1364b3]";
    const containerClassName = manageShowConnection
        ? "relative h-full min-h-[calc(100vh)] w-full overflow-hidden text-white"
        : "relative h-full w-full overflow-hidden text-white";

    // ========= UI ============
    // ========= UI ============
    return (
        <div className={`pointer-events-none h-full w-full ${backgroundClassName}`}>
            <div ref={containerRef} className={`${containerClassName} ${backgroundClassName}`}>

                <button
                    type="button"
                    aria-label="Переключить двухколоночный режим"
                    onClick={() => setDualMode((current) => !current)}
                    className="pointer-events-auto absolute left-0 top-0 z-20 h-[25vw] w-[25vw] max-h-64 max-w-64 min-h-24 min-w-24 bg-transparent"
                />

                <button
                    type="button"
                    aria-label="Назад"
                    onClick={() => navigate(-1)}
                    className="pointer-events-auto absolute left-1/2 top-0 z-20 h-24 w-24 -translate-x-1/2 rounded-full bg-transparent"
                />

                <button
                    type="button"
                    aria-label="Полноэкранный режим"
                    onClick={() => {
                        const element = containerRef.current;
                        if (!element) {
                            return;
                        }

                        if (document.fullscreenElement === element) {
                            void document.exitFullscreen();
                            return;
                        }

                        if (!document.fullscreenElement) {
                            void element.requestFullscreen();
                            return;
                        }

                        void document.exitFullscreen().catch(() => {
                            void element.requestFullscreen();
                        });
                    }}
                    className="pointer-events-auto absolute right-0 top-0 z-20 h-[25vw] w-[25vw] max-h-64 max-w-64 min-h-24 min-w-24 bg-transparent"
                />

                {/* TIMER — всегда сверху */}
                {show?.timer_is_enabled && (
                    <div className="absolute top-4 right-4 px-4 py-2 rounded-lg bg-white/20 text-8xl font-bold backdrop-blur z-10">
                        {mm}:{ss}
                    </div>
                )}

                {/* CONTENT — ниже таймера */}
                <div className="absolute inset-0 z-0">
                    {!isConnected ? (
                        <div className="flex w-full h-full items-center justify-center opacity-70">
                            Подключение…
                        </div>
                    ) : (
                        renderContent()
                    )}
                </div>

            </div>
        </div>
    );
}
