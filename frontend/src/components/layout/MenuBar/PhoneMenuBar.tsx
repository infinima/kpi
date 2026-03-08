import { motion } from "framer-motion"
// @ts-ignore
import { Menu, X } from "lucide-react"
import { useUI } from "@/store"
import { BaseImage } from "@/components/BaseImage"
import type { MenuItem } from "@/components/layout/MenuBar/MenuBar"
type PhoneMenuBarProps = {
    menuItems: MenuItem[]
    currentPath: string
    changePage: (path: string) => void
    mobileMenuOpen: boolean
    toggleMobileMenu: () => void
    closeMobileMenu: () => void
    user: any
}

export default function PhoneMenuBar({
                                         menuItems,
                                         currentPath,
                                         changePage,
                                         mobileMenuOpen,
                                         toggleMobileMenu,
                                         closeMobileMenu,
                                         user,
                                     }: PhoneMenuBarProps) {
    return (
        <div className="sm:hidden">
            <button
                className="
          rounded-xl
          border border-[var(--color-border)]
          bg-[var(--color-surface)]/80
          p-2
          text-[var(--color-text-main)]
          transition
          hover:border-[rgba(99,102,241,0.28)]
          hover:text-[var(--color-primary)]
        "
                onClick={toggleMobileMenu}
            >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {mobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
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
                                    onClick={() => changePage(item.path)}
                                    className={`
                    rounded-xl border px-4 py-3 text-left text-base font-medium transition
                    ${
                                        isActive
                                            ? "border-[rgba(99,102,241,0.34)] text-[var(--color-primary)]"
                                            : "border-[var(--color-border)] text-[var(--color-text-main)] hover:border-[rgba(99,102,241,0.24)] hover:text-[var(--color-primary)]"
                                    }
                  `}
                                >
                                    {item.title}
                                </button>
                            )
                        })}

                        {!user ? (
                            <button
                                onClick={() => {
                                    closeMobileMenu()
                                    useUI.getState().openLoginModal()
                                }}
                                className="
                  mt-2 rounded-xl
                  bg-[var(--color-primary)]
                  px-4 py-3
                  font-medium text-white
                "
                            >
                                Войти
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    closeMobileMenu()
                                    useUI.getState().openProfileModal()
                                }}
                                className="
                  mt-2 flex items-center gap-3
                  rounded-xl border border-[var(--color-border)]
                  px-4 py-3
                  text-left font-medium text-[var(--color-text-main)]
                  transition
                  hover:border-[rgba(99,102,241,0.24)]
                  hover:text-[var(--color-primary)]
                "
                            >
                                <BaseImage
                                    path={`users/${user.id}/photo`}
                                    fallbackLetter={user.first_name[0]}
                                    className="h-8 w-8 rounded-full border border-[var(--color-border)] object-cover"
                                />
                                {user.first_name}
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    )
}