import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Camera, CheckCircle2, Search, Square } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import jsQR from "jsqr";
import { apiGet, apiPatch } from "@/api";
import PrimaryButton from "@/components/ui/PrimaryButton";
import OutlineButton from "@/components/ui/OutlineButton";

type TeamInfo = {
    id: number;
    league_id: number;
    league_name?: string | null;
    owner_user_id: number | null;
    owner_full_name?: string | null;
    owner_email?: string | null;
    owner_phone_number?: string | null;
    name: string;
    school: string;
    region: string;
    meals_count: number;
    maintainer_full_name?: string | null;
    maintainer_activity?: string | null;
    status: "IN_RESERVE" | "ON_CHECKING" | "ACCEPTED" | "PAID" | "ARRIVED" | "DOCUMENTS_SUBMITTED";
    created_at: string;
    updated_at: string;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const teamStatusLabels: Record<TeamInfo["status"], string> = {
    IN_RESERVE: "В резерве",
    ON_CHECKING: "На проверке",
    ACCEPTED: "Принята",
    PAID: "Оплачена",
    ARRIVED: "Прибыла",
    DOCUMENTS_SUBMITTED: "Сдала документы",
};

function getTeamStatusLabel(status: TeamInfo["status"]) {
    return teamStatusLabels[status] ?? status;
}

function extractUuidFromScannerPayload(raw: string) {
    const normalized = String(raw ?? "").trim();

    if (!normalized) {
        return null;
    }

    if (uuidPattern.test(normalized)) {
        return normalized;
    }

    try {
        const url = new URL(normalized);
        if (url.pathname.endsWith("/scanner")) {
            const data = url.searchParams.get("data")?.trim() ?? "";
            return uuidPattern.test(data) ? data : null;
        }
    } catch {
        return null;
    }

    return null;
}

declare global {
    interface Window {
        BarcodeDetector?: new (options?: { formats?: string[] }) => {
            detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
        };
    }
}

export function ReadQrPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const rafRef = useRef<number | null>(null);

    const uuidFromQuery = useMemo(() => searchParams.get("data")?.trim() ?? "", [searchParams]);

    const [uuidInput, setUuidInput] = useState(uuidFromQuery);
    const [teams, setTeams] = useState<TeamInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [updatingTeamId, setUpdatingTeamId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [scannerEnabled, setScannerEnabled] = useState(false);
    const [scannerStatus, setScannerStatus] = useState("Сканирование выключено");

    useEffect(() => {
        setUuidInput(uuidFromQuery);
    }, [uuidFromQuery]);

    function getCameraErrorMessage(rawError: unknown) {
        const error = rawError as DOMException | undefined;

        switch (error?.name) {
            case "NotAllowedError":
            case "PermissionDeniedError":
                return "Доступ к камере запрещён в браузере или системе.";
            case "NotFoundError":
            case "DevicesNotFoundError":
                return "Камера не найдена на устройстве.";
            case "NotReadableError":
            case "TrackStartError":
                return "Камера занята другим приложением или недоступна.";
            case "SecurityError":
                return "Камера доступна только на https или localhost.";
            default:
                return "Не удалось открыть камеру.";
        }
    }

    function stopScanner() {
        if (rafRef.current) {
            window.cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }

        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setScannerEnabled(false);
        setScannerStatus("Сканирование выключено");
    }

    useEffect(() => stopScanner, []);

    useEffect(() => {
        if (!scannerEnabled) {
            return;
        }

        let cancelled = false;
        const BarcodeDetectorClass = window.BarcodeDetector;
        const detector = BarcodeDetectorClass ? new BarcodeDetectorClass({ formats: ["qr_code"] }) : null;

        async function start() {
            try {
                setScannerStatus("Запрашиваем камеру...");
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: "environment",
                    },
                    audio: false,
                });

                if (cancelled) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }

                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }

                setScannerStatus(
                    detector
                        ? "Наведите камеру на QR со ссылкой scanner"
                        : "Наведите камеру на QR со ссылкой scanner, используем резервный режим"
                );

                const scan = async () => {
                    if (cancelled || !videoRef.current) {
                        return;
                    }

                    try {
                        let rawValue: string | undefined;

                        if (detector) {
                            const results = await detector.detect(videoRef.current);
                            rawValue = results[0]?.rawValue;
                        } else {
                            const video = videoRef.current;
                            const canvas = canvasRef.current ?? document.createElement("canvas");
                            const context = canvas.getContext("2d", { willReadFrequently: true });

                            if (!canvasRef.current) {
                                canvasRef.current = canvas;
                            }

                            if (context && video.videoWidth > 0 && video.videoHeight > 0) {
                                canvas.width = video.videoWidth;
                                canvas.height = video.videoHeight;
                                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                                rawValue = jsQR(imageData.data, imageData.width, imageData.height)?.data;
                            }
                        }

                        if (rawValue) {
                            const uuid = extractUuidFromScannerPayload(rawValue);

                            if (uuid) {
                                setScannerStatus(`Найден uuid ${uuid}`);
                                stopScanner();
                                setUuidInput(uuid);
                                setSearchParams({ data: uuid });
                                return;
                            }

                            setScannerStatus("QR считан, но ссылка scanner не распознана");
                        }
                    } catch {
                        setScannerStatus("Не удалось обработать кадр, пробуем снова...");
                    }

                    rafRef.current = window.requestAnimationFrame(() => {
                        void scan();
                    });
                };

                void scan();
            } catch (cameraError) {
                setScannerStatus(getCameraErrorMessage(cameraError));
                stopScanner();
            }
        }

        void start();

        return () => {
            cancelled = true;
            stopScanner();
        };
    }, [scannerEnabled, setSearchParams]);

    useEffect(() => {
        if (!uuidFromQuery) {
            setTeams([]);
            setError(null);
            return;
        }

        if (!uuidPattern.test(uuidFromQuery)) {
            setTeams([]);
            setError("В параметре data передан некорректный uuid.");
            return;
        }

        let cancelled = false;

        async function loadTeams() {
            setLoading(true);
            setError(null);

            try {
                const data = await apiGet<TeamInfo[]>(`teams/user/uuid/${uuidFromQuery}`, { error: true });

                if (cancelled) {
                    return;
                }

                setTeams(Array.isArray(data) ? data : []);
            } catch {
                if (!cancelled) {
                    setTeams([]);
                    setError("Не удалось получить команды пользователя по uuid.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadTeams();

        return () => {
            cancelled = true;
        };
    }, [uuidFromQuery]);

    function handleBack() {
        if (window.history.length > 1) {
            navigate(-1);
            return;
        }

        navigate("/");
    }

    function handleSearch() {
        const normalizedUuid = uuidInput.trim();

        if (!normalizedUuid) {
            setSearchParams({});
            setTeams([]);
            setError(null);
            return;
        }

        if (!uuidPattern.test(normalizedUuid)) {
            setError("Введите корректный uuid пользователя.");
            setTeams([]);
            return;
        }

        setSearchParams({ data: normalizedUuid });
    }

    async function handleMarkArrived(teamId: number) {
        setUpdatingTeamId(teamId);

        try {
            await apiPatch(`teams/${teamId}`, { status: "ARRIVED" }, { success: "Статус команды обновлён", error: true });
            setTeams((current) =>
                current.map((team) => (team.id === teamId ? { ...team, status: "ARRIVED" } : team)),
            );
        } finally {
            setUpdatingTeamId(null);
        }
    }

    return (
        <section className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,116,144,0.12),transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eef6ff_100%)] px-6 py-8">
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="rounded-[32px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.94)] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
                    <div className="mb-4">
                        <OutlineButton
                            active
                            onClick={handleBack}
                            className="px-4 py-2 text-sm"
                            leftIcon={<ArrowLeft size={14} />}
                        >
                            Назад
                        </OutlineButton>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                            <label className="flex-1">
                                <div className="text-sm font-medium text-[var(--color-text-main)]">UUID пользователя</div>
                                <input
                                    value={uuidInput}
                                    onChange={(event) => setUuidInput(event.target.value)}
                                    placeholder="88c756f2-290a-11f1-afc9-02420a000110"
                                    className="mt-3 w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-[var(--color-text-main)] outline-none transition focus:border-[var(--color-primary-light)]"
                                />
                            </label>

                            <PrimaryButton
                                active
                                onClick={handleSearch}
                                disabled={loading}
                                loading={loading}
                                loadingText="Загружаем..."
                                className="px-5 py-3 text-sm shadow-none"
                                leftIcon={<Search size={14} />}
                            >
                                Показать команды
                            </PrimaryButton>
                        </div>

                        <div className="rounded-[24px] border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-4">
                            <div className="text-sm font-medium text-[var(--color-text-main)]">Сканер QR</div>
                            <div className="mt-2 text-sm text-[var(--color-text-secondary)]">{scannerStatus}</div>
                            <div className="mt-3 overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-black">
                                <video ref={videoRef} muted playsInline className="aspect-video w-full object-cover" />
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <PrimaryButton
                                    active
                                    onClick={() => {
                                        setError(null);
                                        setScannerEnabled(true);
                                    }}
                                    disabled={scannerEnabled}
                                    className="px-4 py-2 text-sm shadow-none"
                                    leftIcon={<Camera size={14} />}
                                >
                                    Сканировать
                                </PrimaryButton>
                                <OutlineButton
                                    active
                                    onClick={stopScanner}
                                    className="px-4 py-2 text-sm"
                                    leftIcon={<Square size={14} />}
                                >
                                    Стоп
                                </OutlineButton>
                            </div>
                        </div>
                    </div>

                    {error ? (
                        <div className="mt-4 rounded-[20px] border border-[rgba(220,38,38,0.18)] bg-[rgba(254,242,242,0.92)] px-4 py-4 text-sm text-[rgb(153,27,27)]">
                            {error}
                        </div>
                    ) : null}

                    {!uuidFromQuery && !loading ? (
                        <div className="mt-6 rounded-[20px] border border-dashed border-[var(--color-border)] px-4 py-6 text-sm text-[var(--color-text-secondary)]">
                            Откройте страницу со ссылкой вида `https://kpiturnir.ru/scanner?data=uuid` или введите uuid вручную.
                        </div>
                    ) : null}

                    {uuidFromQuery && !loading && !error && teams.length === 0 ? (
                        <div className="mt-6 rounded-[20px] border border-dashed border-[var(--color-border)] px-4 py-6 text-sm text-[var(--color-text-secondary)]">
                            Для этого пользователя команды не найдены.
                        </div>
                    ) : null}

                    {teams.length > 0 ? (
                        <div className="mt-6 grid gap-4">
                            {teams.map((team) => {
                                const isArrived = (team.status === "ARRIVED" || team.status === "DOCUMENTS_SUBMITTED");
                                const isUpdating = updatingTeamId === team.id;

                                return (
                                    <article
                                        key={team.id}
                                        className="rounded-[28px] border border-[var(--color-border)] bg-[rgba(248,250,252,0.76)] p-5"
                                    >
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <h2 className="text-xl font-semibold text-[var(--color-text-main)]">
                                                        {team.name}
                                                    </h2>
                                                    <span className="rounded-full bg-[rgba(15,23,42,0.06)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
                                                        {getTeamStatusLabel(team.status)}
                                                    </span>
                                                </div>

                                                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                                    <div className="rounded-[20px] bg-white px-4 py-3">
                                                        <div className="text-xs uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Регион</div>
                                                        <div className="mt-2 text-sm text-[var(--color-text-main)]">{team.region || "Не указан"}</div>
                                                    </div>
                                                    <div className="rounded-[20px] bg-white px-4 py-3">
                                                        <div className="text-xs uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Школа</div>
                                                        <div className="mt-2 text-sm text-[var(--color-text-main)]">{team.school || "Не указана"}</div>
                                                    </div>
                                                    <div className="rounded-[20px] bg-white px-4 py-3">
                                                        <div className="text-xs uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Сопровождающий</div>
                                                        <div className="mt-2 text-sm text-[var(--color-text-main)]">{team.maintainer_full_name || "Не указан"}</div>
                                                    </div>
                                                    <div className="rounded-[20px] bg-white px-4 py-3">
                                                        <div className="text-xs uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Статус</div>
                                                        <div className="mt-2 text-sm text-[var(--color-text-main)]">{getTeamStatusLabel(team.status)}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 items-start">
                                                <PrimaryButton
                                                    active
                                                    onClick={() => void handleMarkArrived(team.id)}
                                                    disabled={isArrived}
                                                    loading={isUpdating}
                                                    loadingText="Обновляем..."
                                                    className="px-4 py-3 text-sm shadow-none"
                                                    leftIcon={<CheckCircle2 size={14} />}
                                                >
                                                    {isArrived ? "Уже прибыли" : "Прибыли"}
                                                </PrimaryButton>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : null}
                </div>
            </div>
        </section>
    );
}
