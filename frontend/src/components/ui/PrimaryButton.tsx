import type { ReactNode, MouseEvent } from "react"

type PrimaryButtonProps = {
    active?: boolean
    loading?: boolean
    disabled?: boolean
    children: ReactNode
    loadingText?: string
    leftIcon?: ReactNode
    rightIcon?: ReactNode
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void
    type?: "button" | "submit" | "reset"
    className?: string
}

function Spinner() {
    return (
        <span
            className="
        inline-block h-4 w-4 rounded-full
        border-2 border-white/30 border-t-white
        animate-spin
      "
            aria-hidden="true"
        />
    )
}

export default function PrimaryButton({
                                          active = true,
                                          loading = false,
                                          disabled = false,
                                          children,
                                          loadingText = "Загрузка...",
                                          leftIcon,
                                          rightIcon,
                                          onClick,
                                          type = "button",
                                          className = "",
                                      }: PrimaryButtonProps) {
    if (!active) return null

    const isDisabled = disabled || loading

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={isDisabled}
            className={`
        inline-flex items-center justify-center gap-2
        px-6 py-3
        rounded-[var(--radius-xl)]
        bg-[var(--color-primary)]
        text-white
        font-medium
        shadow-lg
        transition
        hover:bg-[var(--color-primary-dark)]
        hover:scale-[1.02]
        active:scale-[0.98]
        disabled:cursor-not-allowed
        disabled:opacity-60
        ${className}
      `}
        >
            {loading ? (
                <>
                    <Spinner />
                    <span>{loadingText}</span>
                </>
            ) : (
                <>
                    {leftIcon ? <span className="shrink-0">{leftIcon}</span> : null}
                    <span>{children}</span>
                    {rightIcon ? <span className="shrink-0">{rightIcon}</span> : null}
                </>
            )}
        </button>
    )
}