import {motion} from "framer-motion"
import {FileText, LogIn} from "lucide-react"
import Background from "@/components/layout/Background"
import PrimaryButton from "@/components/ui/PrimaryButton"
import AnimatedText from "@/components/ui/AnimatedText";
import OutlineButton from "@/components/ui/OutlineButton";
import {Link} from "react-router-dom";

function downloadFile(url: string, filename?: string) {
    const link = document.createElement("a")
    link.href = url
    if (filename) {
        link.download = filename
    }
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

const leagues = [
    {
        title: "Лига 4",
        text: "Команды, состоящие из учащихся не старше 4 класса",
    },
    {
        title: "Лига 5",
        text: "Команды, состоящие из учащихся не старше 5 класса",
    },
    {
        title: "Лига 6",
        text: "Команды, состоящие из учащихся не старше 6 класса",
    },
    {
        title: "Лига 7",
        text: "Команды, состоящие из учащихся не старше 7 класса",
    },
]

export default function HomePage() {
    return (
        <div className="relative min-h-screen overflow-hidden">
            <Background active={true}/>

            <section className="relative mx-auto max-w-6xl px-6 pt-28 pb-24 text-center">
                <AnimatedText
                    as="h1"
                    text='Турнир математических игр «кπца»'
                    className="text-4xl md:text-6xl font-semibold tracking-tight text-[var(--color-text-main)]"
                />

                <motion.p
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    transition={{delay: 0.2}}
                    className="
            mt-6
            mx-auto
            max-w-2xl
            text-lg
            text-[var(--color-text-secondary)]
          "
                >
                    Ежегодный турнир Физтех-лицея им. П.Л. Капицы для учеников 4–7 классов.
                    Командное соревнование, направленное на развитие математического мышления,
                    интереса к математике и командной работы.
                </motion.p>

                <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: 0.4}}
                    className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap"
                >
                    <PrimaryButton
                        active={true}
                        leftIcon={<FileText size={18}/>}
                        onClick={() => downloadFile("/rules.pdf", "Правила")}
                    >
                        Открыть правила
                    </PrimaryButton>
                    <Link to="/example">
                        <OutlineButton
                            active={true}>
                            Открыть demo
                        </OutlineButton>
                    </Link>
                    <Link to="/auth">
                        <OutlineButton
                            active={true}
                            leftIcon={<LogIn size={18}/>}>
                            Войти / зарегистрироваться
                        </OutlineButton>
                    </Link>

                </motion.div>
            </section>

            <section className="relative mx-auto max-w-6xl px-6 pb-28">
                <motion.h2
                    initial={{opacity: 0, y: 10}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true}}
                    className="
            mb-12
            text-center
            text-2xl
            md:text-3xl
            font-semibold
          "
                >
                    Возрастные лиги
                </motion.h2>

                <div
                    className="
            grid
            grid-cols-1
            gap-6
            sm:grid-cols-2
            lg:grid-cols-4
          "
                >
                    {leagues.map((league, i) => (
                        <motion.div
                            key={i}
                            initial={{opacity: 0, y: 20}}
                            whileInView={{opacity: 1, y: 0}}
                            viewport={{once: true}}
                            transition={{delay: i * 0.1}}
                            className="
                relative
                group
                overflow-hidden
                rounded-2xl
                border
                border-[var(--color-border)]
                bg-[var(--color-surface)]
                p-6
                backdrop-blur-sm
                transition
                hover:border-[var(--color-primary)]
              "
                        >
                            <div
                                className="
                  absolute
                  inset-0
                  opacity-0
                  transition
                  group-hover:opacity-100
                  bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15),transparent_60%)]
                "
                            />

                            <h3 className="relative z-10 text-xl font-semibold">
                                {league.title}
                            </h3>

                            <p
                                className="
                  relative
                  z-10
                  mt-2
                  text-sm
                  text-[var(--color-text-secondary)]
                "
                            >
                                {league.text}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </section>
        </div>
    )
}
