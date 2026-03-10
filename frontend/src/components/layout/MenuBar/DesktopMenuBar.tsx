import {useState} from "react"
import {motion} from "framer-motion"
import {useUI} from "@/store"
import type {MenuItem} from "@/components/layout/MenuBar/MenuBar"
import PrimaryButton from "@/components/ui/PrimaryButton";

type DesktopMenuBarProps = {
    menuItems: MenuItem[]
    currentPath: string
    changePage: (path: string) => void
    user: any
}

export default function DesktopMenuBar({
                                           menuItems,
                                           currentPath,
                                           changePage,
                                           user,
                                       }: DesktopMenuBarProps) {
    const [hoveredItem, setHoveredItem] = useState<string | null>(null)

    return (
        <>
            <nav
                className="hidden sm:flex items-center gap-2"
                onMouseLeave={() => setHoveredItem(null)}
            >
                {menuItems.map((item) => {
                    const isActive = currentPath === item.path
                    const isHovered = hoveredItem === item.id
                    const showHighlight = isHovered || (!hoveredItem && isActive)

                    return (
                        <button
                            key={item.id}
                            onClick={() => changePage(item.path)}
                            onMouseEnter={() => setHoveredItem(item.id)}
                            className="
                relative isolate
                rounded-xl
                px-4 py-2.5
                font-[var(--text-h1)]
                text-[var(--color-text-secondary)]
                transition-colors duration-200
                hover:text-[var(--color-primary)]
              "
                        >
                            {showHighlight && (
                                <motion.span
                                    layoutId="menu-pill"
                                    transition={{
                                        type: "spring",
                                        stiffness: 380,
                                        damping: 30,
                                        mass: 0.8,
                                    }}
                                    className="
                    absolute inset-0 -z-10 rounded-xl
                    border border-[var(--color-primary)]
                  "
                                />
                            )}

                            <span className={showHighlight ? "text-[var(--color-primary)]" : ""}>
                {item.title}
              </span>
                        </button>
                    )
                })}
            </nav>

            <div className="hidden sm:flex items-center gap-4">
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
            </div>
        </>
    )
}