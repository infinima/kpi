export function EventCard({ event, onOpen, onDelete }: any) {
    return (
        <div className="
            bg-surface dark:bg-dark-surface border border-border dark:border-dark-border
            rounded-xl shadow-card p-4 space-y-4
        ">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{event.name}</h3>

                <button
                    className="text-primary hover:opacity-60"
                    onClick={() => onOpen(event)}
                >
                    Открыть →
                </button>
            </div>

            <p className="text-sm text-text-secondary">
                Дата: {event.date}
            </p>

            <div className="pt-3 flex gap-3">
                <button className="px-3 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark">
                    Перейти внутрь
                </button>

                <button
                    onClick={() => onDelete(event.id)}
                    className="px-3 py-2 rounded-lg bg-error text-white hover:bg-error/80"
                >
                    Удалить
                </button>
            </div>
        </div>
    );
}