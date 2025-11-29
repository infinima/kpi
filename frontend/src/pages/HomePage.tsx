import {FileText} from "lucide-react";

export function HomePage() {
    return (
        <div className="space-y-12">

            {/* HERO */}
            <section className="text-center space-y-4">
                <h1 className="text-h1 font-bold text-primary">
                    Турнир математических игр «kπца»
                </h1>

                <p className="text-body text-text-secondary dark:text-dark-text-secondary max-w-3xl mx-auto">
                    Ежегодно АНОО «Физтех-лицей» им. П.Л. Капицы проводит Турнир
                    математических игр для учеников 4–7 классов.
                </p>

                <p className="text-body text-text-secondary dark:text-dark-text-secondary max-w-3xl mx-auto">
                    Принять участие в Турнире могут учащиеся Московской области и регионов России.
                    Это командное соревнование, направленное на развитие интереса к математике,
                    формирование мышления, готовности к саморазвитию и командной работе.
                </p>

                <p className="text-body text-text-secondary dark:text-dark-text-secondary max-w-3xl mx-auto">
                    В Турнире могут участвовать команды школ, кружков, городов и регионов в составе
                    четырёх учащихся 4–7 классов.
                </p>
            </section>

            {/* LEAGUES */}
            <section className="space-y-4 max-w-3xl mx-auto">

                <h2 className="text-h2 font-semibold text-center">Возрастные лиги</h2>

                <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl shadow-card p-6 space-y-2 text-body">
                    <p><b>Лига 4</b> — команды, состоящие из учащихся не старше 4 класса</p>
                    <p><b>Лига 5</b> — команды, состоящие из учащихся не старше 5 класса</p>
                    <p><b>Лига 6</b> — команды, состоящие из учащихся не старше 6 класса</p>
                    <p><b>Лига 7</b> — команды, состоящие из учащихся не старше 7 класса</p>
                </div>
            </section>

            <section className="max-w-3xl mx-auto space-y-4">

                <div className="flex justify-center">
                    <a
                        href="https://phtl.ru/storage/pages/444/pravila-igr-1.pdf"
                        download
                        className="
                inline-flex items-center gap-2
                px-5 py-3 rounded-lg
                bg-primary text-white
                hover:bg-primary-dark
                shadow-card transition
                text-body
            "
                    >
                        <FileText size={20} />
                        Открыть правила турнира
                    </a>
                </div>

            </section>

        </div>
    );
}