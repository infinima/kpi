export function HomePage() {
    return (
        <div className="space-y-12">

            {/* HERO */}
            <section className="text-center space-y-4">
                <h1 className="text-h1 font-bold text-primary">
                    kπца • Турнир Математических Игр
                </h1>

                <p className="text-body text-text-secondary dark:text-dark-text-secondary max-w-2xl mx-auto">
                    Платформа для проведения математических турниров в реальном времени.
                </p>

                <div className="inline-block px-6 py-2 rounded-lg bg-surface dark:bg-dark-surface border border-border dark:border-dark-border shadow-card mt-4">
                    <span className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">
                        Проект, созданный Фзтех-лицеем
                    </span>
                </div>
            </section>

            {/* FEATURES / CARDS */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Мероприятия */}
                <div className="
                    bg-surface dark:bg-dark-surface
                    border border-border dark:border-dark-border
                    rounded-xl shadow-card p-6 cursor-pointer hover:shadow-lg transition
                ">
                    <h2 className="text-h2 font-semibold mb-2">Мероприятия</h2>
                    <p className="text-text-secondary dark:text-dark-text-secondary text-body">
                        Просматривайте расписание, добавляйте события, управляйте турами и матчами.
                    </p>
                </div>

                {/* Таблицы */}
                <div className="
                    bg-surface dark:bg-dark-surface
                    border border-border dark:border-dark-border
                    rounded-xl shadow-card p-6 cursor-pointer hover:shadow-lg transition
                ">
                    <h2 className="text-h2 font-semibold mb-2">Рейтинги и Таблицы</h2>
                    <p className="text-text-secondary dark:text-dark-text-secondary text-body">
                        Текущие результаты, динамика команд, турнирные таблицы и статистика.
                    </p>
                </div>

                {/* Пользователи */}
                <div className="
                    bg-surface dark:bg-dark-surface
                    border border-border dark:border-dark-border
                    rounded-xl shadow-card p-6 cursor-pointer hover:shadow-lg transition
                ">
                    <h2 className="text-h2 font-semibold mb-2">Участники</h2>
                    <p className="text-text-secondary dark:text-dark-text-secondary text-body">
                        Команды, капитаны, учащиеся, кураторы и их активности в турнире.
                    </p>
                </div>
            </section>

            {/* ADMIN SECTION */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                {/* Логи */}
                <div className="
                    bg-surface dark:bg-dark-surface
                    border border-border dark:border-dark-border
                    rounded-xl shadow-card p-6 cursor-pointer hover:shadow-lg transition
                ">
                    <h2 className="text-h2 font-semibold mb-2">Логи и Активность</h2>
                    <p className="text-text-secondary dark:text-dark-text-secondary text-body">
                        Просмотр действий администраторов, судей, ботов и изменений в системе.
                    </p>
                </div>

                {/* Админские настройки */}
                <div className="
                    bg-surface dark:bg-dark-surface
                    border border-border dark:border-dark-border
                    rounded-xl shadow-card p-6 cursor-pointer hover:shadow-lg transition
                ">
                    <h2 className="text-h2 font-semibold mb-2">Управление Турниром</h2>
                    <p className="text-text-secondary dark:text-dark-text-secondary text-body">
                        Настройки сезона, публикация результатов, контроль состояния мероприятия.
                    </p>
                </div>

            </section>
        </div>
    );
}