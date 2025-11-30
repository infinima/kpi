import { useEffect } from "react";
import { useSocketStore, useShowStore } from "@/store";
import {
  ChevronLeft,
  ChevronRight,
  Timer,
  Monitor
} from "lucide-react";
import {ShowPage} from "@/pages/ShowPage";

export function ShowControlPage() {
  const {
    connect,
    disconnect,
    show,
    isConnected,
    showSetStatus,
    showSetSlideNum,
    showSetTimerIsEnabled,
  } = useShowStore();

  useEffect(() => {
    connect();
    return () => disconnect();
  }, []);

  function changeSlide(delta: number) {
    let n = (show?.slide_num ?? 1) + delta;
    if (n < 1) n = 1;
    if (n > 99) n = 99;
    showSetSlideNum(n);
  }

  return (
    <div className="flex flex-col gap-6 pb-20">

      {/*/!* Заголовок *!/*/}
      {/*<h2 className="text-2xl font-bold flex items-center gap-2">*/}
      {/*  <Monitor size={24}/> Управление показом*/}
      {/*</h2>*/}

      {!isConnected && (
        <div className="p-3 rounded-lg bg-hover dark:bg-dark-hover text-center opacity-70">
          Подключение…
        </div>
      )}

      {isConnected && show && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            {/* SELECT — статус показа */}
            <select
              className="
                px-4 py-2 rounded-lg
                bg-surface dark:bg-dark-surface
                border border-border dark:border-dark-border
                w-full sm:w-80
              "
              value={show.status}
              onChange={(e) => showSetStatus(e.target.value as any)}
            >
              <option value="WALLPAPER">Заставка</option>
              <option value="KVARTALY-RESULTS">Таблица Кварталов</option>
              <option value="FUDZI-PRESENTATION">Презентация Фудзи</option>
              <option value="FUDZI-RESULTS">Таблица Фудзи</option>
            </select>

            {show.status === "FUDZI-PRESENTATION" && (
              <div className="flex items-center gap-2">

                <button
                  onClick={() =>
                    showSetTimerIsEnabled(!show.timer_is_enabled)
                  }
                  className={`
                    px-3 py-2 rounded-lg flex items-center gap-1
                    text-sm whitespace-nowrap
                    ${
                    show.timer_is_enabled
                      ? "bg-primary text-white"
                      : "bg-hover dark:bg-dark-hover"
                  }
                  `}
                >
                  <Timer size={16}/>
                </button>

                {/* Слайд -1 */}
                <button
                  onClick={() => changeSlide(-1)}
                  className="px-3 py-2 rounded-lg bg-hover dark:bg-dark-hover"
                >
                  <ChevronLeft size={16}/>
                </button>

                {/* Input → номер слайда */}
                <input
                  className="
                    w-14 text-center px-2 py-1 rounded-lg text-sm
                    bg-surface dark:bg-dark-surface
                    border border-border dark:border-dark-border
                  "
                  value={show.slide_num}
                  onChange={(e) => {
                    let n = Number(e.target.value);
                    if (!Number.isFinite(n)) return;
                    if (n < 1) n = 1;
                    if (n > 99) n = 99;
                    showSetSlideNum(n);
                  }}
                />

                {/* Слайд +1 */}
                <button
                  onClick={() => changeSlide(+1)}
                  className="px-3 py-2 rounded-lg bg-hover dark:bg-dark-hover"
                >
                  <ChevronRight size={16}/>
                </button>

              </div>
            )}

          </div>

          {/* ---------------------------------------------------
             IFRAME — предпросмотр экрана
             --------------------------------------------------- */}
          <div className="mt-4 rounded-xl overflow-hidden shadow-card border border-border dark:border-dark-border">
              <ShowPage iframe/>
          </div>
        </>
      )}
    </div>
  );
}