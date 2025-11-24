import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { X } from "lucide-react";

interface CropModalProps {
    file: File;
    onClose: () => void;
    onCrop: (base64: string) => void;
}

export function CropModal({ file, onClose, onCrop }: CropModalProps) {
    const [zoom, setZoom] = useState<number>(1);
    const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(
        null
    );

    const onCropComplete = useCallback((_: Area, area: Area) => {
        setCroppedAreaPixels(area);
    }, []);

    async function getCroppedImage() {
        if (!croppedAreaPixels) return;

        const image = await createImage(URL.createObjectURL(file));
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;

        ctx.drawImage(
            image,
            croppedAreaPixels.x,
            croppedAreaPixels.y,
            croppedAreaPixels.width,
            croppedAreaPixels.height,
            0,
            0,
            croppedAreaPixels.width,
            croppedAreaPixels.height
        );

        const base64 = canvas.toDataURL("image/png");
        onCrop(base64);
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div
                className="
                bg-surface dark:bg-dark-surface
                rounded-xl border border-border dark:border-dark-border
                shadow-card p-4 w-full max-w-lg space-y-4
            "
            >
                {/* HEADER */}
                <div className="flex justify-between items-center">
                    <h2 className="text-h2">Обрезать фото</h2>
                    <button onClick={onClose}>
                        <X />
                    </button>
                </div>

                <div className="relative w-full h-80 bg-black/20 rounded-lg overflow-hidden">
                    <Cropper
                        image={URL.createObjectURL(file)}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </div>

                <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full"
                />

                <button
                    onClick={getCroppedImage}
                    className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                >
                    Сохранить
                </button>
            </div>
        </div>
    );
}

function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = url;
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
    });
}