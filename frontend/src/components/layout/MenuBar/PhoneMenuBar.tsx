import {motion} from "framer-motion"
import {Menu, X} from "lucide-react"
import {useUI} from "@/store"
import type {MenuItem} from "@/components/layout/MenuBar/MenuBar"
import PrimaryButton from "@/components/ui/PrimaryButton";
import {useState} from "react";

type PhoneMenuBarProps = {
    menuItems: MenuItem[]
    currentPath: string
    changePage: (path: string) => void
    user: any
}

export default function PhoneMenuBar({
                                         menuItems,
                                         currentPath,
                                         changePage,
                                         user,
                                     }: PhoneMenuBarProps) {

    let [MenuOpen, setOpen] = useState(false)

    return (
        <div className="sm:hidden flex items-center w-full justify-between">
            <button
                className="
          rounded-xl
          border border-[var(--color-border)]
          bg-[var(--color-surface)]/80
          p-2
          text-[var(--color-text-main)]
          transition
          hover:border-[var(--color-primary)]
          hover:text-[var(--color-primary)]
        "
                onClick={() => setOpen(!MenuOpen)}
            >
                {MenuOpen ? <X size={24}/> : <Menu size={24}/>}
            </button>
            {!user ? (
                <PrimaryButton
                    onClick={() => useUI.getState().openLoginModal()}
                >
                    Войти
                </PrimaryButton>
            ) : (
                <PrimaryButton
                    onClick={() => useUI.getState().openProfileModal()}
                >
                    Аккаунт
                </PrimaryButton>

            )}


            {MenuOpen && (
                <motion.div
                    initial={{opacity: 0, y: -8}}
                    animate={{opacity: 1, y: 0}}
                    className="
            absolute left-0 top-full w-full
            border-t border-[var(--color-border)]
            bg-[rgba(255,255,255,0.94)]
            backdrop-blur-xl
          "
                >
                    <div className="flex flex-col gap-2 px-6 py-4">
                        {menuItems.map((item) => {
                            const isActive = currentPath === item.path

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        changePage(item.path);
                                        setOpen(false)
                                    }}
                                    className={`
                    rounded-xl border px-4 py-3 text-left text-base font-medium transition
                    ${
                                        isActive
                                            ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                                            : "border-[var(--color-border)] text-[var(--color-text-main)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                                    }
                  `}
                                >
                                    {item.title}
                                </button>
                            )
                        })}
                    </div>
                </motion.div>
            )}
        </div>
    )
}