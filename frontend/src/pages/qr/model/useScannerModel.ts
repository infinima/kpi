import { teamApi } from "@/entities/team/api";
import { useServerCollection } from "@/shared/lib/useServerCollection";
import jsQR from "jsqr";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { extractUuidFromScannerPayload, TeamInfo, uuidPattern } from './scannerSupport';
export function useScannerModel() {
    const navigate = useNavigate();

    const [searchParams, setSearchParams] = useSearchParams();

    const videoRef = useRef<HTMLVideoElement | null>(null);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const streamRef = useRef<MediaStream | null>(null);

    const rafRef = useRef<number | null>(null);

    const uuidFromQuery = useMemo(() => searchParams.get("data")?.trim() ?? "", [searchParams]);

    const [uuidInput, setUuidInput] = useState(uuidFromQuery);

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

                        if (cancelled) return;
                        if (rawValue) {
                            const uuid = extractUuidFromScannerPayload(rawValue);

                            if (uuid) {
                                setScannerStatus(`QR-код распознан`);
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

                    if (cancelled) return;
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

    const { data: teams, setData: setTeams, loading, error: requestError } = useServerCollection<TeamInfo>(
        ["scanner-teams", uuidFromQuery], () => teamApi.byUserUuid(uuidFromQuery, { error: true }), uuidPattern.test(uuidFromQuery)
    );
    useEffect(() => { setError(uuidFromQuery && !uuidPattern.test(uuidFromQuery) ? "В параметре data передан некорректный QR-токен." : null); }, [uuidFromQuery]);

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
            setError("Введите QR-токен пользователя.");
            setTeams([]);
            return;
        }

        setSearchParams({ data: normalizedUuid });
    }

    async function handleMarkArrived(teamId: number) {
        if (updatingTeamId || !teams.some(team => team.id === teamId && team.can_register && team.arrival_open)) return;
        setUpdatingTeamId(teamId);

        try {
            await teamApi.update(teamId, { status: "ARRIVED" }, { success: "Статус команды обновлён", error: true });
            setTeams((current) =>
                current.map((team) => (team.id === teamId ? { ...team, status: "ARRIVED" } : team)),
            );
        } finally {
            setUpdatingTeamId(null);
        }
    }
    return {
        navigate,
        searchParams,
        setSearchParams,
        videoRef,
        canvasRef,
        streamRef,
        rafRef,
        uuidFromQuery,
        uuidInput,
        setUuidInput,
        teams,
        setTeams,
        loading,
        updatingTeamId,
        setUpdatingTeamId,
        error: error ?? (requestError ? "Не удалось получить команды пользователя по QR-токену." : null),
        setError,
        scannerEnabled,
        setScannerEnabled,
        scannerStatus,
        setScannerStatus,
        getCameraErrorMessage,
        stopScanner,
        handleBack,
        handleSearch,
        handleMarkArrived,
    };
}
