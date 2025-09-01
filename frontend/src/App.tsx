import React from 'react';

export default function App() {
    const [health, setHealth] = React.useState<string>('—');
    const [darkMode, setDarkMode] = React.useState<boolean>(false);

    // при загрузке читаем localStorage
    React.useEffect(() => {
        const saved = localStorage.getItem('theme');
        if (saved === 'dark') {
            document.documentElement.classList.add('dark');
            setDarkMode(true);
        }
    }, []);

    async function ping() {
        try {
            const r = await fetch('/api/health');
            const j = await r.json();
            setHealth(JSON.stringify(j, null, 2));
        } catch {
            setHealth('error');
        }
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
                    Vite + React + TS + Tailwind + Nunito
                </p>

                <div className="flex gap-4 mb-4">
                    <button
                        onClick={ping}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition font-semibold text-white"
                    >
                        Проверить API
                    </button>

                    <button
                        onClick={toggleTheme}
                        className="px-4 py-2 rounded-lg bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition font-semibold"
                    >
                        {darkMode ? 'Светлая тема' : 'Тёмная тема'}
                    </button>
                </div>

                <pre className="mt-4 bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 rounded p-4 whitespace-pre-wrap">
          {health}
        </pre>
            </div>
        </div>
    );
}