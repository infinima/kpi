import { CalendarDays } from "lucide-react";
import { BaseImage } from "@/components/BaseImage";

type EventCardProps = {
    id: number;
    name: string;
    date: string;
    deleted_at?: string | null;
    selected?: boolean;
    onClick: () => void;
};

export function EventCard({ id, name, date, deleted_at, selected = false, onClick }: EventCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                rounded-[28px] border p-5 text-left transition
                ${selected
                    ? "border-[var(--color-primary)] bg-[rgba(14,116,144,0.08)]"
                    : "border-[var(--color-border)] bg-[rgba(255,255,255,0.84)] hover:border-[var(--color-primary-light)]"}
            `}
        >
            <div className="mb-4 overflow-hidden rounded-[22px] border border-[var(--color-border)]">
                <BaseImage
                    path={`events/${id}/photo`}
                    alt={name}
                    className="aspect-square w-full object-cover"
                    fallbackLetter="E"
                />
            </div>
            <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(99,102,241,0.12)] text-[var(--color-primary)]">
                    <CalendarDays size={20} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="truncate text-lg font-semibold text-[var(--color-text-main)]">
                        {name}
                    </div>
                    <div className="mt-2 text-sm text-[var(--color-text-secondary)]">
                        Дата: {new Date(date).toLocaleDateString("ru-RU")}
                    </div>
                    {deleted_at ? (
                        <div className="mt-1 text-sm text-[var(--color-error)]">
                            Удалено: {new Date(deleted_at).toLocaleString("ru-RU")}
                        </div>
                    ) : null}
                </div>
            </div>
        </button>
    );
}
