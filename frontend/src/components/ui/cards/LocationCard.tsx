import type { ReactNode } from "react";
import { MapPin } from "lucide-react";

type LocationCardProps = {
    id: number;
    name: string;
    address: string;
    deleted_at?: string | null;
    selected?: boolean;
    onClick: () => void;
    children?: ReactNode;
};

export function LocationCard({ id, name, address, deleted_at, selected = false, onClick, children }: LocationCardProps) {
    return (
        <div
            className={`
                rounded-[24px] border p-4 text-left transition
                ${selected
                    ? "border-[var(--color-primary)] bg-[rgba(14,116,144,0.08)]"
                    : "border-[var(--color-border)] bg-[rgba(255,255,255,0.84)] hover:border-[var(--color-primary-light)]"}
            `}
        >
            <button type="button" onClick={onClick} className="block w-full text-left">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(34,197,94,0.12)] text-[var(--color-success)]">
                        <MapPin size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-base font-semibold text-[var(--color-text-main)]">
                            {name}
                        </div>
                        <div className="mt-1.5 line-clamp-2 text-sm text-[var(--color-text-secondary)]">
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
