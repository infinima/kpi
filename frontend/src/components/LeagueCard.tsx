export function LeagueCard({ league, onOpen, onDelete }: any) {
    return (
        <div className="
            bg-surface dark:bg-dark-surface border border-border dark:border-dark-border
            rounded-xl shadow-card p-4 space-y-4
        ">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{league.name}</h3>

                <button
                    className="text-primary hover:opacity-60"
                    onClick={() => onOpen(league)}
                >
                    Открыть →
                </button>
            </div>

            <p className="text-sm text-text-secondary">
                Статус: {league.status}
            </p>

            <div className="pt-3 flex gap-3">
                <button className="px-3 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark">
                    Участники
                </button>

                <button className="px-3 py-2 rounded-lg bg-hover dark:bg-dark-hover">
                    Статистика
                </button>

                <button
                    onClick={() => onDelete(league.id)}
                    className="px-3 py-2 rounded-lg bg-error text-white hover:bg-error/80"
                >
                    Удалить
                </button>
            </div>
        </div>
    );
}