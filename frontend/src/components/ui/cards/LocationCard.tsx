import type { ReactNode } from "react";
import { Camera, MapPin } from "lucide-react";
import { BaseImage } from "@/components/BaseImage";

type LocationCardProps = {
    id: number;
    name: string;
    address: string;
    deleted_at?: string | null;
    selected?: boolean;
    photoId?: number | null;
    onClick: () => void;
    children?: ReactNode;
};

export function LocationCard({ id, name, address, deleted_at, selected = false, photoId, onClick, children }: LocationCardProps) {
    return (
        <div
            className={`
                rounded-[28px] border p-5 text-left transition
                ${selected
                    ? "border-[var(--color-primary)] bg-[rgba(14,116,144,0.08)]"
                    : "border-[var(--color-border)] bg-[rgba(255,255,255,0.84)] hover:border-[var(--color-primary-light)]"}
            `}
        >
            <button type="button" onClick={onClick} className="block w-full text-left">
                <div className="mb-4 overflow-hidden rounded-[22px] border border-[var(--color-border)]">
                    {photoId ? (
                        <BaseImage
                            path={`photos/${photoId}/file`}
                            alt={name}
                            className="aspect-square w-full object-cover"
                            fallbackLetter="L"
                        />
                    ) : (
                        <div className="flex aspect-square w-full items-center justify-center bg-[rgba(248,250,252,0.92)] text-[var(--color-text-secondary)]">
                            <Camera size={28} />
                        </div>
                    )}
                </div>
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(34,197,94,0.12)] text-[var(--color-success)]">
                        <MapPin size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-lg font-semibold text-[var(--color-text-main)]">
                            {name}
                        </div>
                        <div className="mt-2 line-clamp-2 text-sm text-[var(--color-text-secondary)]">
                            Адрес: {address}
                        </div>
                        {deleted_at ? (
                            <div className="mt-1 text-sm text-[var(--color-error)]">
                                Удалено: {new Date(deleted_at).toLocaleString("ru-RU")}
                            </div>
                        ) : null}
                    </div>
                </div>
            </button>
            {children ? <div className="mt-4">{children}</div> : null}
        </div>
    );
}
