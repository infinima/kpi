import React from 'react';
import { Button } from './components/Button';

export default function App() {
    const [health, setHealth] = React.useState<string>('—');
    const [darkMode, setDarkMode] = React.useState<boolean>(false);
    const [pingLoading, setPingLoading] = React.useState<boolean>(false);

    React.useEffect(() => {
        const saved = localStorage.getItem('theme');
        if (saved === 'dark') {
            document.documentElement.classList.add('dark');
            setDarkMode(true);
        }
    }, []);

    async function ping() {
        setPingLoading(true);
        setTimeout(async () => {
            try {
                const r = await fetch('/api/health');
                const j = await r.json();
                setHealth(JSON.stringify(j, null, 2));
            } catch {
                setHealth('error');
            } finally {
                setPingLoading(false);
            }
        }, 3000);
    }

    function toggleTheme() {
        const html = document.documentElement;
        if (html.classList.contains('dark')) {
            html.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setDarkMode(false);
        } else {
            html.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setDarkMode(true);
        }
    }

    return (
        <div className="min-h-screen grid place-items-center bg-white text-gray-900 dark:bg-gray-900 dark:text-white p-6 font-nunito transition-colors duration-300">
            <div className="w-full max-w-xl">
                <h1 className="text-4xl font-extrabold">kpi</h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                    Vite + React + TS + PostCss + Tailwind + BootStrap + Node.js
                </p>

                {/* === 1) ФУНКЦИОНАЛЬНЫЕ КНОПКИ === */}
                <div className="space-y-2 mb-8">
                    <Button
                        label="Проверить API"
                        hoverLabel={pingLoading ? 'Жду…' : 'Запросить'}
                        variant="primary"
                        size="md"
                        onClick={ping}
                        loading={pingLoading}
                        loadingKind="creating"
                        leftIcon={<i className="bi bi-activity" aria-hidden />}
                    />
                    <Button
                        label={darkMode ? 'Светлая тема' : 'Тёмная тема'}
                        hoverLabel={darkMode ? 'Включить светлую' : 'Включить тёмную'}
                        variant="neutral"
                        size="md"
                        onClick={toggleTheme}
                        leftIcon={darkMode ? <i className="bi bi-sun" /> : <i className="bi bi-moon" />}
                    />
                </div>

                {/* === 2) ВСЕ РАЗМЕРЫ И ВАРИАНТЫ — КАЖДАЯ КНОПКА НА СВОЕЙ СТРОКЕ === */}
                <div className="space-y-2 mb-8">
                    {/* Primary: sm/md/lg — без иконок */}
                    <Button label="Primary sm" hoverLabel="В путь!" variant="primary" size="sm" />
                    <Button label="Primary md" hoverLabel="Поехали" variant="primary" size="md" />
                    <Button label="Primary lg" hoverLabel="Старт" variant="primary" size="lg" />

                    {/* Primary: sm/md/lg — c иконкой слева */}
                    <Button label="Primary sm + icon" hoverLabel="Go!" variant="primary" size="sm" leftIcon={<i className="bi bi-lightning" />} />
                    <Button label="Primary md + icon" hoverLabel="Run" variant="primary" size="md" leftIcon={<i className="bi bi-rocket-takeoff" />} />
                    <Button label="Primary lg + icon" hoverLabel="Start" variant="primary" size="lg" leftIcon={<i className="bi bi-flag-fill" />} />

                    {/* Neutral: sm/md/lg — без иконок */}
                    <Button label="Neutral sm" hoverLabel="Подробнее" variant="neutral" size="sm" />
                    <Button label="Neutral md" hoverLabel="Смотреть" variant="neutral" size="md" />
                    <Button label="Neutral lg" hoverLabel="Дальше" variant="neutral" size="lg" />

                    {/* Neutral: sm/md/lg — c иконкой слева */}
                    <Button label="Neutral sm + icon" hoverLabel="Info" variant="neutral" size="sm" leftIcon={<i className="bi bi-info-circle" />} />
                    <Button label="Neutral md + icon" hoverLabel="List" variant="neutral" size="md" leftIcon={<i className="bi bi-list-ul" />} />
                    <Button label="Neutral lg + icon" hoverLabel="View" variant="neutral" size="lg" leftIcon={<i className="bi bi-eye" />} />
                </div>

                {/* === 3) ВЕРСИИ ЗАГРУЗОК + DISABLED === */}
                <div className="space-y-2 mb-8">
                    <Button label="Сохранить" hoverLabel="Сделать" variant="primary" size="md" loading loadingKind="saving" leftIcon={<i className="bi bi-save" />} />
                    <Button label="Создать" hoverLabel="Добавить" variant="primary" size="md" loading loadingKind="creating" leftIcon={<i className="bi bi-plus-circle" />} />
                    <Button label="Удалить" hoverLabel="Навсегда?" variant="neutral" size="md" loading loadingKind="deleting" leftIcon={<i className="bi bi-trash" />} />
                    <Button label="Процесс" hoverLabel="Ждать?" variant="neutral" size="md" loading loadingText="Идет обработка…" leftIcon={<i className="bi bi-hourglass-split" />} />

                    <Button label="Недоступно" hoverLabel="Закрыто" variant="neutral" size="md" disabled leftIcon={<i className="bi bi-lock" />} />
                </div>

                {/* Вывод ответа / состояние */}
                <pre className="mt-6 bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 rounded p-4 whitespace-pre-wrap">
{health}
        </pre>
            </div>
        </div>
    );
}