import { useState } from "react"
import { motion } from "framer-motion"
import { useUI } from "@/store"
import { BaseImage } from "@/components/BaseImage"
import type { MenuItem } from "@/components/layout/MenuBar/MenuBar"

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
                text-[15px] font-medium
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
                    border border-[rgba(99,102,241,0.34)]
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
                    <button
                        onClick={() => useUI.getState().openLoginModal()}
                        className="
              rounded-xl
              bg-[var(--color-primary)]
              px-4 py-2.5
              font-medium text-white
              transition
              hover:bg-[var(--color-primary-dark)]
            "
                    >
                        Войти
                    </button>
                ) : (
                    <button
                        onClick={() => useUI.getState().openProfileModal()}
                        className="
              flex items-center gap-2
              rounded-xl
              border border-[var(--color-border)]
              px-3 py-2
              font-medium
              text-[var(--color-text-main)]
              transition
              hover:border-[rgba(99,102,241,0.28)]
              hover:text-[var(--color-primary)]
            "
                    >
                        <BaseImage
                            path={`users/${user.id}/photo`}
                            fallbackLetter={user.first_name[0]}
                            className="h-7 w-7 rounded-full border border-[var(--color-border)] object-cover"
                        />
                        {user.first_name}
                    </button>
                )}
            </div>
        </>
    )
}