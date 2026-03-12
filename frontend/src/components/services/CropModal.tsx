import { useCallback, useEffect, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Crop, Image as ImageIcon, X } from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import OutlineButton from "@/components/ui/OutlineButton";
import { useModalStore } from "@/store";

export function CropModal() {
    const activeModal = useModalStore((state) => state.activeModal);
    const closeModal = useModalStore((state) => state.closeModal);
    const payload = activeModal?.type === "crop" ? activeModal.payload : null;

    const [zoom, setZoom] = useState(1);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [imageSrc, setImageSrc] = useState<string | null>(null);

    useEffect(() => {
        setZoom(1);
        setCrop({ x: 0, y: 0 });
        setCroppedAreaPixels(null);
        setIsSaving(false);
        setImageSrc(null);
    }, [payload]);

    useEffect(() => {
        if (!payload) {
            return undefined;
        }

        let isMounted = true;
        const reader = new FileReader();

        reader.onload = () => {
            if (isMounted) {
                setImageSrc(String(reader.result ?? ""));
            }
        };

        reader.readAsDataURL(payload.file);

        return () => {
            isMounted = false;
        };
    }, [payload]);

    const onCropComplete = useCallback((_: Area, area: Area) => {
        setCroppedAreaPixels(area);
    }, []);

    if (!payload || !imageSrc) {
        return null;
    }

    const handleClose = () => {
        if (isSaving) {
            return;
        }

        closeModal();
    };

    const handleSave = async () => {
        if (!croppedAreaPixels || isSaving) {
            return;
        }

        setIsSaving(true);

        try {
            const base64 = await getCroppedImage(imageSrc, croppedAreaPixels);
            await payload.onCrop(base64);
            closeModal();
        } catch {
            setIsSaving(false);
            return;
        }

        setIsSaving(false);
    };

    return (
        <div
            className="fixed inset-0 z-[260] flex items-center justify-center bg-[rgba(15,23,42,0.48)] p-4 backdrop-blur-sm"
            onClick={handleClose}
        >
            <div
                className="w-full max-w-3xl overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.97)] shadow-[0_30px_100px_rgba(15,23,42,0.22)]"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-6 py-5">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-2xl bg-[rgba(14,116,144,0.12)] p-2 text-[var(--color-primary)]">
                            <Crop size={18} />
                        </div>
                        <div>
                            <div className="text-lg font-semibold text-[var(--color-text-main)]">
                                {payload.title ?? "Обрезать фото"}
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSaving}
                        className="rounded-xl p-2 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-main)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="grid gap-5 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_260px]">
                    <div className="overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[linear-gradient(135deg,rgba(226,232,240,0.95),rgba(241,245,249,0.92))] p-3">
                        <div className="relative h-[380px] overflow-hidden rounded-[22px] bg-[rgba(15,23,42,0.82)] sm:h-[460px]">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={payload.aspect ?? 1}
                                objectFit="contain"
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 rounded-[28px] border border-[var(--color-border)] bg-[rgba(248,250,252,0.82)] p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-main)]">
                            <ImageIcon size={16} className="text-[var(--color-primary)]" />
                            Управление кадром
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm text-[var(--color-text-secondary)]">
                                <span>Масштаб</span>
                                <span>{zoom.toFixed(1)}x</span>
                            </div>
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.1}
                                value={zoom}
                                onChange={(event) => setZoom(Number(event.target.value))}
                                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[rgba(148,163,184,0.28)] accent-[var(--color-primary)]"
                            />
                        </div>

                        <div className="flex flex-col gap-2 pt-2">
                            <PrimaryButton
                                onClick={() => void handleSave()}
                                loading={isSaving}
                                loadingText="Сохраняем..."
                                className="w-full"
                            >
                                {payload.confirmLabel ?? "Сохранить"}
                            </PrimaryButton>
                            <OutlineButton
                                onClick={handleClose}
                                disabled={isSaving}
                                className="w-full"
                            >
                                Отмена
                            </OutlineButton>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

async function getCroppedImage(imageUrl: string, area: Area) {
    const image = await createImage(imageUrl);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error("Canvas context is unavailable");
    }

    canvas.width = Math.max(1, Math.round(area.width));
    canvas.height = Math.max(1, Math.round(area.height));

    context.drawImage(
        image,
        area.x,
        area.y,
        area.width,
        area.height,
        0,
        0,
        canvas.width,
        canvas.height
    );

    return canvas.toDataURL("image/jpeg", 0.92);
}

function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Failed to load image"));
        image.src = url;
    });
}
