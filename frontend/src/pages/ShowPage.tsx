import { useEffect, useRef, useState } from "react";
import { useShowStore } from "@/store/useShowSocket";
import { useUser } from "@/store";
import { useSocketStore } from "@/store/useTableSocket";
import {ensureUserSessionInitialized} from "@/store/useUserStore";
import { useNavigate, useParams } from "react-router-dom";

import { Document, Page, pdfjs } from "react-pdf";
import {ShowTable} from "@/components/ShowTable";

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function ShowPage({ manageShowConnection = true }: { manageShowConnection?: boolean }) {
  const navigate = useNavigate();
  const { show, isConnected, connect, disconnect } = useShowStore();
  const { leagueId } = useParams();
  const [dualMode, setDualMode] = useState(false);

  useEffect(() => {
    if (!manageShowConnection) {
      return;
    }

    connect();
    return () => disconnect();
  }, [connect, disconnect, manageShowConnection]);


  const [pdfData, setPdfData] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState(120);

  const containerRef = useRef<HTMLDivElement>(null);
  const [pageWidth, setPageWidth] = useState<number | null>(null);

  useEffect(() => {
    async function loadPdf() {
      try {
        if (!leagueId) {
          return;
        }

        await ensureUserSessionInitialized();
        const token = useUser.getState().token;

        const res = await fetch(`/api/leagues/${leagueId}/fudzi_presentation`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) throw new Error("Ошибка загрузки PDF");

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        setPdfData(url);
      } catch (err) {
        // console.error("Ошибка загрузки PDF:", err);
      }
    }

    if (show?.status === "FUDZI-PRESENTATION") {
      loadPdf();
    }
    return () => {
      if (pdfData) {
        window.URL.revokeObjectURL(pdfData);
      }
    };
  }, [show?.status, leagueId]);

  useEffect(() => {
    useSocketStore.getState().disconnect();

    if (!leagueId || !show) {
      return;
    }

    if (show.status === "KVARTALY-RESULTS") {
      useSocketStore.getState().connect("kvartaly", leagueId);
    }

    if (show.status === "FUDZI-RESULTS") {
      useSocketStore.getState().connect("fudzi", leagueId);
    }

    return () => {
      useSocketStore.getState().disconnect();
    };
  }, [leagueId, show?.status]);

  useEffect(() => {
    if (!show?.timer_is_enabled) {
      setTimeLeft(120);
      return;
    }

    const id = setInterval(() => {
      setTimeLeft(t => Math.max(0, t - 1));
    }, 1000);

    return () => clearInterval(id);
  }, [show?.timer_is_enabled]);

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");

  function handlePageLoad(page: any) {
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
            <img src="/wallpaper.jpg" className="max-w-full max-h-full" />
          </div>
        );

      case "KVARTALY-RESULTS":
        return (
          <ShowTable tableType={"kvartaly"} dualMode={dualMode} />
        );

      case "FUDZI-RESULTS":
        return (
          <ShowTable tableType={"fudzi"} dualMode={dualMode} />
        );

      case "FUDZI-PRESENTATION":

        if (!pdfData) {
          return (
            <div className="w-full h-full flex items-center justify-center opacity-70">
              Загрузка PDF…
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
